"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGameConfig = createGameConfig;
const DESIGN_SIZE = {
    width: 375,
    height: 667
};
function createGameConfig(screen) {
    const scaleX = screen.width / DESIGN_SIZE.width;
    const scaleY = screen.height / DESIGN_SIZE.height;
    const sx = (value) => Math.round(value * scaleX);
    const sy = (value) => Math.round(value * scaleY);
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
    return {
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
