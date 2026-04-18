import { Point } from "../../utils/math";
import { BoardItem, DroppedItemResult, Pseudo3DState } from "./BoardItem";

export type RewardBlockType = "coinReward" | "gemReward" | "chestReward";

export interface RewardBlockDefinition {
  type: RewardBlockType;
  rewardAmount: number;
  radius: number;
  label: string;
  feedbackLabel: string;
  weight: number;
  stackLevel: number;
}

export class RewardBlock extends BoardItem {
  constructor(
    id: number,
    public readonly rewardType: RewardBlockType,
    position: Point,
    velocity: Point,
    radius: number,
    public readonly rewardAmount: number,
    public readonly label: string,
    public readonly feedbackLabel: string,
    pseudo3D?: Partial<Pseudo3DState>
  ) {
    super(id, "reward", position, velocity, radius, pseudo3D);
  }

  buildDropResult(): DroppedItemResult {
    return {
      id: this.id,
      kind: this.kind,
      rewardAmount: this.rewardAmount,
      feedbackText: `${this.feedbackLabel} +${this.rewardAmount}`,
      rewardType: this.rewardType,
      position: { ...this.position }
    };
  }
}
