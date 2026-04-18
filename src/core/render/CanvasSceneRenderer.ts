import { RuntimeGameConfig } from "../../data/gameConfig";
import { BoardItem } from "../../gameplay/entities/BoardItem";
import { Coin } from "../../gameplay/entities/Coin";
import { RewardBlock } from "../../gameplay/entities/RewardBlock";
import { Pusher } from "../../gameplay/entities/Pusher";
import { CoinRenderer } from "../../gameplay/renderers/CoinRenderer";
import { PusherRenderer } from "../../gameplay/renderers/PusherRenderer";
import { RewardBlockRenderer } from "../../gameplay/renderers/RewardBlockRenderer";
import { Pseudo3DProjector } from "./Pseudo3DProjector";

interface RectShape {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MachineGeometry {
  innerLeft: number;
  innerTop: number;
  innerRight: number;
  innerBottom: number;
  ceiling: RectShape;
  rearWall: RectShape;
  leftWall: RectShape;
  rightWall: RectShape;
  floor: RectShape;
  frontLip: RectShape;
  platformFrontFace: RectShape;
  blackDropSlot: RectShape;
  rewardSlot: RectShape;
  pusherOpening: RectShape;
  topSlot: RectShape;
}

export class CanvasSceneRenderer {
  private readonly coinRenderer = new CoinRenderer();
  private readonly rewardBlockRenderer = new RewardBlockRenderer();
  private readonly pusherRenderer = new PusherRenderer();
  private readonly projector: Pseudo3DProjector;

  constructor(private readonly config: RuntimeGameConfig) {
    this.projector = new Pseudo3DProjector(config);
  }

  render(
    context: CanvasRenderingContext2D,
    pusher: Pusher,
    items: BoardItem[]
  ): void {
    const geometry = this.getMachineGeometry();

    this.drawBackdrop(context);
    this.drawCabinetShell(context, geometry);
    this.drawMachineInterior(context, geometry);
    this.drawPusherOpeningLowerFrame(context, geometry);
    this.pusherRenderer.render(context, pusher, this.config, this.projector);
    this.drawPusherOpeningUpperFrame(context, geometry);

    const sortedItems = [...items].sort(
      (left, right) =>
        this.projector.getRenderSortKey(left) - this.projector.getRenderSortKey(right)
    );

    for (const item of sortedItems) {
      if (item instanceof RewardBlock) {
        this.rewardBlockRenderer.render(context, item, this.config, this.projector);
        continue;
      }

      if (item instanceof Coin) {
        this.coinRenderer.render(context, item, this.config, this.projector);
      }
    }

    this.drawGlassFrame(context, geometry);
  }

  private drawBackdrop(context: CanvasRenderingContext2D): void {
    const gradient = context.createLinearGradient(0, 0, 0, this.config.screen.height);
    gradient.addColorStop(0, "#050a12");
    gradient.addColorStop(0.36, "#0b1423");
    gradient.addColorStop(0.72, "#0d1728");
    gradient.addColorStop(1, "#04070d");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.config.screen.width, this.config.screen.height);

    context.fillStyle = "rgba(96, 165, 250, 0.08)";
    context.fillRect(
      this.config.table.left - 8,
      this.config.table.top - 32,
      this.config.table.width + 16,
      this.config.table.height + 72
    );
  }

  private drawCabinetShell(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    const marqueeHeight = 42;
    const marqueeX = this.config.table.left + 28;
    const marqueeWidth = this.config.table.width - 56;
    const marqueeY = this.config.table.top - marqueeHeight + 8;
    const trayHeight = 30;
    const trayWidth = this.config.table.width - 54;
    const trayX = this.config.pseudo3d.centerX - trayWidth / 2;
    const trayY = this.config.table.bottom + 14;

    context.fillStyle = this.config.colors.cabinetShadow;
    context.fillRect(
      this.config.table.left + 8,
      this.config.table.top + 8,
      this.config.table.width,
      this.config.table.height + 8
    );

    context.fillStyle = "#14336f";
    context.fillRect(
      this.config.table.left,
      this.config.table.top,
      this.config.table.width,
      this.config.table.height
    );

    context.fillStyle = "#29539c";
    context.fillRect(marqueeX + 4, marqueeY + 4, marqueeWidth, marqueeHeight);
    context.fillStyle = "#1c3e84";
    context.fillRect(marqueeX, marqueeY, marqueeWidth, marqueeHeight);
    context.fillStyle = "rgba(255, 255, 255, 0.18)";
    context.fillRect(marqueeX + 8, marqueeY + 6, marqueeWidth - 16, 6);

    context.fillStyle = "#10284f";
    context.fillRect(
      geometry.innerLeft - 6,
      geometry.innerTop - 6,
      geometry.innerRight - geometry.innerLeft + 12,
      geometry.innerBottom - geometry.innerTop + 12
    );

    context.fillStyle = "#d5e2f7";
    context.fillRect(
      geometry.innerLeft,
      geometry.innerTop,
      geometry.innerRight - geometry.innerLeft,
      geometry.innerBottom - geometry.innerTop
    );

    context.strokeStyle = "#8db2ea";
    context.lineWidth = 3;
    context.strokeRect(
      this.config.table.left,
      this.config.table.top,
      this.config.table.width,
      this.config.table.height
    );

    context.fillStyle = "#17386f";
    context.fillRect(trayX + 4, trayY + 4, trayWidth, trayHeight);
    context.fillStyle = "#0e2247";
    context.fillRect(trayX, trayY, trayWidth, trayHeight);
    context.fillStyle = "#050b16";
    context.fillRect(trayX + 10, trayY + 8, trayWidth - 20, trayHeight - 12);
    context.strokeStyle = "#7da3df";
    context.lineWidth = 2;
    context.strokeRect(trayX, trayY, trayWidth, trayHeight);
  }

  private drawMachineInterior(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    const ceilingGradient = context.createLinearGradient(
      0,
      geometry.ceiling.y,
      0,
      geometry.ceiling.y + geometry.ceiling.height
    );
    ceilingGradient.addColorStop(0, "#d8e3f5");
    ceilingGradient.addColorStop(1, "#a7b8d1");
    context.fillStyle = ceilingGradient;
    context.fillRect(
      geometry.ceiling.x,
      geometry.ceiling.y,
      geometry.ceiling.width,
      geometry.ceiling.height
    );

    const rearGradient = context.createLinearGradient(
      0,
      geometry.rearWall.y,
      0,
      geometry.rearWall.y + geometry.rearWall.height
    );
    rearGradient.addColorStop(0, "#edf4ff");
    rearGradient.addColorStop(0.62, "#d8e4f5");
    rearGradient.addColorStop(1, "#c7d6ea");
    context.fillStyle = rearGradient;
    context.fillRect(
      geometry.rearWall.x,
      geometry.rearWall.y,
      geometry.rearWall.width,
      geometry.rearWall.height
    );

    const leftWallGradient = context.createLinearGradient(
      geometry.leftWall.x,
      0,
      geometry.leftWall.x + geometry.leftWall.width,
      0
    );
    leftWallGradient.addColorStop(0, "#90a8c7");
    leftWallGradient.addColorStop(1, "#d0ddef");
    context.fillStyle = leftWallGradient;
    context.fillRect(
      geometry.leftWall.x,
      geometry.leftWall.y,
      geometry.leftWall.width,
      geometry.leftWall.height
    );

    const rightWallGradient = context.createLinearGradient(
      geometry.rightWall.x,
      0,
      geometry.rightWall.x + geometry.rightWall.width,
      0
    );
    rightWallGradient.addColorStop(0, "#d2def0");
    rightWallGradient.addColorStop(1, "#8ea7c8");
    context.fillStyle = rightWallGradient;
    context.fillRect(
      geometry.rightWall.x,
      geometry.rightWall.y,
      geometry.rightWall.width,
      geometry.rightWall.height
    );

    const floorGradient = context.createLinearGradient(
      0,
      geometry.floor.y,
      0,
      geometry.floor.y + geometry.floor.height
    );
    floorGradient.addColorStop(0, "#e2ebf7");
    floorGradient.addColorStop(0.5, "#d4dfef");
    floorGradient.addColorStop(1, "#bccbdd");
    context.fillStyle = floorGradient;
    context.fillRect(
      geometry.floor.x,
      geometry.floor.y,
      geometry.floor.width,
      geometry.floor.height
    );

    context.fillStyle = "rgba(15, 23, 42, 0.08)";
    context.fillRect(geometry.floor.x, geometry.floor.y, 6, geometry.floor.height);
    context.fillRect(
      geometry.floor.x + geometry.floor.width - 6,
      geometry.floor.y,
      6,
      geometry.floor.height
    );

    context.strokeStyle = "rgba(99, 116, 139, 0.3)";
    context.lineWidth = 1.5;
    const grooveCount = 4;
    for (let index = 1; index <= grooveCount; index += 1) {
      const y = geometry.floor.y + (geometry.floor.height / (grooveCount + 1)) * index;
      context.beginPath();
      context.moveTo(geometry.floor.x + 10, y);
      context.lineTo(geometry.floor.x + geometry.floor.width - 10, y);
      context.stroke();
    }

    context.fillStyle = "#0f1a2b";
    context.fillRect(
      geometry.topSlot.x - 9,
      geometry.topSlot.y - 6,
      geometry.topSlot.width + 18,
      geometry.topSlot.height + 12
    );
    context.fillStyle = "#04070d";
    context.fillRect(
      geometry.topSlot.x,
      geometry.topSlot.y,
      geometry.topSlot.width,
      geometry.topSlot.height
    );
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(
      geometry.topSlot.x + 5,
      geometry.topSlot.y + 2,
      geometry.topSlot.width - 10,
      2
    );

    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(
      geometry.rearWall.x + 12,
      geometry.rearWall.y + 12,
      geometry.rearWall.width - 24,
      8
    );

    context.strokeStyle = "#7895bb";
    context.lineWidth = 2;
    context.strokeRect(
      geometry.ceiling.x,
      geometry.ceiling.y,
      geometry.ceiling.width,
      geometry.ceiling.height
    );
    context.strokeRect(
      geometry.rearWall.x,
      geometry.rearWall.y,
      geometry.rearWall.width,
      geometry.rearWall.height
    );
    context.strokeRect(
      geometry.leftWall.x,
      geometry.leftWall.y,
      geometry.leftWall.width,
      geometry.leftWall.height
    );
    context.strokeRect(
      geometry.rightWall.x,
      geometry.rightWall.y,
      geometry.rightWall.width,
      geometry.rightWall.height
    );

    this.drawFrontDropArea(context, geometry);
    this.drawPusherOpeningPocket(context, geometry);
  }

  private drawFrontDropArea(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    this.drawPlatformFrontFace(context, geometry.platformFrontFace);
    this.drawBlackDropSlot(context, geometry.blackDropSlot);
  }

  private drawPlatformFrontFace(
    context: CanvasRenderingContext2D,
    platformFrontFace: RectShape
  ): void {
    context.save();
    context.beginPath();
    context.rect(
      platformFrontFace.x,
      platformFrontFace.y,
      platformFrontFace.width,
      platformFrontFace.height
    );
    context.clip();

    const frontFaceGradient = context.createLinearGradient(
      0,
      platformFrontFace.y,
      0,
      platformFrontFace.y + platformFrontFace.height
    );
    frontFaceGradient.addColorStop(0, "#667589");
    frontFaceGradient.addColorStop(0.42, "#4f5d70");
    frontFaceGradient.addColorStop(1, "#313d4b");
    context.fillStyle = frontFaceGradient;
    context.fillRect(
      platformFrontFace.x,
      platformFrontFace.y,
      platformFrontFace.width,
      platformFrontFace.height
    );

    context.fillStyle = "rgba(255, 255, 255, 0.14)";
    context.fillRect(
      platformFrontFace.x,
      platformFrontFace.y,
      platformFrontFace.width,
      1
    );

    context.fillStyle = "rgba(15, 23, 42, 0.18)";
    context.fillRect(
      platformFrontFace.x,
      platformFrontFace.y + platformFrontFace.height - 3,
      platformFrontFace.width,
      3
    );

    context.strokeStyle = "#556577";
    context.lineWidth = 2;
    context.strokeRect(
      platformFrontFace.x + 1,
      platformFrontFace.y + 1,
      platformFrontFace.width - 2,
      platformFrontFace.height - 2
    );
    context.restore();
  }

  private drawBlackDropSlot(
    context: CanvasRenderingContext2D,
    blackDropSlot: RectShape
  ): void {
    context.save();
    context.beginPath();
    context.rect(
      blackDropSlot.x,
      blackDropSlot.y,
      blackDropSlot.width,
      blackDropSlot.height
    );
    context.clip();

    const slotGradient = context.createLinearGradient(
      0,
      blackDropSlot.y,
      0,
      blackDropSlot.y + blackDropSlot.height
    );
    slotGradient.addColorStop(0, "#101823");
    slotGradient.addColorStop(0.55, "#070c13");
    slotGradient.addColorStop(1, "#02050a");
    context.fillStyle = slotGradient;
    context.fillRect(
      blackDropSlot.x,
      blackDropSlot.y,
      blackDropSlot.width,
      blackDropSlot.height
    );

    const edgeWidth = 7;
    const leftEdgeGradient = context.createLinearGradient(
      blackDropSlot.x,
      0,
      blackDropSlot.x + edgeWidth,
      0
    );
    leftEdgeGradient.addColorStop(0, "#02050a");
    leftEdgeGradient.addColorStop(1, "#1a2431");
    context.fillStyle = leftEdgeGradient;
    context.fillRect(
      blackDropSlot.x,
      blackDropSlot.y,
      edgeWidth,
      blackDropSlot.height
    );

    const rightEdgeGradient = context.createLinearGradient(
      blackDropSlot.x + blackDropSlot.width - edgeWidth,
      0,
      blackDropSlot.x + blackDropSlot.width,
      0
    );
    rightEdgeGradient.addColorStop(0, "#1a2431");
    rightEdgeGradient.addColorStop(1, "#02050a");
    context.fillStyle = rightEdgeGradient;
    context.fillRect(
      blackDropSlot.x + blackDropSlot.width - edgeWidth,
      blackDropSlot.y,
      edgeWidth,
      blackDropSlot.height
    );

    context.fillStyle = "rgba(255, 255, 255, 0.08)";
    context.fillRect(
      blackDropSlot.x + 10,
      blackDropSlot.y + 3,
      blackDropSlot.width - 20,
      2
    );

    context.fillStyle = "rgba(15, 23, 42, 0.22)";
    context.fillRect(
      blackDropSlot.x,
      blackDropSlot.y + blackDropSlot.height - 3,
      blackDropSlot.width,
      3
    );

    context.strokeStyle = "#f8d264";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(this.config.machine.playfieldLeft + 12, this.config.table.dropLineY);
    context.lineTo(this.config.machine.playfieldRight - 12, this.config.table.dropLineY);
    context.stroke();

    context.strokeStyle = "#4f5f75";
    context.lineWidth = 2;
    context.strokeRect(
      blackDropSlot.x + 1,
      blackDropSlot.y + 1,
      blackDropSlot.width - 2,
      blackDropSlot.height - 2
    );
    context.restore();
  }

  private drawPusherOpeningPocket(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    const pocketGradient = context.createLinearGradient(
      0,
      geometry.pusherOpening.y,
      0,
      geometry.pusherOpening.y + geometry.pusherOpening.height
    );
    pocketGradient.addColorStop(0, "#03060c");
    pocketGradient.addColorStop(1, "#0b1320");
    context.fillStyle = pocketGradient;
    context.fillRect(
      geometry.pusherOpening.x,
      geometry.pusherOpening.y,
      geometry.pusherOpening.width,
      geometry.pusherOpening.height
    );

    context.fillStyle = "rgba(255, 255, 255, 0.08)";
    context.fillRect(
      geometry.pusherOpening.x + 6,
      geometry.pusherOpening.y + 3,
      geometry.pusherOpening.width - 12,
      3
    );

    context.fillStyle = "rgba(15, 23, 42, 0.16)";
    context.fillRect(
      geometry.pusherOpening.x + 8,
      geometry.pusherOpening.y + geometry.pusherOpening.height - 6,
      geometry.pusherOpening.width - 16,
      4
    );
  }

  private drawPusherOpeningLowerFrame(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    const thresholdY = geometry.pusherOpening.y + geometry.pusherOpening.height - 4;

    context.fillStyle = "#b9c9dd";
    context.fillRect(
      geometry.pusherOpening.x - 4,
      thresholdY,
      geometry.pusherOpening.width + 8,
      5
    );

    context.fillStyle = "rgba(15, 23, 42, 0.18)";
    context.fillRect(
      geometry.pusherOpening.x + 6,
      thresholdY + 1,
      geometry.pusherOpening.width - 12,
      2
    );
  }

  private drawPusherOpeningUpperFrame(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    context.fillStyle = "#b9c9dd";
    context.fillRect(
      geometry.pusherOpening.x - 6,
      geometry.pusherOpening.y - 4,
      geometry.pusherOpening.width + 12,
      5
    );

    context.fillRect(
      geometry.pusherOpening.x - 5,
      geometry.pusherOpening.y - 1,
      5,
      geometry.pusherOpening.height + 2
    );
    context.fillRect(
      geometry.pusherOpening.x + geometry.pusherOpening.width,
      geometry.pusherOpening.y - 1,
      5,
      geometry.pusherOpening.height + 2
    );

    context.strokeStyle = "#6f87a6";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(geometry.pusherOpening.x, geometry.pusherOpening.y + geometry.pusherOpening.height);
    context.lineTo(geometry.pusherOpening.x, geometry.pusherOpening.y);
    context.lineTo(
      geometry.pusherOpening.x + geometry.pusherOpening.width,
      geometry.pusherOpening.y
    );
    context.lineTo(
      geometry.pusherOpening.x + geometry.pusherOpening.width,
      geometry.pusherOpening.y + geometry.pusherOpening.height
    );
    context.stroke();
  }

  private drawGlassFrame(
    context: CanvasRenderingContext2D,
    geometry: MachineGeometry
  ): void {
    context.strokeStyle = "rgba(255, 255, 255, 0.22)";
    context.lineWidth = 2;
    context.strokeRect(
      geometry.innerLeft,
      geometry.innerTop,
      geometry.innerRight - geometry.innerLeft,
      geometry.innerBottom - geometry.innerTop
    );

    context.beginPath();
    context.moveTo(geometry.innerLeft + 10, geometry.innerTop + 12);
    context.lineTo(geometry.innerLeft + 10, geometry.innerBottom - 12);
    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 4;
    context.stroke();

    context.beginPath();
    context.moveTo(geometry.innerLeft + 18, geometry.innerTop + 10);
    context.lineTo(geometry.innerRight - 18, geometry.innerTop + 10);
    context.strokeStyle = "rgba(255, 255, 255, 0.06)";
    context.lineWidth = 3;
    context.stroke();
  }

  private getMachineGeometry(): MachineGeometry {
    const innerLeft = this.config.machine.innerLeft;
    const innerTop = this.config.machine.innerTop;
    const innerRight = this.config.machine.innerRight;
    const innerBottom = this.config.machine.innerBottom;
    const sideWallWidth = this.config.machine.wallThickness;
    const ceilingHeight = 26;
    const rearWallTop = this.config.machine.rearWallTop;
    const floorX = this.config.machine.playfieldLeft;
    const floorWidth = this.config.machine.playfieldWidth;
    const openingWidth = this.config.machine.pusherOpeningWidth;
    const openingHeight = this.config.machine.pusherOpeningHeight;
    const frontFaceHeight = Math.max(
      9,
      Math.floor((this.config.table.rewardSlotTop - this.config.table.frontLipTop) * 0.28)
    );

    return {
      innerLeft,
      innerTop,
      innerRight,
      innerBottom,
      ceiling: {
        x: floorX - 4,
        y: innerTop + 6,
        width: floorWidth + 8,
        height: ceilingHeight
      },
      rearWall: {
        x: floorX,
        y: rearWallTop,
        width: floorWidth,
        height: this.config.table.backWallY - rearWallTop
      },
      leftWall: {
        x: innerLeft,
        y: innerTop + 10,
        width: sideWallWidth,
        height: innerBottom - innerTop - 18
      },
      rightWall: {
        x: innerRight - sideWallWidth,
        y: innerTop + 10,
        width: sideWallWidth,
        height: innerBottom - innerTop - 18
      },
      floor: {
        x: floorX,
        y: this.config.table.backWallY,
        width: floorWidth,
        height: this.config.table.frontLipTop - this.config.table.backWallY
      },
      frontLip: {
        x: floorX + 6,
        y: this.config.table.frontLipTop,
        width: floorWidth - 12,
        height: this.config.table.rewardSlotTop - this.config.table.frontLipTop
      },
      platformFrontFace: {
        x: floorX,
        y: this.config.table.frontLipTop,
        width: floorWidth,
        height: frontFaceHeight
      },
      blackDropSlot: {
        x: floorX + 6,
        y: this.config.table.frontLipTop + frontFaceHeight,
        width: floorWidth - 12,
        height: this.config.table.rewardSlotTop - this.config.table.frontLipTop - frontFaceHeight
      },
      rewardSlot: {
        x: floorX + 8,
        y: this.config.table.rewardSlotTop,
        width: floorWidth - 16,
        height: this.config.table.rewardSlotHeight
      },
      pusherOpening: {
        x: this.config.pseudo3d.centerX - openingWidth / 2,
        y: this.config.machine.pusherOpeningY,
        width: openingWidth,
        height: openingHeight
      },
      topSlot: {
        x: this.config.pseudo3d.centerX - 34,
        y: innerTop + 13,
        width: 68,
        height: 7
      }
    };
  }
}
