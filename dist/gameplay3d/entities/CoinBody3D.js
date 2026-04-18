"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinBody3D = void 0;
const math3d_1 = require("../../core/render3d/math3d");
class CoinBody3D {
    constructor(id, x, y, z, velocity, normal, angularVelocity, radius, thickness) {
        this.id = id;
        this.radius = radius;
        this.thickness = thickness;
        this.isGrounded = false;
        this.isSleeping = false;
        this.supportVelocityZ = 0;
        this.sleepTimer = 0;
        this.position = (0, math3d_1.vec3)(x, y, z);
        this.velocity = velocity;
        this.normal = normal;
        this.angularVelocity = angularVelocity;
    }
    get halfThickness() {
        return this.thickness / 2;
    }
    getRenderState() {
        const displayNormal = this.normal.y >= 0
            ? { ...this.normal }
            : {
                x: -this.normal.x,
                y: -this.normal.y,
                z: -this.normal.z
            };
        return {
            id: this.id,
            position: { ...this.position },
            normal: displayNormal,
            radius: this.radius,
            thickness: this.thickness
        };
    }
}
exports.CoinBody3D = CoinBody3D;
