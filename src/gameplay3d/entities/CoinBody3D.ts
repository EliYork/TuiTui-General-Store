import { vec3 } from "../../core/render3d/math3d";
import { DroppedItemResult } from "../../gameplay/entities/BoardItem";
import { Vector3 } from "../../core/render3d/types";

export interface CoinBody3DRenderState {
  id: number;
  position: Vector3;
  normal: Vector3;
  radius: number;
  thickness: number;
}

export class CoinBody3D {
  public readonly position: Vector3;
  public readonly velocity: Vector3;
  public readonly normal: Vector3;
  public readonly angularVelocity: Vector3;
  public isDropped = false;
  public isGrounded = false;
  public isSleeping = false;
  public supportVelocityZ = 0;
  public sleepTimer = 0;

  constructor(
    public readonly id: number,
    x: number,
    y: number,
    z: number,
    velocity: Vector3,
    normal: Vector3,
    angularVelocity: Vector3,
    public readonly radius: number,
    public readonly thickness: number
  ) {
    this.position = vec3(x, y, z);
    this.velocity = velocity;
    this.normal = normal;
    this.angularVelocity = angularVelocity;
  }

  get halfThickness(): number {
    return this.thickness / 2;
  }

  markDropped(): void {
    this.isDropped = true;
  }

  buildDropResult(): DroppedItemResult {
    return {
      id: this.id,
      kind: "coin",
      rewardAmount: 1,
      feedbackText: "+1",
      position: {
        x: this.position.x,
        y: this.position.z
      }
    };
  }

  getRenderState(): CoinBody3DRenderState {
    const displayNormal =
      this.normal.y >= 0
        ? { ...this.normal }
        : {
            x: -this.normal.x,
            y: -this.normal.y,
            z: -this.normal.z
          };

    return {
      id: this.id,
      position: { ...this.position },
      normal: displayNormal,
      radius: this.radius,
      thickness: this.thickness
    };
  }
}
