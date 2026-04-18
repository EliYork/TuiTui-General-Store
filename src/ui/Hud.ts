import { GameStateSnapshot } from "../core/GameState";
import { RuntimeGameConfig } from "../data/gameConfig";

type HudConfig = RuntimeGameConfig["ui"]["hud"];
type HintTextConfig = RuntimeGameConfig["ui"]["hintText"];
type HudColors = Pick<
  RuntimeGameConfig["colors"],
  "hudPanel" | "textPrimary" | "textSecondary"
>;

export class Hud {
  constructor(
    private readonly hudConfig: HudConfig,
    private readonly hintTextConfig: HintTextConfig,
    private readonly colors: HudColors
  ) {}

  render(context: CanvasRenderingContext2D, snapshot: GameStateSnapshot): void {
    context.fillStyle = this.colors.hudPanel;
    context.fillRect(
      this.hudConfig.x - 10,
      this.hudConfig.y - 24,
      this.hudConfig.panelWidth,
      this.hudConfig.panelHeight
    );

    context.fillStyle = this.colors.textPrimary;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = `600 ${this.hudConfig.titleFontSize}px sans-serif`;
    context.fillText(
      "2.5D \u63a8\u5e01\u673a / \u4f2a 3D \u9aa8\u67b6",
      this.hudConfig.x,
      this.hudConfig.y - 8
    );

    context.font = `${this.hudConfig.bodyFontSize}px sans-serif`;
    context.fillText(`\u91d1\u5e01: ${snapshot.gold}`, this.hudConfig.x, this.hudConfig.y + this.hudConfig.lineHeight);
    context.fillText(
      `\u573a\u4e0a\u786c\u5e01: ${snapshot.sceneCoinCount}`,
      this.hudConfig.x,
      this.hudConfig.y + this.hudConfig.lineHeight * 1.8
    );
    context.fillText(
      `\u573a\u4e0a\u5956\u52b1\u7269: ${snapshot.rewardBlockCount}`,
      this.hudConfig.x,
      this.hudConfig.y + this.hudConfig.lineHeight * 2.6
    );
    context.fillText(
      `\u5df2\u6295\u6570\u91cf: ${snapshot.totalSpawnedCoins}`,
      this.hudConfig.x,
      this.hudConfig.y + this.hudConfig.lineHeight * 3.4
    );
    context.fillText(
      `\u5df2\u6389\u843d: ${snapshot.droppedCoinCount}`,
      this.hudConfig.x,
      this.hudConfig.y + this.hudConfig.lineHeight * 4.2
    );
    context.fillText(
      `Combo: x${snapshot.comboCount}`,
      this.hudConfig.x,
      this.hudConfig.y + this.hudConfig.lineHeight * 5
    );

    context.fillStyle = this.colors.textSecondary;
    context.fillText(
      `Drop: ${snapshot.latestDropHint}`,
      this.hudConfig.x,
      this.hudConfig.y + this.hudConfig.lineHeight * 5.8
    );
    context.font = `${this.hintTextConfig.fontSize}px sans-serif`;
    context.fillText(snapshot.statusText, this.hintTextConfig.x, this.hintTextConfig.y);
  }
}
