"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinSpawner3D = void 0;
const math3d_1 = require("../core/render3d/math3d");
const math_1 = require("../utils/math");
const CoinBody3D_1 = require("./entities/CoinBody3D");
class CoinSpawner3D {
    constructor(config) {
        this.config = config;
        this.nextId = 1;
    }
    spawn() {
        const horizontalBias = (0, math3d_1.normalizeVec3)((0, math3d_1.vec3)((0, math_1.randomRange)(-1, 1), 0, (0, math_1.randomRange)(-0.42, 0.42)));
        const normalY = (0, math_1.randomRange)(this.config.initialNormalYMin, this.config.initialNormalYMax);
        const horizontalMagnitude = Math.sqrt(Math.max(0, 1 - normalY * normalY));
        const normal = (0, math3d_1.normalizeVec3)((0, math3d_1.vec3)(horizontalBias.x * horizontalMagnitude, normalY, horizontalBias.z * horizontalMagnitude));
        const coin = new CoinBody3D_1.CoinBody3D(this.nextId, this.config.spawnX +
            (0, math_1.randomRange)(-this.config.spawnSpreadX, this.config.spawnSpreadX), this.config.spawnY, this.config.spawnZ +
            (0, math_1.randomRange)(-this.config.spawnSpreadZ, this.config.spawnSpreadZ), (0, math3d_1.vec3)((0, math_1.randomRange)(this.config.initialVelocityXMin, this.config.initialVelocityXMax), (0, math_1.randomRange)(this.config.initialVelocityYMin, this.config.initialVelocityYMax), (0, math_1.randomRange)(this.config.initialVelocityZMin, this.config.initialVelocityZMax)), normal, (0, math3d_1.vec3)((0, math_1.randomRange)(this.config.initialAngularVelocityXMin, this.config.initialAngularVelocityXMax), (0, math_1.randomRange)(this.config.initialAngularVelocityYMin, this.config.initialAngularVelocityYMax), (0, math_1.randomRange)(this.config.initialAngularVelocityZMin, this.config.initialAngularVelocityZMax)), this.config.radius, this.config.thickness);
        this.nextId += 1;
        return coin;
    }
}
exports.CoinSpawner3D = CoinSpawner3D;
