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
    @property(CoinSpawner)
    public coinSpawner: CoinSpawner | null = null;

    @property({ type: Enum(MapSelection), tooltip: 'Inspector map selection used on first boot and by applyInspectorMapSelection().' })
    public mapSelection = MapSelection.Map01;

    @property({ tooltip: 'Initial active-spawn resource written into the runtime progress on first boot.' })
    public startCoins = 300;

    @property({ tooltip: 'Resource cap used only by automatic regeneration. Drop rewards may exceed this value.' })
    public maxCoins = 300;

    @property({ tooltip: 'Seconds between each automatic resource regeneration tick.' })
    public resourceRegenInterval = 1;

    @property({ tooltip: 'How much resource is restored on each regeneration tick.' })
    public resourceRegenAmount = 1;

    @property({ tooltip: 'How much resource is consumed per manual spawn. This is tracked, but no longer blocks spawning.' })
    public spawnCostPerCoin = 1;

    @property({ tooltip: 'Use manualSpawnY for ManualSpawnArea spawns instead of the SpawnRoot Y.' })
    public manualSpawnYOverrideEnabled = true;

    @property({ tooltip: 'World-space Y used by ManualSpawnArea spawns when the override is enabled.' })
    public manualSpawnY = 1;

    @property({ type: [CatalogItemConfig], tooltip: 'Logic-only item catalog. Each item prefab is a complete runtime object.' })
    public itemCatalog: CatalogItemConfig[] = [];

    @property({ tooltip: 'How many map-pool items should be seeded onto the board when Map01 starts.' })
    public map01InitialMapItemCount = 2;

    @property({ tooltip: 'Map01 future leak-risk hint. Reserved for later board-difficulty tuning.' })
    public map01RiskLevelHint = 1;

    @property({ tooltip: 'How many map-pool items should be seeded onto the board when Map02 starts.' })
    public map02InitialMapItemCount = 3;

    @property({ tooltip: 'Map02 future leak-risk hint. Reserved for later board-difficulty tuning.' })
    public map02RiskLevelHint = 2;

    @property({ tooltip: 'Enable or disable timed world drops without affecting manual spawn or resource recovery.' })
    public worldDropEnabled = true;

    @property({ tooltip: 'Seconds between each timed world drop batch.' })
    public worldDropInterval = 5;

    @property({ tooltip: 'How many random map-pool items are spawned each time the world drop timer fires.' })
    public worldDropAmount = 1;

    @property(Label)
    public scoreLabel: Label | null = null;

    @property(Label)
    public dropCountLabel: Label | null = null;

    @property(Label)
    public spawnCountLabel: Label | null = null;

    @property(Label)
    public statusLabel: Label | null = null;

    @property
    public showColliderDebug = false;

    private _state = RoundState.Ready;
    private _sessionSpawnedCoinCount = 0;
    private _statusText = 'Preparing runtime progress';
    private readonly _manualSpawnPosition = new Vec3();

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
        this.syncStateFromResources();

        const missingPrefabs = this.getResolvedCatalog().filter((item) => !item.prefab);
        if (missingPrefabs.length > 0) {
            this.setStatus(`Assign prefabs in GameManager.itemCatalog: ${missingPrefabs.map((item) => item.itemName).join(' / ')}`);
            return;
        }

        this.seedInitialMapItems();
        this.setStatus(`Current map: ${this.getCurrentMapConfig().mapName}`);
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
            this.setStatus('Missing CoinSpawner reference');
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

    private spawnCurrentSpawnItem(request: CoinSpawnRequest | null = null): boolean {
        const currentSpawnItem = this.getCurrentSpawnItem();
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('Missing CoinSpawner reference');
            return false;
        }

        if (!currentSpawnItem) {
            this.setStatus('No active spawn item is currently available');
            return false;
        }

        const spawnedItem = this.spawnCatalogItem(currentSpawnItem, request);
        if (!spawnedItem) {
            this.setStatus('Spawn failed');
            return false;
        }

        this._sessionSpawnedCoinCount += 1;
        runtimeProgress.currentCoins -= this.getConfiguredSpawnCost();
        this.syncStateFromResources();
        this.setStatus(`Spawned ${currentSpawnItem.itemName}, resource ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins}`);
        return true;
    }

    public resolveCoinDrop(item: CoinBehaviour): void {
        if (!item.tryMarkScored()) {
            return;
        }

        const collectedItem = this.findResolvedCatalogItemById(item.itemId);
        if (!collectedItem) {
            warn(`[GameManager] Dropped item is missing catalog registration: ${item.itemId || item.node.name}`);
            this.setStatus(`Dropped item is not registered: ${item.itemTypeLabel}`);
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

        const rewardText = `resource +${collectedItem.value}`;
        if (unlockedItemName) {
            this.setStatus(
                `Received ${collectedItem.itemName} x1, ${rewardText}, owned ${progress.ownedCount}, unlocked spawn: ${unlockedItemName}`,
            );
            return;
        }

        this.setStatus(`Received ${collectedItem.itemName} x1, ${rewardText}, owned ${progress.ownedCount}`);
    }

    public restartGame(): void {
        const currentScene = director.getScene();
        if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('Restart failed: current scene is missing');
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
        return !!this.coinSpawner && !!this.getCurrentSpawnItem();
    }

    public onSpawnItemButtonClicked(_event: Event | null, itemId: string): void {
        this.selectSpawnItemById(itemId);
    }

    public selectSpawnItemById(itemId: string): boolean {
        const nextItem = this.findResolvedCatalogItemById(itemId);
        if (!nextItem) {
            this.setStatus(`Unknown spawn item: ${itemId}`);
            return false;
        }

        if (!nextItem.isSpawnUnlocked) {
            this.setStatus(`${nextItem.itemName} is not unlocked for spawning yet`);
            return false;
        }

        if (!nextItem.prefab) {
            this.setStatus(`${nextItem.itemName} is missing its prefab`);
            return false;
        }

        runtimeProgress.currentSpawnItemId = nextItem.itemId;
        this.refreshUi();
        this.setStatus(`Active spawn item switched to ${nextItem.itemName}`);
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
            this.setStatus('Map switch failed');
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
        this.setStatus(`Switched to ${nextConfig.mapName}`);
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
            ? `${this.getConfiguredWorldDropAmount()} items / ${this.getConfiguredWorldDropInterval()}s`
            : 'disabled';

        if (this.scoreLabel) {
            this.scoreLabel.string = `Resource: ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins} | Regen ${this.getConfiguredResourceRegenAmount()} / ${this.getConfiguredResourceRegenInterval()}s`;
        }

        if (this.dropCountLabel) {
            this.dropCountLabel.string = `Spawn item: ${currentSpawnItem?.itemName ?? 'None'} | World drop: ${worldDropSummary}`;
        }

        if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `Latest drop: ${latestDroppedItem?.itemName ?? 'None'} | Collection: ${pocketSummary || 'None'} | Unlocked: ${unlockedItems.join(' / ') || 'None'}`;
        }

        if (this.statusLabel) {
            this.statusLabel.string = `Map: ${mapConfig.mapName} | ${this.getStateText()} | ${this._statusText}`;
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
                mapName: 'Map02 Reserve',
                sceneName: SHARED_SCENE_NAME,
                initialMapItemCount: this.normalizeNonNegativeInteger(this.map02InitialMapItemCount, 3),
                riskLevelHint: this.normalizeNonNegativeNumber(this.map02RiskLevelHint, 2),
            };
        }

        return {
            mapId: 'Map01',
            mapName: 'Map01 Base',
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
            return 'State: Playing';
        case RoundState.LowResources:
            return 'State: Resource below zero, spawning still allowed';
        case RoundState.Ready:
        default:
            return 'State: Ready';
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
