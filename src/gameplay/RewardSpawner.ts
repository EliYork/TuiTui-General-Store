import { RuntimeGameConfig } from "../data/gameConfig";
import { randomRange } from "../utils/math";
import { BoardItem } from "./entities/BoardItem";
import {
  RewardBlock,
  RewardBlockDefinition,
  RewardBlockType
} from "./entities/RewardBlock";

type RewardConfig = RuntimeGameConfig["reward"];

export class RewardSpawner {
  private nextId = 1;

  constructor(private readonly config: RewardConfig) {}

  spawnInitial(existingItems: BoardItem[]): RewardBlock[] {
    const result: RewardBlock[] = [];

    for (let index = 0; index < this.config.initialCount; index += 1) {
      const rewardBlock = this.trySpawn([...existingItems, ...result]);
      if (!rewardBlock) {
        break;
      }

      result.push(rewardBlock);
    }

    return result;
  }

  trySpawn(existingItems: BoardItem[]): RewardBlock | null {
    if (existingItems.filter((item) => item.kind === "reward").length >= this.config.maxVisible) {
      return null;
    }

    const definition = this.pickTypeDefinition();
    const position = this.findSpawnPosition(existingItems, definition.radius);
    if (!position) {
      return null;
    }

    const rewardBlock = new RewardBlock(
      this.nextId,
      definition.type,
      position,
      {
        x: randomRange(this.config.initialSpeedXMin, this.config.initialSpeedXMax),
        y: randomRange(this.config.initialSpeedYMin, this.config.initialSpeedYMax)
      },
      definition.radius,
      definition.rewardAmount,
      definition.label,
      definition.feedbackLabel,
      {
        stackLevel: definition.stackLevel
      }
    );

    this.nextId += 1;
    return rewardBlock;
  }

  private pickTypeDefinition(): RewardBlockDefinition {
    const entries = Object.values(this.config.types);
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * totalWeight;

    for (const entry of entries) {
      cursor -= entry.weight;
      if (cursor <= 0) {
        return {
          type: entry.type,
          rewardAmount: entry.rewardAmount,
          radius: entry.radius,
          label: entry.label,
          feedbackLabel: entry.feedbackLabel,
          weight: entry.weight,
          stackLevel: entry.stackLevel
        };
      }
    }

    const fallback = entries[entries.length - 1];
    return {
      type: fallback.type,
      rewardAmount: fallback.rewardAmount,
      radius: fallback.radius,
      label: fallback.label,
      feedbackLabel: fallback.feedbackLabel,
      weight: fallback.weight,
      stackLevel: fallback.stackLevel
    };
  }

  private findSpawnPosition(existingItems: BoardItem[], radius: number) {
    const left = this.config.spawnArea.left + radius;
    const right = this.config.spawnArea.right - radius;
    const top = this.config.spawnArea.top + radius;
    const bottom = this.config.spawnArea.bottom - radius;

    for (let attempt = 0; attempt < this.config.spawnAttempts; attempt += 1) {
      const position = {
        x: randomRange(left, right),
        y: randomRange(top, bottom)
      };

      const hasOverlap = existingItems.some((item) => {
        const deltaX = item.position.x - position.x;
        const deltaY = item.position.y - position.y;
        const minDistance = item.radius + radius + this.config.spawnPadding;
        return deltaX * deltaX + deltaY * deltaY < minDistance * minDistance;
      });

      if (!hasOverlap) {
        return position;
      }
    }

    return null;
  }
}
