"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinSpawner = void 0;
const math_1 = require("../utils/math");
const Coin_1 = require("./entities/Coin");
class CoinSpawner {
    constructor(config) {
        this.config = config;
        this.nextId = 1;
    }
    spawn() {
        const coin = new Coin_1.Coin(this.nextId, {
            x: this.config.spawnX + (0, math_1.randomRange)(-this.config.spawnSpreadX, this.config.spawnSpreadX),
            y: this.config.spawnDepth
        }, {
            x: (0, math_1.randomRange)(this.config.initialSpeedXMin, this.config.initialSpeedXMax),
            y: (0, math_1.randomRange)(this.config.initialSpeedYMin, this.config.initialSpeedYMax)
        }, this.config.radius, {
            height: (0, math_1.randomRange)(this.config.spawnHeightMin, this.config.spawnHeightMax),
            heightVelocity: (0, math_1.randomRange)(this.config.spawnHeightVelocityMin, this.config.spawnHeightVelocityMax),
            stackLevel: this.config.stackLevel
        });
        this.nextId += 1;
        return coin;
    }
}
exports.CoinSpawner = CoinSpawner;
