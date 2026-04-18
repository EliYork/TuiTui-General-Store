import { RuntimeGameConfig } from "../../data/gameConfig";
import { clamp, lerp, Point } from "../../utils/math";

export interface Pseudo3DRenderable {
  x: number;
  depth: number;
  height: number;
  stackLevel: number;
  renderOrderBias: number;
  sortKey?: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  depthRatio: number;
  heightOffset: number;
}

export class Pseudo3DProjector {
  constructor(private readonly config: RuntimeGameConfig) {}

  getDepthRatio(depth: number): number {
    return clamp(
      (depth - this.config.pseudo3d.depthStart) /
        Math.max(1, this.config.pseudo3d.depthEnd - this.config.pseudo3d.depthStart),
      0,
      1
    );
  }

  getRenderScaleByDepth(depth: number): number {
    return lerp(
      this.config.pseudo3d.spriteScaleBack,
      this.config.pseudo3d.spriteScaleFront,
      this.getDepthRatio(depth)
    );
  }

  getPerspectiveX(worldX: number, depth: number): number {
    const horizontalFactor = lerp(
      this.config.pseudo3d.horizontalPerspectiveBack,
      this.config.pseudo3d.horizontalPerspectiveFront,
      this.getDepthRatio(depth)
    );

    return (
      this.config.pseudo3d.centerX +
      (worldX - this.config.pseudo3d.centerX) * horizontalFactor
    );
  }

  getHeightLift(height: number, stackLevel: number, depth: number): number {
    void stackLevel;
    const scale = this.getRenderScaleByDepth(depth);
    return (
      height * this.config.pseudo3d.heightLiftFactor * scale
    );
  }

  getShadowOffsetByDepth(depth: number): Point {
    const scale = this.getRenderScaleByDepth(depth);
    return {
      x: this.config.pseudo3d.shadowOffsetX * scale,
      y: this.config.pseudo3d.shadowOffsetY * scale
    };
  }

  projectToScreen(
    worldX: number,
    depth: number,
    height = 0,
    stackLevel = 0
  ): ProjectedPoint {
    const scale = this.getRenderScaleByDepth(depth);
    const heightOffset = this.getHeightLift(height, stackLevel, depth);

    return {
      x: this.getPerspectiveX(worldX, depth),
      y: depth - heightOffset,
      scale,
      depthRatio: this.getDepthRatio(depth),
      heightOffset
    };
  }

  getProjectedRadius(radius: number, depth: number): number {
    return radius * this.getRenderScaleByDepth(depth);
  }

  getRenderSortKey(renderable: Pseudo3DRenderable): number {
    if (typeof renderable.sortKey === "number") {
      return renderable.sortKey;
    }

    return (
      renderable.depth * 1000 +
      renderable.stackLevel * 48 +
      renderable.height * 6 +
      renderable.renderOrderBias
    );
  }
}
