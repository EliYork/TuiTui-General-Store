import { _decorator, Component, director, Enum, Label, warn } from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner } from '../gameplay/CoinSpawner';

const { ccclass, property } = _decorator;
const SHARED_SCENE_NAME = 'Prototype01';

type MapId = 'Map01' | 'Map02';

enum RoundState {
    Ready = 'Ready',
    Playing = 'Playing',
    NoCoins = 'NoCoins',
}

enum MapSelection {
    Map01 = 0,
    Map02 = 1,
}

interface MapConfig {
    mapId: MapId;
    mapName: string;
    sceneName: string;
    coinRewardMultiplier: number;
    specialCoinChance: number;
    allowToyCarDrop: boolean;
    toyCarChance: number;
    riskLevelHint: number;
}

interface RuntimePersistentProgress {
    initialized: boolean;
    currentMapId: MapId;
    currentCoins: number;
    maxCoins: number;
    coinRegenInterval: number;
    lifetimeCoinsDropped: number;
    totalToyCars: number;
    regenProgressSeconds: number;
}

const runtimeProgress: RuntimePersistentProgress = {
    initialized: false,
    currentMapId: 'Map01',
    currentCoins: 0,
    maxCoins: 0,
    coinRegenInterval: 0,
    lifetimeCoinsDropped: 0,
    totalToyCars: 0,
    regenProgressSeconds: 0,
};

@ccclass('GameManager')
export class GameManager extends Component {
    @property(CoinSpawner)
    public coinSpawner: CoinSpawner | null = null;

    @property({ type: Enum(MapSelection), tooltip: 'Inspector map selection used on first boot and by applyInspectorMapSelection().' })
    public mapSelection = MapSelection.Map01;

    @property({ tooltip: 'Initial wallet coin amount written into the persistent runtime data on first boot.' })
    public startCoins = 300;

    @property({ tooltip: 'Natural regeneration cap. Wallet coins may exceed this through drops.' })
    public maxCoins = 300;

    @property({ tooltip: 'Seconds needed to regenerate 1 coin back into the wallet while currentCoins is below maxCoins.' })
    public coinRegenInterval = 15;

    @property({ tooltip: 'Wallet coin reward granted when a normal coin drops, before map multiplier.' })
    public normalCoinReward = 1;

    @property({ tooltip: 'Wallet coin reward granted when a special reward coin drops, before map multiplier.' })
    public specialCoinReward = 5;

    @property({ tooltip: 'Optional wallet coin reward granted when a ToyCar drops. Keep 0 if ToyCar should only count as a collectible.' })
    public toyCarCoinReward = 0;

    @property({ tooltip: 'How many wallet coins are consumed per spawn button click.' })
    public spawnCostPerCoin = 1;

    @property({ tooltip: 'Map01 wallet reward multiplier.' })
    public map01CoinRewardMultiplier = 1;

    @property({ tooltip: 'Map01 special reward coin chance.' })
    public map01SpecialCoinChance = 0.1;

    @property({ tooltip: 'Map01 exclusive ToyCar drop toggle. Keep this off for the basic map.' })
    public map01AllowToyCarDrop = false;

    @property({ tooltip: 'Reserved ToyCar chance for Map01 if you ever enable its exclusive drop later.' })
    public map01ToyCarChance = 0;

    @property({ tooltip: 'Map01 future leak-risk hint. Reserved for later board-difficulty tuning.' })
    public map01RiskLevelHint = 1;

    @property({ tooltip: 'Map02 wallet reward multiplier.' })
    public map02CoinRewardMultiplier = 2;

    @property({ tooltip: 'Map02 special reward coin chance.' })
    public map02SpecialCoinChance = 0.16;

    @property({ tooltip: 'Map02 enables the exclusive ToyCar drop.' })
    public map02AllowToyCarDrop = true;

    @property({ tooltip: 'ToyCar chance used only when the current map allows it.' })
    public map02ToyCarChance = 0.05;

    @property({ tooltip: 'Map02 future leak-risk hint. Reserved for harder map variants later.' })
    public map02RiskLevelHint = 2;

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
    private _statusText = '\u51c6\u5907\u8fdb\u5165\u6301\u7eed\u5b58\u6863';

    protected start(): void {
        this.ensureRuntimeProgress();
        this._sessionSpawnedCoinCount = 0;
        this.syncStateFromResources();
        this.setStatus(`\u5f53\u524d\u5730\u56fe: ${this.getCurrentMapConfig().mapName}`);
    }

    protected update(deltaTime: number): void {
        if (!runtimeProgress.initialized) {
            return;
        }

        if (!this.tryRegenerateCoins(deltaTime)) {
            return;
        }

        this.syncStateFromResources();
        this.refreshUi();
    }

    public spawnCoinFromButton(): boolean {
        const spawnCost = this.getConfiguredSpawnCost();

        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('\u7f3a\u5c11 CoinSpawner \u5f15\u7528');
            return false;
        }

        if (runtimeProgress.currentCoins < spawnCost) {
            this.syncStateFromResources();
            this.setStatus('\u6ca1\u5e01\u4e86');
            return false;
        }

        const spawnedCoin = this.coinSpawner.spawnCoin();
        if (!spawnedCoin) {
            this.setStatus('\u6295\u5e01\u5931\u8d25');
            return false;
        }

        this.configureSpawnedReward(spawnedCoin, this.getCurrentMapConfig());

        this._sessionSpawnedCoinCount += 1;
        runtimeProgress.currentCoins -= spawnCost;
        this.syncStateFromResources();

        if (runtimeProgress.currentCoins < spawnCost) {
            this.setStatus('\u6295\u51fa\u672c\u6b21\u540e\uff0c\u6ca1\u5e01\u4e86');
            return true;
        }

        this.setStatus(`${this.getCurrentMapConfig().mapName} \u6295\u51fa\u7b2c ${this._sessionSpawnedCoinCount} \u679a`);
        return true;
    }

    public resolveCoinDrop(coin: CoinBehaviour): void {
        if (!coin.tryMarkScored()) {
            return;
        }

        const rewardCoins = this.normalizeNonNegativeInteger(coin.coinValue);

        if (coin.isToyCarReward) {
            runtimeProgress.totalToyCars += 1;

            if (rewardCoins > 0) {
                runtimeProgress.currentCoins += rewardCoins;
                this.setStatus(`ToyCar \u6389\u843d +${rewardCoins} \u5e01\uff0c\u6536\u85cf\u603b\u6570 ${runtimeProgress.totalToyCars}`);
            } else {
                this.setStatus(`ToyCar \u6389\u843d\uff0c\u6536\u85cf\u603b\u6570 ${runtimeProgress.totalToyCars}`);
            }
        } else {
            runtimeProgress.lifetimeCoinsDropped += 1;
            runtimeProgress.currentCoins += rewardCoins;
            this.setStatus(`${coin.coinTypeLabel} \u6389\u843d +${rewardCoins} \u5e01`);
        }

        this.syncStateFromResources();
        coin.onScored();
    }

    public restartGame(): void {
        const currentScene = director.getScene();
        if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('\u91cd\u5f00\u5931\u8d25\uff1a\u5f53\u524d\u573a\u666f\u4e0d\u5b58\u5728');
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
        return !!this.coinSpawner && runtimeProgress.currentCoins >= this.getConfiguredSpawnCost();
    }

    private ensureRuntimeProgress(): void {
        if (!runtimeProgress.initialized) {
            runtimeProgress.initialized = true;
            runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
            runtimeProgress.lifetimeCoinsDropped = 0;
            runtimeProgress.totalToyCars = 0;
            runtimeProgress.regenProgressSeconds = 0;
            return;
        }

        runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
        runtimeProgress.currentCoins = Math.max(0, runtimeProgress.currentCoins);
        runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
    }

    private switchMapInternal(mapId: MapId): void {
        const nextConfig = this.getMapConfig(mapId);
        if (!nextConfig) {
            warn(`[GameManager] Unknown map id: ${mapId}`);
            this.setStatus('\u5730\u56fe\u5207\u6362\u5931\u8d25');
            return;
        }

        runtimeProgress.currentMapId = mapId;
        this.syncStateFromResources();

        const currentSceneName = director.getScene()?.name ?? '';
        if (nextConfig.sceneName && currentSceneName && nextConfig.sceneName !== currentSceneName) {
            director.loadScene(nextConfig.sceneName);
            return;
        }

        this.setStatus(`\u5df2\u5207\u6362\u5230 ${nextConfig.mapName}`);
    }

    private configureSpawnedReward(coin: CoinBehaviour, mapConfig: MapConfig): void {
        if (this.rollToyCarDrop(mapConfig)) {
            coin.configureAsToyCar(this.getConfiguredToyCarCoinReward());
            return;
        }

        if (this.rollSpecialCoin(mapConfig)) {
            coin.configureAsSpecial(
                this.applyMapRewardMultiplier(this.getConfiguredSpecialCoinReward(), mapConfig),
            );
            return;
        }

        coin.configureAsNormal(
            this.applyMapRewardMultiplier(this.getConfiguredNormalCoinReward(), mapConfig),
        );
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
        if (runtimeProgress.currentCoins < this.getConfiguredSpawnCost()) {
            this._state = RoundState.NoCoins;
            return;
        }

        this._state = this._sessionSpawnedCoinCount > 0 ? RoundState.Playing : RoundState.Ready;
    }

    private refreshUi(): void {
        const mapConfig = this.getCurrentMapConfig();

        if (this.scoreLabel) {
            this.scoreLabel.string = `\u5f53\u524d\u5e01\u6570: ${runtimeProgress.currentCoins}`;
        }

        if (this.dropCountLabel) {
            this.dropCountLabel.string = `\u6062\u590d\u4e0a\u9650: ${runtimeProgress.maxCoins}`;
        }

        if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `\u6536\u85cf\u7269: ToyCar ${runtimeProgress.totalToyCars}`;
        }

        if (this.statusLabel) {
            this.statusLabel.string = `\u5730\u56fe: ${mapConfig.mapName} | ${this.getStateText()} | ${this._statusText}`;
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
                mapName: 'Map02 \u9ad8\u98ce\u9669\u9ad8\u6536\u76ca',
                sceneName: SHARED_SCENE_NAME,
                coinRewardMultiplier: this.normalizePositiveNumber(this.map02CoinRewardMultiplier, 1),
                specialCoinChance: this.normalizeChance(this.map02SpecialCoinChance),
                allowToyCarDrop: this.map02AllowToyCarDrop,
                toyCarChance: this.normalizeChance(this.map02ToyCarChance),
                riskLevelHint: this.normalizePositiveNumber(this.map02RiskLevelHint, 2),
            };
        }

        return {
            mapId: 'Map01',
            mapName: 'Map01 \u57fa\u7840\u5730\u56fe',
            sceneName: SHARED_SCENE_NAME,
            coinRewardMultiplier: this.normalizePositiveNumber(this.map01CoinRewardMultiplier, 1),
            specialCoinChance: this.normalizeChance(this.map01SpecialCoinChance),
            allowToyCarDrop: this.map01AllowToyCarDrop,
            toyCarChance: this.normalizeChance(this.map01ToyCarChance),
            riskLevelHint: this.normalizePositiveNumber(this.map01RiskLevelHint, 1),
        };
    }

    private getMapIdFromSelection(selection: MapSelection): MapId {
        return selection === MapSelection.Map02 ? 'Map02' : 'Map01';
    }

    private rollSpecialCoin(mapConfig: MapConfig): boolean {
        return Math.random() < mapConfig.specialCoinChance;
    }

    private rollToyCarDrop(mapConfig: MapConfig): boolean {
        return mapConfig.allowToyCarDrop && Math.random() < mapConfig.toyCarChance;
    }

    private applyMapRewardMultiplier(baseReward: number, mapConfig: MapConfig): number {
        return Math.max(0, Math.round(baseReward * mapConfig.coinRewardMultiplier));
    }

    private getStateText(): string {
        switch (this._state) {
        case RoundState.Playing:
            return '\u72b6\u6001: \u8fdb\u884c\u4e2d';
        case RoundState.NoCoins:
            return '\u72b6\u6001: \u6ca1\u5e01';
        case RoundState.Ready:
        default:
            return '\u72b6\u6001: \u51c6\u5907\u4e2d';
        }
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

    private getConfiguredNormalCoinReward(): number {
        return this.normalizeNonNegativeInteger(this.normalCoinReward);
    }

    private getConfiguredSpecialCoinReward(): number {
        return this.normalizeNonNegativeInteger(this.specialCoinReward);
    }

    private getConfiguredToyCarCoinReward(): number {
        return this.normalizeNonNegativeInteger(this.toyCarCoinReward);
    }

    private getConfiguredSpawnCost(): number {
        return Math.max(1, this.normalizeNonNegativeInteger(this.spawnCostPerCoin, 1));
    }

    private normalizeChance(value: number): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return clamp(value, 0, 1);
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

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
