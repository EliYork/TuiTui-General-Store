import { lerp } from "../utils/math";

export interface PusherRig3DConfig {
  width: number;
  height: number;
  depth: number;
  retractFrontZ: number;
  extendFrontZ: number;
  baseY: number;
  cycleSeconds: number;
}

export interface PusherRig3DState {
  width: number;
  height: number;
  depth: number;
  baseY: number;
  frontZ: number;
  backZ: number;
  travelRatio: number;
}

export class PusherRig3D {
  private elapsedSeconds = 0;
  private travelRatio = 0;
  private frontZ: number;

  constructor(private readonly config: PusherRig3DConfig) {
    this.frontZ = config.retractFrontZ;
  }

  update(deltaSeconds: number): void {
    this.elapsedSeconds = (this.elapsedSeconds + deltaSeconds) % this.config.cycleSeconds;
    const phase = this.elapsedSeconds / this.config.cycleSeconds;
    const motion = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    this.travelRatio = motion;
    this.frontZ = lerp(this.config.retractFrontZ, this.config.extendFrontZ, motion);
  }

  getState(): PusherRig3DState {
    return {
      width: this.config.width,
      height: this.config.height,
      depth: this.config.depth,
      baseY: this.config.baseY,
      frontZ: this.frontZ,
      backZ: this.frontZ + this.config.depth,
      travelRatio: this.travelRatio
    };
  }
}
