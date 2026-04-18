import { createGameConfig, RuntimeGameConfig } from "../data/gameConfig";
import { CoinSpawner } from "../gameplay/CoinSpawner";
import { ComboTracker } from "../gameplay/ComboTracker";
import { BoardItem, DroppedItemResult } from "../gameplay/entities/BoardItem";
import { Coin } from "../gameplay/entities/Coin";
import { Pusher } from "../gameplay/entities/Pusher";
import { RewardBlock } from "../gameplay/entities/RewardBlock";
import { RewardSpawner } from "../gameplay/RewardSpawner";
import {
  onDropResolved,
  spawnReward
} from "../gameplay/rewards/RewardSystem";
import { createMiniGameAdapter, MiniGameAdapter } from "../platform/miniGameAdapter";
import { PhysicsStepResult, PhysicsWorld } from "../physics/PhysicsWorld";
import { playSound } from "../services/AudioService";
import { loadGame, saveGame } from "../services/SaveService";
import { syncToCloud } from "../services/CloudService";
import { DropFeedbackOverlay } from "../ui/DropFeedbackOverlay";
import { Button } from "../ui/Button";
import { Hud } from "../ui/Hud";
import { Point } from "../utils/math";
import { EventBus, GAME_EVENTS } from "./EventBus";
import { GameLoop } from "./GameLoop";
import { GameState } from "./GameState";
import { CanvasSceneRenderer } from "./render/CanvasSceneRenderer";

export class Game {
  private readonly adapter: MiniGameAdapter;
  private readonly config: RuntimeGameConfig;
  private readonly eventBus: EventBus;
  private readonly state: GameState;
  private readonly loop: GameLoop;
  private readonly sceneRenderer: CanvasSceneRenderer;
  private readonly pusher: Pusher;
  private readonly physicsWorld: PhysicsWorld;
  private readonly coinSpawner: CoinSpawner;
  private readonly rewardSpawner: RewardSpawner;
  private readonly comboTracker: ComboTracker;
  private readonly feedbackOverlay: DropFeedbackOverlay;
  private readonly hud: Hud;
  private readonly coinButton: Button;
  private readonly coins: Coin[] = [];
  private readonly rewardBlocks: RewardBlock[] = [];
  private rewardReplenishTimer = 0;

  constructor(adapter: MiniGameAdapter = createMiniGameAdapter()) {
    this.adapter = adapter;
    this.config = createGameConfig(this.adapter.screen);
    this.eventBus = new EventBus();
    this.state = new GameState();
    this.state.applyLoadedData(loadGame());

    this.pusher = new Pusher(this.config.pusher);
    this.physicsWorld = new PhysicsWorld(this.config.physics);
    this.coinSpawner = new CoinSpawner(this.config.coin);
    this.rewardSpawner = new RewardSpawner(this.config.reward);
    this.comboTracker = new ComboTracker(this.config.combo);
    this.feedbackOverlay = new DropFeedbackOverlay(this.config);
    this.sceneRenderer = new CanvasSceneRenderer(this.config);
    this.hud = new Hud(this.config.ui.hud, this.config.ui.hintText, this.config.colors);
    this.coinButton = new Button(this.config.ui.coinButton, this.config.colors, () => {
      this.handleSpawnCoin();
    });

    this.loop = new GameLoop(this.adapter.frameDriver, {
      update: this.update,
      render: this.render
    });

    this.registerEvents();
    this.registerInput();
    this.bootstrapRewardBlocks();
    this.syncSceneCounts();
  }

  start(): void {
    this.loop.start();
  }

  private registerEvents(): void {
    this.eventBus.on(GAME_EVENTS.COIN_SPAWNED, () => {
      this.state.recordCoinSpawn();
      this.persistSnapshot();
    });

    this.eventBus.on(GAME_EVENTS.REWARD_SPAWN_REQUESTED, (payload) => {
      spawnReward(payload as { reason: string; position?: Point; rewardType?: string });
    });
  }

  private registerInput(): void {
    this.adapter.onTouchStart((point: Point) => {
      const handledByUi = this.coinButton.handleTouch(point);
      if (!handledByUi) {
        this.state.setStatusText(
          "\u70b9\u51fb\u6295\u5e01\u6309\u94ae\uff0c\u628a\u786c\u5e01\u548c\u5956\u52b1\u7269\u4e00\u8d77\u63a8\u5411\u524d\u6cbf"
        );
      }
    });
  }

  private bootstrapRewardBlocks(): void {
    const initialRewards = this.rewardSpawner.spawnInitial(this.getBoardItems());
    for (const rewardBlock of initialRewards) {
      this.addRewardBlock(rewardBlock, "initial-board");
    }
  }

  private handleSpawnCoin(): void {
    const coin = this.coinSpawner.spawn();
    this.coins.push(coin);
    this.syncSceneCounts();
    this.eventBus.emit(GAME_EVENTS.COIN_SPAWNED, { coinId: coin.id });
    playSound("coin-drop");
  }

  private readonly update = (deltaSeconds: number): void => {
    this.pusher.update(deltaSeconds);
    this.comboTracker.update(deltaSeconds);
    this.feedbackOverlay.update(deltaSeconds);

    const physicsResult = this.physicsWorld.updateItems(
      this.getBoardItems(),
      this.pusher,
      deltaSeconds
    );

    if (physicsResult.droppedItems.length > 0) {
      this.handleDropResolution(physicsResult);
    }

    this.updateRewardReplenish(deltaSeconds);
    this.state.setComboCount(this.comboTracker.getCurrentCombo());
    this.syncSceneCounts();
  };

  private readonly render = (): void => {
    const context = this.adapter.context;
    context.clearRect(0, 0, this.config.screen.width, this.config.screen.height);
    this.sceneRenderer.render(context, this.pusher, this.getBoardItems());
    this.feedbackOverlay.render(context);
    this.hud.render(context, this.state.getSnapshot());
    this.coinButton.render(context);
  };

  private handleDropResolution(physicsResult: PhysicsStepResult): void {
    const comboResult = this.comboTracker.registerDrop(physicsResult.droppedItems.length);
    this.removeDroppedItems(physicsResult.droppedItems);

    const latestDropHint = this.buildLatestDropHint(
      physicsResult.droppedItems,
      comboResult.comboBonus
    );

    this.state.recordDropResolution(
      physicsResult.droppedItems.length,
      physicsResult.totalReward,
      comboResult.comboCount,
      comboResult.comboBonus,
      latestDropHint
    );
    this.feedbackOverlay.push({
      droppedItems: physicsResult.droppedItems,
      comboCount: comboResult.comboCount,
      comboBonus: comboResult.comboBonus
    });

    this.eventBus.emit(GAME_EVENTS.REWARD_SPAWN_REQUESTED, {
      reason: "front-drop",
      count: physicsResult.droppedItems.length,
      position: {
        x: this.config.screen.width / 2,
        y: this.config.table.rewardSlotTop
      }
    });

    onDropResolved({
      droppedItems: physicsResult.droppedItems,
      totalReward: physicsResult.totalReward,
      comboCount: comboResult.comboCount,
      comboBonus: comboResult.comboBonus
    });

    this.playDropSounds(physicsResult.droppedItems, comboResult.comboCount);
    this.persistSnapshot();
  }

  private updateRewardReplenish(deltaSeconds: number): void {
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
    playSound(rewardBlock.rewardType === "chestReward" ? "reward-rare" : "reward-spawn");
  }

  private addRewardBlock(rewardBlock: RewardBlock, reason: string): void {
    this.rewardBlocks.push(rewardBlock);
    this.eventBus.emit(GAME_EVENTS.REWARD_SPAWN_REQUESTED, {
      reason,
      rewardType: rewardBlock.rewardType,
      position: { ...rewardBlock.position }
    });
  }

  private removeDroppedItems(droppedItems: DroppedItemResult[]): void {
    const droppedKeySet = new Set(
      droppedItems.map((item) => `${item.kind}:${item.id}`)
    );

    for (let index = this.coins.length - 1; index >= 0; index -= 1) {
      const coin = this.coins[index];
      if (!droppedKeySet.has(`${coin.kind}:${coin.id}`)) {
        continue;
      }

      this.coins.splice(index, 1);
    }

    for (let index = this.rewardBlocks.length - 1; index >= 0; index -= 1) {
      const rewardBlock = this.rewardBlocks[index];
      if (!droppedKeySet.has(`${rewardBlock.kind}:${rewardBlock.id}`)) {
        continue;
      }

      this.rewardBlocks.splice(index, 1);
    }
  }

  private getBoardItems(): BoardItem[] {
    return [...this.rewardBlocks, ...this.coins];
  }

  private syncSceneCounts(): void {
    this.state.setSceneCoinCount(this.coins.length);
    this.state.setRewardBlockCount(this.rewardBlocks.length);
  }

  private playDropSounds(droppedItems: DroppedItemResult[], comboCount: number): void {
    const hasRewardBlock = droppedItems.some((item) => item.kind === "reward");
    const hasChest = droppedItems.some((item) => item.rewardType === "chestReward");

    if (hasChest) {
      playSound("reward-rare");
    } else if (hasRewardBlock) {
      playSound("reward-drop");
    } else {
      playSound("coin-score");
    }

    if (comboCount >= 2) {
      playSound("combo");
    }
  }

  private buildLatestDropHint(
    droppedItems: DroppedItemResult[],
    comboBonus: number
  ): string {
    const joined = droppedItems
      .slice(0, 2)
      .map((item) => item.feedbackText)
      .join(", ");
    const suffix = droppedItems.length > 2 ? "..." : "";
    const comboSuffix = comboBonus > 0 ? ` | Combo +${comboBonus}` : "";
    return `${joined}${suffix}${comboSuffix}`;
  }

  private persistSnapshot(): void {
    const snapshot = this.state.getSnapshot();
    saveGame(snapshot);
    syncToCloud(snapshot);
  }
}
