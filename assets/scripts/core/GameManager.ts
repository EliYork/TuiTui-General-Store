import {
    _decorator,
    BlockInputEvents,
    Button,
    Component,
    director,
    Enum,
    Event,
    find,
    Graphics,
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
    UITransform,
} from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner, CoinSpawnRequest } from '../gameplay/CoinSpawner';
import { ItemPrefabConfig, ItemPrefabRuntimeConfig } from '../gameplay/ItemPrefabConfig';
import { PusherController } from '../gameplay/PusherController';
import { ModeConfig } from '../config/ModeConfig';
import { ModeConfigTable } from '../config/ModeConfigTable';
import {
    BusinessDayResult,
    BusinessItemValueSnapshot,
    BusinessModeController,
} from '../modes/business/BusinessModeController';
import { AudioService, GameSoundId, playGameSound } from './AudioService';
import { DayResultPanel } from '../ui/DayResultPanel';
import { addShopOrderWeight, resetShopRuntimeState, SHOP_RUNTIME_STATE, SHOP_SCENE_NAME } from '../shop/ShopTypes';
import {
    BusinessDiaryDaySnapshot,
    BusinessDiaryItemCountSnapshot,
    BusinessRunLogger,
} from '../business/BusinessRunLogger';
import {
    createDefaultNormalizedStallDetectionConfig,
    NormalizedBusinessStallDetectionConfig,
} from '../modes/business/StallDetectionConfig';

const { ccclass, property } = _decorator;
const SHARED_SCENE_NAME = 'Prototype01';
const MIN_AUTO_SPAWN_INTERVAL = 0.05;
const INSUFFICIENT_RESOURCE_STATUS = '资源不足，无法投放';
const AUTO_SPAWN_INSUFFICIENT_RESOURCE_STATUS = '资源不足，自动投放已停止';
const INSUFFICIENT_STOCK_STATUS = '今日进货次数不足';
const DEBUG_UI_BACKGROUND_COLOR = new Color(72, 54, 64, 145);
const DEBUG_UI_PANEL_COLOR = new Color(255, 238, 246, 220);
const DEBUG_UI_BUTTON_COLOR = new Color(255, 196, 216, 245);
const DEBUG_UI_TEXT_COLOR = new Color(82, 42, 59, 255);
const DEFAULT_INITIAL_SPAWN_RESOURCE = 300;
const DEFAULT_DAILY_SPAWN_QUOTA = 300;
const DEFAULT_RESOURCE_REGEN_CAP = 300;
const DEFAULT_RESOURCE_REGEN_INTERVAL = 5;
const DEFAULT_RESOURCE_REGEN_AMOUNT = 1;
const DEFAULT_MANUAL_SPAWN_COST = 1;
const DEFAULT_MANUAL_SPAWN_Y_OVERRIDE_ENABLED = true;
const DEFAULT_MANUAL_SPAWN_Y = 1;
const DEFAULT_AUTO_SPAWN_INTERVAL = 0.5;
const DEFAULT_AUTO_SPAWN_X = 0;
const DEFAULT_AUTO_SPAWN_Z = -0.2;
const DEFAULT_WORLD_DROP_ENABLED = true;
const DEFAULT_WORLD_DROP_INTERVAL = 5;
const DEFAULT_WORLD_DROP_AMOUNT = 1;

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
        type: Label,
        displayName: '停滞检测倒计时 Label',
        tooltip: '绑定右上方用于显示“判定倒计时 / 无得分判定 / 本日已结算 / 经营失败”的 Label。优先使用场景中绑定的 Label，方便在 Cocos Creator 中手动调整位置、大小、字号和颜色；为空时才运行时创建兜底文本。',
    })
    public countdownLabel: Label | null = null;

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
    private _businessDaySettlementCompleted = false;
    private _businessDayElapsedSeconds = 0;
    private _businessDayLastScoreSeconds = 0;
    private _businessDayLastScore = 0;
    private _businessStagnationEnabled = false;
    private _businessDayHasSpawnedItem = false;
    private _businessRunFailed = false;
    private _businessStagnationTriggered = false;
    private _dayResultPhysicsFrozen = false;
    private readonly _pausedPusherStates = new Map<PusherController, boolean>();
    private _debugButtonNode: Node | null = null;
    private _debugPanelRoot: Node | null = null;
    private _businessStagnationStatusNode: Node | null = null;
    private _businessStagnationStatusLabel: Label | null = null;
    private _businessFailurePanelRoot: Node | null = null;

    protected start(): void {
        try {
            this.startGameManager();
        } catch (error) {
            warn('[GameManager] 启动经营/图鉴玩法场景失败。已阻止异常继续中断首帧渲染。', error);
            this.setSafeStartupStatus('玩法场景启动异常，请查看 Android 日志');
        }
    }

    private startGameManager(): void {
        PhysicsSystem.instance.enable = true;
        this.autoSpawnEnabled = false;
        this._autoSpawnTimer = 0;
        this._businessDaySettlementCompleted = false;
        this.applyModeUiVisibility();
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

        const shouldEnterNextBusinessDayFromShop = SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay;
        const requestedNewBusinessRun = (this.shouldUseBusinessOrderDeck() || shouldEnterNextBusinessDayFromShop)
            && BusinessRunLogger.consumeNewRunRequest();
        const shouldCreateNewBusinessRun = requestedNewBusinessRun && !shouldEnterNextBusinessDayFromShop;
        if (shouldCreateNewBusinessRun) {
            resetShopRuntimeState();
            this.resetRuntimeProgress();
            this._businessDayReadyForTomorrow = false;
            this._businessDaySettlementCompleted = false;
            this._businessRunFailed = false;
            this._businessStagnationTriggered = false;
            this._modeStartAccepted = false;
        }

        this.ensureRuntimeProgress();
        this.syncBusinessItemValues();
        this.startBusinessDayState();
        this.initializeBusinessDiaryIfNeeded(shouldCreateNewBusinessRun);
        this.buildBusinessStagnationStatusUi();
        this.buildBusinessFailurePanel();
        this.refreshBusinessStagnationStatusLabel();
        this.buildDebugUi();

        if (SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay) {
            SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay = false;
            this.enterNextBusinessDay(true);
            this.restoreBoardItemsAfterSceneTransition();
            this.recordBusinessDayStart();
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
        this.recordBusinessDayStart();
        this.setStatus(`当前地图：${this.getCurrentMapConfig().mapName}`);
    }

    private setSafeStartupStatus(statusText: string): void {
        this._statusText = statusText;

        if (this.statusLabel) {
            this.statusLabel.string = statusText;
        }

        if (this.modeResourceLabel) {
            this.modeResourceLabel.string = statusText;
        }
    }

    private buildDebugUi(): void {
        if (this._debugButtonNode || this._debugPanelRoot) {
            return;
        }

        const parent = find('Canvas/UIRoot/经营模式界面') ?? find('Canvas/UIRoot') ?? this.node.parent;
        if (!parent) {
            warn('[GameManager] 未找到 UI 根节点，无法创建调试按钮。');
            return;
        }

        const rootSize = this.getRuntimeUiSize(parent);
        this._debugButtonNode = this.createRuntimeButton('调试按钮', parent, 'Debug', rootSize.width * 0.5 - 78, -rootSize.height * 0.5 + 34, 120, 44);
        this._debugButtonNode.on(Node.EventType.TOUCH_END, this.openDebugPanel, this);

        this._debugPanelRoot = this.createRuntimeNode('调试面板', parent, 0, 0, rootSize.width, rootSize.height);
        this._debugPanelRoot.addComponent(BlockInputEvents);
        this.drawRuntimeRect(this._debugPanelRoot, rootSize.width, rootSize.height, DEBUG_UI_BACKGROUND_COLOR, 0);
        this._debugPanelRoot.on(Node.EventType.TOUCH_END, this.closeDebugPanel, this);
        this._debugPanelRoot.active = false;

        const panelWidth = Math.min(920, Math.max(620, rootSize.width - 220));
        const panelHeight = Math.min(560, Math.max(430, rootSize.height - 120));
        const panel = this.createRuntimeNode('调试按钮容器', this._debugPanelRoot, 0, 0, panelWidth, panelHeight);
        panel.on(Node.EventType.TOUCH_START, this.stopDebugPanelEvent, this);
        panel.on(Node.EventType.TOUCH_END, this.stopDebugPanelEvent, this);
        panel.on(Node.EventType.TOUCH_CANCEL, this.stopDebugPanelEvent, this);
        this.drawRuntimeRect(panel, panelWidth, panelHeight, DEBUG_UI_PANEL_COLOR, 12, new Color(255, 207, 223, 255), 2);
        this.createRuntimeLabel('调试标题文本', panel, '调试面板', 0, panelHeight * 0.5 - 44, 280, 40, 28);

        const closeButton = this.createRuntimeButton('关闭调试面板按钮', panel, '关闭', panelWidth * 0.5 - 78, panelHeight * 0.5 - 44, 112, 42);
        closeButton.on(Node.EventType.TOUCH_END, this.closeDebugPanel, this);

        const debugButtons: Array<{ label: string; onClick: () => void }> = [
            { label: '当前分 +100', onClick: () => this.onDebugAddCurrentScoreTouched() },
            { label: '资金 +10', onClick: () => this.onDebugAddMoneyTouched() },
            { label: '进货次数 +100', onClick: () => this.onDebugAddStockCountTouched() },
            { label: '重新开局', onClick: () => this.onDebugRestartGameTouched() },
            { label: '苹果进货单 +1', onClick: () => this.onDebugAddStockOrderTouched('apple', '苹果') },
            { label: '香蕉进货单 +1', onClick: () => this.onDebugAddStockOrderTouched('banana', '香蕉') },
            { label: '柠檬进货单 +1', onClick: () => this.onDebugAddStockOrderTouched('lemon', '柠檬') },
        ];
        const buttonWidth = 180;
        const buttonHeight = 52;
        const gapX = 28;
        const gapY = 24;
        const columns = 4;
        const startX = -((buttonWidth * columns + gapX * (columns - 1)) * 0.5) + buttonWidth * 0.5;
        const startY = panelHeight * 0.5 - 132;

        debugButtons.forEach((button, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const buttonNode = this.createRuntimeButton(
                `调试功能按钮${index + 1}`,
                panel,
                button.label,
                startX + column * (buttonWidth + gapX),
                startY - row * (buttonHeight + gapY),
                buttonWidth,
                buttonHeight,
            );
            buttonNode.on(Node.EventType.TOUCH_END, button.onClick, this);
        });

        this._debugButtonNode.setSiblingIndex(parent.children.length - 1);
    }

    private stopDebugPanelEvent(event: Event): void {
        (event as Event & { propagationStopped: boolean }).propagationStopped = true;
    }

    private openDebugPanel(): void {
        if (!this._debugPanelRoot) {
            return;
        }

        this._debugPanelRoot.active = true;
        this._debugPanelRoot.setSiblingIndex(this._debugPanelRoot.parent ? this._debugPanelRoot.parent.children.length - 1 : 0);
    }

    private closeDebugPanel(): void {
        if (this._debugPanelRoot) {
            this._debugPanelRoot.active = false;
        }
    }

    private buildBusinessStagnationStatusUi(): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        if (this.countdownLabel) {
            this._businessStagnationStatusLabel = this.countdownLabel;
            this._businessStagnationStatusNode = this.countdownLabel.node;
            return;
        }

        if (this._businessStagnationStatusNode) {
            return;
        }

        const parent = find('Canvas/UIRoot/经营模式界面') ?? find('Canvas/UIRoot') ?? this.node.parent;
        if (!parent) {
            warn('[GameManager] 未找到 UI 根节点，无法创建停滞判定状态。');
            return;
        }

        const rootSize = this.getRuntimeUiSize(parent);
        const width = 260;
        const height = 42;
        this._businessStagnationStatusNode = this.createRuntimeNode(
            '停滞判定状态',
            parent,
            rootSize.width * 0.5 - width * 0.5 - 24,
            rootSize.height * 0.5 - height * 0.5 - 20,
            width,
            height,
        );
        this.drawRuntimeRect(this._businessStagnationStatusNode, width, height, new Color(255, 247, 220, 235), 8, new Color(224, 169, 92, 255), 1);
        this._businessStagnationStatusLabel = this.createRuntimeLabel(
            '停滞判定状态文字',
            this._businessStagnationStatusNode,
            '判定倒计时：20.0s',
            0,
            0,
            width - 18,
            height - 6,
            20,
        );
        this._businessStagnationStatusNode.setSiblingIndex(parent.children.length - 1);
    }

    private buildBusinessFailurePanel(): void {
        if (this._businessFailurePanelRoot || !this.shouldUseBusinessOrderDeck()) {
            return;
        }

        const parent = find('Canvas/UIRoot') ?? this.node.parent;
        if (!parent) {
            warn('[GameManager] 未找到 UI 根节点，无法创建经营失败面板。');
            return;
        }

        const rootSize = this.getRuntimeUiSize(parent);
        this._businessFailurePanelRoot = this.createRuntimeNode('经营失败面板', parent, 0, 0, rootSize.width, rootSize.height);
        this._businessFailurePanelRoot.addComponent(BlockInputEvents);
        this.drawRuntimeRect(this._businessFailurePanelRoot, rootSize.width, rootSize.height, new Color(32, 24, 28, 180), 0);
        this._businessFailurePanelRoot.active = false;

        const panelWidth = 520;
        const panelHeight = 240;
        const panel = this.createRuntimeNode('经营失败内容', this._businessFailurePanelRoot, 0, 0, panelWidth, panelHeight);
        this.drawRuntimeRect(panel, panelWidth, panelHeight, new Color(255, 245, 235, 250), 10, new Color(214, 120, 96, 255), 2);
        this.createRuntimeLabel('经营失败标题', panel, '经营失败', 0, 72, panelWidth - 40, 44, 30);
        this.createRuntimeLabel('经营失败说明', panel, '长时间没有新的得分。', 0, 22, panelWidth - 60, 36, 22);
        const backButton = this.createRuntimeButton('经营失败返回主菜单按钮', panel, '返回主菜单', 0, -68, 168, 48);
        backButton.on(Node.EventType.TOUCH_END, this.returnToMainMenuAfterBusinessRunEnd, this);
    }

    private showBusinessFailurePanel(): void {
        this.buildBusinessFailurePanel();
        if (!this._businessFailurePanelRoot) {
            return;
        }

        this._businessFailurePanelRoot.active = true;
        this._businessFailurePanelRoot.setSiblingIndex(this._businessFailurePanelRoot.parent ? this._businessFailurePanelRoot.parent.children.length - 1 : 0);
    }

    private hideBusinessFailurePanel(): void {
        if (this._businessFailurePanelRoot) {
            this._businessFailurePanelRoot.active = false;
        }
    }

    private onDebugAddCurrentScoreTouched(): void {
        const nextScore = this.businessModeController?.addDebugScore(100) ?? 0;
        if (nextScore > this._businessDayLastScore) {
            this.markBusinessDayScored(nextScore);
        }
        this.setStatus(`调试：当前分 +100，当前分 ${formatScore(nextScore)}`);
    }

    private onDebugAddMoneyTouched(): void {
        const currentMoney = this.businessModeController?.getCurrentMoney() ?? SHOP_RUNTIME_STATE.currentMoney;
        const nextMoney = this.normalizeNonNegativeInteger(currentMoney + 10);
        if (this.businessModeController) {
            this.businessModeController.setCurrentMoney(nextMoney);
        } else {
            SHOP_RUNTIME_STATE.currentMoney = nextMoney;
        }
        this.setStatus(`调试：资金 +10，当前资金 ￥${nextMoney}`);
    }

    private onDebugAddStockCountTouched(): void {
        runtimeProgress.remainingStock = this.normalizeNonNegativeInteger(runtimeProgress.remainingStock + 100);
        this.setStatus(`调试：进货次数 +100，当前剩余 ${runtimeProgress.remainingStock}`);
    }

    private onDebugRestartGameTouched(): void {
        this.closeDebugPanel();
        this.restartGame();
    }

    private onDebugAddStockOrderTouched(itemId: string, displayName: string): void {
        const newWeight = this.businessModeController
            ? this.businessModeController.addOrderDeckWeight(itemId, displayName, 1)
            : addShopOrderWeight(itemId, displayName, 1);
        this.setStatus(`调试：${displayName}进货单 +1，当前权重 ${newWeight}`);
    }

    private createRuntimeButton(name: string, parent: Node, text: string, x: number, y: number, width: number, height: number): Node {
        const buttonNode = this.createRuntimeNode(name, parent, x, y, width, height);
        this.drawRuntimeRect(buttonNode, width, height, DEBUG_UI_BUTTON_COLOR, 8, new Color(248, 177, 202, 255), 1);
        buttonNode.addComponent(Button);
        this.createRuntimeLabel(`${name}文字`, buttonNode, text, 0, 0, width - 10, height - 4, 20);
        return buttonNode;
    }

    private createRuntimeLabel(name: string, parent: Node, text: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
        const labelNode = this.createRuntimeNode(name, parent, x, y, width, height);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.35);
        label.color = DEBUG_UI_TEXT_COLOR;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.overflow = 1;
        label.enableWrapText = true;
        return label;
    }

    private createRuntimeNode(name: string, parent: Node, x: number, y: number, width: number, height: number): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.setPosition(x, y, 0);

        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        transform.setAnchorPoint(0.5, 0.5);
        return node;
    }

    private drawRuntimeRect(node: Node, width: number, height: number, fillColor: Color, radius: number, strokeColor: Color | null = null, lineWidth = 0): void {
        const graphics = node.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = fillColor;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
        graphics.fill();

        if (strokeColor && lineWidth > 0) {
            graphics.lineWidth = lineWidth;
            graphics.strokeColor = strokeColor;
            graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
            graphics.stroke();
        }
    }

    private getRuntimeUiSize(root: Node): { width: number; height: number } {
        const transform = root.getComponent(UITransform)
            ?? root.parent?.getComponent(UITransform)
            ?? null;
        const width = this.normalizePositiveNumber(transform?.contentSize.width ?? 0, 1280);
        const height = this.normalizePositiveNumber(transform?.contentSize.height ?? 0, 720);
        return { width, height };
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

        if (this._dayResultPhysicsFrozen) {
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

        if (this.updateBusinessStagnationDetection(deltaTime)) {
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
        const shouldOverrideManualSpawnY = modeConfig?.getOverrideManualSpawnY() ?? DEFAULT_MANUAL_SPAWN_Y_OVERRIDE_ENABLED;
        const configuredManualSpawnY = modeConfig?.getManualSpawnY() ?? DEFAULT_MANUAL_SPAWN_Y;

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

        if (this._dayResultPhysicsFrozen) {
            this.stopAutoSpawn('玩法暂停中，自动投放已停止');
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

        if (this._dayResultPhysicsFrozen) {
            this.setStatus('玩法暂停中，请先处理本日结算');
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
            this.markBusinessDaySpawnedItem();
            BusinessRunLogger.recordSpawn(runtimeProgress.currentBusinessDay, currentSpawnItem.itemId, currentSpawnItem.itemName, 'manual');
        }
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

        if (this._dayResultPhysicsFrozen) {
            return '玩法暂停中，自动投放已停止';
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

        if (this._businessRunFailed) {
            this.setStatus('经营失败，请返回主菜单。');
            return;
        }

        if (this._businessDayReadyForTomorrow) {
            this.enterNextBusinessDay();
            return;
        }

        if (this._businessDaySettlementCompleted) {
            this.setStatus('今天已经结算啦。');
            return;
        }

        if (!this.isCurrentBusinessDayReachedTarget()) {
            this.setStatus('还没达标，再推一点吧！');
            return;
        }

        this.playSound('button-click');
        const dayResult = this.businessModeController?.settleCurrentDay() ?? this.buildFallbackBusinessDayResult();
        const resultText = dayResult.reachedTarget ? '本日达标！' : '本日未达标';

        if (!dayResult.reachedTarget) {
            this._businessDayReadyForTomorrow = false;
            this.refreshBusinessEndDayButtonLabel();
            this.setStatus('还没达标，再推一点吧！');
            return;
        }

        this._businessDaySettlementCompleted = true;
        this.recordBusinessDayFinished(dayResult);
        this.refreshBusinessStagnationStatusLabel();

        if (this.dayResultPanel) {
            this._businessDayReadyForTomorrow = false;
            this.refreshBusinessEndDayButtonLabel();
            this.setDayResultPhysicsFrozen(true);
            this.dayResultPanel.showResult(dayResult);
            this.setStatus('请查看本日结算');
            return;
        }

        this._businessDayReadyForTomorrow = true;
        this.refreshBusinessEndDayButtonLabel();
        this.setStatus(`${resultText} 今日分数 ${formatScore(dayResult.score)} / ${formatScore(dayResult.targetScore)}，可进入明日`);
    }

    private enterNextBusinessDay(deferStartLog = false): void {
        const claimedMoney = this.businessModeController?.claimSettledMoney() ?? 0;
        const moneyAfterClaim = this.businessModeController?.getCurrentMoney() ?? SHOP_RUNTIME_STATE.currentMoney;
        const nextBusinessDay = runtimeProgress.currentBusinessDay + 1;
        runtimeProgress.currentBusinessDay = nextBusinessDay;

        const configuredStockLimit = this.getConfiguredStockLimitForDay(nextBusinessDay);
        runtimeProgress.remainingStock = configuredStockLimit;
        runtimeProgress.remainingStockLimit = configuredStockLimit;
        runtimeProgress.remainingStockModeId = this.getActiveModeId();
        runtimeProgress.resourceRegenProgressSeconds = 0;
        runtimeProgress.worldDropProgressSeconds = 0;

        this._businessDayReadyForTomorrow = false;
        this._businessDaySettlementCompleted = false;
        this.stopAutoSpawn();
        this.syncBusinessItemValues();
        this.businessModeController?.startCurrentDay(
            runtimeProgress.currentBusinessDay,
            this.getConfiguredBaseDailyTargetScore(),
            this.getConfiguredDailyTargetScoreIncrease(),
        );
        this.businessModeController?.setCurrentMoney(moneyAfterClaim);
        SHOP_RUNTIME_STATE.currentMoney = moneyAfterClaim;
        SHOP_RUNTIME_STATE.businessMoneyInitialized = true;
        this.resetBusinessDayStagnationState();
        this.syncStateFromResources();
        SHOP_RUNTIME_STATE.currentBusinessDay = runtimeProgress.currentBusinessDay;
        SHOP_RUNTIME_STATE.orderDeckSnapshots = this.businessModeController?.getOrderDeckSnapshots() ?? [];
        BusinessRunLogger.enterNextDay(this.buildBusinessDiaryDaySnapshot());
        if (!deferStartLog) {
            this.recordBusinessDayStart();
        }
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
        this.captureBoardItemsForSceneTransition();
        this.businessModeController?.syncShopConfigToRuntime();
        SHOP_RUNTIME_STATE.currentMoney = this.businessModeController?.getCurrentMoney() ?? SHOP_RUNTIME_STATE.currentMoney;
        SHOP_RUNTIME_STATE.currentBusinessDay = runtimeProgress.currentBusinessDay;
        SHOP_RUNTIME_STATE.orderDeckSnapshots = this.businessModeController?.getOrderDeckSnapshots() ?? [];
        SHOP_RUNTIME_STATE.returnSceneName = SHARED_SCENE_NAME;
        SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay = true;
        director.loadScene(SHOP_SCENE_NAME);
        this.setStatus(claimedMoney > 0
            ? `获得资金 ￥${claimedMoney}，进入商店采购`
            : '进入商店采购');
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
        const previousBusinessScore = this.businessModeController?.getDailyScore() ?? 0;
        this.businessModeController?.recordDrop(collectedItem.itemId, collectedItem.value, collectedItem.itemName);
        const nextBusinessScore = this.businessModeController?.getDailyScore() ?? previousBusinessScore;
        if (nextBusinessScore > previousBusinessScore) {
            this.markBusinessDayScored(nextBusinessScore);
        }
        if (this.shouldUseBusinessOrderDeck()) {
            BusinessRunLogger.recordDrop(runtimeProgress.currentBusinessDay, collectedItem.itemId, collectedItem.itemName);
        }

        let unlockedItemName = '';
        if (!progress.isSpawnUnlocked && progress.ownedCount >= collectedItem.unlockRequiredCount) {
            progress.isSpawnUnlocked = true;
            unlockedItemName = collectedItem.itemName;
        }

        this.ensureRuntimeProgress();
        this.syncStateFromResources();
        item.onScored();
        this.playSound(unlockedItemName ? 'unlock' : 'item-drop');

        if (this.tryAutoSettleReachedBusinessDay()) {
            return;
        }

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

        this.resetWholeBusinessRun(true);
        this.playSound('button-click');
        this.setStatus(`已重新开始，当前地图：${this.getCurrentMapConfig().mapName}`);
    }

    public prepareBusinessRunResetForMainMenu(): void {
        this.resetWholeBusinessRun(false);
    }

    private returnToMainMenuAfterBusinessRunEnd(): void {
        this.resetWholeBusinessRun(false);
        director.loadScene('MainMenu');
    }

    private resetWholeBusinessRun(createNewDiary: boolean): void {
        if (!createNewDiary) {
            BusinessRunLogger.markCurrentRunAbandoned();
        }

        this.stopAutoSpawn();
        this.coinSpawner?.clearSpawnedItems();
        this.dayResultPanel?.hide();
        this.hideBusinessFailurePanel();
        this.setDayResultPhysicsFrozen(false);
        resetShopRuntimeState();
        this.resetRuntimeProgress();
        this.refreshModeStartGate();
        this._businessDayReadyForTomorrow = false;
        this._businessDaySettlementCompleted = false;
        this._businessRunFailed = false;
        this._businessStagnationTriggered = false;
        this._modeStartAccepted = false;
        this.resetBusinessDayStagnationState();
        this.refreshBusinessEndDayButtonLabel();
        this.refreshBusinessStagnationStatusLabel();

        if (!createNewDiary) {
            this.syncStateFromResources();
            return;
        }

        this.ensureRuntimeProgress();
        this.syncBusinessItemValues();
        this.startBusinessDayState();
        this.businessModeController?.resetRunMoneyToInitial();
        this.createBusinessDiaryForCurrentDay();
        this._sessionSpawnedCoinCount = 0;
        this.syncStateFromResources();
        if (this.shouldEnableRandomDrop()) {
            this.seedInitialMapItems();
        }
        this.recordBusinessDayStart();
        this.refreshBusinessStagnationStatusLabel();
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

    private isCurrentBusinessDayReachedTarget(): boolean {
        return this.businessModeController?.isDailyTargetReached() ?? false;
    }

    private tryAutoSettleReachedBusinessDay(): boolean {
        if (!this.autoSpawnEnabled || !this.shouldUseBusinessOrderDeck()) {
            return false;
        }

        if (this._businessDaySettlementCompleted || !this.isCurrentBusinessDayReachedTarget()) {
            return false;
        }

        this.stopAutoSpawn('已达标，自动结算本日');
        this.endCurrentBusinessDay();
        return true;
    }

    private resetBusinessDayStagnationState(): void {
        this._businessDayElapsedSeconds = 0;
        this._businessDayLastScoreSeconds = 0;
        this._businessDayLastScore = this.businessModeController?.getDailyScore() ?? 0;
        this._businessStagnationEnabled = false;
        this._businessDayHasSpawnedItem = false;
        this._businessStagnationTriggered = false;
        this._businessRunFailed = false;
        this.refreshBusinessStagnationStatusLabel();
    }

    private markBusinessDaySpawnedItem(): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        const wasWaitingForFirstDaySpawn = this.getConfiguredStallRequiresFirstSpawn()
            && !this._businessDayHasSpawnedItem
            && this._businessDayElapsedSeconds >= this.getConfiguredStallGraceSeconds() - this.getConfiguredNoScoreTimeoutSeconds();
        this._businessDayHasSpawnedItem = true;
        if (wasWaitingForFirstDaySpawn) {
            this._businessDayLastScoreSeconds = this._businessDayElapsedSeconds;
        }
        this.refreshBusinessStagnationStatusLabel();
    }

    private markBusinessDayScored(score: number): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        this._businessDayLastScore = score;
        this._businessDayLastScoreSeconds = this._businessDayElapsedSeconds;
        this.refreshBusinessStagnationStatusLabel();
    }

    private updateBusinessStagnationDetection(deltaTime: number): boolean {
        if (!this.shouldUseBusinessOrderDeck()) {
            return false;
        }

        const config = this.getConfiguredStallDetectionConfig();
        if (!config.enableStallDetection) {
            this._businessStagnationEnabled = false;
            this.refreshBusinessStagnationStatusLabel();
            return false;
        }

        if (this._businessRunFailed || this._businessDaySettlementCompleted || this._businessDayReadyForTomorrow) {
            this.refreshBusinessStagnationStatusLabel();
            return false;
        }

        this._businessDayElapsedSeconds += Math.max(0, deltaTime);
        const canEnableDetection = this._businessDayElapsedSeconds >= this.getConfiguredStallGraceSeconds()
            && (!this.getConfiguredStallRequiresFirstSpawn() || this._businessDayHasSpawnedItem);
        this._businessStagnationEnabled = canEnableDetection;

        if (!canEnableDetection) {
            this.refreshBusinessStagnationStatusLabel();
            return true;
        }

        if (
            !this._businessStagnationTriggered
            && this._businessDayElapsedSeconds - this._businessDayLastScoreSeconds >= this.getConfiguredNoScoreTimeoutSeconds()
        ) {
            this._businessStagnationTriggered = true;
            this.resolveBusinessStagnationJudgement();
            return true;
        }

        this.refreshBusinessStagnationStatusLabel();
        return true;
    }

    private resolveBusinessStagnationJudgement(): void {
        if (this._businessDaySettlementCompleted || this._businessRunFailed) {
            return;
        }

        if (this.isCurrentBusinessDayReachedTarget()) {
            this.endCurrentBusinessDay();
            return;
        }

        this.failCurrentBusinessRun(this.getBusinessStagnationFailureReason());
    }

    private failCurrentBusinessRun(reason: string): void {
        if (this._businessRunFailed || this._businessDaySettlementCompleted) {
            return;
        }

        this._businessRunFailed = true;
        this._businessStagnationEnabled = false;
        this._businessStagnationTriggered = true;
        this._businessDayReadyForTomorrow = false;
        this.stopAutoSpawn();
        this.dayResultPanel?.hide();
        this.setDayResultPhysicsFrozen(true);
        const snapshot = this.buildBusinessDiaryDaySnapshot();
        BusinessRunLogger.failDay({
            ...snapshot,
            score: this.businessModeController?.getDailyScore() ?? 0,
            reason,
            boardCounts: this.getBoardItemCountSnapshots(),
        });
        this.showBusinessFailurePanel();
        this.refreshBusinessEndDayButtonLabel();
        this.refreshBusinessStagnationStatusLabel();
        this.setStatus('经营失败：长时间没有新的得分。');
    }

    private refreshBusinessStagnationStatusLabel(): void {
        if (!this._businessStagnationStatusLabel) {
            return;
        }

        const config = this.getConfiguredStallDetectionConfig();
        this._businessStagnationStatusNode!.active = this.shouldUseBusinessOrderDeck() && config.showStallCountdown;
        if (!this.shouldUseBusinessOrderDeck() || !config.showStallCountdown) {
            return;
        }

        if (!config.enableStallDetection) {
            this._businessStagnationStatusLabel.string = '停滞检测已关闭';
            return;
        }

        if (this._businessRunFailed) {
            this._businessStagnationStatusLabel.string = '经营失败';
            return;
        }

        if (this._businessDaySettlementCompleted || this._businessDayReadyForTomorrow) {
            this._businessStagnationStatusLabel.string = '本日已结算';
            return;
        }

        const decimalPlaces = this.getConfiguredCountdownDecimalPlaces();
        const graceRemaining = this.getConfiguredStallGraceSeconds() - this._businessDayElapsedSeconds;
        if (graceRemaining > 0) {
            this._businessStagnationStatusLabel.string = `判定倒计时：${formatCountdownSeconds(graceRemaining, decimalPlaces)}s`;
            return;
        }

        if (this.getConfiguredStallRequiresFirstSpawn() && !this._businessDayHasSpawnedItem) {
            this._businessStagnationStatusLabel.string = '等待首次投放';
            return;
        }

        const idleRemaining = this.getConfiguredNoScoreTimeoutSeconds()
            - (this._businessDayElapsedSeconds - this._businessDayLastScoreSeconds);
        this._businessStagnationStatusLabel.string = `无得分判定：${formatCountdownSeconds(idleRemaining, decimalPlaces)}s`;
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

        if (frozen) {
            this.stopAutoSpawn();
            this.pausePusherControllers();
            return;
        }

        this.resumePusherControllers();
    }

    private pausePusherControllers(): void {
        this._pausedPusherStates.clear();
        this.collectPusherControllers().forEach((controller) => {
            this._pausedPusherStates.set(controller, controller.enabled);
            controller.enabled = false;
        });
    }

    private resumePusherControllers(): void {
        this._pausedPusherStates.forEach((wasEnabled, controller) => {
            if (controller?.isValid) {
                controller.enabled = wasEnabled;
            }
        });
        this._pausedPusherStates.clear();
    }

    private collectPusherControllers(): PusherController[] {
        const scene = director.getScene();
        if (!scene) {
            return [];
        }

        const controllers: PusherController[] = [];
        const visit = (node: Node): void => {
            const controller = node.getComponent(PusherController);
            if (controller) {
                controllers.push(controller);
            }

            node.children.forEach(visit);
        };

        scene.children.forEach(visit);
        return controllers;
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
        if (this._dayResultPhysicsFrozen) {
            return false;
        }

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
        const holdInterval = this.getActiveModeConfig()?.getHoldSpawnInterval() ?? fallbackInterval;
        return Math.max(0.02, this.normalizeNonNegativeNumber(holdInterval, fallbackInterval));
    }

    private getActiveModeConfig(): ModeConfig | null {
        return this.modeConfigTable?.getActiveConfig() ?? null;
    }

    private getActiveModeDisplayName(): string {
        const modeConfig = this.getActiveModeConfig();
        return modeConfig?.getDisplayName() || modeConfig?.getModeId() || '当前模式';
    }

    private getActiveModeId(): string {
        const modeConfig = this.getActiveModeConfig();
        return modeConfig?.getModeId() || modeConfig?.getDisplayName() || 'legacy';
    }

    private applyModeUiVisibility(): void {
        const activeModeId = this.getActiveModeId();
        const isCollectionMode = activeModeId === 'collection';
        const businessUiNode = find('Canvas/UIRoot/经营模式界面');
        const collectionUiNode = find('Canvas/UIRoot/图鉴模式界面');

        if (businessUiNode) {
            businessUiNode.active = !isCollectionMode;
        }

        if (collectionUiNode) {
            collectionUiNode.active = isCollectionMode;
        }

        log(`[GameManager] 当前玩法模式：${activeModeId}`);
    }

    private shouldAllowManualSpawn(): boolean {
        return this.getActiveModeConfig()?.getAllowManualSpawn() ?? true;
    }

    private shouldUseBusinessOrderDeck(): boolean {
        const modeConfig = this.getActiveModeConfig();
        const requestedByMode = modeConfig?.getUseBusinessOrders() ?? !!this.businessModeController?.isOrderDeckSpawnEnabled();
        return requestedByMode && !!this.businessModeController?.isOrderDeckSpawnEnabled();
    }

    private shouldUseLegacyCurrentItem(): boolean {
        const modeConfig = this.getActiveModeConfig();
        return modeConfig?.getUseLegacyCurrentSpawnItem() ?? !this.shouldUseBusinessOrderDeck();
    }

    private shouldConsumeResourceOnManualSpawn(): boolean {
        return this.getActiveModeConfig()?.getSpendLegacyResourceOnSpawn() ?? true;
    }

    private shouldEnableRandomDrop(): boolean {
        return this.getActiveModeConfig()?.getEnableRandomDrop() ?? DEFAULT_WORLD_DROP_ENABLED;
    }

    private shouldEnableAutoSpawn(): boolean {
        return this.getActiveModeConfig()?.getEnableAutoSpawn() ?? true;
    }

    private shouldRequireStartButton(): boolean {
        return this.getActiveModeConfig()?.getRequiresStartButton() ?? false;
    }

    private initializeBusinessDiaryIfNeeded(forceNewRun = false): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        const shouldCreateRun = forceNewRun || !BusinessRunLogger.hasCurrentRun();
        if (shouldCreateRun) {
            this.createBusinessDiaryForCurrentDay();
        }
    }

    private createBusinessDiaryForCurrentDay(): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        SHOP_RUNTIME_STATE.currentBusinessDay = runtimeProgress.currentBusinessDay;
        SHOP_RUNTIME_STATE.orderDeckSnapshots = this.businessModeController?.getOrderDeckSnapshots() ?? [];
        BusinessRunLogger.createNewRun(this.buildBusinessDiaryDaySnapshot());
    }

    private recordBusinessDayStart(): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        SHOP_RUNTIME_STATE.currentBusinessDay = runtimeProgress.currentBusinessDay;
        SHOP_RUNTIME_STATE.orderDeckSnapshots = this.businessModeController?.getOrderDeckSnapshots() ?? [];
        BusinessRunLogger.startDay(this.buildBusinessDiaryDaySnapshot());
    }

    private recordBusinessDayFinished(dayResult: BusinessDayResult): void {
        if (!this.shouldUseBusinessOrderDeck()) {
            return;
        }

        const currentMoney = this.businessModeController?.getCurrentMoney() ?? SHOP_RUNTIME_STATE.currentMoney;
        const baseRewardMoney = dayResult.rewardLines
            .filter((line) => line.category === 'base' && line.achieved)
            .reduce((sum, line) => sum + line.rewardMoney, 0);
        const businessBonusRewardMoney = dayResult.rewardLines
            .filter((line) => line.category === 'businessBonus' && line.achieved)
            .reduce((sum, line) => sum + line.rewardMoney, 0);

        BusinessRunLogger.finishDay({
            ...this.buildBusinessDiaryDaySnapshot(),
            day: dayResult.day,
            targetScore: dayResult.targetScore,
            score: dayResult.score,
            reachedTarget: dayResult.reachedTarget,
            obtainedItems: dayResult.obtainedItems.map((item) => ({
                itemId: item.itemId,
                displayName: item.displayName,
                count: item.count,
            })),
            baseRewardMoney,
            businessBonusRewardMoney,
            earnedMoney: dayResult.earnedMoney,
            settledMoney: currentMoney + dayResult.earnedMoney,
            boardCounts: this.getBoardItemCountSnapshots(),
        });
    }

    private buildBusinessDiaryDaySnapshot(): BusinessDiaryDaySnapshot {
        const currentResource = runtimeProgress.currentCoins;
        const maxResource = runtimeProgress.maxCoins;
        return {
            day: runtimeProgress.currentBusinessDay,
            targetScore: this.businessModeController?.getDailyTargetScore()
                ?? this.getConfiguredBaseDailyTargetScore() + Math.max(0, runtimeProgress.currentBusinessDay - 1) * this.getConfiguredDailyTargetScoreIncrease(),
            dailyTargetIncrease: this.getConfiguredDailyTargetScoreIncrease(),
            currentMoney: this.businessModeController?.getCurrentMoney() ?? SHOP_RUNTIME_STATE.currentMoney,
            remainingStock: runtimeProgress.remainingStock,
            dailyRestock: this.getConfiguredDailyStockLimit(),
            currentResource,
            maxResource,
            orderDeck: this.businessModeController?.getOrderDeckSnapshots() ?? [],
            ownedBusinessBonuses: this.businessModeController?.getOwnedBusinessBonusSnapshots() ?? [],
            boardCounts: this.getBoardItemCountSnapshots(),
            sceneName: director.getScene()?.name ?? '未知',
        };
    }

    private getBoardItemCountSnapshots(): BusinessDiaryItemCountSnapshot[] | null {
        if (!this.coinSpawner) {
            return null;
        }

        const parent = this.coinSpawner.coinRoot ?? this.coinSpawner.node;
        const spawnPoint = this.coinSpawner.spawnPoint;
        const counts = new Map<string, BusinessDiaryItemCountSnapshot>();
        parent.children.forEach((child) => {
            if (child === spawnPoint) {
                return;
            }

            const item = child.getComponent(CoinBehaviour);
            if (!item || item.hasScored || !item.itemId) {
                return;
            }

            const existing = counts.get(item.itemId);
            if (existing) {
                existing.count += 1;
                return;
            }

            counts.set(item.itemId, {
                itemId: item.itemId,
                displayName: item.itemTypeLabel,
                count: 1,
            });
        });

        return [...counts.values()];
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
        this.resetBusinessDayStagnationState();
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

        const spawnedItem = this.spawnCatalogItem(mapPoolItem, request);
        if (spawnedItem && this.shouldUseBusinessOrderDeck()) {
            BusinessRunLogger.recordSpawn(runtimeProgress.currentBusinessDay, mapPoolItem.itemId, mapPoolItem.itemName, 'random');
        }
        return !!spawnedItem;
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

    private getConfiguredStallDetectionConfig(): NormalizedBusinessStallDetectionConfig {
        return this.getActiveModeConfig()?.getStallDetectionConfig() ?? createDefaultNormalizedStallDetectionConfig();
    }

    private getConfiguredStallGraceSeconds(): number {
        const config = this.getConfiguredStallDetectionConfig();
        const configuredSeconds = runtimeProgress.currentBusinessDay === 1
            ? config.firstDayGraceSeconds
            : config.laterDayGraceSeconds;
        return this.normalizeNonNegativeNumber(configuredSeconds, 20);
    }

    private getConfiguredNoScoreTimeoutSeconds(): number {
        return this.normalizeNonNegativeNumber(this.getConfiguredStallDetectionConfig().noScoreTimeoutSeconds, 3);
    }

    private getConfiguredStallRequiresFirstSpawn(): boolean {
        const config = this.getConfiguredStallDetectionConfig();
        return runtimeProgress.currentBusinessDay === 1
            ? config.firstDayRequiresFirstSpawn
            : config.laterDaysRequireFirstSpawn;
    }

    private getConfiguredCountdownDecimalPlaces(): number {
        const decimalPlaces = this.getConfiguredStallDetectionConfig().countdownDecimalPlaces;
        return Math.min(3, Math.max(0, this.normalizeNonNegativeInteger(decimalPlaces, 1)));
    }

    private getBusinessStagnationFailureReason(): string {
        const timeoutSeconds = this.getConfiguredNoScoreTimeoutSeconds();
        return `连续 ${formatCountdownSeconds(timeoutSeconds, this.getConfiguredCountdownDecimalPlaces())} 秒没有获得分数`;
    }

    private getConfiguredInitialCoins(): number {
        return this.normalizeNonNegativeInteger(this.getActiveModeConfig()?.getInitialSpawnResource() ?? DEFAULT_INITIAL_SPAWN_RESOURCE);
    }

    private getConfiguredDailyStockLimit(): number {
        const modeConfig = this.getActiveModeConfig();
        if (modeConfig) {
            return this.normalizeNonNegativeInteger(modeConfig.getDailySpawnQuota());
        }

        return this.normalizeNonNegativeInteger(DEFAULT_DAILY_SPAWN_QUOTA);
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
        if (modeConfig) {
            return this.normalizeNonNegativeInteger(modeConfig.getInitialSpawnResource());
        }

        return this.getConfiguredDailyStockLimit();
    }

    private getConfiguredBaseDailyTargetScore(): number {
        return this.normalizeNonNegativeNumber(this.getActiveModeConfig()?.getFirstDayTargetScore() ?? 20, 20);
    }

    private getConfiguredDailyTargetScoreIncrease(): number {
        return this.normalizeNonNegativeNumber(this.getActiveModeConfig()?.getDailyTargetScoreGrowth() ?? 10, 10);
    }

    private getConfiguredMaxCoins(): number {
        return this.normalizeNonNegativeInteger(this.getActiveModeConfig()?.getResourceRegenCap() ?? DEFAULT_RESOURCE_REGEN_CAP);
    }

    private getConfiguredResourceRegenInterval(): number {
        return this.normalizeNonNegativeNumber(
            this.getActiveModeConfig()?.getResourceRegenInterval() ?? DEFAULT_RESOURCE_REGEN_INTERVAL,
            DEFAULT_RESOURCE_REGEN_INTERVAL,
        );
    }

    private getConfiguredResourceRegenAmount(): number {
        return this.normalizeNonNegativeInteger(
            this.getActiveModeConfig()?.getResourceRegenAmount() ?? DEFAULT_RESOURCE_REGEN_AMOUNT,
            DEFAULT_RESOURCE_REGEN_AMOUNT,
        );
    }

    private getConfiguredWorldDropInterval(): number {
        return this.normalizeNonNegativeNumber(
            this.getActiveModeConfig()?.getRandomDropInterval() ?? DEFAULT_WORLD_DROP_INTERVAL,
            DEFAULT_WORLD_DROP_INTERVAL,
        );
    }

    private getConfiguredWorldDropAmount(): number {
        return this.normalizeNonNegativeInteger(
            this.getActiveModeConfig()?.getRandomDropBatchCount() ?? DEFAULT_WORLD_DROP_AMOUNT,
            DEFAULT_WORLD_DROP_AMOUNT,
        );
    }

    private getConfiguredAutoSpawnInterval(): number {
        const interval = this.getActiveModeConfig()?.getAutoSpawnInterval() ?? DEFAULT_AUTO_SPAWN_INTERVAL;
        return Math.max(MIN_AUTO_SPAWN_INTERVAL, this.normalizeNonNegativeNumber(interval, DEFAULT_AUTO_SPAWN_INTERVAL));
    }

    private getConfiguredAutoSpawnX(): number {
        return this.normalizeFiniteNumber(this.getActiveModeConfig()?.getAutoSpawnX() ?? DEFAULT_AUTO_SPAWN_X, DEFAULT_AUTO_SPAWN_X);
    }

    private getConfiguredAutoSpawnZ(): number {
        return this.normalizeFiniteNumber(this.getActiveModeConfig()?.getAutoSpawnZ() ?? DEFAULT_AUTO_SPAWN_Z, DEFAULT_AUTO_SPAWN_Z);
    }

    private getConfiguredSpawnCost(): number {
        const spawnCost = this.getActiveModeConfig()?.getManualSpawnCost() ?? DEFAULT_MANUAL_SPAWN_COST;
        return Math.max(1, this.normalizeNonNegativeInteger(spawnCost, DEFAULT_MANUAL_SPAWN_COST));
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

    private normalizePositiveNumber(value: number, fallback: number): number {
        if (!Number.isFinite(value) || value <= 0) {
            return fallback;
        }

        return value;
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

function formatCountdownSeconds(value: number, decimalPlaces = 1): string {
    const normalizedDecimalPlaces = Math.min(3, Math.max(0, Math.round(decimalPlaces)));
    if (!Number.isFinite(value)) {
        return (0).toFixed(normalizedDecimalPlaces);
    }

    return Math.max(0, value).toFixed(normalizedDecimalPlaces);
}
