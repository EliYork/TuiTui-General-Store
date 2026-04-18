import { RuntimeGameConfig } from "../../data/gameConfig";
import { Pseudo3DProjector } from "../../core/render/Pseudo3DProjector";
import { Coin } from "../entities/Coin";

export class CoinRenderer {
  render(
    context: CanvasRenderingContext2D,
    coin: Coin,
    config: RuntimeGameConfig,
    projector: Pseudo3DProjector
  ): void {
    const visualLift = this.getVisualLift(coin);
    const shadowCenter = projector.projectToScreen(coin.x, coin.depth, 0, 0);
    const bodyBaseCenter = projector.projectToScreen(
      coin.x,
      coin.depth,
      visualLift,
      0
    );
    const topCenter = projector.projectToScreen(
      coin.x,
      coin.depth,
      visualLift,
      coin.stackLevel
    );

    const radiusX = projector.getProjectedRadius(coin.radius, coin.depth);
    const radiusY = radiusX * config.pseudo3d.coinEllipseRatio;
    const thickness = Math.max(2, bodyBaseCenter.y - topCenter.y);
    const shadowOffset = projector.getShadowOffsetByDepth(coin.depth);
    const shadowAlpha = this.getShadowAlpha(coin);

    context.save();
    if (shadowAlpha > 0) {
      context.globalAlpha = shadowAlpha;
      context.fillStyle = config.colors.coinShadow;
      context.beginPath();
      context.ellipse(
        shadowCenter.x + shadowOffset.x,
        shadowCenter.y + shadowOffset.y,
        radiusX * 1.02,
        radiusY * config.pseudo3d.shadowScaleY,
        0,
        0,
        Math.PI * 2
      );
      context.fill();
      context.globalAlpha = 1;
    }

    context.fillStyle = config.colors.coinSide;
    context.fillRect(
      topCenter.x - radiusX,
      topCenter.y,
      radiusX * 2,
      thickness
    );

    context.beginPath();
    context.ellipse(
      bodyBaseCenter.x,
      bodyBaseCenter.y,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    );
    context.fillStyle = config.colors.coinSide;
    context.fill();

    context.beginPath();
    context.ellipse(
      topCenter.x,
      topCenter.y,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    );
    context.fillStyle = config.colors.coinFill;
    context.fill();
    context.strokeStyle = config.colors.coinEdge;
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.ellipse(
      topCenter.x,
      topCenter.y - radiusY * 0.1,
      radiusX * 0.72,
      radiusY * 0.52,
      0,
      Math.PI,
      Math.PI * 2
    );
    context.strokeStyle = "rgba(255, 255, 255, 0.42)";
    context.lineWidth = 1.5;
    context.stroke();

    context.restore();
  }

  private getVisualLift(coin: Coin): number {
    const compressedSupportLift = Math.min(
      coin.supportHeight * 0.16,
      coin.radius * 0.28
    );
    return coin.height + compressedSupportLift;
  }

  private getShadowAlpha(coin: Coin): number {
    if (coin.height > 10) {
      return 0.8;
    }

    if (coin.supportHeight > 1) {
      return 0;
    }

    return 0.28;
  }
}
