"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pusher = void 0;
const math_1 = require("../../utils/math");
class Pusher {
    constructor(config) {
        this.stackLevel = 2;
        this.renderOrderBias = -120;
        this.elapsedSeconds = 0;
        this.travelRatio = 0;
        this.x = config.x;
        this.y = config.backY;
        this.previousY = config.backY;
        this.velocityY = 0;
        this.width = config.width;
        this.height = config.height;
        this.thickness = config.thickness;
        this.backY = config.backY;
        this.frontY = config.frontY;
        this.cycleSeconds = config.cycleSeconds;
        this.hiddenDepth = config.hiddenDepth;
    }
    get depth() {
        return this.y;
    }
    get heightOffset() {
        return 0;
    }
    get sortKey() {
        return this.depth * 1000 + this.renderOrderBias;
    }
    update(deltaSeconds) {
        this.previousY = this.y;
        this.elapsedSeconds = (this.elapsedSeconds + deltaSeconds) % this.cycleSeconds;
        const phase = this.elapsedSeconds / this.cycleSeconds;
        const motion = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        this.travelRatio = motion;
        this.y = (0, math_1.lerp)(this.backY, this.frontY, motion);
        this.velocityY = deltaSeconds > 0 ? (this.y - this.previousY) / deltaSeconds : 0;
    }
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
    getFrontEdgeY() {
        return this.y + this.height / 2;
    }
    getBackEdgeY() {
        return this.y - this.height / 2;
    }
    getPushDeltaY() {
        return Math.max(0, this.y - this.previousY);
    }
    isMovingForward() {
        return this.velocityY > 0;
    }
    getTrackStartY() {
        return this.backY;
    }
    getTrackEndY() {
        return this.frontY;
    }
    getTravelRatio() {
        return this.travelRatio;
    }
    getVisualBackEdgeY() {
        return this.getBackEdgeY() - this.hiddenDepth;
    }
    getHiddenDepth() {
        return this.hiddenDepth;
    }
    getMountDepth() {
        return this.backY - this.height * 0.95;
    }
    getMountWidth() {
        return this.width * 0.72;
    }
    getMountThickness() {
        return this.thickness * 0.78;
    }
}
exports.Pusher = Pusher;
