import { lerp } from "../utils/math";

export interface PusherRig3DConfig {
  width: number;
  height: number;
  depth: number;
  retractFrontZ: number;
  extendFrontZ: number;
  hiddenSupportFrontZ: number;
  hiddenSupportBackZ: number;
  hiddenSupportWidth: number;
  baseY: number;
  cycleSeconds: number;
}

export interface PusherRig3DState {
  width: number;
  height: number;
  depth: number;
  baseY: number;
  topY: number;
  frontZ: number;
  backZ: number;
  supportBackZ: number;
  hiddenSupportFrontZ: number;
  hiddenSupportBackZ: number;
  hiddenSupportWidth: number;
  velocityZ: number;
  travelRatio: number;
}

export class PusherRig3D {
  private elapsedSeconds = 0;
  private travelRatio = 0;
  private frontZ: number;
  private previousFrontZ: number;
  private velocityZ = 0;

  constructor(private readonly config: PusherRig3DConfig) {
    this.frontZ = config.retractFrontZ;
    this.previousFrontZ = config.retractFrontZ;
  }

  update(deltaSeconds: number): void {
    this.previousFrontZ = this.frontZ;
    this.elapsedSeconds = (this.elapsedSeconds + deltaSeconds) % this.config.cycleSeconds;
    const phase = this.elapsedSeconds / this.config.cycleSeconds;
    const motion = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    this.travelRatio = motion;
    this.frontZ = lerp(this.config.retractFrontZ, this.config.extendFrontZ, motion);
    this.velocityZ =
      deltaSeconds > 0 ? (this.frontZ - this.previousFrontZ) / deltaSeconds : 0;
  }

  getState(): PusherRig3DState {
    return {
      width: this.config.width,
      height: this.config.height,
      depth: this.config.depth,
      baseY: this.config.baseY,
      topY: this.config.baseY + this.config.height,
      frontZ: this.frontZ,
      backZ: this.frontZ + this.config.depth,
      supportBackZ: Math.max(
        this.frontZ + this.config.depth,
        this.config.hiddenSupportBackZ
      ),
      hiddenSupportFrontZ: Math.min(
        this.frontZ + this.config.depth,
        this.config.hiddenSupportFrontZ
      ),
      hiddenSupportBackZ: this.config.hiddenSupportBackZ,
      hiddenSupportWidth: this.config.hiddenSupportWidth,
      velocityZ: this.velocityZ,
      travelRatio: this.travelRatio
    };
  }
}
