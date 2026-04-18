import { RuntimeGameConfig } from "../../data/gameConfig";
import { CoinBody3D } from "../../gameplay3d/entities/CoinBody3D";
import { PusherRig3D } from "../../gameplay3d/PusherRig3D";
import { CoinMesh3D } from "./CoinMesh3D";
import { MachineCabinet3D } from "./MachineCabinet3D";
import { normalizeVec3, projectSurface3D, shadeHexColor, vec3 } from "./math3d";
import { PusherMesh3D } from "./PusherMesh3D";
import { Camera3D, DirectionalLight3D, ProjectedSurface3D, Viewport3D } from "./types";

export class SceneRenderer3D {
  private readonly cabinetMesh: MachineCabinet3D;
  private readonly coinMesh: CoinMesh3D;
  private readonly pusherMesh: PusherMesh3D;
  private readonly viewport: Viewport3D;
  private readonly camera: Camera3D;
  private readonly light: DirectionalLight3D;

  constructor(private readonly config: RuntimeGameConfig) {
    this.cabinetMesh = new MachineCabinet3D(config);
    this.coinMesh = new CoinMesh3D(config);
    this.pusherMesh = new PusherMesh3D(config);
    this.viewport = config.threeD.viewport;
    this.camera = {
      position: vec3(
        config.threeD.camera.positionX,
        config.threeD.camera.positionY,
        config.threeD.camera.positionZ
      ),
      target: vec3(
        config.threeD.camera.targetX,
        config.threeD.camera.targetY,
        config.threeD.camera.targetZ
      ),
      up: vec3(0, 1, 0),
      fovDegrees: config.threeD.camera.fovDegrees,
      near: config.threeD.camera.near
    };
    this.light = {
      direction: normalizeVec3(
        vec3(
          config.threeD.light.directionX,
          config.threeD.light.directionY,
          config.threeD.light.directionZ
        )
      ),
      ambient: config.threeD.light.ambient,
      diffuse: config.threeD.light.diffuse
    };
  }

  render(
    context: CanvasRenderingContext2D,
    pusher: PusherRig3D,
    coins: CoinBody3D[]
  ): void {
    const pusherState = pusher.getState();
    this.drawBackdrop(context);
    this.drawCabinetShell(context);

    context.save();
    context.beginPath();
    context.rect(
      this.viewport.x,
      this.viewport.y,
      this.viewport.width,
      this.viewport.height
    );
    context.clip();
    this.drawViewportAmbient(context);

    const surfaces = [
      ...this.cabinetMesh.buildSurfaces(),
      ...this.pusherMesh.buildSurfaces(pusherState),
      ...(this.config.threeD.debug3DPhysics
        ? this.pusherMesh.buildDebugSurfaces(pusherState)
        : []),
      ...this.coinMesh.buildSurfaces(coins)
    ];
    const projectedSurfaces = surfaces
      .map((surface) =>
        projectSurface3D(surface, this.camera, this.viewport, this.light)
      )
      .filter((surface): surface is ProjectedSurface3D => surface !== null)
      .sort((left, right) => {
        if (left.renderOrder !== right.renderOrder) {
          return left.renderOrder - right.renderOrder;
        }

        return right.depth - left.depth;
      });

    for (const surface of projectedSurfaces) {
      this.drawSurface(context, surface);
    }

    context.restore();
    if (this.config.threeD.debug3DPhysics) {
      this.drawDebugOverlay(context, pusherState, coins);
    }
    this.drawGlassFrame(context);
  }

  private drawBackdrop(context: CanvasRenderingContext2D): void {
    const gradient = context.createLinearGradient(0, 0, 0, this.config.screen.height);
    gradient.addColorStop(0, "#09111b");
    gradient.addColorStop(0.5, "#0c1726");
    gradient.addColorStop(1, "#09111a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.config.screen.width, this.config.screen.height);

    context.fillStyle = "rgba(88, 160, 255, 0.03)";
    context.fillRect(
      this.config.table.left - 8,
      this.config.table.top - 28,
      this.config.table.width + 16,
      this.config.table.height + 64
    );
  }

  private drawCabinetShell(context: CanvasRenderingContext2D): void {
    const shellX = this.config.table.left;
    const shellY = this.config.table.top - 8;
    const shellWidth = this.config.table.width;
    const shellHeight = this.config.table.height + 26;
    const marqueeHeight = 42;

    context.fillStyle = "rgba(8, 28, 71, 0.2)";
    context.fillRect(shellX + 8, shellY + 10, shellWidth, shellHeight);

    const shellGradient = context.createLinearGradient(0, shellY, 0, shellY + shellHeight);
    shellGradient.addColorStop(0, "#2752a1");
    shellGradient.addColorStop(1, "#153469");
    context.fillStyle = shellGradient;
    context.fillRect(shellX, shellY, shellWidth, shellHeight);

    context.fillStyle = "#1e3f7d";
    context.fillRect(shellX + 22, shellY - marqueeHeight + 12, shellWidth - 44, marqueeHeight);
    context.fillStyle = "rgba(255, 255, 255, 0.12)";
    context.fillRect(shellX + 30, shellY - marqueeHeight + 18, shellWidth - 60, 7);

    context.strokeStyle = "#7da3df";
    context.lineWidth = 3;
    context.strokeRect(shellX, shellY, shellWidth, shellHeight);
  }

  private drawViewportAmbient(context: CanvasRenderingContext2D): void {
    const gradient = context.createLinearGradient(
      0,
      this.viewport.y,
      0,
      this.viewport.y + this.viewport.height
    );
    gradient.addColorStop(0, "#eff5ff");
    gradient.addColorStop(0.56, "#dfe9f7");
    gradient.addColorStop(1, "#c5d3e6");
    context.fillStyle = gradient;
    context.fillRect(
      this.viewport.x,
      this.viewport.y,
      this.viewport.width,
      this.viewport.height
    );

    context.fillStyle = "rgba(255, 255, 255, 0.08)";
    context.fillRect(
      this.viewport.x + 10,
      this.viewport.y + 10,
      this.viewport.width - 20,
      8
    );
  }

  private drawGlassFrame(context: CanvasRenderingContext2D): void {
    context.strokeStyle = "rgba(255, 255, 255, 0.28)";
    context.lineWidth = 2;
    context.strokeRect(
      this.viewport.x,
      this.viewport.y,
      this.viewport.width,
      this.viewport.height
    );

    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(this.viewport.x + 12, this.viewport.y + 12);
    context.lineTo(this.viewport.x + 12, this.viewport.y + this.viewport.height - 12);
    context.stroke();

    context.strokeStyle = shadeHexColor(this.config.colors.slotEdge, 1.15);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(
      this.viewport.x + 16,
      this.viewport.y + this.viewport.height - 16
    );
    context.lineTo(
      this.viewport.x + this.viewport.width - 16,
      this.viewport.y + this.viewport.height - 16
    );
    context.stroke();
  }

  private drawSurface(
    context: CanvasRenderingContext2D,
    surface: ProjectedSurface3D
  ): void {
    context.save();
    context.globalAlpha = surface.opacity;
    context.beginPath();
    surface.points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
        return;
      }

      context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = surface.fillStyle;
    context.fill();

    if (surface.strokeStyle) {
      context.strokeStyle = surface.strokeStyle;
      context.lineWidth = 1.5;
      context.stroke();
    }

    context.restore();
  }

  private drawDebugOverlay(
    context: CanvasRenderingContext2D,
    pusherState: ReturnType<PusherRig3D["getState"]>,
    coins: CoinBody3D[]
  ): void {
    const groundedCount = coins.filter((coin) => coin.isGrounded).length;
    const sleepingCount = coins.filter((coin) => coin.isSleeping).length;
    const unstableCount = coins.filter((coin) => this.isCoinUnstable(coin)).length;
    const debugLines = [
      "DEBUG 3D PHYSICS",
      `coins ${coins.length}`,
      `grounded ${groundedCount}`,
      `sleeping ${sleepingCount}`,
      `unstable ${unstableCount}`,
      `rear support z ${pusherState.hiddenSupportFrontZ.toFixed(0)}..${pusherState.hiddenSupportBackZ.toFixed(0)}`
    ];

    context.save();
    context.fillStyle = "rgba(8, 16, 28, 0.72)";
    context.fillRect(this.viewport.x + 12, this.viewport.y + 12, 172, 92);
    context.strokeStyle = "rgba(74, 222, 128, 0.9)";
    context.lineWidth = 1.5;
    context.strokeRect(this.viewport.x + 12, this.viewport.y + 12, 172, 92);
    context.font = "12px monospace";
    context.textBaseline = "top";

    debugLines.forEach((line, index) => {
      context.fillStyle = index === 0 ? "#86efac" : "#e5f3ff";
      context.fillText(line, this.viewport.x + 20, this.viewport.y + 20 + index * 13);
    });

    context.fillStyle = "rgba(34, 197, 94, 0.9)";
    context.fillRect(this.viewport.x + 194, this.viewport.y + 20, 12, 12);
    context.fillStyle = "#e5f3ff";
    context.fillText("rear support", this.viewport.x + 212, this.viewport.y + 18);

    context.fillStyle = "#4ade80";
    context.fillRect(this.viewport.x + 194, this.viewport.y + 38, 12, 12);
    context.fillStyle = "#e5f3ff";
    context.fillText("sleeping", this.viewport.x + 212, this.viewport.y + 36);

    context.fillStyle = "#facc15";
    context.fillRect(this.viewport.x + 194, this.viewport.y + 56, 12, 12);
    context.fillStyle = "#e5f3ff";
    context.fillText("grounded", this.viewport.x + 212, this.viewport.y + 54);

    context.fillStyle = "#f87171";
    context.fillRect(this.viewport.x + 194, this.viewport.y + 74, 12, 12);
    context.fillStyle = "#e5f3ff";
    context.fillText("active/spinning", this.viewport.x + 212, this.viewport.y + 72);
    context.restore();
  }

  private isCoinUnstable(coin: CoinBody3D): boolean {
    if (coin.isSleeping) {
      return false;
    }

    const linearSpeed = Math.hypot(coin.velocity.x, coin.velocity.z);
    const angularSpeed = Math.hypot(
      coin.angularVelocity.x,
      coin.angularVelocity.y,
      coin.angularVelocity.z
    );
    return (
      !coin.isGrounded ||
      linearSpeed > this.config.physics3d.sleepLinearSpeed * 0.8 ||
      angularSpeed > this.config.physics3d.sleepAngularSpeed * 0.8
    );
  }
}
