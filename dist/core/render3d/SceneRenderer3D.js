"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneRenderer3D = void 0;
const MachineCabinet3D_1 = require("./MachineCabinet3D");
const math3d_1 = require("./math3d");
const PusherMesh3D_1 = require("./PusherMesh3D");
class SceneRenderer3D {
    constructor(config) {
        this.config = config;
        this.cabinetMesh = new MachineCabinet3D_1.MachineCabinet3D(config);
        this.pusherMesh = new PusherMesh3D_1.PusherMesh3D(config);
        this.viewport = config.threeD.viewport;
        this.camera = {
            position: (0, math3d_1.vec3)(config.threeD.camera.positionX, config.threeD.camera.positionY, config.threeD.camera.positionZ),
            target: (0, math3d_1.vec3)(config.threeD.camera.targetX, config.threeD.camera.targetY, config.threeD.camera.targetZ),
            up: (0, math3d_1.vec3)(0, 1, 0),
            fovDegrees: config.threeD.camera.fovDegrees,
            near: config.threeD.camera.near
        };
        this.light = {
            direction: (0, math3d_1.normalizeVec3)((0, math3d_1.vec3)(config.threeD.light.directionX, config.threeD.light.directionY, config.threeD.light.directionZ)),
            ambient: config.threeD.light.ambient,
            diffuse: config.threeD.light.diffuse
        };
    }
    render(context, pusher) {
        this.drawBackdrop(context);
        this.drawCabinetShell(context);
        context.save();
        context.beginPath();
        context.rect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
        context.clip();
        this.drawViewportAmbient(context);
        const surfaces = [
            ...this.cabinetMesh.buildSurfaces(),
            ...this.pusherMesh.buildSurfaces(pusher.getState())
        ];
        const projectedSurfaces = surfaces
            .map((surface) => (0, math3d_1.projectSurface3D)(surface, this.camera, this.viewport, this.light))
            .filter((surface) => surface !== null)
            .sort((left, right) => {
            if (left.renderOrder !== right.renderOrder) {
                return left.renderOrder - right.renderOrder;
            }
            return right.depth - left.depth;
        });
        for (const surface of projectedSurfaces) {
            this.drawSurface(context, surface);
        }
        context.restore();
        this.drawGlassFrame(context);
    }
    drawBackdrop(context) {
        const gradient = context.createLinearGradient(0, 0, 0, this.config.screen.height);
        gradient.addColorStop(0, "#09111b");
        gradient.addColorStop(0.5, "#0c1726");
        gradient.addColorStop(1, "#09111a");
        context.fillStyle = gradient;
        context.fillRect(0, 0, this.config.screen.width, this.config.screen.height);
        context.fillStyle = "rgba(88, 160, 255, 0.03)";
        context.fillRect(this.config.table.left - 8, this.config.table.top - 28, this.config.table.width + 16, this.config.table.height + 64);
    }
    drawCabinetShell(context) {
        const shellX = this.config.table.left;
        const shellY = this.config.table.top - 8;
        const shellWidth = this.config.table.width;
        const shellHeight = this.config.table.height + 26;
        const marqueeHeight = 42;
        context.fillStyle = "rgba(8, 28, 71, 0.2)";
        context.fillRect(shellX + 8, shellY + 10, shellWidth, shellHeight);
        const shellGradient = context.createLinearGradient(0, shellY, 0, shellY + shellHeight);
        shellGradient.addColorStop(0, "#2752a1");
        shellGradient.addColorStop(1, "#153469");
        context.fillStyle = shellGradient;
        context.fillRect(shellX, shellY, shellWidth, shellHeight);
        context.fillStyle = "#1e3f7d";
        context.fillRect(shellX + 22, shellY - marqueeHeight + 12, shellWidth - 44, marqueeHeight);
        context.fillStyle = "rgba(255, 255, 255, 0.12)";
        context.fillRect(shellX + 30, shellY - marqueeHeight + 18, shellWidth - 60, 7);
        context.strokeStyle = "#7da3df";
        context.lineWidth = 3;
        context.strokeRect(shellX, shellY, shellWidth, shellHeight);
    }
    drawViewportAmbient(context) {
        const gradient = context.createLinearGradient(0, this.viewport.y, 0, this.viewport.y + this.viewport.height);
        gradient.addColorStop(0, "#eff5ff");
        gradient.addColorStop(0.56, "#dfe9f7");
        gradient.addColorStop(1, "#c5d3e6");
        context.fillStyle = gradient;
        context.fillRect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
        context.fillStyle = "rgba(255, 255, 255, 0.08)";
        context.fillRect(this.viewport.x + 10, this.viewport.y + 10, this.viewport.width - 20, 8);
    }
    drawGlassFrame(context) {
        context.strokeStyle = "rgba(255, 255, 255, 0.28)";
        context.lineWidth = 2;
        context.strokeRect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
        context.strokeStyle = "rgba(255, 255, 255, 0.08)";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(this.viewport.x + 12, this.viewport.y + 12);
        context.lineTo(this.viewport.x + 12, this.viewport.y + this.viewport.height - 12);
        context.stroke();
        context.strokeStyle = (0, math3d_1.shadeHexColor)(this.config.colors.slotEdge, 1.15);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this.viewport.x + 16, this.viewport.y + this.viewport.height - 16);
        context.lineTo(this.viewport.x + this.viewport.width - 16, this.viewport.y + this.viewport.height - 16);
        context.stroke();
    }
    drawSurface(context, surface) {
        context.save();
        context.globalAlpha = surface.opacity;
        context.beginPath();
        surface.points.forEach((point, index) => {
            if (index === 0) {
                context.moveTo(point.x, point.y);
                return;
            }
            context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.fillStyle = surface.fillStyle;
        context.fill();
        if (surface.strokeStyle) {
            context.strokeStyle = surface.strokeStyle;
            context.lineWidth = 1.5;
            context.stroke();
        }
        context.restore();
    }
}
exports.SceneRenderer3D = SceneRenderer3D;
