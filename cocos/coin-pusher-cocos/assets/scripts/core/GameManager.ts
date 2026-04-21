import { _decorator, Component, director, Enum, Event, Label, Prefab, warn, PhysicsSystem, EPhysicsDrawFlags } from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner } from '../gameplay/CoinSpawner';
import { ItemPrefabConfig, ItemPrefabRuntimeConfig } from '../gameplay/ItemPrefabConfig';

const { ccclass, property } = _decorator;
const SHARED_SCENE_NAME = 'Prototype01';

type MapId = 'Map01' | 'Map02';
type ResolvedPrefabMetadata = Omit<ItemPrefabRuntimeConfig, 'itemId'>;

enum RoundState {
    Ready = 'Ready',
    Playing = 'Playing',
    NoCoins = 'NoCoins',
}

enum MapSelection {
    Map01 = 0,
    Map02 = 1,
}

@ccclass('CatalogItemConfig')
class CatalogItemConfig {
    @property({ tooltip: 'Stable item id used for runtime progress and button switching.' })
    public itemId = '';

    @property(Prefab)
    public prefab: Prefab | null = null;

    @property({ tooltip: 'How many copies must be collected before the item becomes selectable for active spawning.' })
    public unlockRequiredCount = 0;

    @property({ tooltip: 'Enable this for the very first base item that should be actively spawnable from the beginning.' })
    public startSpawnUnlocked = false;

    @property({ tooltip: 'Enable this if the item should already be shown as discovered at runtime start.' })
    public startDiscovered = false;

    @property
    public allowDropInMap01 = true;

    @property
    public allowDropInMap02 = true;
}

interface MapConfig {
    mapId: MapId;
    mapName: string;
    sceneName: string;
    ambientSpawnInterval: number;
    initialAmbientItemCount: number;
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
    coinRegenInterval: number;
    regenProgressSeconds: number;
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
    coinRegenInterval: 0,
    regenProgressSeconds: 0,
    currentSpawnItemId: '',
    lastDroppedItemId: '',
    itemProgress: {},
};

@ccclass('GameManager')
export class GameManager extends Component {
    @property(CoinSpawner)
    public coinSpawner: CoinSpawner | null = null;

    @property({ type: Enum(MapSelection), tooltip: 'Inspector map selection used on first boot and by applyInspectorMapSelection().' })
    public mapSelection = MapSelection.Map01;

    @property({ tooltip: 'Initial active-spawn resource written into the persistent runtime data on first boot.' })
    public startCoins = 300;

    @property({ tooltip: 'Natural regeneration cap. Active-spawn resource may exceed this only if you later add external rewards.' })
    public maxCoins = 300;

    @property({ tooltip: 'Seconds needed to regenerate 1 active-spawn resource while currentCoins is below maxCoins.' })
    public coinRegenInterval = 15;

    @property({ tooltip: 'How many active-spawn resources are consumed per spawn button click.' })
    public spawnCostPerCoin = 1;

    @property({ type: [CatalogItemConfig], tooltip: 'Logic-only item catalog. Shape and collider parameters now live on each item prefab.' })
    public itemCatalog: CatalogItemConfig[] = [];

    @property({ tooltip: 'How many map-pool items should be seeded onto the board when Map01 starts.' })
    public map01InitialMapItemCount = 2;

    @property({ tooltip: 'Seconds between automatic Map01 map-pool spawns. Set 0 to disable ambient map refresh.' })
    public map01AmbientSpawnInterval = 8;

    @property({ tooltip: 'Map01 future leak-risk hint. Reserved for later board-difficulty tuning.' })
    public map01RiskLevelHint = 1;

    @property({ tooltip: 'How many map-pool items should be seeded onto the board when Map02 starts.' })
    public map02InitialMapItemCount = 3;

    @property({ tooltip: 'Seconds between automatic Map02 map-pool spawns. Set 0 to disable ambient map refresh.' })
    public map02AmbientSpawnInterval = 6;

    @property({ tooltip: 'Map02 future leak-risk hint. Reserved for later board-difficulty tuning.' })
    public map02RiskLevelHint = 2;

    @property({ tooltip: 'Simple board safety cap so ambient map refresh does not flood the scene while idle.' })
    public maxBoardItemCount = 12;

    @property(Label)
    public scoreLabel: Label | null = null;

    @property(Label)
    public dropCountLabel: Label | null = null;

    @property(Label)
    public spawnCountLabel: Label | null = null;

    @property(Label)
    public statusLabel: Label | null = null;

    private _state = RoundState.Ready;
    private _sessionSpawnedCoinCount = 0;
    private _statusText = '准备进入持续存档';
    private _ambientSpawnProgressSeconds = 0;

	@property
	public showColliderDebug = false;

	protected start(): void {
		PhysicsSystem.instance.enable = true;

		if (this.showColliderDebug) {
			PhysicsSystem.instance.debugDrawFlags =
				EPhysicsDrawFlags.WIRE_FRAME | EPhysicsDrawFlags.AABB;
		} else {
			PhysicsSystem.instance.debugDrawFlags = 0;
		}
		
        this.ensureRuntimeProgress();
        this._sessionSpawnedCoinCount = 0;
        this._ambientSpawnProgressSeconds = 0;
        this.syncStateFromResources();
        this.seedInitialMapItems();

        const missingPrefabs = this.getResolvedCatalog().filter((item) => !item.prefab);
        if (missingPrefabs.length > 0) {
            this.setStatus(`请先在 GameManager.itemCatalog 绑定 prefab: ${missingPrefabs.map((item) => item.itemName).join(' / ')}`);
            return;
        }

        this.setStatus(`当前地图: ${this.getCurrentMapConfig().mapName}`);
    }

    protected update(deltaTime: number): void {
        if (!runtimeProgress.initialized) {
            return;
        }

        let shouldRefreshUi = false;

        if (this.tryRegenerateCoins(deltaTime)) {
            this.syncStateFromResources();
            shouldRefreshUi = true;
        }

        if (this.trySpawnAmbientMapItem(deltaTime)) {
            shouldRefreshUi = true;
        }

        if (shouldRefreshUi) {
            this.refreshUi();
        }
    }

    public spawnCoinFromButton(): boolean {
        const spawnCost = this.getConfiguredSpawnCost();
        const currentSpawnItem = this.getCurrentSpawnItem();

        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return false;
        }

        if (!currentSpawnItem) {
            this.setStatus('当前没有可投放物，请先检查图鉴配置');
            return false;
        }

        if (runtimeProgress.currentCoins < spawnCost) {
            this.syncStateFromResources();
            this.setStatus('投放资源不足');
            return false;
        }

        const spawnedCoin = this.coinSpawner.spawnCoin(currentSpawnItem.prefab);
        if (!spawnedCoin) {
            this.setStatus('投放失败');
            return false;
        }

        this._sessionSpawnedCoinCount += 1;
        runtimeProgress.currentCoins -= spawnCost;
        this.syncStateFromResources();

        if (runtimeProgress.currentCoins < spawnCost) {
            this.setStatus(`投出 ${currentSpawnItem.itemName} 后，投放资源不足`);
            return true;
        }

        this.setStatus(`已投放 ${currentSpawnItem.itemName}`);
        return true;
    }

    public resolveCoinDrop(coin: CoinBehaviour): void {
        if (!coin.tryMarkScored()) {
            return;
        }

        const collectedItem = this.findResolvedCatalogItemById(coin.itemId);
        if (!collectedItem) {
            warn(`[GameManager] Dropped item is missing catalog registration: ${coin.itemId || coin.node.name}`);
            this.setStatus(`掉落物未登记: ${coin.itemTypeLabel}`);
            coin.onScored();
            return;
        }

        const progress = runtimeProgress.itemProgress[collectedItem.itemId];
        progress.ownedCount += 1;
        progress.isDiscovered = true;
        runtimeProgress.lastDroppedItemId = collectedItem.itemId;

        let unlockedItemName = '';
        if (!progress.isSpawnUnlocked && progress.ownedCount >= collectedItem.unlockRequiredCount) {
            progress.isSpawnUnlocked = true;
            unlockedItemName = collectedItem.itemName;
        }

        this.ensureRuntimeProgress();
        this.syncStateFromResources();
        coin.onScored();

        if (unlockedItemName) {
            this.setStatus(`收到 ${collectedItem.itemName} x1，已解锁可投放: ${unlockedItemName}`);
            return;
        }

        this.setStatus(`收到 ${collectedItem.itemName} x1，口袋 ${progress.ownedCount}`);
    }

    public restartGame(): void {
        const currentScene = director.getScene();
        if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('重开失败：当前场景不存在');
            return;
        }

        director.loadScene(currentScene.name);
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
        return !!this.coinSpawner && !!this.getCurrentSpawnItem() && runtimeProgress.currentCoins >= this.getConfiguredSpawnCost();
    }

    public onSpawnItemButtonClicked(_event: Event | null, itemId: string): void {
        this.selectSpawnItemById(itemId);
    }

    public selectSpawnItemById(itemId: string): boolean {
        const nextItem = this.findResolvedCatalogItemById(itemId);
        if (!nextItem) {
            this.setStatus(`未找到投放物: ${itemId}`);
            return false;
        }

        if (!nextItem.isSpawnUnlocked) {
            this.setStatus(`${nextItem.itemName} 还没有解锁投放`);
            return false;
        }

        if (!nextItem.prefab) {
            this.setStatus(`${nextItem.itemName} 缺少 prefab 绑定`);
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
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
            runtimeProgress.regenProgressSeconds = 0;
            runtimeProgress.currentSpawnItemId = '';
            runtimeProgress.lastDroppedItemId = '';
            runtimeProgress.itemProgress = {};
        } else {
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = Math.max(0, runtimeProgress.currentCoins);
            runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
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
        this._ambientSpawnProgressSeconds = 0;
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
        const initialCount = this.normalizeNonNegativeInteger(mapConfig.initialAmbientItemCount);

        for (let index = 0; index < initialCount; index += 1) {
            if (!this.spawnMapPoolItem()) {
                break;
            }
        }
    }

    private trySpawnAmbientMapItem(deltaTime: number): boolean {
        const mapConfig = this.getCurrentMapConfig();
        const interval = this.normalizeNonNegativeNumber(mapConfig.ambientSpawnInterval);
        if (interval <= 0) {
            this._ambientSpawnProgressSeconds = 0;
            return false;
        }

        this._ambientSpawnProgressSeconds += deltaTime;
        let spawned = false;

        while (this._ambientSpawnProgressSeconds >= interval) {
            this._ambientSpawnProgressSeconds -= interval;
            if (!this.spawnMapPoolItem()) {
                break;
            }
            spawned = true;
        }

        return spawned;
    }

    private spawnMapPoolItem(): boolean {
        if (!this.coinSpawner) {
            return false;
        }

        if (this.getBoardItemCount() >= this.getConfiguredBoardItemLimit()) {
            return false;
        }

        const mapPoolItem = this.pickRandomMapPoolItem();
        if (!mapPoolItem) {
            return false;
        }

        return !!this.coinSpawner.spawnCoin(mapPoolItem.prefab);
    }

    private pickRandomMapPoolItem(): ResolvedCatalogItem | null {
        const dropPool = this.getResolvedCatalog().filter((item) => item.allowDropOnCurrentMap && !!item.prefab);
        if (dropPool.length === 0) {
            return null;
        }

        return dropPool[Math.floor(Math.random() * dropPool.length)] ?? null;
    }

    private tryRegenerateCoins(deltaTime: number): boolean {
        const regenInterval = runtimeProgress.coinRegenInterval;
        if (regenInterval <= 0 || runtimeProgress.currentCoins >= runtimeProgress.maxCoins) {
            runtimeProgress.regenProgressSeconds = 0;
            return false;
        }

        runtimeProgress.regenProgressSeconds += deltaTime;

        let regenerated = false;
        while (
            runtimeProgress.regenProgressSeconds >= regenInterval &&
            runtimeProgress.currentCoins < runtimeProgress.maxCoins
        ) {
            runtimeProgress.regenProgressSeconds -= regenInterval;
            runtimeProgress.currentCoins += 1;
            regenerated = true;
        }

        return regenerated;
    }

    private syncStateFromResources(): void {
        if (!this.getCurrentSpawnItem()) {
            this._state = RoundState.Ready;
            return;
        }

        if (runtimeProgress.currentCoins < this.getConfiguredSpawnCost()) {
            this._state = RoundState.NoCoins;
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

        if (this.scoreLabel) {
            this.scoreLabel.string = `投放资源: ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins} | 自动恢复 ${runtimeProgress.coinRegenInterval}s`;
        }

        if (this.dropCountLabel) {
            this.dropCountLabel.string = `当前投放物: ${currentSpawnItem?.itemName ?? '未设置'} | 已解锁: ${unlockedItems.join(' / ') || '无'}`;
        }

        if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `最近掉落: ${latestDroppedItem?.itemName ?? '暂无'} | 口袋: ${pocketSummary || '暂无物品'}`;
        }

        if (this.statusLabel) {
            this.statusLabel.string = `地图: ${mapConfig.mapName} | ${this.getStateText()} | ${this._statusText}`;
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
                mapName: 'Map02 预留地图',
                sceneName: SHARED_SCENE_NAME,
                ambientSpawnInterval: this.normalizeNonNegativeNumber(this.map02AmbientSpawnInterval, 6),
                initialAmbientItemCount: this.normalizeNonNegativeInteger(this.map02InitialMapItemCount, 3),
                riskLevelHint: this.normalizePositiveNumber(this.map02RiskLevelHint, 2),
            };
        }

        return {
            mapId: 'Map01',
            mapName: 'Map01 基础地图',
            sceneName: SHARED_SCENE_NAME,
            ambientSpawnInterval: this.normalizeNonNegativeNumber(this.map01AmbientSpawnInterval, 8),
            initialAmbientItemCount: this.normalizeNonNegativeInteger(this.map01InitialMapItemCount, 2),
            riskLevelHint: this.normalizePositiveNumber(this.map01RiskLevelHint, 1),
        };
    }

    private getMapIdFromSelection(selection: MapSelection): MapId {
        return selection === MapSelection.Map02 ? 'Map02' : 'Map01';
    }

    private getStateText(): string {
        switch (this._state) {
        case RoundState.Playing:
            return '状态: 进行中';
        case RoundState.NoCoins:
            return '状态: 资源不足';
        case RoundState.Ready:
        default:
            return '状态: 准备中';
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

    private getBoardItemCount(): number {
        return this.coinSpawner?.coinRoot?.children.length ?? 0;
    }

    private getConfiguredBoardItemLimit(): number {
        return Math.max(1, this.normalizeNonNegativeInteger(this.maxBoardItemCount, 12));
    }

    private getConfiguredInitialCoins(): number {
        return this.normalizeNonNegativeInteger(this.startCoins);
    }

    private getConfiguredMaxCoins(): number {
        return this.normalizeNonNegativeInteger(this.maxCoins);
    }

    private getConfiguredCoinRegenInterval(): number {
        return this.normalizeNonNegativeNumber(this.coinRegenInterval);
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
            return 'Unnamed Item';
        }

        const spaced = trimmed
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ');

        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }

    private normalizePositiveNumber(value: number, fallback = 1): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.max(0, value);
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
}
