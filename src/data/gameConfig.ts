import { RewardBlockType } from "../gameplay/entities/RewardBlock";
import { Size } from "../utils/math";

export type RenderMode = "legacy2d" | "prototype3d";

interface RewardTypeConfig {
  type: RewardBlockType;
  weight: number;
  rewardAmount: number;
  radius: number;
  label: string;
  feedbackLabel: string;
  stackLevel: number;
}

export interface RuntimeGameConfig {
  renderMode: RenderMode;
  screen: Size;
  colors: {
    background: string;
    backgroundGlow: string;
    cabinet: string;
    cabinetShadow: string;
    cabinetInner: string;
    tableBackWall: string;
    tableBackWallGlow: string;
    sideWall: string;
    sideWallDark: string;
    boardSurfaceTop: string;
    boardSurfaceBottom: string;
    boardRail: string;
    spawnLane: string;
    spawnLaneShadow: string;
    spawnLaneGlow: string;
    coinSlotPanel: string;
    coinSlotEdge: string;
    coinSlotOpening: string;
    coinSlotChute: string;
    pusherZone: string;
    stackZone: string;
    dropZone: string;
    floor: string;
    pusher: string;
    pusherEdge: string;
    pusherSide: string;
    coinFill: string;
    coinEdge: string;
    coinSide: string;
    coinShadow: string;
    rewardCoinFill: string;
    rewardCoinEdge: string;
    rewardCoinSide: string;
    rewardGemFill: string;
    rewardGemEdge: string;
    rewardGemSide: string;
    rewardChestFill: string;
    rewardChestEdge: string;
    rewardChestSide: string;
    textPrimary: string;
    textSecondary: string;
    hudPanel: string;
    buttonFill: string;
    buttonEdge: string;
    buttonText: string;
    dropLine: string;
    slotDark: string;
    slotEdge: string;
    feedbackFlash: string;
    feedbackGold: string;
    feedbackGem: string;
    feedbackChest: string;
    feedbackCombo: string;
  };
  table: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
    innerPadding: number;
    spawnLaneX: number;
    spawnLaneWidth: number;
    spawnLaneTop: number;
    spawnLaneHeight: number;
    backWallY: number;
    pusherZoneTop: number;
    pusherZoneBottom: number;
    stackZoneTop: number;
    stackZoneBottom: number;
    frontLipTop: number;
    dropLineY: number;
    rewardSlotTop: number;
    rewardSlotHeight: number;
  };
  machine: {
    innerLeft: number;
    innerTop: number;
    innerRight: number;
    innerBottom: number;
    wallThickness: number;
    rearWallTop: number;
    playfieldLeft: number;
    playfieldRight: number;
    playfieldWidth: number;
    pusherOpeningWidth: number;
    pusherOpeningHeight: number;
    pusherOpeningY: number;
  };
  coinSlot: {
    panelX: number;
    panelY: number;
    panelWidth: number;
    panelHeight: number;
    openingX: number;
    openingY: number;
    openingWidth: number;
    openingHeight: number;
    exitWidth: number;
    exitDepth: number;
    exitHeight: number;
  };
  threeD: {
    viewport: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    camera: {
      positionX: number;
      positionY: number;
      positionZ: number;
      targetX: number;
      targetY: number;
      targetZ: number;
      fovDegrees: number;
      near: number;
    };
    light: {
      directionX: number;
      directionY: number;
      directionZ: number;
      ambient: number;
      diffuse: number;
    };
    cabinet: {
      width: number;
      height: number;
      depth: number;
      wallThickness: number;
      ceilingThickness: number;
      platformFrontZ: number;
      dropWellDepth: number;
      rearOpeningWidth: number;
      rearOpeningHeight: number;
      rearOpeningInsetDepth: number;
    };
    pusher: {
      width: number;
      height: number;
      depth: number;
      retractFrontZ: number;
      extendFrontZ: number;
      baseY: number;
      cycleSeconds: number;
    };
  };
  pseudo3d: {
    centerX: number;
    depthStart: number;
    depthEnd: number;
    horizontalPerspectiveBack: number;
    horizontalPerspectiveFront: number;
    spriteScaleBack: number;
    spriteScaleFront: number;
    heightLiftFactor: number;
    stackHeightUnit: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowScaleY: number;
    coinEllipseRatio: number;
    rewardTopRatio: number;
    pusherRailInset: number;
    labelDepthOffset: number;
  };
  pusher: {
    x: number;
    backY: number;
    frontY: number;
    width: number;
    height: number;
    thickness: number;
    cycleSeconds: number;
    hiddenDepth: number;
  };
  coin: {
    spawnX: number;
    spawnDepth: number;
    spawnSpreadX: number;
    radius: number;
    spawnHeightMin: number;
    spawnHeightMax: number;
    spawnHeightVelocityMin: number;
    spawnHeightVelocityMax: number;
    initialSpeedXMin: number;
    initialSpeedXMax: number;
    initialSpeedYMin: number;
    initialSpeedYMax: number;
    maxSpeedX: number;
    maxSpeedY: number;
    maxVisible: number;
    stackLevel: number;
  };
  reward: {
    initialCount: number;
    targetCount: number;
    maxVisible: number;
    replenishIntervalSeconds: number;
    spawnAttempts: number;
    spawnPadding: number;
    initialSpeedXMin: number;
    initialSpeedXMax: number;
    initialSpeedYMin: number;
    initialSpeedYMax: number;
    spawnArea: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    types: Record<RewardBlockType, RewardTypeConfig>;
  };
  combo: {
    windowSeconds: number;
    bonusPerExtra: number;
    maxBonus: number;
  };
  physics: {
    leftWallX: number;
    rightWallX: number;
    backWallY: number;
    dropLineY: number;
    maxSpeedX: number;
    maxSpeedY: number;
    linearDamping: number;
    maxStepSeconds: number;
    separationIterations: number;
    pairBounce: number;
    pushVelocityTransfer: number;
    pushSeparationBias: number;
    restThreshold: number;
    heightGravity: number;
    maxHeightVelocity: number;
    airborneCollisionHeight: number;
    dropResolveHeight: number;
    stackHeightUnit: number;
    supportSearchRadiusScale: number;
    supportDepthTolerance: number;
    maxStackLevel: number;
    pusherSupportHeight: number;
    supportRelaxationPerSecond: number;
  };
  ui: {
    hud: {
      x: number;
      y: number;
      lineHeight: number;
      titleFontSize: number;
      bodyFontSize: number;
      panelWidth: number;
      panelHeight: number;
    };
    hintText: {
      x: number;
      y: number;
      fontSize: number;
    };
    coinButton: {
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
      label: string;
      fontSize: number;
    };
    feedback: {
      floatFontSize: number;
      comboFontSize: number;
      floatDurationSeconds: number;
      comboDurationSeconds: number;
      floatRiseSpeed: number;
      floatSpacing: number;
      flashHeight: number;
      flashFadeSpeed: number;
      comboYOffset: number;
      maxFloatingTexts: number;
    };
  };
}

const DESIGN_SIZE = {
  width: 375,
  height: 667
};

const DEFAULT_RENDER_MODE: RenderMode = "prototype3d";

export function createGameConfig(screen: Size): RuntimeGameConfig {
  const scaleX = screen.width / DESIGN_SIZE.width;
  const scaleY = screen.height / DESIGN_SIZE.height;
  const sx = (value: number): number => Math.round(value * scaleX);
  const sy = (value: number): number => Math.round(value * scaleY);

  const tableLeft = sx(18);
  const tableRight = screen.width - sx(18);
  const tableTop = sy(82);
  const tableBottom = screen.height - sy(130);
  const tableInnerPadding = sx(12);
  const buttonWidth = sx(112);
  const buttonHeight = sy(52);
  const innerLeft = tableLeft + tableInnerPadding;
  const innerTop = tableTop + tableInnerPadding;
  const innerRight = tableRight - tableInnerPadding;
  const innerBottom = tableBottom - tableInnerPadding;
  const wallThickness = sx(24);

  const backWallY = tableTop + sy(122);
  const pusherBackY = backWallY + sy(10);
  const pusherFrontY = pusherBackY + sy(86);
  const frontLipTop = tableBottom - sy(90);
  const dropLineY = frontLipTop;
  const rewardSlotTop = frontLipTop + sy(36);
  const stackZoneTop = pusherFrontY + sy(18);
  const stackZoneBottom = frontLipTop;
  const rearWallTop = innerTop + sy(34);
  const playfieldLeft = innerLeft + wallThickness;
  const playfieldRight = innerRight - wallThickness;
  const playfieldWidth = playfieldRight - playfieldLeft;
  const pusherWidth = playfieldWidth - sx(4);
  const pusherHeight = sy(22);
  const pusherThickness = sy(11);
  const pusherOpeningWidth = pusherWidth + sx(12);
  const pusherOpeningHeight = pusherThickness + sy(10);
  const pusherOpeningY = backWallY - pusherOpeningHeight + sy(4);
  const slotPanelWidth = sx(118);
  const slotPanelHeight = sy(30);
  const slotOpeningWidth = sx(54);
  const slotOpeningHeight = sy(9);
  const slotPanelX = screen.width / 2 - slotPanelWidth / 2;
  const slotPanelY = sy(34);
  const slotOpeningX = screen.width / 2 - slotOpeningWidth / 2;
  const slotOpeningY = slotPanelY + sy(10);
  const slotExitDepth = backWallY + sy(8);
  const slotExitHeight = sy(74);
  const threeDViewportX = tableLeft;
  const threeDViewportY = tableTop + sy(6);
  const threeDViewportWidth = tableRight - tableLeft;
  const threeDViewportHeight = tableBottom - threeDViewportY + sy(18);
  const threeDCabinetWidth = Math.max(playfieldWidth + sx(8), sx(178));
  const threeDCabinetHeight = sy(132);
  const threeDCabinetDepth = sy(190);
  const threeDWallThickness = sx(12);
  const threeDCeilingThickness = sy(8);
  const threeDPlatformFrontZ = sy(50);
  const threeDDropWellDepth = sy(40);
  const threeDPusherWidth = threeDCabinetWidth - threeDWallThickness * 2 - sx(6);
  const threeDPusherHeight = sy(18);
  const threeDPusherDepth = sy(92);
  const threeDRearOpeningWidth = threeDPusherWidth + sx(12);
  const threeDRearOpeningHeight = threeDPusherHeight + sy(12);
  const threeDRearOpeningInsetDepth = sy(28);
  const threeDPusherRetractFrontZ = threeDCabinetDepth - threeDPusherDepth + sy(6);
  const threeDPusherExtendFrontZ = threeDPlatformFrontZ + sy(20);

  return {
    renderMode: DEFAULT_RENDER_MODE,
    screen,
    colors: {
      background: "#09111d",
      backgroundGlow: "#12233f",
      cabinet: "#133a87",
      cabinetShadow: "#081c47",
      cabinetInner: "#dce9fb",
      tableBackWall: "#bcd2f7",
      tableBackWallGlow: "rgba(255, 255, 255, 0.24)",
      sideWall: "#c8daf8",
      sideWallDark: "#97b7eb",
      boardSurfaceTop: "#edf5ff",
      boardSurfaceBottom: "#d6e4fb",
      boardRail: "#7da3df",
      spawnLane: "#a3afc4",
      spawnLaneShadow: "#475569",
      spawnLaneGlow: "rgba(255, 255, 255, 0.3)",
      coinSlotPanel: "#dde6f7",
      coinSlotEdge: "#64748b",
      coinSlotOpening: "#0f172a",
      coinSlotChute: "#c7d6ef",
      pusherZone: "rgba(249, 115, 22, 0.12)",
      stackZone: "rgba(59, 130, 246, 0.08)",
      dropZone: "rgba(239, 68, 68, 0.14)",
      floor: "#c7d6ef",
      pusher: "#fb923c",
      pusherEdge: "#7c2d12",
      pusherSide: "#c2410c",
      coinFill: "#facc15",
      coinEdge: "#854d0e",
      coinSide: "#ca8a04",
      coinShadow: "rgba(15, 23, 42, 0.22)",
      rewardCoinFill: "#f59e0b",
      rewardCoinEdge: "#92400e",
      rewardCoinSide: "#b45309",
      rewardGemFill: "#22d3ee",
      rewardGemEdge: "#0f766e",
      rewardGemSide: "#0891b2",
      rewardChestFill: "#a855f7",
      rewardChestEdge: "#6b21a8",
      rewardChestSide: "#7e22ce",
      textPrimary: "#ffffff",
      textSecondary: "#dbeafe",
      hudPanel: "rgba(15, 23, 42, 0.56)",
      buttonFill: "#22c55e",
      buttonEdge: "#166534",
      buttonText: "#052e16",
      dropLine: "#ef4444",
      slotDark: "#0b1220",
      slotEdge: "#64748b",
      feedbackFlash: "#fde68a",
      feedbackGold: "#fde047",
      feedbackGem: "#67e8f9",
      feedbackChest: "#d8b4fe",
      feedbackCombo: "#fb7185"
    },
    table: {
      left: tableLeft,
      right: tableRight,
      top: tableTop,
      bottom: tableBottom,
      width: tableRight - tableLeft,
      height: tableBottom - tableTop,
      innerPadding: tableInnerPadding,
      spawnLaneX: screen.width / 2 - sx(18),
      spawnLaneWidth: sx(36),
      spawnLaneTop: sy(22),
      spawnLaneHeight: backWallY - sy(6),
      backWallY,
      pusherZoneTop: pusherBackY - sy(28),
      pusherZoneBottom: pusherFrontY + sy(26),
      stackZoneTop,
      stackZoneBottom,
      frontLipTop,
      dropLineY,
      rewardSlotTop,
      rewardSlotHeight: sy(32)
    },
    machine: {
      innerLeft,
      innerTop,
      innerRight,
      innerBottom,
      wallThickness,
      rearWallTop,
      playfieldLeft,
      playfieldRight,
      playfieldWidth,
      pusherOpeningWidth,
      pusherOpeningHeight,
      pusherOpeningY
    },
    coinSlot: {
      panelX: slotPanelX,
      panelY: slotPanelY,
      panelWidth: slotPanelWidth,
      panelHeight: slotPanelHeight,
      openingX: slotOpeningX,
      openingY: slotOpeningY,
      openingWidth: slotOpeningWidth,
      openingHeight: slotOpeningHeight,
      exitWidth: sx(26),
      exitDepth: slotExitDepth,
      exitHeight: slotExitHeight
    },
    threeD: {
      viewport: {
        x: threeDViewportX,
        y: threeDViewportY,
        width: threeDViewportWidth,
        height: threeDViewportHeight
      },
      camera: {
        positionX: 0,
        positionY: threeDCabinetHeight * 0.85,
        positionZ: -threeDCabinetDepth * 2.9,
        targetX: 0,
        targetY: threeDCabinetHeight * 0.06,
        targetZ: threeDCabinetDepth * 0.62,
        fovDegrees: 29,
        near: 1
      },
      light: {
        directionX: -0.14,
        directionY: 0.96,
        directionZ: -0.22,
        ambient: 0.93,
        diffuse: 0.07
      },
      cabinet: {
        width: threeDCabinetWidth,
        height: threeDCabinetHeight,
        depth: threeDCabinetDepth,
        wallThickness: threeDWallThickness,
        ceilingThickness: threeDCeilingThickness,
        platformFrontZ: threeDPlatformFrontZ,
        dropWellDepth: threeDDropWellDepth,
        rearOpeningWidth: threeDRearOpeningWidth,
        rearOpeningHeight: threeDRearOpeningHeight,
        rearOpeningInsetDepth: threeDRearOpeningInsetDepth
      },
      pusher: {
        width: threeDPusherWidth,
        height: threeDPusherHeight,
        depth: threeDPusherDepth,
        retractFrontZ: threeDPusherRetractFrontZ,
        extendFrontZ: threeDPusherExtendFrontZ,
        baseY: 0,
        cycleSeconds: 2
      }
    },
    pseudo3d: {
      centerX: screen.width / 2,
      depthStart: backWallY,
      depthEnd: rewardSlotTop,
      horizontalPerspectiveBack: 0.975,
      horizontalPerspectiveFront: 1,
      spriteScaleBack: 0.97,
      spriteScaleFront: 1.02,
      heightLiftFactor: 0.96,
      stackHeightUnit: sy(5),
      shadowOffsetX: sx(6),
      shadowOffsetY: sy(8),
      shadowScaleY: 0.34,
      coinEllipseRatio: 0.68,
      rewardTopRatio: 0.84,
      pusherRailInset: sx(18),
      labelDepthOffset: sy(12)
    },
    pusher: {
      x: screen.width / 2,
      backY: pusherBackY,
      frontY: pusherFrontY,
      width: pusherWidth,
      height: pusherHeight,
      thickness: pusherThickness,
      cycleSeconds: 2,
      hiddenDepth: pusherFrontY - pusherBackY + sy(20)
    },
    coin: {
      spawnX: screen.width / 2,
      spawnDepth: slotExitDepth,
      spawnSpreadX: sx(6),
      radius: Math.max(8, sx(10)),
      spawnHeightMin: sy(68),
      spawnHeightMax: sy(88),
      spawnHeightVelocityMin: -sy(12),
      spawnHeightVelocityMax: -sy(4),
      initialSpeedXMin: -sx(3),
      initialSpeedXMax: sx(3),
      initialSpeedYMin: sy(10),
      initialSpeedYMax: sy(20),
      maxSpeedX: sx(120),
      maxSpeedY: sy(360),
      maxVisible: 36,
      stackLevel: 1
    },
    reward: {
      initialCount: 4,
      targetCount: 4,
      maxVisible: 6,
      replenishIntervalSeconds: 5,
      spawnAttempts: 18,
      spawnPadding: sx(6),
      initialSpeedXMin: -sx(6),
      initialSpeedXMax: sx(6),
      initialSpeedYMin: sy(12),
      initialSpeedYMax: sy(22),
      spawnArea: {
        left: playfieldLeft + sx(18),
        right: playfieldRight - sx(18),
        top: stackZoneTop + sy(18),
        bottom: stackZoneBottom - sy(18)
      },
      types: {
        coinReward: {
          type: "coinReward",
          weight: 6,
          rewardAmount: 5,
          radius: sx(12),
          label: "$",
          feedbackLabel: "Coin",
          stackLevel: 2
        },
        gemReward: {
          type: "gemReward",
          weight: 3,
          rewardAmount: 15,
          radius: sx(12),
          label: "G",
          feedbackLabel: "Gem",
          stackLevel: 2
        },
        chestReward: {
          type: "chestReward",
          weight: 1,
          rewardAmount: 30,
          radius: sx(14),
          label: "B",
          feedbackLabel: "Chest",
          stackLevel: 3
        }
      }
    },
    combo: {
      windowSeconds: 1.6,
      bonusPerExtra: 1,
      maxBonus: 8
    },
    physics: {
      leftWallX: playfieldLeft,
      rightWallX: playfieldRight,
      backWallY,
      dropLineY,
      maxSpeedX: sx(120),
      maxSpeedY: sy(360),
      linearDamping: 1.4,
      maxStepSeconds: 1 / 90,
      separationIterations: 4,
      pairBounce: 0.08,
      pushVelocityTransfer: 0.92,
      pushSeparationBias: sy(2),
      restThreshold: sy(12),
      heightGravity: sy(380),
      maxHeightVelocity: sy(420),
      airborneCollisionHeight: sy(7),
      dropResolveHeight: sy(3),
      stackHeightUnit: sy(5),
      supportSearchRadiusScale: 0.9,
      supportDepthTolerance: sy(10),
      maxStackLevel: 3,
      pusherSupportHeight: sy(3),
      supportRelaxationPerSecond: sy(44)
    },
    ui: {
      hud: {
        x: tableLeft,
        y: sy(26),
        lineHeight: sy(20),
        titleFontSize: sy(18),
        bodyFontSize: sy(14),
        panelWidth: sx(258),
        panelHeight: sy(152)
      },
      hintText: {
        x: tableLeft,
        y: screen.height - sy(98),
        fontSize: sy(13)
      },
      coinButton: {
        x: screen.width - tableLeft - buttonWidth,
        y: screen.height - sy(82),
        width: buttonWidth,
        height: buttonHeight,
        radius: 14,
        label: "\u6295\u5e01",
        fontSize: sy(18)
      },
      feedback: {
        floatFontSize: sy(16),
        comboFontSize: sy(24),
        floatDurationSeconds: 1,
        comboDurationSeconds: 1.4,
        floatRiseSpeed: sy(26),
        floatSpacing: sx(42),
        flashHeight: sy(42),
        flashFadeSpeed: 2.8,
        comboYOffset: sy(44),
        maxFloatingTexts: 4
      }
    }
  };
}
