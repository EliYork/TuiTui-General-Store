import { RuntimeGameConfig } from "../../data/gameConfig";
import { Pseudo3DProjector } from "../../core/render/Pseudo3DProjector";
import { RewardBlock } from "../entities/RewardBlock";

export class RewardBlockRenderer {
  render(
    context: CanvasRenderingContext2D,
    rewardBlock: RewardBlock,
    config: RuntimeGameConfig,
    projector: Pseudo3DProjector
  ): void {
    const colors = this.getRewardColors(rewardBlock.rewardType, config);
    const shadowCenter = projector.projectToScreen(rewardBlock.x, rewardBlock.depth, 0, 0);
    const bodyBaseCenter = projector.projectToScreen(
      rewardBlock.x,
      rewardBlock.depth,
      rewardBlock.totalVisualHeight,
      0
    );
    const topCenter = projector.projectToScreen(
      rewardBlock.x,
      rewardBlock.depth,
      rewardBlock.totalVisualHeight,
      rewardBlock.stackLevel
    );

    const halfWidth = projector.getProjectedRadius(rewardBlock.radius, rewardBlock.depth);
    const topHeight = halfWidth * config.pseudo3d.rewardTopRatio;
    const thickness = Math.max(4, bodyBaseCenter.y - topCenter.y);
    const shadowOffset = projector.getShadowOffsetByDepth(rewardBlock.depth);

    context.save();
    context.fillStyle = config.colors.coinShadow;
    context.beginPath();
    context.ellipse(
      shadowCenter.x + shadowOffset.x,
      shadowCenter.y + shadowOffset.y,
      halfWidth * 0.95,
      topHeight * config.pseudo3d.shadowScaleY,
      0,
      0,
      Math.PI * 2
    );
    context.fill();

    if (rewardBlock.rewardType === "gemReward") {
      this.drawGem(context, rewardBlock, colors, topCenter, bodyBaseCenter, halfWidth, topHeight);
    } else {
      this.drawBlock(
        context,
        rewardBlock,
        colors,
        topCenter,
        bodyBaseCenter,
        halfWidth,
        topHeight,
        thickness
      );
    }

    context.restore();
  }

  private drawBlock(
    context: CanvasRenderingContext2D,
    rewardBlock: RewardBlock,
    colors: { fill: string; edge: string; side: string },
    topCenter: { x: number; y: number },
    bodyBaseCenter: { x: number; y: number },
    halfWidth: number,
    topHeight: number,
    thickness: number
  ): void {
    const left = topCenter.x - halfWidth;
    const top = topCenter.y - topHeight;
    const width = halfWidth * 2;
    const height = topHeight * 2;

    context.fillStyle = colors.side;
    context.fillRect(left, top + topHeight, width, thickness);

    context.fillStyle = colors.fill;
    context.fillRect(left, top, width, height);
    context.strokeStyle = colors.edge;
    context.lineWidth = 2;
    context.strokeRect(left, top, width, height);

    context.fillStyle = "rgba(255, 255, 255, 0.18)";
    context.fillRect(left + 3, top + 3, width - 6, Math.max(4, height * 0.24));

    if (rewardBlock.rewardType === "chestReward") {
      context.fillStyle = colors.edge;
      context.fillRect(left, top + height * 0.46, width, Math.max(4, height * 0.16));
    }

    context.fillStyle = "rgba(255, 255, 255, 0.82)";
    context.font = `600 ${Math.max(10, rewardBlock.radius)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(rewardBlock.label, topCenter.x, topCenter.y + 1);
  }

  private drawGem(
    context: CanvasRenderingContext2D,
    rewardBlock: RewardBlock,
    colors: { fill: string; edge: string; side: string },
    topCenter: { x: number; y: number },
    bodyBaseCenter: { x: number; y: number },
    halfWidth: number,
    topHeight: number
  ): void {
    context.beginPath();
    context.moveTo(topCenter.x, topCenter.y - topHeight);
    context.lineTo(topCenter.x + halfWidth, topCenter.y);
    context.lineTo(bodyBaseCenter.x, bodyBaseCenter.y + topHeight * 0.45);
    context.lineTo(topCenter.x - halfWidth, topCenter.y);
    context.closePath();
    context.fillStyle = colors.side;
    context.fill();

    context.beginPath();
    context.moveTo(topCenter.x, topCenter.y - topHeight);
    context.lineTo(topCenter.x + halfWidth, topCenter.y - topHeight * 0.08);
    context.lineTo(topCenter.x, topCenter.y + topHeight * 0.88);
    context.lineTo(topCenter.x - halfWidth, topCenter.y - topHeight * 0.08);
    context.closePath();
    context.fillStyle = colors.fill;
    context.fill();
    context.strokeStyle = colors.edge;
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = "rgba(255, 255, 255, 0.26)";
    context.beginPath();
    context.moveTo(topCenter.x, topCenter.y - topHeight + 2);
    context.lineTo(topCenter.x + halfWidth * 0.45, topCenter.y - topHeight * 0.12);
    context.lineTo(topCenter.x, topCenter.y + topHeight * 0.2);
    context.closePath();
    context.fill();

    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.font = `600 ${Math.max(10, rewardBlock.radius)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(rewardBlock.label, topCenter.x, topCenter.y + 1);
  }

  private getRewardColors(
    rewardType: RewardBlock["rewardType"],
    config: RuntimeGameConfig
  ): { fill: string; edge: string; side: string } {
    if (rewardType === "gemReward") {
      return {
        fill: config.colors.rewardGemFill,
        edge: config.colors.rewardGemEdge,
        side: config.colors.rewardGemSide
      };
    }

    if (rewardType === "chestReward") {
      return {
        fill: config.colors.rewardChestFill,
        edge: config.colors.rewardChestEdge,
        side: config.colors.rewardChestSide
      };
    }

    return {
      fill: config.colors.rewardCoinFill,
      edge: config.colors.rewardCoinEdge,
      side: config.colors.rewardCoinSide
    };
  }
}
