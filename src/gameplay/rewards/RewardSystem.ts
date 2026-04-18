import { Point } from "../../utils/math";
import { DroppedItemResult } from "../entities/BoardItem";

export interface RewardSpawnContext {
  reason: string;
  rewardType?: string;
  count?: number;
  position?: Point;
}

export function spawnReward(context?: RewardSpawnContext): void {
  void context;
  // 阶段三开始在正确时机调用，后续可在这里接奖励生成动画或埋点。
}

export interface DropResolvedContext {
  droppedItems: DroppedItemResult[];
  totalReward: number;
  comboCount: number;
  comboBonus: number;
}

export function onDropResolved(context: DropResolvedContext): void {
  void context;
  // 阶段三预留统一掉落结算扩展点，后续可接特殊奖励和统计。
}
