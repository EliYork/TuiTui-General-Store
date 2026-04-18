import { Point } from "../../utils/math";

export type BoardItemKind = "coin" | "reward";

export interface Pseudo3DState {
  height: number;
  heightVelocity: number;
  supportHeight: number;
  stackLevel: number;
  renderOrderBias: number;
  landingAssistActive: boolean;
}

export interface DroppedItemResult {
  id: number;
  kind: BoardItemKind;
  rewardAmount: number;
  feedbackText: string;
  rewardType?: string;
  position: Point;
}

export abstract class BoardItem {
  public position: Point;
  public velocity: Point;
  public readonly radius: number;
  public isDropped: boolean;
  public height: number;
  public heightVelocity: number;
  public supportHeight: number;
  public stackLevel: number;
  public renderOrderBias: number;
  public landingAssistActive: boolean;

  constructor(
    public readonly id: number,
    public readonly kind: BoardItemKind,
    position: Point,
    velocity: Point,
    radius: number,
    pseudo3D: Partial<Pseudo3DState> = {}
  ) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.radius = radius;
    this.isDropped = false;
    this.height = pseudo3D.height ?? 0;
    this.heightVelocity = pseudo3D.heightVelocity ?? 0;
    this.supportHeight = pseudo3D.supportHeight ?? 0;
    this.stackLevel = pseudo3D.stackLevel ?? 1;
    this.renderOrderBias = pseudo3D.renderOrderBias ?? 0;
    this.landingAssistActive =
      pseudo3D.landingAssistActive ??
      (this.height > 0 || this.heightVelocity !== 0);
  }

  get x(): number {
    return this.position.x;
  }

  set x(value: number) {
    this.position.x = value;
  }

  get depth(): number {
    return this.position.y;
  }

  set depth(value: number) {
    this.position.y = value;
  }

  get z(): number {
    return this.height;
  }

  set z(value: number) {
    this.height = value;
  }

  get totalVisualHeight(): number {
    return this.supportHeight + this.height;
  }

  get sortKey(): number {
    const visualStackBias =
      this.totalVisualHeight > 0 ? this.stackLevel * 18 : 0;

    return (
      this.depth * 1000 +
      visualStackBias +
      this.totalVisualHeight * 6 +
      this.renderOrderBias
    );
  }

  applyLinearDamping(damping: number, deltaSeconds: number, restThreshold: number): void {
    if (this.isDropped) {
      return;
    }

    const factor = 1 / (1 + damping * deltaSeconds);
    this.velocity.x *= factor;
    this.velocity.y *= factor;

    if (Math.abs(this.velocity.x) < restThreshold) {
      this.velocity.x = 0;
    }

    if (Math.abs(this.velocity.y) < restThreshold) {
      this.velocity.y = 0;
    }
  }

  integrate(deltaSeconds: number): void {
    if (this.isDropped) {
      return;
    }

    this.x += this.velocity.x * deltaSeconds;
    this.depth += this.velocity.y * deltaSeconds;
  }

  clampVelocity(maxSpeedX: number, maxSpeedY: number): void {
    this.velocity.x = Math.max(-maxSpeedX, Math.min(maxSpeedX, this.velocity.x));
    this.velocity.y = Math.max(-maxSpeedY, Math.min(maxSpeedY, this.velocity.y));
  }

  translate(offsetX: number, offsetY: number): void {
    this.x += offsetX;
    this.depth += offsetY;
  }

  setMinimumForwardVelocity(minVelocityY: number): void {
    if (this.velocity.y < minVelocityY) {
      this.velocity.y = minVelocityY;
    }
  }

  markDropped(): void {
    this.isDropped = true;
  }

  setAirborneState(height: number, heightVelocity: number): void {
    this.height = Math.max(0, height);
    this.heightVelocity = heightVelocity;
    this.landingAssistActive = true;
  }

  setSupportState(supportHeight: number, stackLevel: number): void {
    this.supportHeight = Math.max(0, supportHeight);
    this.stackLevel = Math.max(1, stackLevel);
  }

  markLandingResolved(supportHeight: number, stackLevel: number): void {
    this.setSupportState(supportHeight, stackLevel);
    this.landingAssistActive = false;
  }

  shouldResolveLanding(airborneThreshold: number): boolean {
    if (!this.landingAssistActive || this.isDropped) {
      return false;
    }

    return this.height <= airborneThreshold;
  }

  relaxSupportState(deltaSeconds: number, relaxationPerSecond: number): void {
    if (this.supportHeight <= 0) {
      this.supportHeight = 0;
      return;
    }

    this.supportHeight = Math.max(
      0,
      this.supportHeight - relaxationPerSecond * deltaSeconds
    );

    if (this.supportHeight === 0 && this.height === 0) {
      this.stackLevel = 1;
    }
  }

  abstract buildDropResult(): DroppedItemResult;
}
