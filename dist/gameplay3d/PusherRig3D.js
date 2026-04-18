"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PusherRig3D = void 0;
const math_1 = require("../utils/math");
class PusherRig3D {
    constructor(config) {
        this.config = config;
        this.elapsedSeconds = 0;
        this.travelRatio = 0;
        this.frontZ = config.retractFrontZ;
    }
    update(deltaSeconds) {
        this.elapsedSeconds = (this.elapsedSeconds + deltaSeconds) % this.config.cycleSeconds;
        const phase = this.elapsedSeconds / this.config.cycleSeconds;
        const motion = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        this.travelRatio = motion;
        this.frontZ = (0, math_1.lerp)(this.config.retractFrontZ, this.config.extendFrontZ, motion);
    }
    getState() {
        return {
            width: this.config.width,
            height: this.config.height,
            depth: this.config.depth,
            baseY: this.config.baseY,
            frontZ: this.frontZ,
            backZ: this.frontZ + this.config.depth,
            travelRatio: this.travelRatio
        };
    }
}
exports.PusherRig3D = PusherRig3D;
