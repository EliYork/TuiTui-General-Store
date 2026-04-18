import { Point } from "../../utils/math";
import { BoardItem, DroppedItemResult, Pseudo3DState } from "./BoardItem";

export class Coin extends BoardItem {
  constructor(
    id: number,
    position: Point,
    velocity: Point,
    radius: number,
    pseudo3D?: Partial<Pseudo3DState>
  ) {
    super(id, "coin", position, velocity, radius, pseudo3D);
  }

  buildDropResult(): DroppedItemResult {
    return {
      id: this.id,
      kind: this.kind,
      rewardAmount: 1,
      feedbackText: "+1",
      position: { ...this.position }
    };
  }
}
