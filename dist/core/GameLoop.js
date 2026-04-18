"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLoop = void 0;
const math_1 = require("../utils/math");
class GameLoop {
    constructor(frameDriver, callbacks, maxDeltaMs = 32) {
        this.frameDriver = frameDriver;
        this.callbacks = callbacks;
        this.maxDeltaMs = maxDeltaMs;
        this.running = false;
        this.lastTimeMs = 0;
        this.frameId = null;
        this.tick = (timeMs) => {
            if (!this.running) {
                return;
            }
            const deltaMs = (0, math_1.clamp)(timeMs - this.lastTimeMs, 0, this.maxDeltaMs);
            this.lastTimeMs = timeMs;
            this.callbacks.update(deltaMs / 1000);
            this.callbacks.render();
            this.frameId = this.frameDriver.schedule(this.tick);
        };
    }
    start() {
        if (this.running) {
            return;
        }
        this.running = true;
        this.lastTimeMs = this.frameDriver.now();
        this.frameId = this.frameDriver.schedule(this.tick);
    }
    stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        if (this.frameId !== null) {
            this.frameDriver.cancel(this.frameId);
            this.frameId = null;
        }
    }
}
exports.GameLoop = GameLoop;
