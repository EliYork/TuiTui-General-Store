import {
    _decorator,
    Component,
    director,
    Enum,
    Event,
    Label,
    log,
    Prefab,
    Vec3,
    warn,
    PhysicsSystem,
    EPhysicsDrawFlags,
} from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner, CoinSpawnRequest } from '../gameplay/CoinSpawner';
import { ItemPrefabConfig, ItemPrefabRuntimeConfig } from '../gameplay/ItemPrefabConfig';

const { ccclass, property } = _decorator;
const SHARED_SCENE_NAME = 'Prototype01';
const MIN_AUTO_SPAWN_INTERVAL = 0.05;
const INSUFFICIENT_RESOURCE_STATUS = '资源不足，无法投放';
const AUTO_SPAWN_INSUFFICIENT_RESOURCE_STATUS = '资源不足，自动投放已停止';

type MapId = 'Map01' | 'Map02';
type ResolvedPrefabMetadata = Omit<ItemPrefabRuntimeConfig, 'itemId'>;

enum RoundState {
    Ready = 'Ready',
    Playing = 'Playing',
    LowResources = 'LowResources',
}

enum MapSelection {
    Map01 = 0,
    Map02 = 1,
}

@ccclass('CatalogItemConfig')
class CatalogItemConfig {
    @property({
        displayName: '物品 ID',
        tooltip: '逻辑层使用的稳定物品 ID，需要和物品 Prefab 上的 ItemPrefabConfig.itemId 保持一致。改错会导致按钮选择、收集进度和解锁状态对不上。',
    })
    public itemId = '';

    @property({
        type: Prefab,
        displayName: '物品 Prefab',
        tooltip: '该物品实际生成时使用的 Prefab。为空时该物品不能被主动投放，也不会进入随机掉落池。',
    })
    public prefab: Prefab | null = null;

    @property({
        displayName: '解锁所需收集数',
        tooltip: '累计收集达到这个数量后，该物品会解锁为可主动投放。数值越大解锁越慢，0 表示开局即可满足数量条件。',
    })
    public unlockRequiredCount = 0;

    @property({
        displayName: '开局可投放',
        tooltip: '开启后该物品开局就可以作为主动投放物。通常只给基础物品开启，避免玩家开局没有可投放目标。',
    })
    public startSpawnUnlocked = false;

    @property({
        displayName: '开局已发现',
        tooltip: '开启后该物品开局就显示为已发现。只影响图鉴/显示状态，不代表一定可主动投放。',
    })
    public startDiscovered = false;

    @property({
        displayName: '允许地图一掉落',
        tooltip: '开启后该物品会进入地图一的世界随机掉落池。关闭后地图一不会免费随机生成它。',
    })
    public allowDropInMap01 = true;

    @property({
        displayName: '允许地图二掉落',
        tooltip: '开启后该物品会进入地图二的世界随机掉落池。关闭后地图二不会免费随机生成它。',
    })
    public allowDropInMap02 = true;
}

interface MapConfig {
    mapId: MapId;
    mapName: string;
    sceneName: string;
    initialMapItemCount: number;
    riskLevelHint: number;
}

interface RuntimeItemProgress {
    ownedCount: number;
    isSpawnUnlocked: boolean;
    isDiscovered: boolean;
}

interface RuntimePersistentProgress {
    initialized: boolean;
    currentMapId: MapId;
    currentCoins: number;
    maxCoins: number;
    resourceRegenProgressSeconds: number;
    worldDropProgressSeconds: number;
    currentSpawnItemId: string;
    lastDroppedItemId: string;
    itemProgress: Record<string, RuntimeItemProgress>;
}

interface NormalizedCatalogConfig {
    itemId: string;
    prefab: Prefab | null;
    unlockRequiredCount: number;
    startSpawnUnlocked: boolean;
    startDiscovered: boolean;
    allowDropInMap01: boolean;
    allowDropInMap02: boolean;
}

interface ResolvedCatalogItem extends NormalizedCatalogConfig, ResolvedPrefabMetadata {
    ownedCount: number;
    isSpawnUnlocked: boolean;
    isDiscovered: boolean;
    allowDropOnCurrentMap: boolean;
    canBeCurrentSpawnItem: boolean;
}

const DEFAULT_TEST_ITEMS: NormalizedCatalogConfig[] = [
    {
        itemId: 'apple',
        prefab: null,
        unlockRequiredCount: 0,
        startSpawnUnlocked: true,
        startDiscovered: true,
        allowDropInMap01: true,
        allowDropInMap02: true,
    },
    {
        itemId: 'banana',
        prefab: null,
        unlockRequiredCount: 3,
        startSpawnUnlocked: false,
        startDiscovered: false,
        allowDropInMap01: true,
        allowDropInMap02: true,
    },
    {
        itemId: 'lemon',
        prefab: null,
        unlockRequiredCount: 5,
        startSpawnUnlocked: false,
        startDiscovered: false,
        allowDropInMap01: true,
        allowDropInMap02: true,
    },
];

const runtimeProgress: RuntimePersistentProgress = {
    initialized: false,
    currentMapId: 'Map01',
    currentCoins: 0,
    maxCoins: 0,
    resourceRegenProgressSeconds: 0,
    worldDropProgressSeconds: 0,
    currentSpawnItemId: '',
    lastDroppedItemId: '',
    itemProgress: {},
};

@ccclass('GameManager')
export class GameManager extends Component {
    @property({
        type: CoinSpawner,
        displayName: '投放器',
        tooltip: '场景里的 SpawnRoot/CoinSpawner 引用，所有主动投放和世界随机掉落都会通过它生成物体。为空时不会生成任何物体。',
    })
    public coinSpawner: CoinSpawner | null = null;

    @property({
        type: Enum(MapSelection),
        displayName: '初始地图',
        tooltip: '首次启动运行数据时使用的地图选择。切换后会影响初始掉落数量和随机掉落池。',
    })
    public mapSelection = MapSelection.Map01;

    @property({
        displayName: '初始资源',
        tooltip: '开局写入运行数据的主动投放资源。数值越大，玩家可连续主动投放的次数越多。',
    })
    public startCoins = 300;

    @property({
        displayName: '资源回复上限',
        tooltip: '被动资源回复最多回复到这个上限。掉落奖励可以超过该上限，不会被这里截断。',
    })
    public maxCoins = 300;

    @property({
        displayName: '资源回复间隔',
        tooltip: '被动资源每隔多少秒回复一次。数值越小回复越快，数值越大玩家等待时间越长。',
    })
    public resourceRegenInterval = 1;

    @property({
        displayName: '每次回复资源',
        tooltip: '每次被动回复增加的资源数量。数值越大恢复越快，可能降低资源管理压力。',
    })
    public resourceRegenAmount = 1;

    @property({
        displayName: '主动投放消耗',
        tooltip: '每次玩家主动投放消耗的资源。包括手动点击/长按和自动投放；资源不足时不会生成物体。',
    })
    public spawnCostPerCoin = 1;

    @property({
        displayName: '覆盖手动投放 Y',
        tooltip: '开启后 ManualSpawnArea 会使用 manualSpawnY 作为投放高度；关闭后使用 SpawnRoot/SpawnPoint 的世界 Y。',
    })
    public manualSpawnYOverrideEnabled = true;

    @property({
        displayName: '手动投放 Y',
        tooltip: '手动投放使用的世界 Y 高度。数值越大生成越高，可能更容易弹起；数值太小可能贴近台面或穿插。',
    })
    public manualSpawnY = 1;

    @property({
        displayName: '自动投放间隔',
        tooltip: '自动投放开启后每隔多少秒投放一次当前选中物品。数值越小投放越快；当前 0.5 是较稳的节奏。',
    })
    public autoSpawnInterval = 0.5;

    @property({
        displayName: '自动投放 X',
        tooltip: '自动投放使用的世界 X 坐标。0 表示从中间投放，负数偏左，正数偏右。',
    })
    public autoSpawnX = 0;

    @property({
        displayName: '自动投放 Z',
        tooltip: '自动投放使用的世界 Z 坐标，决定水果落在前后哪个位置。当前 -0.2 是默认自动投放落点，不要随意改成正值。',
    })
    public autoSpawnZ = -0.2;

    @property({
        type: [CatalogItemConfig],
        displayName: '物品配置表',
        tooltip: '逻辑层物品表，配置每种水果的 Prefab、解锁数量和地图掉落开关。主动投放和随机掉落都会读取这里。',
    })
    public itemCatalog: CatalogItemConfig[] = [];

    @property({
        displayName: '地图一初始掉落数',
        tooltip: '地图一开始时免费预生成到台面的随机掉落物数量。数值越大开局越热闹，也会增加初始物理负载。',
    })
    public map01InitialMapItemCount = 2;

    @property({
        displayName: '地图一风险提示',
        tooltip: '地图一的难度/漏出风险提示值，目前主要作为后续调参预留，不直接改变玩法逻辑。',
    })
    public map01RiskLevelHint = 1;

    @property({
        displayName: '地图二初始掉落数',
        tooltip: '地图二开始时免费预生成到台面的随机掉落物数量。数值越大开局物体越多，也会增加初始物理负载。',
    })
    public map02InitialMapItemCount = 3;

    @property({
        displayName: '地图二风险提示',
        tooltip: '地图二的难度/漏出风险提示值，目前主要作为后续调参预留，不直接改变玩法逻辑。',
    })
    public map02RiskLevelHint = 2;

    @property({
        displayName: '启用世界随机掉落',
        tooltip: '开启后系统会按间隔免费生成随机掉落物。该掉落不消耗玩家资源，也不受主动投放资源检查限制。',
    })
    public worldDropEnabled = true;

    @property({
        displayName: '世界掉落间隔',
        tooltip: '系统随机掉落每隔多少秒触发一批。数值越小掉落越频繁，可能增加台面物体数量和物理压力。',
    })
    public worldDropInterval = 5;

    @property({
        displayName: '每批世界掉落数量',
        tooltip: '每次世界随机掉落触发时生成几个物体。数值越大随机掉落越密集，也更容易造成性能压力。',
    })
    public worldDropAmount = 1;

    @property({
        type: Label,
        displayName: '资源标签',
        tooltip: '显示当前资源和被动回复信息的 Label。为空时资源 HUD 不会更新。',
    })
    public scoreLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '掉落标签',
        tooltip: '显示当前可投放物品和世界随机掉落状态的 Label。为空时对应 HUD 不会更新。',
    })
    public dropCountLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '收集标签',
        tooltip: '显示最近掉落、收集数量和已解锁物品的 Label。为空时对应 HUD 不会更新。',
    })
    public spawnCountLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '状态标签',
        tooltip: '显示当前地图、游戏状态和操作提示的 Label。为空时状态提示不会显示。',
    })
    public statusLabel: Label | null = null;

    @property({
        displayName: '显示碰撞调试',
        tooltip: '开启后显示物理碰撞调试线框，方便排查 Collider。正式体验应关闭，避免影响画面和性能。',
    })
    public showColliderDebug = false;

    public autoSpawnEnabled = false;

    private _state = RoundState.Ready;
    private _sessionSpawnedCoinCount = 0;
    private _statusText = '准备运行数据';
    private _autoSpawnTimer = 0;
    private readonly _manualSpawnPosition = new Vec3();

    protected start(): void {
        PhysicsSystem.instance.enable = true;
        this.autoSpawnEnabled = false;
        this._autoSpawnTimer = 0;

        if (this.showColliderDebug) {
            PhysicsSystem.instance.debugDrawFlags =
                EPhysicsDrawFlags.WIRE_FRAME | EPhysicsDrawFlags.AABB;
        } else {
            PhysicsSystem.instance.debugDrawFlags = 0;
        }

        this.ensureRuntimeProgress();
        this._sessionSpawnedCoinCount = 0;
        this.syncStateFromResources();

        const missingPrefabs = this.getResolvedCatalog().filter((item) => !item.prefab);
        if (missingPrefabs.length > 0) {
            this.setStatus(`请在 GameManager.itemCatalog 配置 Prefab：${missingPrefabs.map((item) => item.itemName).join(' / ')}`);
            return;
        }

        this.seedInitialMapItems();
        this.setStatus(`当前地图：${this.getCurrentMapConfig().mapName}`);
    }

    protected update(deltaTime: number): void {
        if (!runtimeProgress.initialized) {
            return;
        }

        let shouldRefreshUi = false;

        if (this.tryRegenerateResources(deltaTime)) {
            this.syncStateFromResources();
            shouldRefreshUi = true;
        }

        if (this.trySpawnWorldDrops(deltaTime)) {
            shouldRefreshUi = true;
        }

        if (this.updateAutoSpawn(deltaTime)) {
            shouldRefreshUi = true;
        }

        if (shouldRefreshUi) {
            this.refreshUi();
        }
    }

    public spawnCoinFromButton(): boolean {
        return this.spawnCurrentSpawnItem();
    }

    public spawnCoinFromManualPosition(worldX: number, worldZ: number, debugLog = false): boolean {
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return false;
        }

        const basePosition = this.coinSpawner.getBaseSpawnWorldPosition(this._manualSpawnPosition);
        const baseX = basePosition.x;
        const baseY = basePosition.y;
        const baseZ = basePosition.z;
        const spawnX = this.normalizeFiniteNumber(worldX, baseX);
        const spawnY = this.manualSpawnYOverrideEnabled
            ? this.normalizeFiniteNumber(this.manualSpawnY, baseY)
            : baseY;
        const spawnZ = this.normalizeFiniteNumber(worldZ, baseZ);

        Vec3.set(
            this._manualSpawnPosition,
            spawnX,
            spawnY,
            spawnZ,
        );

        if (debugLog) {
            log(
                `[GameManager.manualSpawnAt] worldX=${formatNumber(spawnX)} `
                + `fixedDepthZ=${formatNumber(spawnZ)} `
                + `spawnY=${formatNumber(spawnY)}`,
            );
        }

        return this.spawnCurrentSpawnItem({
            worldPosition: this._manualSpawnPosition,
            randomizeAroundPosition: false,
        });
    }

    public toggleAutoSpawn(): boolean {
        return this.setAutoSpawnEnabled(!this.autoSpawnEnabled);
    }

    public setAutoSpawnEnabled(enabled: boolean): boolean {
        if (!enabled) {
            this.stopAutoSpawn('自动投放已关闭');
            return false;
        }

        const stopReason = this.getAutoSpawnStopReason();
        if (stopReason) {
            this.stopAutoSpawn(stopReason);
            return false;
        }

        this.autoSpawnEnabled = true;
        this._autoSpawnTimer = 0;
        this.setStatus('自动投放已开启');
        return true;
    }

    public isAutoSpawnEnabled(): boolean {
        return this.autoSpawnEnabled;
    }

    private spawnCurrentSpawnItem(request: CoinSpawnRequest | null = null): boolean {
        const currentSpawnItem = this.getCurrentSpawnItem();
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return false;
        }

        if (!currentSpawnItem) {
            this.setStatus('当前没有可投放物品');
            return false;
        }

        if (!this.canAffordSpawn()) {
            this.setStatus(INSUFFICIENT_RESOURCE_STATUS);
            return false;
        }

        const spawnedItem = this.spawnCatalogItem(currentSpawnItem, request);
        if (!spawnedItem) {
            this.setStatus('投放失败');
            return false;
        }

        this._sessionSpawnedCoinCount += 1;
        runtimeProgress.currentCoins -= this.getConfiguredSpawnCost();
        this.syncStateFromResources();
        this.setStatus(`已投放 ${currentSpawnItem.itemName}，资源 ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins}`);
        return true;
    }

    private updateAutoSpawn(deltaTime: number): boolean {
        if (!this.autoSpawnEnabled) {
            return false;
        }

        this._autoSpawnTimer += deltaTime;
        const interval = this.getConfiguredAutoSpawnInterval();
        let changed = false;

        while (this.autoSpawnEnabled && this._autoSpawnTimer >= interval) {
            this._autoSpawnTimer -= interval;
            changed = true;

            if (!this.tryAutoSpawnOnce()) {
                break;
            }
        }

        return changed;
    }

    private tryAutoSpawnOnce(): boolean {
        const stopReason = this.getAutoSpawnStopReason();
        if (stopReason) {
            this.stopAutoSpawn(stopReason);
            return false;
        }

        if (!this.spawnCoinFromManualPosition(this.autoSpawnX, this.autoSpawnZ)) {
            this.stopAutoSpawn('自动投放失败，已停止');
            return false;
        }

        const stopReasonAfterSpawn = this.getAutoSpawnStopReason();
        if (stopReasonAfterSpawn) {
            this.stopAutoSpawn(stopReasonAfterSpawn);
        }

        return true;
    }

    private getAutoSpawnStopReason(): string {
        if (!runtimeProgress.initialized) {
            return '自动投放未就绪，已停止';
        }

        if (!this.coinSpawner) {
            return '缺少投放器，自动投放已停止';
        }

        if (!this.getCurrentSpawnItem()) {
            return '当前没有可投放物品，自动投放已停止';
        }

        if (!this.canAffordSpawn()) {
            return AUTO_SPAWN_INSUFFICIENT_RESOURCE_STATUS;
        }

        return '';
    }

    private stopAutoSpawn(statusText = ''): void {
        this.autoSpawnEnabled = false;
        this._autoSpawnTimer = 0;

        if (statusText) {
            this.setStatus(statusText);
        }
    }

    public resolveCoinDrop(item: CoinBehaviour): void {
        if (!item.tryMarkScored()) {
            return;
        }

        const collectedItem = this.findResolvedCatalogItemById(item.itemId);
        if (!collectedItem) {
            warn(`[GameManager] Dropped item is missing catalog registration: ${item.itemId || item.node.name}`);
            this.setStatus(`掉落物未注册：${item.itemTypeLabel}`);
            item.onScored();
            return;
        }

        const progress = runtimeProgress.itemProgress[collectedItem.itemId];
        progress.ownedCount += 1;
        progress.isDiscovered = true;
        runtimeProgress.lastDroppedItemId = collectedItem.itemId;
        runtimeProgress.currentCoins += collectedItem.value;

        let unlockedItemName = '';
        if (!progress.isSpawnUnlocked && progress.ownedCount >= collectedItem.unlockRequiredCount) {
            progress.isSpawnUnlocked = true;
            unlockedItemName = collectedItem.itemName;
        }

        this.ensureRuntimeProgress();
        this.syncStateFromResources();
        item.onScored();

        const rewardText = `资源 +${collectedItem.value}`;
        if (unlockedItemName) {
            this.setStatus(
                `获得 ${collectedItem.itemName} x1，${rewardText}，已收集 ${progress.ownedCount}，解锁投放：${unlockedItemName}`,
            );
            return;
        }

        this.setStatus(`获得 ${collectedItem.itemName} x1，${rewardText}，已收集 ${progress.ownedCount}`);
    }

    public restartGame(): void {
        const sceneName = director.getScene()?.name || SHARED_SCENE_NAME;
        if (!sceneName) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('重新开始失败：当前场景缺失');
            return;
        }

        this.stopAutoSpawn();
        this.resetRuntimeProgress();
        director.loadScene(sceneName);
    }

    public switchToMap01(): void {
        this.switchMapInternal('Map01');
    }

    public switchToMap02(): void {
        this.switchMapInternal('Map02');
    }

    public applyInspectorMapSelection(): void {
        this.switchMapInternal(this.getMapIdFromSelection(this.mapSelection));
    }

    public canSpawnCoin(): boolean {
        return !!this.coinSpawner && !!this.getCurrentSpawnItem() && this.canAffordSpawn();
    }

    public canAffordSpawn(): boolean {
        return runtimeProgress.currentCoins >= this.getConfiguredSpawnCost();
    }

    public onSpawnItemButtonClicked(_event: Event | null, itemId: string): void {
        this.selectSpawnItemById(itemId);
    }

    public selectSpawnItemById(itemId: string): boolean {
        const nextItem = this.findResolvedCatalogItemById(itemId);
        if (!nextItem) {
            this.setStatus(`未知投放物品：${itemId}`);
            return false;
        }

        if (!nextItem.isSpawnUnlocked) {
            this.setStatus(`${nextItem.itemName} 尚未解锁投放`);
            return false;
        }

        if (!nextItem.prefab) {
            this.setStatus(`${nextItem.itemName} 缺少 Prefab`);
            return false;
        }

        runtimeProgress.currentSpawnItemId = nextItem.itemId;
        this.refreshUi();
        this.setStatus(`当前投放物切换为 ${nextItem.itemName}`);
        return true;
    }

    private ensureRuntimeProgress(): void {
        const catalogConfigs = this.getNormalizedCatalogConfigs();

        if (!runtimeProgress.initialized) {
            runtimeProgress.initialized = true;
            runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.resourceRegenProgressSeconds = 0;
            runtimeProgress.worldDropProgressSeconds = 0;
            runtimeProgress.currentSpawnItemId = '';
            runtimeProgress.lastDroppedItemId = '';
            runtimeProgress.itemProgress = {};
        } else {
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = this.normalizeFiniteInteger(runtimeProgress.currentCoins, 0);
        }

        for (const config of catalogConfigs) {
            const progress = runtimeProgress.itemProgress[config.itemId] ?? {
                ownedCount: 0,
                isSpawnUnlocked: false,
                isDiscovered: false,
            };

            progress.isSpawnUnlocked = progress.isSpawnUnlocked || config.startSpawnUnlocked;
            progress.isDiscovered = progress.isDiscovered || config.startDiscovered || progress.isSpawnUnlocked;
            runtimeProgress.itemProgress[config.itemId] = progress;
        }

        this.ensureCurrentSpawnItemSelection(catalogConfigs);
    }

    private resetRuntimeProgress(): void {
        runtimeProgress.initialized = false;
        runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
        runtimeProgress.maxCoins = 0;
        runtimeProgress.currentCoins = 0;
        runtimeProgress.resourceRegenProgressSeconds = 0;
        runtimeProgress.worldDropProgressSeconds = 0;
        runtimeProgress.currentSpawnItemId = '';
        runtimeProgress.lastDroppedItemId = '';
        runtimeProgress.itemProgress = {};

        this._sessionSpawnedCoinCount = 0;
        this.syncStateFromResources();
    }

    private ensureCurrentSpawnItemSelection(catalogConfigs: NormalizedCatalogConfig[]): void {
        const selectableItems = catalogConfigs.filter((config) => {
            const progress = runtimeProgress.itemProgress[config.itemId];
            return !!config.prefab && !!progress?.isSpawnUnlocked;
        });

        const fallbackUnlockedItem = selectableItems[0]
            ?? catalogConfigs.find((config) => runtimeProgress.itemProgress[config.itemId]?.isSpawnUnlocked)
            ?? catalogConfigs[0]
            ?? null;

        if (!fallbackUnlockedItem) {
            runtimeProgress.currentSpawnItemId = '';
            return;
        }

        const currentConfig = catalogConfigs.find((config) => config.itemId === runtimeProgress.currentSpawnItemId) ?? null;
        const currentProgress = currentConfig ? runtimeProgress.itemProgress[currentConfig.itemId] : null;
        const currentIsSelectable = !!currentConfig && !!currentConfig.prefab && !!currentProgress?.isSpawnUnlocked;

        if (!currentIsSelectable) {
            runtimeProgress.currentSpawnItemId = fallbackUnlockedItem.itemId;
        }
    }

    private switchMapInternal(mapId: MapId): void {
        const nextConfig = this.getMapConfig(mapId);
        if (!nextConfig) {
            warn(`[GameManager] Unknown map id: ${mapId}`);
            this.setStatus('地图切换失败');
            return;
        }

        runtimeProgress.currentMapId = mapId;
        runtimeProgress.worldDropProgressSeconds = 0;
        this.syncStateFromResources();

        const currentSceneName = director.getScene()?.name ?? '';
        if (nextConfig.sceneName && currentSceneName && nextConfig.sceneName !== currentSceneName) {
            director.loadScene(nextConfig.sceneName);
            return;
        }

        this.seedInitialMapItems();
        this.setStatus(`已切换到 ${nextConfig.mapName}`);
    }

    private seedInitialMapItems(): void {
        const mapConfig = this.getCurrentMapConfig();
        const initialCount = this.normalizeNonNegativeInteger(mapConfig.initialMapItemCount);
        for (let index = 0; index < initialCount; index += 1) {
            this.spawnRandomWorldDrop();
        }
    }

    private tryRegenerateResources(deltaTime: number): boolean {
        const interval = this.getConfiguredResourceRegenInterval();
        const amount = this.getConfiguredResourceRegenAmount();
        if (interval <= 0 || amount <= 0 || runtimeProgress.currentCoins >= runtimeProgress.maxCoins) {
            runtimeProgress.resourceRegenProgressSeconds = 0;
            return false;
        }

        runtimeProgress.resourceRegenProgressSeconds += deltaTime;
        let regenerated = false;

        while (
            runtimeProgress.resourceRegenProgressSeconds >= interval &&
            runtimeProgress.currentCoins < runtimeProgress.maxCoins
        ) {
            runtimeProgress.resourceRegenProgressSeconds -= interval;
            runtimeProgress.currentCoins = Math.min(
                runtimeProgress.maxCoins,
                runtimeProgress.currentCoins + amount,
            );
            regenerated = true;
        }

        return regenerated;
    }

    private trySpawnWorldDrops(deltaTime: number): boolean {
        const interval = this.getConfiguredWorldDropInterval();
        const amount = this.getConfiguredWorldDropAmount();
        if (!this.worldDropEnabled || interval <= 0 || amount <= 0) {
            runtimeProgress.worldDropProgressSeconds = 0;
            return false;
        }

        runtimeProgress.worldDropProgressSeconds += deltaTime;
        let spawned = false;

        while (runtimeProgress.worldDropProgressSeconds >= interval) {
            runtimeProgress.worldDropProgressSeconds -= interval;
            for (let index = 0; index < amount; index += 1) {
                if (this.spawnRandomWorldDrop()) {
                    spawned = true;
                }
            }
        }

        return spawned;
    }

    private spawnRandomWorldDrop(request: CoinSpawnRequest | null = null): boolean {
        const mapPoolItem = this.pickRandomMapPoolItem();
        if (!mapPoolItem) {
            return false;
        }

        return !!this.spawnCatalogItem(mapPoolItem, request);
    }

    private spawnCatalogItem(item: ResolvedCatalogItem | null, request: CoinSpawnRequest | null = null): CoinBehaviour | null {
        if (!this.coinSpawner || !item?.prefab) {
            return null;
        }

        return this.coinSpawner.spawnCoin(item.prefab, request);
    }

    private pickRandomMapPoolItem(): ResolvedCatalogItem | null {
        const dropPool = this.getResolvedCatalog().filter(
            (item) => item.allowDropOnCurrentMap && !!item.prefab && item.weight > 0,
        );
        if (dropPool.length === 0) {
            return null;
        }

        const totalWeight = dropPool.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight <= 0) {
            return null;
        }

        let roll = Math.random() * totalWeight;
        for (const item of dropPool) {
            roll -= item.weight;
            if (roll < 0) {
                return item;
            }
        }

        return dropPool[dropPool.length - 1] ?? null;
    }

    private syncStateFromResources(): void {
        if (!this.getCurrentSpawnItem()) {
            this._state = RoundState.Ready;
            return;
        }

        if (runtimeProgress.currentCoins < 0) {
            this._state = RoundState.LowResources;
            return;
        }

        this._state = this._sessionSpawnedCoinCount > 0 ? RoundState.Playing : RoundState.Ready;
    }

    private refreshUi(): void {
        const mapConfig = this.getCurrentMapConfig();
        const resolvedCatalog = this.getResolvedCatalog();
        const currentSpawnItem = this.getCurrentSpawnItem();
        const latestDroppedItem = runtimeProgress.lastDroppedItemId
            ? this.findResolvedCatalogItemById(runtimeProgress.lastDroppedItemId)
            : null;
        const unlockedItems = resolvedCatalog.filter((item) => item.isSpawnUnlocked).map((item) => item.itemName);
        const pocketSummary = resolvedCatalog.map((item) => `${item.itemName} ${item.ownedCount}`).join(' / ');
        const worldDropSummary = this.worldDropEnabled
            ? `每 ${this.getConfiguredWorldDropInterval()} 秒 ${this.getConfiguredWorldDropAmount()} 个`
            : '关闭';

        if (this.scoreLabel) {
            this.scoreLabel.string = `资源：${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins} | 回复：${this.getConfiguredResourceRegenAmount()} / ${this.getConfiguredResourceRegenInterval()}秒`;
        }

        if (this.dropCountLabel) {
            this.dropCountLabel.string = `当前投放：${currentSpawnItem?.itemName ?? '无'} | 随机掉落：${worldDropSummary}`;
        }

        if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `最近掉落：${latestDroppedItem?.itemName ?? '无'} | 收集：${pocketSummary || '无'} | 已解锁：${unlockedItems.join(' / ') || '无'}`;
        }

        if (this.statusLabel) {
            this.statusLabel.string = `地图：${mapConfig.mapName} | ${this.getStateText()} | ${this._statusText}`;
        }
    }

    private setStatus(statusText: string): void {
        this._statusText = statusText;
        this.refreshUi();
    }

    private getCurrentMapConfig(): MapConfig {
        return this.getMapConfig(runtimeProgress.currentMapId) ?? this.buildMapConfig('Map01');
    }

    private getMapConfig(mapId: MapId): MapConfig | null {
        switch (mapId) {
        case 'Map02':
            return this.buildMapConfig('Map02');
        case 'Map01':
            return this.buildMapConfig('Map01');
        default:
            return null;
        }
    }

    private buildMapConfig(mapId: MapId): MapConfig {
        if (mapId === 'Map02') {
            return {
                mapId: 'Map02',
                mapName: '地图二',
                sceneName: SHARED_SCENE_NAME,
                initialMapItemCount: this.normalizeNonNegativeInteger(this.map02InitialMapItemCount, 3),
                riskLevelHint: this.normalizeNonNegativeNumber(this.map02RiskLevelHint, 2),
            };
        }

        return {
            mapId: 'Map01',
            mapName: '地图一',
            sceneName: SHARED_SCENE_NAME,
            initialMapItemCount: this.normalizeNonNegativeInteger(this.map01InitialMapItemCount, 2),
            riskLevelHint: this.normalizeNonNegativeNumber(this.map01RiskLevelHint, 1),
        };
    }

    private getMapIdFromSelection(selection: MapSelection): MapId {
        return selection === MapSelection.Map02 ? 'Map02' : 'Map01';
    }

    private getStateText(): string {
        switch (this._state) {
        case RoundState.Playing:
            return '状态：投放中';
        case RoundState.LowResources:
            return '状态：资源不足';
        case RoundState.Ready:
        default:
            return '状态：准备';
        }
    }

    private getResolvedCatalog(mapId = runtimeProgress.currentMapId): ResolvedCatalogItem[] {
        return this.getNormalizedCatalogConfigs().map((config) => {
            const progress = runtimeProgress.itemProgress[config.itemId] ?? {
                ownedCount: 0,
                isSpawnUnlocked: false,
                isDiscovered: false,
            };
            const allowDropOnCurrentMap = mapId === 'Map02' ? config.allowDropInMap02 : config.allowDropInMap01;
            const prefabMetadata = this.resolvePrefabMetadata(config);

            return {
                ...config,
                ...prefabMetadata,
                ownedCount: progress.ownedCount,
                isSpawnUnlocked: progress.isSpawnUnlocked,
                isDiscovered: progress.isDiscovered,
                allowDropOnCurrentMap,
                canBeCurrentSpawnItem: progress.isSpawnUnlocked && !!config.prefab,
            };
        });
    }

    private getNormalizedCatalogConfigs(): NormalizedCatalogConfig[] {
        const normalizedItems: NormalizedCatalogConfig[] = [];
        const usedIds = new Set<string>();
        const sourceCount = Math.max(this.itemCatalog.length, DEFAULT_TEST_ITEMS.length);

        for (let index = 0; index < sourceCount; index += 1) {
            const inspectorItem = this.itemCatalog[index];
            const fallbackItem = DEFAULT_TEST_ITEMS[index] ?? DEFAULT_TEST_ITEMS[DEFAULT_TEST_ITEMS.length - 1];
            const itemId = this.normalizeItemId(inspectorItem?.itemId || fallbackItem.itemId, index);

            if (usedIds.has(itemId)) {
                warn(`[GameManager] Duplicate itemId detected and skipped: ${itemId}`);
                continue;
            }

            usedIds.add(itemId);
            normalizedItems.push({
                itemId,
                prefab: inspectorItem?.prefab ?? fallbackItem.prefab,
                unlockRequiredCount: this.normalizeNonNegativeInteger(
                    inspectorItem?.unlockRequiredCount ?? fallbackItem.unlockRequiredCount,
                ),
                startSpawnUnlocked: inspectorItem?.startSpawnUnlocked ?? fallbackItem.startSpawnUnlocked,
                startDiscovered: inspectorItem?.startDiscovered ?? fallbackItem.startDiscovered,
                allowDropInMap01: inspectorItem?.allowDropInMap01 ?? fallbackItem.allowDropInMap01,
                allowDropInMap02: inspectorItem?.allowDropInMap02 ?? fallbackItem.allowDropInMap02,
            });
        }

        return normalizedItems;
    }

    private resolvePrefabMetadata(config: NormalizedCatalogConfig): ResolvedPrefabMetadata {
        const fallbackName = this.humanizeItemId(config.itemId);
        const prefabConfig = ItemPrefabConfig.readFromPrefab(config.prefab, config.itemId, fallbackName);

        return {
            itemName: prefabConfig.itemName || fallbackName,
            value: this.normalizeNonNegativeInteger(prefabConfig.value, 1),
            weight: this.normalizeNonNegativeNumber(prefabConfig.weight, 1),
        };
    }

    private findResolvedCatalogItemById(itemId: string): ResolvedCatalogItem | null {
        return this.getResolvedCatalog().find((item) => item.itemId === itemId) ?? null;
    }

    private getCurrentSpawnItem(): ResolvedCatalogItem | null {
        if (!runtimeProgress.currentSpawnItemId) {
            return null;
        }

        const currentSpawnItem = this.findResolvedCatalogItemById(runtimeProgress.currentSpawnItemId);
        if (!currentSpawnItem?.canBeCurrentSpawnItem) {
            return null;
        }

        return currentSpawnItem;
    }

    private getConfiguredInitialCoins(): number {
        return this.normalizeNonNegativeInteger(this.startCoins);
    }

    private getConfiguredMaxCoins(): number {
        return this.normalizeNonNegativeInteger(this.maxCoins);
    }

    private getConfiguredResourceRegenInterval(): number {
        return this.normalizeNonNegativeNumber(this.resourceRegenInterval, 1);
    }

    private getConfiguredResourceRegenAmount(): number {
        return this.normalizeNonNegativeInteger(this.resourceRegenAmount, 1);
    }

    private getConfiguredWorldDropInterval(): number {
        return this.normalizeNonNegativeNumber(this.worldDropInterval, 5);
    }

    private getConfiguredWorldDropAmount(): number {
        return this.normalizeNonNegativeInteger(this.worldDropAmount, 1);
    }

    private getConfiguredAutoSpawnInterval(): number {
        return Math.max(MIN_AUTO_SPAWN_INTERVAL, this.normalizeNonNegativeNumber(this.autoSpawnInterval, 0.5));
    }

    private getConfiguredSpawnCost(): number {
        return Math.max(1, this.normalizeNonNegativeInteger(this.spawnCostPerCoin, 1));
    }

    private normalizeItemId(value: string, index: number): string {
        const trimmed = (value || '').trim();
        if (trimmed.length > 0) {
            return trimmed;
        }

        const fallback = DEFAULT_TEST_ITEMS[index]?.itemId ?? `item_${index + 1}`;
        return fallback;
    }

    private humanizeItemId(itemId: string): string {
        const trimmed = (itemId || '').trim();
        if (!trimmed) {
            return '未命名物品';
        }

        const spaced = trimmed
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ');

        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }

    private normalizeNonNegativeNumber(value: number, fallback = 0): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.max(0, value);
    }

    private normalizeNonNegativeInteger(value: number, fallback = 0): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.max(0, Math.round(value));
    }

    private normalizeFiniteInteger(value: number, fallback = 0): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.round(value);
    }

    private normalizeFiniteNumber(value: number, fallback = 0): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return value;
    }
}

function formatNumber(value: number): string {
    return Number.isFinite(value) ? value.toFixed(3) : String(value);
}
