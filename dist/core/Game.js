"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const gameConfig_1 = require("../data/gameConfig");
const CoinSpawner_1 = require("../gameplay/CoinSpawner");
const ComboTracker_1 = require("../gameplay/ComboTracker");
const Pusher_1 = require("../gameplay/entities/Pusher");
const RewardSpawner_1 = require("../gameplay/RewardSpawner");
const CoinSpawner3D_1 = require("../gameplay3d/CoinSpawner3D");
const PusherRig3D_1 = require("../gameplay3d/PusherRig3D");
const RewardSystem_1 = require("../gameplay/rewards/RewardSystem");
const miniGameAdapter_1 = require("../platform/miniGameAdapter");
const PhysicsWorld_1 = require("../physics/PhysicsWorld");
const PhysicsWorld3D_1 = require("../physics3d/PhysicsWorld3D");
const AudioService_1 = require("../services/AudioService");
const CloudService_1 = require("../services/CloudService");
const SaveService_1 = require("../services/SaveService");
const Button_1 = require("../ui/Button");
const DropFeedbackOverlay_1 = require("../ui/DropFeedbackOverlay");
const Hud_1 = require("../ui/Hud");
const EventBus_1 = require("./EventBus");
const GameLoop_1 = require("./GameLoop");
const GameState_1 = require("./GameState");
const CanvasSceneRenderer_1 = require("./render/CanvasSceneRenderer");
const SceneRenderer3D_1 = require("./render3d/SceneRenderer3D");
class Game {
    constructor(adapter = (0, miniGameAdapter_1.createMiniGameAdapter)()) {
        this.coins = [];
        this.coins3D = [];
        this.rewardBlocks = [];
        this.rewardReplenishTimer = 0;
        this.update = (deltaSeconds) => {
            if (this.renderMode === "prototype3d") {
                this.update3DPrototype(deltaSeconds);
                return;
            }
            this.pusher.update(deltaSeconds);
            this.comboTracker.update(deltaSeconds);
            this.feedbackOverlay.update(deltaSeconds);
            const physicsResult = this.physicsWorld.updateItems(this.getBoardItems(), this.pusher, deltaSeconds);
            if (physicsResult.droppedItems.length > 0) {
                this.handleDropResolution(physicsResult);
            }
            this.updateRewardReplenish(deltaSeconds);
            this.state.setComboCount(this.comboTracker.getCurrentCombo());
            this.syncSceneCounts();
        };
        this.render = () => {
            const context = this.adapter.context;
            context.clearRect(0, 0, this.config.screen.width, this.config.screen.height);
            if (this.renderMode === "prototype3d" && this.sceneRenderer3D && this.pusher3D) {
                this.sceneRenderer3D.render(context, this.pusher3D, this.coins3D);
            }
            else {
                this.sceneRenderer.render(context, this.pusher, this.getBoardItems());
            }
            this.feedbackOverlay.render(context);
            this.hud.render(context, this.state.getSnapshot());
            this.coinButton.render(context);
        };
        this.adapter = adapter;
        this.config = (0, gameConfig_1.createGameConfig)(this.adapter.screen);
        this.renderMode = this.config.renderMode;
        this.eventBus = new EventBus_1.EventBus();
        this.state = new GameState_1.GameState();
        this.state.applyLoadedData((0, SaveService_1.loadGame)());
        this.pusher = new Pusher_1.Pusher(this.config.pusher);
        this.physicsWorld = new PhysicsWorld_1.PhysicsWorld(this.config.physics);
        this.physicsWorld3D =
            this.renderMode === "prototype3d" ? new PhysicsWorld3D_1.PhysicsWorld3D(this.config) : null;
        this.coinSpawner = new CoinSpawner_1.CoinSpawner(this.config.coin);
        this.coinSpawner3D =
            this.renderMode === "prototype3d"
                ? new CoinSpawner3D_1.CoinSpawner3D(this.config.threeD.coin)
                : null;
        this.rewardSpawner = new RewardSpawner_1.RewardSpawner(this.config.reward);
        this.comboTracker = new ComboTracker_1.ComboTracker(this.config.combo);
        this.feedbackOverlay = new DropFeedbackOverlay_1.DropFeedbackOverlay(this.config);
        this.sceneRenderer = new CanvasSceneRenderer_1.CanvasSceneRenderer(this.config);
        this.sceneRenderer3D =
            this.renderMode === "prototype3d" ? new SceneRenderer3D_1.SceneRenderer3D(this.config) : null;
        this.hud = new Hud_1.Hud(this.config.ui.hud, this.config.ui.hintText, this.config.colors);
        this.pusher3D =
            this.renderMode === "prototype3d"
                ? new PusherRig3D_1.PusherRig3D(this.config.threeD.pusher)
                : null;
        this.coinButton = new Button_1.Button(this.config.ui.coinButton, this.config.colors, () => {
            this.handleSpawnCoin();
        });
        this.loop = new GameLoop_1.GameLoop(this.adapter.frameDriver, {
            update: this.update,
            render: this.render
        });
        this.registerEvents();
        this.registerInput();
        if (this.renderMode === "legacy2d") {
            this.bootstrapRewardBlocks();
        }
        else {
            this.state.setStatusText("\u0033\u0044 \u786c\u5e01\u539f\u578b\u5df2\u542f\u7528\uff1a\u70b9\u51fb\u6295\u5e01\u9a8c\u8bc1\u6389\u843d\u3001\u5806\u53e0\u548c\u63a8\u677f\u524d\u63a8");
        }
        this.syncSceneCounts();
    }
    start() {
        this.loop.start();
    }
    registerEvents() {
        this.eventBus.on(EventBus_1.GAME_EVENTS.COIN_SPAWNED, () => {
            this.state.recordCoinSpawn();
            this.persistSnapshot();
        });
        this.eventBus.on(EventBus_1.GAME_EVENTS.REWARD_SPAWN_REQUESTED, (payload) => {
            (0, RewardSystem_1.spawnReward)(payload);
        });
    }
    registerInput() {
        this.adapter.onTouchStart((point) => {
            const handledByUi = this.coinButton.handleTouch(point);
            if (!handledByUi) {
                if (this.renderMode === "prototype3d") {
                    this.state.setStatusText("\u70b9\u51fb\u6295\u5e01\u9a8c\u8bc1 \u0033\u0044 \u786c\u5e01\u6389\u843d\u3001\u5806\u53e0\u548c\u63a8\u677f\u524d\u63a8");
                    return;
                }
                this.state.setStatusText("\u70b9\u51fb\u6295\u5e01\u6309\u94ae\uff0c\u628a\u786c\u5e01\u548c\u5956\u52b1\u7269\u4e00\u8d77\u63a8\u5411\u524d\u6cbf");
            }
        });
    }
    bootstrapRewardBlocks() {
        const initialRewards = this.rewardSpawner.spawnInitial(this.getBoardItems());
        for (const rewardBlock of initialRewards) {
            this.addRewardBlock(rewardBlock, "initial-board");
        }
    }
    handleSpawnCoin() {
        if (this.renderMode === "prototype3d") {
            if (!this.coinSpawner3D) {
                return;
            }
            const coin3D = this.coinSpawner3D.spawn();
            this.coins3D.push(coin3D);
            this.state.setStatusText("\u5df2\u6295\u4e0b\u4e00\u679a \u0033\u0044 \u786c\u5e01\uff0c\u89c2\u5bdf\u5b83\u7684\u6389\u843d\u3001\u5806\u53e0\u548c\u53d7\u63a8\u60c5\u51b5");
            this.syncSceneCounts();
            this.eventBus.emit(EventBus_1.GAME_EVENTS.COIN_SPAWNED, { coinId: coin3D.id });
            (0, AudioService_1.playSound)("coin-drop");
            return;
        }
        const coin = this.coinSpawner.spawn();
        this.coins.push(coin);
        this.syncSceneCounts();
        this.eventBus.emit(EventBus_1.GAME_EVENTS.COIN_SPAWNED, { coinId: coin.id });
        (0, AudioService_1.playSound)("coin-drop");
    }
    update3DPrototype(deltaSeconds) {
        var _a;
        (_a = this.pusher3D) === null || _a === void 0 ? void 0 : _a.update(deltaSeconds);
        this.comboTracker.update(deltaSeconds);
        this.feedbackOverlay.update(deltaSeconds);
        if (this.physicsWorld3D && this.pusher3D) {
            const physicsResult = this.physicsWorld3D.updateCoins(this.coins3D, this.pusher3D.getState(), deltaSeconds);
            if (physicsResult.droppedItems.length > 0) {
                this.handleDropResolution(physicsResult);
            }
        }
        this.state.setComboCount(this.comboTracker.getCurrentCombo());
        this.syncSceneCounts();
    }
    handleDropResolution(physicsResult) {
        const comboResult = this.comboTracker.registerDrop(physicsResult.droppedItems.length);
        this.removeDroppedItems(physicsResult.droppedItems);
        const latestDropHint = this.buildLatestDropHint(physicsResult.droppedItems, comboResult.comboBonus);
        this.state.recordDropResolution(physicsResult.droppedItems.length, physicsResult.totalReward, comboResult.comboCount, comboResult.comboBonus, latestDropHint);
        this.feedbackOverlay.push({
            droppedItems: physicsResult.droppedItems,
            comboCount: comboResult.comboCount,
            comboBonus: comboResult.comboBonus
        });
        this.eventBus.emit(EventBus_1.GAME_EVENTS.REWARD_SPAWN_REQUESTED, {
            reason: "front-drop",
            count: physicsResult.droppedItems.length,
            position: {
                x: this.config.screen.width / 2,
                y: this.config.table.rewardSlotTop
            }
        });
        (0, RewardSystem_1.onDropResolved)({
            droppedItems: physicsResult.droppedItems,
            totalReward: physicsResult.totalReward,
            comboCount: comboResult.comboCount,
            comboBonus: comboResult.comboBonus
        });
        this.playDropSounds(physicsResult.droppedItems, comboResult.comboCount);
        this.persistSnapshot();
    }
    updateRewardReplenish(deltaSeconds) {
        if (this.rewardBlocks.length >= this.config.reward.targetCount) {
            this.rewardReplenishTimer = 0;
            return;
        }
        this.rewardReplenishTimer += deltaSeconds;
        if (this.rewardReplenishTimer < this.config.reward.replenishIntervalSeconds) {
            return;
        }
        const rewardBlock = this.rewardSpawner.trySpawn(this.getBoardItems());
        if (!rewardBlock) {
            return;
        }
        this.rewardReplenishTimer = 0;
        this.addRewardBlock(rewardBlock, "auto-replenish");
        (0, AudioService_1.playSound)(rewardBlock.rewardType === "chestReward" ? "reward-rare" : "reward-spawn");
    }
    addRewardBlock(rewardBlock, reason) {
        this.rewardBlocks.push(rewardBlock);
        this.eventBus.emit(EventBus_1.GAME_EVENTS.REWARD_SPAWN_REQUESTED, {
            reason,
            rewardType: rewardBlock.rewardType,
            position: { ...rewardBlock.position }
        });
    }
    removeDroppedItems(droppedItems) {
        const droppedKeySet = new Set(droppedItems.map((item) => `${item.kind}:${item.id}`));
        const droppedCoinIdSet = new Set(droppedItems
            .filter((item) => item.kind === "coin")
            .map((item) => item.id));
        for (let index = this.coins.length - 1; index >= 0; index -= 1) {
            const coin = this.coins[index];
            if (!droppedKeySet.has(`${coin.kind}:${coin.id}`)) {
                continue;
            }
            this.coins.splice(index, 1);
        }
        for (let index = this.coins3D.length - 1; index >= 0; index -= 1) {
            const coin = this.coins3D[index];
            if (!droppedCoinIdSet.has(coin.id)) {
                continue;
            }
            this.coins3D.splice(index, 1);
        }
        for (let index = this.rewardBlocks.length - 1; index >= 0; index -= 1) {
            const rewardBlock = this.rewardBlocks[index];
            if (!droppedKeySet.has(`${rewardBlock.kind}:${rewardBlock.id}`)) {
                continue;
            }
            this.rewardBlocks.splice(index, 1);
        }
    }
    getBoardItems() {
        return [...this.rewardBlocks, ...this.coins];
    }
    syncSceneCounts() {
        if (this.renderMode === "prototype3d") {
            this.state.setSceneCoinCount(this.coins3D.length);
            this.state.setRewardBlockCount(0);
            return;
        }
        this.state.setSceneCoinCount(this.coins.length);
        this.state.setRewardBlockCount(this.rewardBlocks.length);
    }
    playDropSounds(droppedItems, comboCount) {
        const hasRewardBlock = droppedItems.some((item) => item.kind === "reward");
        const hasChest = droppedItems.some((item) => item.rewardType === "chestReward");
        if (hasChest) {
            (0, AudioService_1.playSound)("reward-rare");
        }
        else if (hasRewardBlock) {
            (0, AudioService_1.playSound)("reward-drop");
        }
        else {
            (0, AudioService_1.playSound)("coin-score");
        }
        if (comboCount >= 2) {
            (0, AudioService_1.playSound)("combo");
        }
    }
    buildLatestDropHint(droppedItems, comboBonus) {
        const joined = droppedItems
            .slice(0, 2)
            .map((item) => item.feedbackText)
            .join(", ");
        const suffix = droppedItems.length > 2 ? "..." : "";
        const comboSuffix = comboBonus > 0 ? ` | Combo +${comboBonus}` : "";
        return `${joined}${suffix}${comboSuffix}`;
    }
    persistSnapshot() {
        const snapshot = this.state.getSnapshot();
        (0, SaveService_1.saveGame)(snapshot);
        (0, CloudService_1.syncToCloud)(snapshot);
    }
}
exports.Game = Game;
