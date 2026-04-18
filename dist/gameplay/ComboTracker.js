"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboTracker = void 0;
class ComboTracker {
    constructor(config) {
        this.config = config;
        this.currentCombo = 0;
        this.timerSeconds = 0;
    }
    update(deltaSeconds) {
        if (this.timerSeconds <= 0) {
            return;
        }
        this.timerSeconds = Math.max(0, this.timerSeconds - deltaSeconds);
        if (this.timerSeconds === 0) {
            this.currentCombo = 0;
        }
    }
    registerDrop(dropCount) {
        if (dropCount <= 0) {
            return {
                comboCount: this.currentCombo,
                comboBonus: 0
            };
        }
        if (this.timerSeconds > 0) {
            this.currentCombo += dropCount;
        }
        else {
            this.currentCombo = dropCount;
        }
        this.timerSeconds = this.config.windowSeconds;
        return {
            comboCount: this.currentCombo,
            comboBonus: Math.min(this.config.maxBonus, Math.max(0, this.currentCombo - 1) * this.config.bonusPerExtra)
        };
    }
    getCurrentCombo() {
        if (this.timerSeconds <= 0) {
            return 0;
        }
        return this.currentCombo;
    }
}
exports.ComboTracker = ComboTracker;
