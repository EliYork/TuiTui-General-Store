import { RuntimeGameConfig } from "../data/gameConfig";
import { DroppedItemResult } from "../gameplay/entities/BoardItem";

interface FloatingText {
  text: string;
  x: number;
  y: number;
  ageSeconds: number;
  durationSeconds: number;
  color: string;
}

export interface DropFeedbackSummary {
  droppedItems: DroppedItemResult[];
  comboCount: number;
  comboBonus: number;
}

export class DropFeedbackOverlay {
  private readonly floatingTexts: FloatingText[] = [];
  private flashStrength = 0;
  private comboTimer = 0;
  private comboText = "";

  constructor(private readonly config: RuntimeGameConfig) {}

  update(deltaSeconds: number): void {
    for (let index = this.floatingTexts.length - 1; index >= 0; index -= 1) {
      const text = this.floatingTexts[index];
      text.ageSeconds += deltaSeconds;
      text.y -= this.config.ui.feedback.floatRiseSpeed * deltaSeconds;

      if (text.ageSeconds >= text.durationSeconds) {
        this.floatingTexts.splice(index, 1);
      }
    }

    this.flashStrength = Math.max(
      0,
      this.flashStrength - deltaSeconds * this.config.ui.feedback.flashFadeSpeed
    );
    this.comboTimer = Math.max(0, this.comboTimer - deltaSeconds);
  }

  push(summary: DropFeedbackSummary): void {
    const visibleItems = summary.droppedItems.slice(0, this.config.ui.feedback.maxFloatingTexts);
    const baseX = this.config.screen.width / 2;
    const spacing = this.config.ui.feedback.floatSpacing;

    visibleItems.forEach((item, index) => {
      const offset = (index - (visibleItems.length - 1) / 2) * spacing;
      this.floatingTexts.push({
        text: item.feedbackText,
        x: baseX + offset,
        y: this.config.table.rewardSlotTop - 8,
        ageSeconds: 0,
        durationSeconds: this.config.ui.feedback.floatDurationSeconds,
        color: this.getTextColor(item)
      });
    });

    if (summary.comboCount >= 2) {
      const bonusText =
        summary.comboBonus > 0 ? ` +${summary.comboBonus}` : "";
      this.comboText = `Combo x${summary.comboCount}${bonusText}`;
      this.comboTimer = this.config.ui.feedback.comboDurationSeconds;
    }

    this.flashStrength = 1;
  }

  render(context: CanvasRenderingContext2D): void {
    this.renderDropFlash(context);
    this.renderFloatingTexts(context);
    this.renderCombo(context);
  }

  private renderDropFlash(context: CanvasRenderingContext2D): void {
    if (this.flashStrength <= 0) {
      return;
    }

    context.save();
    context.globalAlpha = this.flashStrength * 0.36;
    context.fillStyle = this.config.colors.feedbackFlash;
    context.fillRect(
      this.config.table.left + this.config.table.innerPadding,
      this.config.table.rewardSlotTop - this.config.ui.feedback.flashHeight / 2,
      this.config.table.width - this.config.table.innerPadding * 2,
      this.config.ui.feedback.flashHeight
    );
    context.restore();
  }

  private renderFloatingTexts(context: CanvasRenderingContext2D): void {
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${this.config.ui.feedback.floatFontSize}px sans-serif`;

    for (const text of this.floatingTexts) {
      const alpha = 1 - text.ageSeconds / text.durationSeconds;
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = "rgba(15, 23, 42, 0.75)";
      context.fillText(text.text, text.x + 1, text.y + 1);
      context.fillStyle = text.color;
      context.fillText(text.text, text.x, text.y);
      context.restore();
    }
  }

  private renderCombo(context: CanvasRenderingContext2D): void {
    if (this.comboTimer <= 0) {
      return;
    }

    context.save();
    context.globalAlpha = Math.min(
      1,
      this.comboTimer / this.config.ui.feedback.comboDurationSeconds
    );
    context.font = `700 ${this.config.ui.feedback.comboFontSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(15, 23, 42, 0.76)";
    context.fillText(
      this.comboText,
      this.config.screen.width / 2 + 2,
      this.config.table.rewardSlotTop - this.config.ui.feedback.comboYOffset + 2
    );
    context.fillStyle = this.config.colors.feedbackCombo;
    context.fillText(
      this.comboText,
      this.config.screen.width / 2,
      this.config.table.rewardSlotTop - this.config.ui.feedback.comboYOffset
    );
    context.restore();
  }

  private getTextColor(item: DroppedItemResult): string {
    if (item.rewardType === "gemReward") {
      return this.config.colors.feedbackGem;
    }

    if (item.rewardType === "chestReward") {
      return this.config.colors.feedbackChest;
    }

    if (item.rewardType === "coinReward") {
      return this.config.colors.feedbackGold;
    }

    return this.config.colors.feedbackGold;
  }
}
