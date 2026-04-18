"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardItem = void 0;
class BoardItem {
    constructor(id, kind, position, velocity, radius, pseudo3D = {}) {
        var _a, _b, _c, _d, _e, _f;
        this.id = id;
        this.kind = kind;
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.radius = radius;
        this.isDropped = false;
        this.height = (_a = pseudo3D.height) !== null && _a !== void 0 ? _a : 0;
        this.heightVelocity = (_b = pseudo3D.heightVelocity) !== null && _b !== void 0 ? _b : 0;
        this.supportHeight = (_c = pseudo3D.supportHeight) !== null && _c !== void 0 ? _c : 0;
        this.stackLevel = (_d = pseudo3D.stackLevel) !== null && _d !== void 0 ? _d : 1;
        this.renderOrderBias = (_e = pseudo3D.renderOrderBias) !== null && _e !== void 0 ? _e : 0;
        this.landingAssistActive =
            (_f = pseudo3D.landingAssistActive) !== null && _f !== void 0 ? _f : (this.height > 0 || this.heightVelocity !== 0);
    }
    get x() {
        return this.position.x;
    }
    set x(value) {
        this.position.x = value;
    }
    get depth() {
        return this.position.y;
    }
    set depth(value) {
        this.position.y = value;
    }
    get z() {
        return this.height;
    }
    set z(value) {
        this.height = value;
    }
    get totalVisualHeight() {
        return this.supportHeight + this.height;
    }
    get sortKey() {
        const visualStackBias = this.totalVisualHeight > 0 ? this.stackLevel * 18 : 0;
        return (this.depth * 1000 +
            visualStackBias +
            this.totalVisualHeight * 6 +
            this.renderOrderBias);
    }
    applyLinearDamping(damping, deltaSeconds, restThreshold) {
        if (this.isDropped) {
            return;
        }
        const factor = 1 / (1 + damping * deltaSeconds);
        this.velocity.x *= factor;
        this.velocity.y *= factor;
        if (Math.abs(this.velocity.x) < restThreshold) {
            this.velocity.x = 0;
        }
        if (Math.abs(this.velocity.y) < restThreshold) {
            this.velocity.y = 0;
        }
    }
    integrate(deltaSeconds) {
        if (this.isDropped) {
            return;
        }
        this.x += this.velocity.x * deltaSeconds;
        this.depth += this.velocity.y * deltaSeconds;
    }
    clampVelocity(maxSpeedX, maxSpeedY) {
        this.velocity.x = Math.max(-maxSpeedX, Math.min(maxSpeedX, this.velocity.x));
        this.velocity.y = Math.max(-maxSpeedY, Math.min(maxSpeedY, this.velocity.y));
    }
    translate(offsetX, offsetY) {
        this.x += offsetX;
        this.depth += offsetY;
    }
    setMinimumForwardVelocity(minVelocityY) {
        if (this.velocity.y < minVelocityY) {
            this.velocity.y = minVelocityY;
        }
    }
    markDropped() {
        this.isDropped = true;
    }
    setAirborneState(height, heightVelocity) {
        this.height = Math.max(0, height);
        this.heightVelocity = heightVelocity;
        this.landingAssistActive = true;
    }
    setSupportState(supportHeight, stackLevel) {
        this.supportHeight = Math.max(0, supportHeight);
        this.stackLevel = Math.max(1, stackLevel);
    }
    markLandingResolved(supportHeight, stackLevel) {
        this.setSupportState(supportHeight, stackLevel);
        this.landingAssistActive = false;
    }
    shouldResolveLanding(airborneThreshold) {
        if (!this.landingAssistActive || this.isDropped) {
            return false;
        }
        return this.height <= airborneThreshold;
    }
    relaxSupportState(deltaSeconds, relaxationPerSecond) {
        if (this.supportHeight <= 0) {
            this.supportHeight = 0;
            return;
        }
        this.supportHeight = Math.max(0, this.supportHeight - relaxationPerSecond * deltaSeconds);
        if (this.supportHeight === 0 && this.height === 0) {
            this.stackLevel = 1;
        }
    }
}
exports.BoardItem = BoardItem;
