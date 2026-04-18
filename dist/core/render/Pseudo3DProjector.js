"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pseudo3DProjector = void 0;
const math_1 = require("../../utils/math");
class Pseudo3DProjector {
    constructor(config) {
        this.config = config;
    }
    getDepthRatio(depth) {
        return (0, math_1.clamp)((depth - this.config.pseudo3d.depthStart) /
            Math.max(1, this.config.pseudo3d.depthEnd - this.config.pseudo3d.depthStart), 0, 1);
    }
    getRenderScaleByDepth(depth) {
        return (0, math_1.lerp)(this.config.pseudo3d.spriteScaleBack, this.config.pseudo3d.spriteScaleFront, this.getDepthRatio(depth));
    }
    getPerspectiveX(worldX, depth) {
        const horizontalFactor = (0, math_1.lerp)(this.config.pseudo3d.horizontalPerspectiveBack, this.config.pseudo3d.horizontalPerspectiveFront, this.getDepthRatio(depth));
        return (this.config.pseudo3d.centerX +
            (worldX - this.config.pseudo3d.centerX) * horizontalFactor);
    }
    getHeightLift(height, stackLevel, depth) {
        void stackLevel;
        const scale = this.getRenderScaleByDepth(depth);
        return (height * this.config.pseudo3d.heightLiftFactor * scale);
    }
    getShadowOffsetByDepth(depth) {
        const scale = this.getRenderScaleByDepth(depth);
        return {
            x: this.config.pseudo3d.shadowOffsetX * scale,
            y: this.config.pseudo3d.shadowOffsetY * scale
        };
    }
    projectToScreen(worldX, depth, height = 0, stackLevel = 0) {
        const scale = this.getRenderScaleByDepth(depth);
        const heightOffset = this.getHeightLift(height, stackLevel, depth);
        return {
            x: this.getPerspectiveX(worldX, depth),
            y: depth - heightOffset,
            scale,
            depthRatio: this.getDepthRatio(depth),
            heightOffset
        };
    }
    getProjectedRadius(radius, depth) {
        return radius * this.getRenderScaleByDepth(depth);
    }
    getRenderSortKey(renderable) {
        if (typeof renderable.sortKey === "number") {
            return renderable.sortKey;
        }
        return (renderable.depth * 1000 +
            renderable.stackLevel * 48 +
            renderable.height * 6 +
            renderable.renderOrderBias);
    }
}
exports.Pseudo3DProjector = Pseudo3DProjector;
