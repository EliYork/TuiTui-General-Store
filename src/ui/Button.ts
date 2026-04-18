import { RuntimeGameConfig } from "../data/gameConfig";
import { Point, Rect, pointInRect } from "../utils/math";

type ButtonConfig = RuntimeGameConfig["ui"]["coinButton"];
type ButtonColors = Pick<
  RuntimeGameConfig["colors"],
  "buttonFill" | "buttonEdge" | "buttonText"
>;

export class Button {
  constructor(
    private readonly config: ButtonConfig,
    private readonly colors: ButtonColors,
    private readonly onPress: () => void
  ) {}

  handleTouch(point: Point): boolean {
    if (!pointInRect(point, this.getBounds())) {
      return false;
    }

    this.onPress();
    return true;
  }

  render(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds();
    this.drawRoundedRect(context, bounds, this.config.radius);

    context.fillStyle = this.colors.buttonFill;
    context.fill();

    context.strokeStyle = this.colors.buttonEdge;
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle = this.colors.buttonText;
    context.font = `600 ${this.config.fontSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      this.config.label,
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    );
  }

  private getBounds(): Rect {
    return {
      x: this.config.x,
      y: this.config.y,
      width: this.config.width,
      height: this.config.height
    };
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    bounds: Rect,
    radius: number
  ): void {
    const safeRadius = Math.min(radius, bounds.width / 2, bounds.height / 2);

    context.beginPath();
    context.moveTo(bounds.x + safeRadius, bounds.y);
    context.lineTo(bounds.x + bounds.width - safeRadius, bounds.y);
    context.quadraticCurveTo(
      bounds.x + bounds.width,
      bounds.y,
      bounds.x + bounds.width,
      bounds.y + safeRadius
    );
    context.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - safeRadius);
    context.quadraticCurveTo(
      bounds.x + bounds.width,
      bounds.y + bounds.height,
      bounds.x + bounds.width - safeRadius,
      bounds.y + bounds.height
    );
    context.lineTo(bounds.x + safeRadius, bounds.y + bounds.height);
    context.quadraticCurveTo(
      bounds.x,
      bounds.y + bounds.height,
      bounds.x,
      bounds.y + bounds.height - safeRadius
    );
    context.lineTo(bounds.x, bounds.y + safeRadius);
    context.quadraticCurveTo(bounds.x, bounds.y, bounds.x + safeRadius, bounds.y);
    context.closePath();
  }
}
