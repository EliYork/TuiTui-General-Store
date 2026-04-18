import { Rect, lerp } from "../../utils/math";

export interface PusherConfig {
  x: number;
  backY: number;
  frontY: number;
  width: number;
  height: number;
  thickness: number;
  cycleSeconds: number;
  hiddenDepth: number;
}

export class Pusher {
  public x: number;
  public y: number;
  public readonly width: number;
  public readonly height: number;
  public readonly thickness: number;
  public previousY: number;
  public velocityY: number;
  public readonly stackLevel = 2;
  public readonly renderOrderBias = -120;
  private readonly backY: number;
  private readonly frontY: number;
  private readonly cycleSeconds: number;
  private readonly hiddenDepth: number;
  private elapsedSeconds = 0;
  private travelRatio = 0;

  constructor(config: PusherConfig) {
    this.x = config.x;
    this.y = config.backY;
    this.previousY = config.backY;
    this.velocityY = 0;
    this.width = config.width;
    this.height = config.height;
    this.thickness = config.thickness;
    this.backY = config.backY;
    this.frontY = config.frontY;
    this.cycleSeconds = config.cycleSeconds;
    this.hiddenDepth = config.hiddenDepth;
  }

  get depth(): number {
    return this.y;
  }

  get heightOffset(): number {
    return 0;
  }

  get sortKey(): number {
    return this.depth * 1000 + this.renderOrderBias;
  }

  update(deltaSeconds: number): void {
    this.previousY = this.y;
    this.elapsedSeconds = (this.elapsedSeconds + deltaSeconds) % this.cycleSeconds;
    const phase = this.elapsedSeconds / this.cycleSeconds;
    const motion = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    this.travelRatio = motion;
    this.y = lerp(this.backY, this.frontY, motion);
    this.velocityY = deltaSeconds > 0 ? (this.y - this.previousY) / deltaSeconds : 0;
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  getFrontEdgeY(): number {
    return this.y + this.height / 2;
  }

  getBackEdgeY(): number {
    return this.y - this.height / 2;
  }

  getPushDeltaY(): number {
    return Math.max(0, this.y - this.previousY);
  }

  isMovingForward(): boolean {
    return this.velocityY > 0;
  }

  getTrackStartY(): number {
    return this.backY;
  }

  getTrackEndY(): number {
    return this.frontY;
  }

  getTravelRatio(): number {
    return this.travelRatio;
  }

  getVisualBackEdgeY(): number {
    return this.getBackEdgeY() - this.hiddenDepth;
  }

  getHiddenDepth(): number {
    return this.hiddenDepth;
  }

  getMountDepth(): number {
    return this.backY - this.height * 0.95;
  }

  getMountWidth(): number {
    return this.width * 0.72;
  }

  getMountThickness(): number {
    return this.thickness * 0.78;
  }
}
