"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineCabinet3D = void 0;
const math3d_1 = require("./math3d");
function createQuad(vertices, normal, color, strokeColor, opacity, renderOrder) {
    return {
        vertices,
        normal,
        color,
        strokeColor,
        opacity,
        renderOrder
    };
}
class MachineCabinet3D {
    constructor(config) {
        this.config = config;
    }
    buildSurfaces() {
        const { cabinet } = this.config.threeD;
        const halfWidth = cabinet.width / 2;
        const height = cabinet.height;
        const depth = cabinet.depth;
        const openingHalfWidth = cabinet.rearOpeningWidth / 2;
        const openingHeight = cabinet.rearOpeningHeight;
        const openingShadowHalfWidth = Math.min(openingHalfWidth - cabinet.wallThickness * 0.12, this.config.threeD.pusher.width / 2 + cabinet.wallThickness * 0.2);
        const openingFrontZ = depth - cabinet.rearOpeningInsetDepth;
        const openingShadowZ = depth + cabinet.wallThickness * 1.3;
        const platformFrontZ = cabinet.platformFrontZ;
        const dropFloorY = -cabinet.dropWellDepth;
        const colors = this.config.colors;
        const dropSideLeftColor = (0, math3d_1.shadeHexColor)(colors.sideWall, 0.78);
        const dropSideRightColor = (0, math3d_1.shadeHexColor)(colors.sideWallDark, 0.82);
        const shellLayer = 0;
        const playfieldLayer = 8;
        const dropLayer = 10;
        const openingShadowLayer = 14;
        const openingLipLayer = 28;
        return [
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, height, 0),
                (0, math3d_1.vec3)(halfWidth, height, 0),
                (0, math3d_1.vec3)(halfWidth, height, depth),
                (0, math3d_1.vec3)(-halfWidth, height, depth)
            ], (0, math3d_1.vec3)(0, -1, 0), "#edf3ff", "#95a7c0", undefined, shellLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, 0, platformFrontZ),
                (0, math3d_1.vec3)(halfWidth, 0, platformFrontZ),
                (0, math3d_1.vec3)(halfWidth, 0, depth),
                (0, math3d_1.vec3)(-halfWidth, 0, depth)
            ], (0, math3d_1.vec3)(0, 1, 0), "#eef4ff", "#8ea0b8", undefined, playfieldLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, dropFloorY, 0),
                (0, math3d_1.vec3)(halfWidth, dropFloorY, 0),
                (0, math3d_1.vec3)(halfWidth, dropFloorY, platformFrontZ),
                (0, math3d_1.vec3)(-halfWidth, dropFloorY, platformFrontZ)
            ], (0, math3d_1.vec3)(0, 1, 0), "#0b1220", "#273545", undefined, dropLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, dropFloorY, platformFrontZ),
                (0, math3d_1.vec3)(halfWidth, dropFloorY, platformFrontZ),
                (0, math3d_1.vec3)(halfWidth, 0, platformFrontZ),
                (0, math3d_1.vec3)(-halfWidth, 0, platformFrontZ)
            ], (0, math3d_1.vec3)(0, 0, -1), "#59687b", "#74879e", undefined, dropLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, dropFloorY, 0),
                (0, math3d_1.vec3)(-halfWidth, dropFloorY, platformFrontZ),
                (0, math3d_1.vec3)(-halfWidth, 0, platformFrontZ),
                (0, math3d_1.vec3)(-halfWidth, 0, 0)
            ], (0, math3d_1.vec3)(1, 0, 0), dropSideLeftColor, "#7d95b6", undefined, dropLayer),
            createQuad([
                (0, math3d_1.vec3)(halfWidth, dropFloorY, platformFrontZ),
                (0, math3d_1.vec3)(halfWidth, dropFloorY, 0),
                (0, math3d_1.vec3)(halfWidth, 0, 0),
                (0, math3d_1.vec3)(halfWidth, 0, platformFrontZ)
            ], (0, math3d_1.vec3)(-1, 0, 0), dropSideRightColor, "#6d87aa", undefined, dropLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, 0, 0),
                (0, math3d_1.vec3)(-halfWidth, 0, depth),
                (0, math3d_1.vec3)(-halfWidth, height, depth),
                (0, math3d_1.vec3)(-halfWidth, height, 0)
            ], (0, math3d_1.vec3)(1, 0, 0), colors.sideWall, "#7f97b7", undefined, shellLayer),
            createQuad([
                (0, math3d_1.vec3)(halfWidth, 0, depth),
                (0, math3d_1.vec3)(halfWidth, 0, 0),
                (0, math3d_1.vec3)(halfWidth, height, 0),
                (0, math3d_1.vec3)(halfWidth, height, depth)
            ], (0, math3d_1.vec3)(-1, 0, 0), colors.sideWallDark, "#6d87aa", undefined, shellLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, 0, depth),
                (0, math3d_1.vec3)(-openingHalfWidth, 0, depth),
                (0, math3d_1.vec3)(-openingHalfWidth, height, depth),
                (0, math3d_1.vec3)(-halfWidth, height, depth)
            ], (0, math3d_1.vec3)(0, 0, -1), colors.tableBackWall, "#7b95b8", undefined, shellLayer),
            createQuad([
                (0, math3d_1.vec3)(openingHalfWidth, 0, depth),
                (0, math3d_1.vec3)(halfWidth, 0, depth),
                (0, math3d_1.vec3)(halfWidth, height, depth),
                (0, math3d_1.vec3)(openingHalfWidth, height, depth)
            ], (0, math3d_1.vec3)(0, 0, -1), colors.tableBackWall, "#7b95b8", undefined, shellLayer),
            createQuad([
                (0, math3d_1.vec3)(-openingHalfWidth, openingHeight, depth),
                (0, math3d_1.vec3)(openingHalfWidth, openingHeight, depth),
                (0, math3d_1.vec3)(openingHalfWidth, height, depth),
                (0, math3d_1.vec3)(-openingHalfWidth, height, depth)
            ], (0, math3d_1.vec3)(0, 0, -1), "#dce8f7", "#7b95b8", undefined, shellLayer),
            createQuad([
                (0, math3d_1.vec3)(-openingShadowHalfWidth, 0, openingShadowZ),
                (0, math3d_1.vec3)(openingShadowHalfWidth, 0, openingShadowZ),
                (0, math3d_1.vec3)(openingShadowHalfWidth, openingHeight, openingShadowZ),
                (0, math3d_1.vec3)(-openingShadowHalfWidth, openingHeight, openingShadowZ)
            ], (0, math3d_1.vec3)(0, 0, -1), "#152334", undefined, 0.82, openingShadowLayer),
            // A simple top lip is enough here; deep dark side walls read as two black bricks.
            createQuad([
                (0, math3d_1.vec3)(-openingHalfWidth, openingHeight, openingFrontZ),
                (0, math3d_1.vec3)(openingHalfWidth, openingHeight, openingFrontZ),
                (0, math3d_1.vec3)(openingHalfWidth, openingHeight, depth),
                (0, math3d_1.vec3)(-openingHalfWidth, openingHeight, depth)
            ], (0, math3d_1.vec3)(0, -1, 0), "#152230", "#26384b", undefined, openingLipLayer)
        ];
    }
}
exports.MachineCabinet3D = MachineCabinet3D;
