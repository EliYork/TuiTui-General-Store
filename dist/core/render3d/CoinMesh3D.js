"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinMesh3D = void 0;
const math3d_1 = require("./math3d");
function createSurface(vertices, normal, color, strokeColor, renderOrder) {
    return {
        vertices,
        normal,
        color,
        strokeColor,
        renderOrder
    };
}
class CoinMesh3D {
    constructor(config) {
        this.config = config;
    }
    buildSurfaces(coins) {
        const surfaces = [];
        for (const coin of coins) {
            surfaces.push(...this.buildCoinSurfaces(coin));
        }
        return surfaces;
    }
    buildCoinSurfaces(coin) {
        const state = coin.getRenderState();
        const segmentCount = this.config.threeD.coin.sides;
        const halfThickness = state.thickness / 2;
        const capNormal = (0, math3d_1.normalizeVec3)(state.normal);
        const referenceAxis = Math.abs(capNormal.y) < 0.92 ? (0, math3d_1.vec3)(0, 1, 0) : (0, math3d_1.vec3)(1, 0, 0);
        const tangent = (0, math3d_1.normalizeVec3)((0, math3d_1.crossVec3)(referenceAxis, capNormal));
        const bitangent = (0, math3d_1.normalizeVec3)((0, math3d_1.crossVec3)(capNormal, tangent));
        const topCenter = (0, math3d_1.addVec3)(state.position, (0, math3d_1.scaleVec3)(capNormal, halfThickness));
        const bottomCenter = (0, math3d_1.addVec3)(state.position, (0, math3d_1.scaleVec3)(capNormal, -halfThickness));
        const topRing = [];
        const bottomRing = [];
        const surfaces = [];
        const capLayer = 18;
        const sideLayer = 18;
        const debugPalette = this.getCoinDebugPalette(coin);
        for (let index = 0; index < segmentCount; index += 1) {
            const angle = (index / segmentCount) * Math.PI * 2;
            const rimOffset = (0, math3d_1.addVec3)((0, math3d_1.scaleVec3)(tangent, Math.cos(angle) * state.radius), (0, math3d_1.scaleVec3)(bitangent, Math.sin(angle) * state.radius));
            topRing.push((0, math3d_1.addVec3)(topCenter, rimOffset));
            bottomRing.push((0, math3d_1.addVec3)(bottomCenter, rimOffset));
        }
        surfaces.push(createSurface(topRing, capNormal, debugPalette.fill, debugPalette.edge, capLayer));
        surfaces.push(createSurface([...bottomRing].reverse(), (0, math3d_1.scaleVec3)(capNormal, -1), debugPalette.fill, debugPalette.edge, capLayer));
        for (let index = 0; index < segmentCount; index += 1) {
            const nextIndex = (index + 1) % segmentCount;
            const currentTop = topRing[index];
            const nextTop = topRing[nextIndex];
            const currentBottom = bottomRing[index];
            const nextBottom = bottomRing[nextIndex];
            const rimNormal = (0, math3d_1.normalizeVec3)((0, math3d_1.addVec3)((0, math3d_1.scaleVec3)(tangent, Math.cos((index + 0.5) / segmentCount * Math.PI * 2)), (0, math3d_1.scaleVec3)(bitangent, Math.sin((index + 0.5) / segmentCount * Math.PI * 2))));
            surfaces.push(createSurface([currentBottom, nextBottom, nextTop, currentTop], rimNormal, debugPalette.side, debugPalette.edge, sideLayer));
        }
        return surfaces;
    }
    getCoinDebugPalette(coin) {
        if (!this.config.threeD.debug3DPhysics) {
            return {
                fill: this.config.colors.coinFill,
                side: this.config.colors.coinSide,
                edge: this.config.colors.coinEdge
            };
        }
        const linearSpeed = Math.hypot(coin.velocity.x, coin.velocity.z);
        const angularSpeed = Math.hypot(coin.angularVelocity.x, coin.angularVelocity.y, coin.angularVelocity.z);
        const isUnstable = !coin.isGrounded ||
            linearSpeed > this.config.physics3d.sleepLinearSpeed * 0.8 ||
            angularSpeed > this.config.physics3d.sleepAngularSpeed * 0.8;
        if (coin.isSleeping) {
            return {
                fill: "#4ade80",
                side: "#22c55e",
                edge: "#166534"
            };
        }
        if (isUnstable) {
            return {
                fill: "#f87171",
                side: "#ef4444",
                edge: "#7f1d1d"
            };
        }
        return {
            fill: "#facc15",
            side: "#eab308",
            edge: "#854d0e"
        };
    }
}
exports.CoinMesh3D = CoinMesh3D;
