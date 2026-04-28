import {
    _decorator,
    Component,
    director,
    Enum,
    Event,
    find,
    ImageAsset,
    Label,
    Node,
    log,
    Prefab,
    Quat,
    Vec3,
    warn,
    PhysicsSystem,
    EPhysicsDrawFlags,
    Color,
    Collider,
    instantiate,
    MeshRenderer,
    RigidBody,
} from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner, CoinSpawnRequest } from '../gameplay/CoinSpawner';
import { ItemPrefabConfig, ItemPrefabRuntimeConfig } from '../gameplay/ItemPrefabConfig';
import { ModeConfig } from '../config/ModeConfig';
import { ModeConfigTable } from '../config/ModeConfigTable';
import {
    BusinessDayResult,
    BusinessItemValueSnapshot,
    BusinessModeController,
} from '../modes/business/BusinessModeController';
import { AudioService, GameSoundId, playGameSound } from './AudioService';
import { DayResultPanel } from '../ui/DayResultPanel';
import { SHOP_RUNTIME_STATE, SHOP_SCENE_NAME } from '../shop/ShopTypes';

const { ccclass, property } = _decorator;
const SHARED_SCENE_NAME = 'Prototype01';
const MIN_AUTO_SPAWN_INTERVAL = 0.05;
const INSUFFICIENT_RESOURCE_STATUS = '资源不足，无法投放';
const AUTO_SPAWN_INSUFFICIENT_RESOURCE_STATUS = '资源不足，自动投放已停止';
const INSUFFICIENT_STOCK_STATUS = '今日进货次数不足';

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
        type: ImageAsset,
        displayName: '图鉴图片',
        tooltip: '图鉴 UI 使用的物品 PNG 图片资源。为空时图鉴卡片会显示文字占位；换成清晰、正面的 PNG 可以提升图鉴识别度。',
    })
    public iconImage: ImageAsset | null = null;

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

interface RuntimeBoardItemSnapshot {
    itemId: string;
    coinId: number;
    worldPosition: Vec3;
    worldRotation: Quat;
    linearVelocity: Vec3;
    angularVelocity: Vec3;
}

interface RuntimePersistentProgress {
    initialized: boolean;
    currentMapId: MapId;
    currentBusinessDay: number;
    currentCoins: number;
    remainingStock: number;
    remainingStockLimit: number;
    remainingStockModeId: string;
    maxCoins: number;
    resourceRegenProgressSeconds: number;
    worldDropProgressSeconds: number;
    currentSpawnItemId: string;
    lastDroppedItemId: string;
    itemProgress: Record<string, RuntimeItemProgress>;
    boardItemSnapshots: RuntimeBoardItemSnapshot[];
}

export interface EncyclopediaCatalogItemSnapshot {
    itemId: string;
    itemName: string;
    iconImage: ImageAsset | null;
    value: number;
    weight: number;
    ownedCount: number;
    unlockRequiredCount: number;
    isSpawnUnlocked: boolean;
    isDiscovered: boolean;
}

interface NormalizedCatalogConfig {
    itemId: string;
    prefab: Prefab | null;
    iconImage: ImageAsset | null;
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

interface SpawnItemResolveResult {
    item: ResolvedCatalogItem | null;
    statusText: string;
}

const DEFAULT_TEST_ITEMS: NormalizedCatalogConfig[] = [
    {
        itemId: 'apple',
        prefab: null,
        iconImage: null,
        unlockRequiredCount: 0,
        startSpawnUnlocked: true,
        startDiscovered: true,
        allowDropInMap01: true,
        allowDropInMap02: true,
    },
    {
        itemId: 'banana',
        prefab: null,
        iconImage: null,
        unlockRequiredCount: 3,
        startSpawnUnlocked: false,
        startDiscovered: false,
        allowDropInMap01: true,
        allowDropInMap02: true,
    },
    {
        itemId: 'lemon',
        prefab: null,
        iconImage: null,
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
    currentBusinessDay: 1,
    currentCoins: 0,
    remainingStock: 0,
    remainingStockLimit: 0,
    remainingStockModeId: '',
    maxCoins: 0,
    resourceRegenProgressSeconds: 0,
    worldDropProgressSeconds: 0,
    currentSpawnItemId: '',
    lastDroppedItemId: '',
    itemProgress: {},
    boardItemSnapshots: [],
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
        type: ModeConfigTable,
        displayName: '模式配置表',
        tooltip: '绑定场景中的“模式配置表”节点。GameManager 会读取当前 ModeConfig 来决定手动投放、订购单投放、资源消耗、随机掉落和自动投放是否启用。'
    })
    public modeConfigTable: ModeConfigTable | null = null;

    @property({
        type: BusinessModeController,
        displayName: '经营模式控制器',
        tooltip: '绑定场景中的 BusinessModeController。存在且启用时，主动点击/长按投放会优先按经营模式订购单牌组权重抽取物品；为空时保持旧的当前投放物逻辑。'
    })
    public businessModeController: BusinessModeController | null = null;

    @property({
        type: AudioService,
        displayName: '音频服务',
        tooltip: '拖入 GameRoot/AudioManager 上的 AudioService。为空时会尝试使用当前场景中已加载的 AudioService 单例；仍为空则静默跳过，不会报错。',
    })
    public audioService: AudioService | null = null;

    @property({
        type: Enum(MapSelection),
        displayName: '初始地图',
        tooltip: '首次启动运行数据时使用的地图选择。切换后会影响初始掉落数量和随机掉落池。',
    })
    public mapSelection = MapSelection.Map01;

    @property({
        displayName: '初始资源',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.initialResource。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public startCoins = 300;

    @property({
        displayName: '资源回复上限',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.resourceRecoverLimit。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public maxCoins = 300;

    @property({
        displayName: '资源回复间隔',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.resourceRecoverInterval。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public resourceRegenInterval = 1;

    @property({
        displayName: '每次回复资源',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.resourceRecoverAmount。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public resourceRegenAmount = 1;

    @property({
        displayName: '主动投放消耗',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.manualSpawnCost。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public spawnCostPerCoin = 1;

    @property({
        displayName: '覆盖手动投放 Y',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.overrideManualSpawnY。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public manualSpawnYOverrideEnabled = true;

    @property({
        displayName: '手动投放 Y',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.manualSpawnY。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public manualSpawnY = 1;

    @property({
        displayName: '自动投放间隔',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.autoSpawnInterval。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public autoSpawnInterval = 0.5;

    @property({
        displayName: '自动投放 X',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.autoSpawnX。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public autoSpawnX = 0;

    @property({
        displayName: '自动投放 Z',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.autoSpawnZ。正常请在“模式配置表/具体模式参数”里修改。',
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
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.enableRandomDrop。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public worldDropEnabled = true;

    @property({
        displayName: '世界掉落间隔',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.randomDropInterval。正常请在“模式配置表/具体模式参数”里修改。',
    })
    public worldDropInterval = 5;

    @property({
        displayName: '每批世界掉落数量',
        tooltip: '兼容旧配置用；当前模式优先读取 ModeConfig.randomDropAmount。正常请在“模式配置表/具体模式参数”里修改。',
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
        displayName: '模式资源标签',
        tooltip: '当前模式主界面使用的资源 Label。经营模式左侧信息栏可绑定到这里；旧图鉴 HUD 仍可继续使用资源标签。为空时不更新额外模式资源显示。',
    })
    public modeResourceLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '模式天数标签',
        tooltip: '经营模式左侧顶部显示当前第几天的 Label。为空时会自动查找“回合信息”节点。',
    })
    public modeDayLabel: Label | null = null;

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
        type: Label,
        displayName: '结束本日按钮文字',
        tooltip: '经营模式左侧底部“结束本日/进入明日”按钮上的文字 Label。达标后会切换为“进入明日”，进入新一天后切回“结束本日”。'
    })
    public businessEndDayButtonLabel: Label | null = null;

    @property({
        type: DayResultPanel,
        displayName: '本日结算面板',
        tooltip: '经营模式结束本日后弹出的独立结算面板。显示是否达标、今日分数、目标分数，并处理继续本日或进入商店按钮。'
    })
    public dayResultPanel: DayResultPanel | null = null;

    @property({
        type: Node,
        displayName: '重新开始按钮',
        tooltip: '重新开始按钮节点。为空时会自动查找 Canvas/UIRoot/RestartButton，用于兜底恢复按钮点击后重开本局。绑定错误会导致按钮无响应。',
    })
    public restartButton: Node | null = null;

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
    private readonly _resolvedManualSpawnPosition = new Vec3();
    private _boundRestartButton: Node | null = null;
    private _restartLocked = false;
    private _modeStartAccepted = false;
    private _businessDayReadyForTomorrow = false;
    private _dayResultPhysicsFrozen = false;

    protected start(): void {
        PhysicsSystem.instance.enable = true;
        this.autoSpawnEnabled = false;
        this._autoSpawnTimer = 0;
        this.refreshModeStartGate();
        this.bindRestartButton();
        this.bindModeResourceLabel();
        this.bindModeDayLabel();
        this.bindDayResultPanel();
        this.dayResultPanel?.setMainButtonHandler((passed) => this.onDayResultPanelMainButtonClicked(passed));
        this.dayResultPanel?.hide();
        this.refreshBusinessEndDayButtonLabel();

        if (this.showColliderDebug) {
            PhysicsSystem.instance.debugDrawFlags =
                EPhysicsDrawFlags.WIRE_FRAME | EPhysicsDrawFlags.AABB;
        } else {
            PhysicsSystem.instance.debugDrawFlags = 0;
        }

        this.ensureRuntimeProgress();
        this.syncBusinessItemValues();
        this.startBusinessDayState();

        if (SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay) {
            SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay = false;
            this.enterNextBusinessDay();
            this.restoreBoardItemsAfterSceneTransition();
            return;
        }

        this._sessionSpawnedCoinCount = 0;
        this.syncStateFromResources();

        const missingPrefabs = this.getResolvedCatalog().filter((item) => !item.prefab);
        if (missingPrefabs.length > 0) {
            this.setStatus(`请在 GameManager.itemCatalog 配置 Prefab：${missingPrefabs.map((item) => item.itemName).join(' / ')}`);
            return;
        }

        if (this.shouldEnableRandomDrop()) {
            this.seedInitialMapItems();
        }
        this.setStatus(`当前地图：${this.getCurrentMapConfig().mapName}`);
    }

    protected onDisable(): void {
        this.setDayResultPhysicsFrozen(false);
        this.dayResultPanel?.setMainButtonHandler(null);
        this.unbindRestartButton();
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

    public resolveManualSpawnWorldPosition(worldX: number, worldZ: number, out: Vec3 | null = null): Vec3 {
        const target = out ?? new Vec3();
        const basePosition = this.coinSpawner?.getBaseSpawnWorldPosition(this._resolvedManualSpawnPosition)
            ?? this._resolvedManualSpawnPosition;
        const baseX = basePosition.x;
        const baseY = basePosition.y;
        const baseZ = basePosition.z;
        const modeConfig = this.getActiveModeConfig();
        const shouldOverrideManualSpawnY = modeConfig?.overrideManualSpawnY ?? this.manualSpawnYOverrideEnabled;
        const configuredManualSpawnY = modeConfig?.manualSpawnY ?? this.manualSpawnY;

        Vec3.set(
            target,
            this.normalizeFiniteNumber(worldX, baseX),
            shouldOverrideManualSpawnY
                ? this.normalizeFiniteNumber(configuredManualSpawnY, baseY)
                : baseY,
            this.normalizeFiniteNumber(worldZ, baseZ),
        );

        return target;
    }

    public spawnCoinFromManualPosition(worldX: number, worldZ: number, debugLog = false): boolean {
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return false;
        }

        this.resolveManualSpawnWorldPosition(worldX, worldZ, this._manualSpawnPosition);

        if (debugLog) {
            log(
                `[GameManager.manualSpawnAt] worldX=${formatNumber(this._manualSpawnPosition.x)} `
                + `fixedDepthZ=${formatNumber(this._manualSpawnPosition.z)} `
                + `spawnY=${formatNumber(this._manualSpawnPosition.y)}`,
            );
        }

        return this.spawnCurrentSpawnItem({
            worldPosition: this._manualSpawnPosition,
            randomizeAroundPosition: false,
        });
    }

    public spawnBusinessNextItemAtPosition(worldPosition: Vec3, worldRotation: Quat | null = null): boolean {
        if (!this.shouldUseBusinessOrderDeck()) {
            this.setStatus('当前模式没有可用订购单投放来源');
            return false;
        }

        return this.spawnCurrentSpawnItem({
            worldPosition,
            worldRotation,
            randomizeAroundPosition: false,
        });
    }

    public createBusinessNextItemPreview(
        previewParent: Node | null = null,
        previewAlpha = 0.45,
        outWorldRotation: Quat | null = null,
    ): Node | null {
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return null;
        }

        if (this.isDayResultPanelShowing()) {
            this.setStatus('请先处理本日结算');
            return null;
        }

        if (!this.shouldUseBusinessOrderDeck()) {
            this.setStatus('当前模式没有可用订购单投放来源');
            return null;
        }

        const businessController = this.businessModeController;
        if (!businessController?.hasAvailableOrders()) {
            const statusText = businessController?.getNoAvailableOrderStatus() ?? '没有可用订购单';
            businessController?.showSpawnMessage('下次投放：无');
            this.setStatus(statusText);
            return null;
        }

        if (!this.hasRemainingStock()) {
            this.setStatus(INSUFFICIENT_STOCK_STATUS);
            return null;
        }

        const spawnItemResult = this.resolveBusinessOrderDeckSpawnItem();
        const previewItem = spawnItemResult.item;
        if (!previewItem?.prefab) {
            this.setStatus(spawnItemResult.statusText || '没有可用订购单');
            return null;
        }

        const previewNode = instantiate(previewItem.prefab);
        previewNode.active = false;
        previewNode.name = `${previewItem.itemName}_虚影`;
        this.disablePreviewRuntimeComponents(previewNode);

        const parent = previewParent ?? this.coinSpawner.coinRoot ?? this.coinSpawner.node;
        parent.addChild(previewNode);
        const previewRotation = this.coinSpawner.createRandomSpawnWorldRotation(outWorldRotation);
        previewNode.setWorldRotation(previewRotation);
        this.applyPreviewVisualStyle(previewNode, previewAlpha);
        previewNode.active = true;
        return previewNode;
    }

    public toggleAutoSpawn(): boolean {
        return this.setAutoSpawnEnabled(!this.autoSpawnEnabled);
    }

    public setAutoSpawnEnabled(enabled: boolean): boolean {
        if (!enabled) {
            this.stopAutoSpawn('自动投放已关闭');
            return false;
        }

        if (!this.shouldEnableAutoSpawn()) {
            this.stopAutoSpawn('当前模式已禁用自动投放');
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
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return false;
        }

        if (this.isDayResultPanelShowing()) {
            this.setStatus('请先处理本日结算');
            return false;
        }

        if (!this.shouldAllowManualSpawn()) {
            this.setStatus('当前模式不允许手动投放');
            return false;
        }

        if (!this.isModeStartGateOpen()) {
            this.setStatus('请先开始当前模式');
            return false;
        }

        const shouldUseBusinessDeck = this.shouldUseBusinessOrderDeck();
        const shouldConsumeResource = this.shouldConsumeResourceOnManualSpawn();

        if (shouldUseBusinessDeck) {
            const businessController = this.businessModeController;
            if (!businessController?.hasAvailableOrders()) {
                const statusText = businessController?.getNoAvailableOrderStatus() ?? '没有可用订购单';
                businessController?.showSpawnMessage('下次投放：无');
                this.setStatus(statusText);
                return false;
            }

            if (!this.hasRemainingStock()) {
                this.setStatus(INSUFFICIENT_STOCK_STATUS);
                return false;
            }

            if (!businessController.getPreparedNextItem()) {
                businessController.showSpawnMessage('下次投放：无');
                this.setStatus(businessController.getNoAvailableOrderStatus());
                return false;
            }

            if (shouldConsumeResource && !this.canAffordSpawn()) {
                this.setStatus(INSUFFICIENT_RESOURCE_STATUS);
                return false;
            }
        }

        const spawnItemResult = this.resolveActiveSpawnItem();
        const currentSpawnItem = spawnItemResult.item;
        if (!currentSpawnItem) {
            this.setStatus(spawnItemResult.statusText || '当前没有可投放物品');
            return false;
        }

        if (shouldConsumeResource && !this.canAffordSpawn()) {
            this.setStatus(INSUFFICIENT_RESOURCE_STATUS);
            return false;
        }

        const spawnedItem = this.spawnCatalogItem(currentSpawnItem, request);
        if (!spawnedItem) {
            this.setStatus('投放失败');
            return false;
        }

        this._sessionSpawnedCoinCount += 1;
        if (shouldUseBusinessDeck) {
            runtimeProgress.remainingStock = Math.max(0, runtimeProgress.remainingStock - 1);
            this.businessModeController?.consumePreparedNextItemAndPrepareAnother();
        }
        if (shouldConsumeResource) {
            runtimeProgress.currentCoins -= this.getConfiguredSpawnCost();
        }
        this.syncStateFromResources();
        this.playSound('coin-drop');
        const resourceText = shouldConsumeResource
            ? `，资源 ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins}`
            : '';
        const stockText = shouldUseBusinessDeck
            ? `，当天剩余进货 ${runtimeProgress.remainingStock}`
            : '';
        this.setStatus(`已投放 ${currentSpawnItem.itemName}${stockText}${resourceText}`);
        return true;
    }

    private updateAutoSpawn(deltaTime: number): boolean {
        if (!this.shouldEnableAutoSpawn()) {
            if (this.autoSpawnEnabled) {
                this.stopAutoSpawn('当前模式已禁用自动投放');
            }
            return false;
        }

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

        if (!this.spawnCoinFromManualPosition(this.getConfiguredAutoSpawnX(), this.getConfiguredAutoSpawnZ())) {
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

        if (!this.shouldEnableAutoSpawn()) {
            return '当前模式已禁用自动投放';
        }

        if (this.shouldUseBusinessOrderDeck()) {
            const businessController = this.businessModeController;
            if (!businessController?.hasAvailableOrders()) {
                return `${businessController?.getNoAvailableOrderStatus() ?? '没有可用订购单'}，自动投放已停止`;
            }

            if (!this.hasRemainingStock()) {
                return `${INSUFFICIENT_STOCK_STATUS}，自动投放已停止`;
            }

            if (!businessController.getPreparedNextItem()) {
                return '没有可用下次投放物，自动投放已停止';
            }
        } else if (this.shouldUseLegacyCurrentItem()) {
            if (!this.getCurrentSpawnItem()) {
                return '当前没有可投放物品，自动投放已停止';
            }
        } else {
            return '当前模式没有可用投放来源，自动投放已停止';
        }

        if (this.shouldConsumeResourceOnManualSpawn() && !this.canAffordSpawn()) {
            return AUTO_SPAWN_INSUFFICIENT_RESOURCE_STATUS;
        }

        return '';
    }

    public startCurrentMode(): void {
        this._modeStartAccepted = true;
        this.playSound('button-click');
        this.setStatus(`${this.getActiveModeDisplayName()}已开始`);
    }

    public endCurrentBusinessDay(): void {
        this.ensureRuntimeProgress();

        if (!this.shouldUseBusinessOrderDeck()) {
            this.setStatus('当前模式不使用经营本日流程');
            return;
        }

        if (this._businessDayReadyForTomorrow) {
            this.enterNextBusinessDay();
            return;
        }

        this.playSound('button-click');
        const dayResult = this.businessModeController?.settleCurrentDay() ?? this.buildFallbackBusinessDayResult();
        const resultText = dayResult.reachedTarget ? '本日达标！' : '本日未达标';

        if (this.dayResultPanel) {
            this._businessDayReadyForTomorrow = false;
            this.refreshBusinessEndDayButtonLabel();
            this.setDayResultPhysicsFrozen(true);
            this.dayResultPanel.showResult(dayResult);
            this.setStatus('请查看本日结算');
            return;
        }

        if (!dayResult.reachedTarget) {
            this._businessDayReadyForTomorrow = false;
            this.refreshBusinessEndDayButtonLabel();
            this.setStatus(`${resultText} ${formatScore(dayResult.score)} / ${formatScore(dayResult.targetScore)}`);
            return;
        }

        this._businessDayReadyForTomorrow = true;
        this.refreshBusinessEndDayButtonLabel();
        this.setStatus(`${resultText} 今日分数 ${formatScore(dayResult.score)} / ${formatScore(dayResult.targetScore)}，可进入明日`);
    }

    private enterNextBusinessDay(): void {
        const claimedMoney = this.businessModeController?.claimSettledMoney() ?? 0;
        const nextBusinessDay = runtimeProgress.currentBusinessDay + 1;
        runtimeProgress.currentBusinessDay = nextBusinessDay;

        const configuredStockLimit = this.getConfiguredStockLimitForDay(nextBusinessDay);
        runtimeProgress.remainingStock = configuredStockLimit;
        runtimeProgress.remainingStockLimit = configuredStockLimit;
        runtimeProgress.remainingStockModeId = this.getActiveModeId();
        runtimeProgress.resourceRegenProgressSeconds = 0;
        runtimeProgress.worldDropProgressSeconds = 0;

        this._businessDayReadyForTomorrow = false;
        this.stopAutoSpawn();
        this.syncBusinessItemValues();
        this.businessModeController?.startCurrentDay(
            runtimeProgress.currentBusinessDay,
            this.getConfiguredBaseDailyTargetScore(),
            this.getConfiguredDailyTargetScoreIncrease(),
        );
        this.syncStateFromResources();
        this.refreshBusinessEndDayButtonLabel();
        this.setDayResultPhysicsFrozen(false);
        this.playSound('button-click');
        this.setStatus(claimedMoney > 0
            ? `获得资金 ￥${claimedMoney}，已进入第${runtimeProgress.currentBusinessDay}天`
            : `已进入第${runtimeProgress.currentBusinessDay}天`);
    }

    private onDayResultPanelMainButtonClicked(passed: boolean): void {
        this.dayResultPanel?.hide();

        if (!passed) {
            this._businessDayReadyForTomorrow = false;
            this.refreshBusinessEndDayButtonLabel();
            this.setDayResultPhysicsFrozen(false);
            this.setStatus('继续本日');
            return;
        }

        const claimedMoney = this.businessModeController?.claimSettledMoney() ?? 0;
        this._businessDayReadyForTomorrow = false;
        this.refreshBusinessEndDayButtonLabel();
        this.setDayResultPhysicsFrozen(false);
        this.captureBoardItemsForSceneTransition();
        SHOP_RUNTIME_STATE.currentMoney = this.businessModeController?.getCurrentMoney() ?? SHOP_RUNTIME_STATE.currentMoney;
        SHOP_RUNTIME_STATE.returnSceneName = SHARED_SCENE_NAME;
        SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay = true;
        director.loadScene(SHOP_SCENE_NAME);
        this.setStatus(claimedMoney > 0
            ? `获得资金 ￥${claimedMoney}，进入商店采购订购单`
            : '进入商店采购订购单');
    }

    private captureBoardItemsForSceneTransition(): void {
        runtimeProgress.boardItemSnapshots = [];

        if (!this.coinSpawner) {
            return;
        }

        const parent = this.coinSpawner.coinRoot ?? this.coinSpawner.node;
        const spawnPoint = this.coinSpawner.spawnPoint;
        runtimeProgress.boardItemSnapshots = parent.children
            .filter((child) => child !== spawnPoint)
            .map((child) => {
                const item = child.getComponent(CoinBehaviour);
                if (!item || item.hasScored || !item.itemId) {
                    return null;
                }

                const body = child.getComponent(RigidBody);
                const worldPosition = new Vec3();
                const worldRotation = new Quat();
                const linearVelocity = new Vec3();
                const angularVelocity = new Vec3();
                child.getWorldPosition(worldPosition);
                child.getWorldRotation(worldRotation);
                body?.getLinearVelocity(linearVelocity);
                body?.getAngularVelocity(angularVelocity);

                return {
                    itemId: item.itemId,
                    coinId: item.coinId,
                    worldPosition,
                    worldRotation,
                    linearVelocity,
                    angularVelocity,
                };
            })
            .filter((snapshot): snapshot is RuntimeBoardItemSnapshot => !!snapshot);
    }

    private restoreBoardItemsAfterSceneTransition(): void {
        const snapshots = runtimeProgress.boardItemSnapshots;
        if (snapshots.length <= 0) {
            return;
        }

        if (!this.coinSpawner) {
            warn('[GameManager] 找不到 CoinSpawner，无法恢复进入商店前的推币机物体。');
            return;
        }

        runtimeProgress.boardItemSnapshots = [];
        snapshots.forEach((snapshot) => {
            const catalogItem = this.findResolvedCatalogItemById(snapshot.itemId);
            if (!catalogItem?.prefab) {
                warn(`[GameManager] 找不到 ${snapshot.itemId} 的 Prefab，无法恢复进入商店前的物体。`);
                return;
            }

            const restoredItem = this.coinSpawner?.restoreSpawnedItem(
                catalogItem.prefab,
                snapshot.worldPosition,
                snapshot.worldRotation,
                snapshot.coinId,
            ) ?? null;
            const body = restoredItem?.getComponent(RigidBody) ?? null;
            if (!body) {
                return;
            }

            body.setLinearVelocity(snapshot.linearVelocity);
            body.setAngularVelocity(snapshot.angularVelocity);
            body.wakeUp();
        });
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
        this.businessModeController?.recordDrop(collectedItem.itemId, collectedItem.value, collectedItem.itemName);

        let unlockedItemName = '';
        if (!progress.isSpawnUnlocked && progress.ownedCount >= collectedItem.unlockRequiredCount) {
            progress.isSpawnUnlocked = true;
            unlockedItemName = collectedItem.itemName;
        }

        this.ensureRuntimeProgress();
        this.syncStateFromResources();
        item.onScored();
        this.playSound(unlockedItemName ? 'unlock' : 'item-drop');

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
        if (this._restartLocked) {
            return;
        }

        this._restartLocked = true;
        this.scheduleOnce(() => {
            this._restartLocked = false;
        }, 0);

        this.stopAutoSpawn();
        this.coinSpawner?.clearSpawnedItems();
        this.dayResultPanel?.hide();
        this.setDayResultPhysicsFrozen(false);
        this.resetRuntimeProgress();
        this.refreshModeStartGate();
        this._businessDayReadyForTomorrow = false;
        this.refreshBusinessEndDayButtonLabel();
        this.ensureRuntimeProgress();
        this.syncBusinessItemValues();
        this.startBusinessDayState();
        this._sessionSpawnedCoinCount = 0;
        this.syncStateFromResources();
        if (this.shouldEnableRandomDrop()) {
            this.seedInitialMapItems();
        }
        this.playSound('button-click');
        this.setStatus(`已重新开始，当前地图：${this.getCurrentMapConfig().mapName}`);
    }

    private bindRestartButton(): void {
        const buttonNode = this.restartButton ?? find('Canvas/UIRoot/RestartButton');
        if (!buttonNode) {
            warn('[GameManager] RestartButton is not assigned and could not be found.');
            return;
        }

        this._boundRestartButton = buttonNode;
        buttonNode.off(Node.EventType.TOUCH_END, this.onRestartButtonTouched, this);
        buttonNode.on(Node.EventType.TOUCH_END, this.onRestartButtonTouched, this);
    }

    private unbindRestartButton(): void {
        this._boundRestartButton?.off(Node.EventType.TOUCH_END, this.onRestartButtonTouched, this);
        this._boundRestartButton = null;
    }

    private bindModeResourceLabel(): void {
        if (this.modeResourceLabel) {
            return;
        }

        const modeResourceNode = find('Canvas/UIRoot/经营模式界面/左侧信息栏/顶部信息区/资源信息');
        this.modeResourceLabel = modeResourceNode?.getComponent(Label) ?? null;
    }

    private bindModeDayLabel(): void {
        if (this.modeDayLabel) {
            return;
        }

        const modeDayNode = find('Canvas/UIRoot/经营模式界面/左侧信息栏/顶部信息区/回合信息');
        this.modeDayLabel = modeDayNode?.getComponent(Label) ?? null;
    }

    private bindDayResultPanel(): void {
        if (this.dayResultPanel) {
            return;
        }

        const dayResultPanelNode = find('Canvas/UIRoot/经营模式界面/本日结算面板');
        this.dayResultPanel = dayResultPanelNode?.getComponent(DayResultPanel) ?? null;
    }

    private refreshBusinessEndDayButtonLabel(): void {
        if (!this.businessEndDayButtonLabel) {
            return;
        }

        this.businessEndDayButtonLabel.string = this._businessDayReadyForTomorrow ? '进入明日' : '结束本日';
    }

    private isDayResultPanelShowing(): boolean {
        return this.dayResultPanel?.isShowing() ?? false;
    }

    private setDayResultPhysicsFrozen(frozen: boolean): void {
        if (this._dayResultPhysicsFrozen === frozen) {
            return;
        }

        this._dayResultPhysicsFrozen = frozen;
        PhysicsSystem.instance.enable = !frozen;
    }

    private onRestartButtonTouched(): void {
        this.restartGame();
    }

    private playSound(soundId: GameSoundId): void {
        if (!this.audioService) {
            this.audioService = AudioService.getInstance();
        }

        playGameSound(this.audioService, soundId);
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
        const shouldCheckResource = this.shouldConsumeResourceOnManualSpawn();
        return !!this.coinSpawner
            && !this.isDayResultPanelShowing()
            && this.shouldAllowManualSpawn()
            && this.isModeStartGateOpen()
            && this.hasConfiguredSpawnSource()
            && (!this.shouldUseBusinessOrderDeck() || (this.hasRemainingStock() && !!this.businessModeController?.getPreparedNextItem()))
            && (!shouldCheckResource || this.canAffordSpawn());
    }

    public canAffordSpawn(): boolean {
        return runtimeProgress.currentCoins >= this.getConfiguredSpawnCost();
    }

    public hasRemainingStock(): boolean {
        return runtimeProgress.remainingStock > 0;
    }

    public isDayResultPanelOpen(): boolean {
        return this.isDayResultPanelShowing();
    }

    public getConfiguredManualSpawnHoldInterval(fallbackInterval: number): number {
        const holdInterval = this.getActiveModeConfig()?.manualSpawnHoldInterval ?? fallbackInterval;
        return Math.max(0.02, this.normalizeNonNegativeNumber(holdInterval, fallbackInterval));
    }

    private getActiveModeConfig(): ModeConfig | null {
        return this.modeConfigTable?.getActiveConfig() ?? null;
    }

    private getActiveModeDisplayName(): string {
        const modeConfig = this.getActiveModeConfig();
        return modeConfig?.modeDisplayName || modeConfig?.modeId || '当前模式';
    }

    private getActiveModeId(): string {
        const modeConfig = this.getActiveModeConfig();
        return modeConfig?.modeId || modeConfig?.modeDisplayName || 'legacy';
    }

    private shouldAllowManualSpawn(): boolean {
        return this.getActiveModeConfig()?.allowManualSpawn ?? true;
    }

    private shouldUseBusinessOrderDeck(): boolean {
        const modeConfig = this.getActiveModeConfig();
        const requestedByMode = modeConfig?.useBusinessOrderDeck ?? !!this.businessModeController?.isOrderDeckSpawnEnabled();
        return requestedByMode && !!this.businessModeController?.isOrderDeckSpawnEnabled();
    }

    private shouldUseLegacyCurrentItem(): boolean {
        const modeConfig = this.getActiveModeConfig();
        return modeConfig?.useLegacyCurrentItem ?? !this.shouldUseBusinessOrderDeck();
    }

    private shouldConsumeResourceOnManualSpawn(): boolean {
        return this.getActiveModeConfig()?.consumeResourceOnManualSpawn ?? true;
    }

    private shouldEnableRandomDrop(): boolean {
        return this.getActiveModeConfig()?.enableRandomDrop ?? this.worldDropEnabled;
    }

    private shouldEnableAutoSpawn(): boolean {
        return this.getActiveModeConfig()?.enableAutoSpawn ?? true;
    }

    private shouldRequireStartButton(): boolean {
        return this.getActiveModeConfig()?.requireStartButton ?? false;
    }

    private startBusinessDayState(): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        this.businessModeController?.startCurrentDay(
            runtimeProgress.currentBusinessDay,
            this.getConfiguredBaseDailyTargetScore(),
            this.getConfiguredDailyTargetScoreIncrease(),
        );
    }

    private syncBusinessItemValues(): void {
        if (!this.businessModeController) {
            return;
        }

        const itemValues: BusinessItemValueSnapshot[] = this.getResolvedCatalog().map((item) => ({
            itemId: item.itemId,
            displayName: item.itemName,
            value: item.value,
        }));
        this.businessModeController.syncItemValues(itemValues);
    }

    private buildFallbackBusinessDayResult(): BusinessDayResult {
        const targetScore = this.getConfiguredBaseDailyTargetScore()
            + Math.max(0, runtimeProgress.currentBusinessDay - 1) * this.getConfiguredDailyTargetScoreIncrease();

        return {
            day: runtimeProgress.currentBusinessDay,
            score: 0,
            targetScore,
            reachedTarget: false,
            obtainedItems: [],
            rewardLines: [],
            earnedMoney: 0,
            detailText: '今日没有获得商品\n\n今日分数：0 / ' + formatScore(targetScore) + '\n本日未达标\n\n────────────\n暂无资金奖励\n────────────\n获得资金 ··············· ￥0',
        };
    }

    private refreshModeStartGate(): void {
        this._modeStartAccepted = !this.shouldRequireStartButton();
    }

    private isModeStartGateOpen(): boolean {
        return !this.shouldRequireStartButton() || this._modeStartAccepted;
    }

    private hasConfiguredSpawnSource(): boolean {
        if (this.shouldUseBusinessOrderDeck() && this.businessModeController?.hasAvailableOrders()) {
            return true;
        }

        return this.shouldUseLegacyCurrentItem() && !!this.getCurrentSpawnItem();
    }

    public getEncyclopediaItems(): EncyclopediaCatalogItemSnapshot[] {
        this.ensureRuntimeProgress();

        return this.getResolvedCatalog().map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            iconImage: item.iconImage,
            value: item.value,
            weight: item.weight,
            ownedCount: item.ownedCount,
            unlockRequiredCount: item.unlockRequiredCount,
            isSpawnUnlocked: item.isSpawnUnlocked,
            isDiscovered: item.isDiscovered,
        }));
    }

    public onSpawnItemButtonClicked(_event: Event | null, itemId: string): void {
        this.selectSpawnItemById(itemId);
    }

    public selectSpawnItemById(itemId: string): boolean {
        const nextItem = this.findResolvedCatalogItemById(itemId);
        if (!nextItem) {
            this.playSound('error');
            this.setStatus(`未知投放物品：${itemId}`);
            return false;
        }

        if (!nextItem.isSpawnUnlocked) {
            this.playSound('error');
            this.setStatus(`${nextItem.itemName} 尚未解锁投放`);
            return false;
        }

        if (!nextItem.prefab) {
            this.playSound('error');
            this.setStatus(`${nextItem.itemName} 缺少 Prefab`);
            return false;
        }

        runtimeProgress.currentSpawnItemId = nextItem.itemId;
        this.refreshUi();
        this.playSound('button-click');
        this.setStatus(`当前投放物切换为 ${nextItem.itemName}`);
        return true;
    }

    private ensureRuntimeProgress(): void {
        const catalogConfigs = this.getNormalizedCatalogConfigs();
        const activeModeId = this.getActiveModeId();

        if (!runtimeProgress.initialized) {
            runtimeProgress.initialized = true;
            runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
            runtimeProgress.currentBusinessDay = 1;
            const configuredStockLimit = this.getConfiguredStockLimitForDay(runtimeProgress.currentBusinessDay);
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.remainingStock = configuredStockLimit;
            runtimeProgress.remainingStockLimit = configuredStockLimit;
            runtimeProgress.remainingStockModeId = activeModeId;
            runtimeProgress.resourceRegenProgressSeconds = 0;
            runtimeProgress.worldDropProgressSeconds = 0;
            runtimeProgress.currentSpawnItemId = '';
            runtimeProgress.lastDroppedItemId = '';
            runtimeProgress.itemProgress = {};
            runtimeProgress.boardItemSnapshots = [];
        } else {
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentBusinessDay = Math.max(1, this.normalizeNonNegativeInteger(runtimeProgress.currentBusinessDay, 1));
            runtimeProgress.currentCoins = this.normalizeFiniteInteger(runtimeProgress.currentCoins, 0);
            const configuredStockLimit = this.getConfiguredStockLimitForDay(runtimeProgress.currentBusinessDay);
            if (
                runtimeProgress.remainingStockModeId !== activeModeId
                || runtimeProgress.remainingStockLimit !== configuredStockLimit
            ) {
                runtimeProgress.remainingStock = configuredStockLimit;
                runtimeProgress.remainingStockLimit = configuredStockLimit;
                runtimeProgress.remainingStockModeId = activeModeId;
            } else {
                runtimeProgress.remainingStock = this.normalizeNonNegativeInteger(runtimeProgress.remainingStock);
            }
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
        runtimeProgress.currentBusinessDay = 1;
        runtimeProgress.maxCoins = 0;
        runtimeProgress.currentCoins = 0;
        runtimeProgress.remainingStock = 0;
        runtimeProgress.remainingStockLimit = 0;
        runtimeProgress.remainingStockModeId = '';
        runtimeProgress.resourceRegenProgressSeconds = 0;
        runtimeProgress.worldDropProgressSeconds = 0;
        runtimeProgress.currentSpawnItemId = '';
        runtimeProgress.lastDroppedItemId = '';
        runtimeProgress.itemProgress = {};
        runtimeProgress.boardItemSnapshots = [];

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
        if (!this.shouldEnableRandomDrop()) {
            return;
        }

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
        if (!this.shouldEnableRandomDrop() || interval <= 0 || amount <= 0) {
            runtimeProgress.worldDropProgressSeconds = 0;
            return false;
        }

        runtimeProgress.worldDropProgressSeconds += deltaTime;
        let spawned = false;

        while (runtimeProgress.worldDropProgressSeconds >= interval) {
            runtimeProgress.worldDropProgressSeconds -= interval;
            let spawnedThisBatch = false;
            for (let index = 0; index < amount; index += 1) {
                if (this.spawnRandomWorldDrop()) {
                    spawned = true;
                    spawnedThisBatch = true;
                }
            }

            if (spawnedThisBatch) {
                this.playSound('item-drop');
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

    private disablePreviewRuntimeComponents(previewNode: Node): void {
        const stack: Node[] = [previewNode];
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) {
                continue;
            }

            node.getComponents(RigidBody).forEach((body) => {
                body.enabled = false;
            });
            node.getComponents(Collider).forEach((collider) => {
                collider.enabled = false;
            });
            node.getComponents(CoinBehaviour).forEach((behaviour) => {
                behaviour.enabled = false;
            });

            stack.push(...node.children);
        }
    }

    private applyPreviewVisualStyle(previewNode: Node, previewAlpha: number): void {
        const alpha = Math.max(0, Math.min(1, this.normalizeNonNegativeNumber(previewAlpha, 0.45)));
        const previewColor = new Color(255, 255, 255, Math.round(alpha * 255));
        const stack: Node[] = [previewNode];

        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) {
                continue;
            }

            node.getComponents(MeshRenderer).forEach((renderer) => {
                const materialCount = Math.max(1, renderer.materials.length);
                for (let index = 0; index < materialCount; index += 1) {
                    try {
                        const material = renderer.getMaterialInstance(index);
                        material?.setProperty('mainColor', previewColor);
                        material?.setProperty('albedo', previewColor);
                    } catch {
                        // Some item materials do not expose color properties; the preview still works without tinting.
                    }
                }
            });

            stack.push(...node.children);
        }
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

    private resolveActiveSpawnItem(): SpawnItemResolveResult {
        if (this.shouldUseBusinessOrderDeck()) {
            return this.resolveBusinessOrderDeckSpawnItem();
        }

        if (this.shouldUseLegacyCurrentItem()) {
            return {
                item: this.getCurrentSpawnItem(),
                statusText: '当前没有可投放物品',
            };
        }

        return {
            item: null,
            statusText: '当前模式没有可用投放来源',
        };
    }

    private resolveBusinessOrderDeckSpawnItem(): SpawnItemResolveResult {
        const preparedItem = this.businessModeController?.getPreparedNextItem() ?? null;
        if (!preparedItem) {
            return {
                item: null,
                statusText: this.businessModeController?.getNoAvailableOrderStatus() ?? '没有可用订购单',
            };
        }

        const catalogItem = this.findResolvedCatalogItemById(preparedItem.itemId);
        if (!catalogItem) {
            const statusText = `订购单物品未配置：${preparedItem.displayName}`;
            this.businessModeController?.showSpawnMessage(`下次投放：${preparedItem.displayName} 未配置`);
            return {
                item: null,
                statusText,
            };
        }

        if (!catalogItem.prefab) {
            const statusText = `${catalogItem.itemName} 缺少 Prefab`;
            this.businessModeController?.showSpawnMessage(`下次投放：${catalogItem.itemName} 缺少 Prefab`);
            return {
                item: null,
                statusText,
            };
        }

        return {
            item: catalogItem,
            statusText: '',
        };
    }

    private syncStateFromResources(): void {
        if (!this.hasConfiguredSpawnSource()) {
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
        const worldDropSummary = this.shouldEnableRandomDrop()
            ? `每 ${this.getConfiguredWorldDropInterval()} 秒 ${this.getConfiguredWorldDropAmount()} 个`
            : '关闭';

        if (this.scoreLabel) {
            this.scoreLabel.string = `资源：${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins} | 回复：${this.getConfiguredResourceRegenAmount()} / ${this.getConfiguredResourceRegenInterval()}秒`;
        }

        if (this.modeResourceLabel) {
            this.modeResourceLabel.string = this.shouldUseBusinessOrderDeck()
                ? `当天剩余进货：${runtimeProgress.remainingStock}`
                : `资源：${runtimeProgress.currentCoins}`;
        }

        if (this.modeDayLabel) {
            this.modeDayLabel.string = `第${runtimeProgress.currentBusinessDay}天`;
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
                iconImage: inspectorItem?.iconImage ?? fallbackItem.iconImage,
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
        return this.normalizeNonNegativeInteger(this.getActiveModeConfig()?.initialResource ?? this.startCoins);
    }

    private getConfiguredDailyStockLimit(): number {
        const modeConfig = this.getActiveModeConfig();
        if (modeConfig && typeof modeConfig.dailyStockLimit === 'number') {
            return this.normalizeNonNegativeInteger(modeConfig.dailyStockLimit);
        }

        return this.normalizeNonNegativeInteger(modeConfig?.initialResource ?? this.startCoins);
    }

    private getConfiguredStockLimitForDay(day: number): number {
        const normalizedDay = Math.max(1, this.normalizeNonNegativeInteger(day, 1));
        if (normalizedDay === 1 && this.shouldUseBusinessOrderDeck()) {
            return this.getConfiguredFirstDayStockLimit();
        }

        return this.getConfiguredDailyStockLimit();
    }

    private getConfiguredFirstDayStockLimit(): number {
        const modeConfig = this.getActiveModeConfig();
        if (modeConfig && typeof modeConfig.initialResource === 'number') {
            return this.normalizeNonNegativeInteger(modeConfig.initialResource);
        }

        return this.getConfiguredDailyStockLimit();
    }

    private getConfiguredBaseDailyTargetScore(): number {
        return this.normalizeNonNegativeNumber(this.getActiveModeConfig()?.baseDailyTargetScore ?? 20, 20);
    }

    private getConfiguredDailyTargetScoreIncrease(): number {
        return this.normalizeNonNegativeNumber(this.getActiveModeConfig()?.dailyTargetScoreIncrease ?? 10, 10);
    }

    private getConfiguredMaxCoins(): number {
        return this.normalizeNonNegativeInteger(this.getActiveModeConfig()?.resourceRecoverLimit ?? this.maxCoins);
    }

    private getConfiguredResourceRegenInterval(): number {
        return this.normalizeNonNegativeNumber(
            this.getActiveModeConfig()?.resourceRecoverInterval ?? this.resourceRegenInterval,
            1,
        );
    }

    private getConfiguredResourceRegenAmount(): number {
        return this.normalizeNonNegativeInteger(
            this.getActiveModeConfig()?.resourceRecoverAmount ?? this.resourceRegenAmount,
            1,
        );
    }

    private getConfiguredWorldDropInterval(): number {
        return this.normalizeNonNegativeNumber(
            this.getActiveModeConfig()?.randomDropInterval ?? this.worldDropInterval,
            5,
        );
    }

    private getConfiguredWorldDropAmount(): number {
        return this.normalizeNonNegativeInteger(
            this.getActiveModeConfig()?.randomDropAmount ?? this.worldDropAmount,
            1,
        );
    }

    private getConfiguredAutoSpawnInterval(): number {
        const interval = this.getActiveModeConfig()?.autoSpawnInterval ?? this.autoSpawnInterval;
        return Math.max(MIN_AUTO_SPAWN_INTERVAL, this.normalizeNonNegativeNumber(interval, 0.5));
    }

    private getConfiguredAutoSpawnX(): number {
        return this.normalizeFiniteNumber(this.getActiveModeConfig()?.autoSpawnX ?? this.autoSpawnX, 0);
    }

    private getConfiguredAutoSpawnZ(): number {
        return this.normalizeFiniteNumber(this.getActiveModeConfig()?.autoSpawnZ ?? this.autoSpawnZ, -0.2);
    }

    private getConfiguredSpawnCost(): number {
        const spawnCost = this.getActiveModeConfig()?.manualSpawnCost ?? this.spawnCostPerCoin;
        return Math.max(1, this.normalizeNonNegativeInteger(spawnCost, 1));
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

function formatScore(value: number): string {
    if (!Number.isFinite(value)) {
        return '0';
    }

    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}
