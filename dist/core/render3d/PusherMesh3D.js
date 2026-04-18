"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PusherMesh3D = void 0;
const math3d_1 = require("./math3d");
function createQuad(vertices, normal, color, strokeColor, renderOrder) {
    return {
        vertices,
        normal,
        color,
        strokeColor,
        renderOrder
    };
}
class PusherMesh3D {
    constructor(config) {
        this.config = config;
    }
    buildSurfaces(state) {
        const halfWidth = state.width / 2;
        const frontZ = state.frontZ;
        const backZ = state.backZ;
        const concealedBackZ = backZ + this.config.threeD.cabinet.wallThickness * 2.2;
        const bottomY = state.baseY;
        const topY = bottomY + state.height;
        const concealedTopY = topY - this.config.threeD.cabinet.wallThickness * 0.16;
        const plateLayer = 18;
        const concealedPlateLayer = 12;
        const colors = this.config.colors;
        return [
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, concealedTopY, backZ),
                (0, math3d_1.vec3)(halfWidth, concealedTopY, backZ),
                (0, math3d_1.vec3)(halfWidth, concealedTopY, concealedBackZ),
                (0, math3d_1.vec3)(-halfWidth, concealedTopY, concealedBackZ)
            ], (0, math3d_1.vec3)(0, 1, 0), "#ce7e33", undefined, concealedPlateLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, bottomY, concealedBackZ),
                (0, math3d_1.vec3)(-halfWidth, bottomY, backZ),
                (0, math3d_1.vec3)(-halfWidth, concealedTopY, backZ),
                (0, math3d_1.vec3)(-halfWidth, concealedTopY, concealedBackZ)
            ], (0, math3d_1.vec3)(1, 0, 0), "#a35a22", undefined, concealedPlateLayer),
            createQuad([
                (0, math3d_1.vec3)(halfWidth, bottomY, backZ),
                (0, math3d_1.vec3)(halfWidth, bottomY, concealedBackZ),
                (0, math3d_1.vec3)(halfWidth, concealedTopY, concealedBackZ),
                (0, math3d_1.vec3)(halfWidth, concealedTopY, backZ)
            ], (0, math3d_1.vec3)(-1, 0, 0), "#9a5119", undefined, concealedPlateLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, topY, frontZ),
                (0, math3d_1.vec3)(halfWidth, topY, frontZ),
                (0, math3d_1.vec3)(halfWidth, topY, backZ),
                (0, math3d_1.vec3)(-halfWidth, topY, backZ)
            ], (0, math3d_1.vec3)(0, 1, 0), "#f4a454", colors.pusherEdge, plateLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, bottomY, frontZ),
                (0, math3d_1.vec3)(halfWidth, bottomY, frontZ),
                (0, math3d_1.vec3)(halfWidth, topY, frontZ),
                (0, math3d_1.vec3)(-halfWidth, topY, frontZ)
            ], (0, math3d_1.vec3)(0, 0, -1), "#ffbf7a", colors.pusherEdge, plateLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, bottomY, backZ),
                (0, math3d_1.vec3)(-halfWidth, bottomY, frontZ),
                (0, math3d_1.vec3)(-halfWidth, topY, frontZ),
                (0, math3d_1.vec3)(-halfWidth, topY, backZ)
            ], (0, math3d_1.vec3)(1, 0, 0), "#cb7024", colors.pusherEdge, plateLayer),
            createQuad([
                (0, math3d_1.vec3)(halfWidth, bottomY, frontZ),
                (0, math3d_1.vec3)(halfWidth, bottomY, backZ),
                (0, math3d_1.vec3)(halfWidth, topY, backZ),
                (0, math3d_1.vec3)(halfWidth, topY, frontZ)
            ], (0, math3d_1.vec3)(-1, 0, 0), "#c2681d", colors.pusherEdge, plateLayer),
            createQuad([
                (0, math3d_1.vec3)(-halfWidth, bottomY, backZ),
                (0, math3d_1.vec3)(halfWidth, bottomY, backZ),
                (0, math3d_1.vec3)(halfWidth, topY, backZ),
                (0, math3d_1.vec3)(-halfWidth, topY, backZ)
            ], (0, math3d_1.vec3)(0, 0, 1), "#8f4717", colors.pusherEdge, plateLayer - 1)
        ];
    }
}
exports.PusherMesh3D = PusherMesh3D;
