"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const math_1 = require("../utils/math");
class Button {
    constructor(config, colors, onPress) {
        this.config = config;
        this.colors = colors;
        this.onPress = onPress;
    }
    handleTouch(point) {
        if (!(0, math_1.pointInRect)(point, this.getBounds())) {
            return false;
        }
        this.onPress();
        return true;
    }
    render(context) {
        const bounds = this.getBounds();
        this.drawRoundedRect(context, bounds, this.config.radius);
        context.fillStyle = this.colors.buttonFill;
        context.fill();
        context.strokeStyle = this.colors.buttonEdge;
        context.lineWidth = 3;
        context.stroke();
        context.fillStyle = this.colors.buttonText;
        context.font = `600 ${this.config.fontSize}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.config.label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    }
    getBounds() {
        return {
            x: this.config.x,
            y: this.config.y,
            width: this.config.width,
            height: this.config.height
        };
    }
    drawRoundedRect(context, bounds, radius) {
        const safeRadius = Math.min(radius, bounds.width / 2, bounds.height / 2);
        context.beginPath();
        context.moveTo(bounds.x + safeRadius, bounds.y);
        context.lineTo(bounds.x + bounds.width - safeRadius, bounds.y);
        context.quadraticCurveTo(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + safeRadius);
        context.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - safeRadius);
        context.quadraticCurveTo(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width - safeRadius, bounds.y + bounds.height);
        context.lineTo(bounds.x + safeRadius, bounds.y + bounds.height);
        context.quadraticCurveTo(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - safeRadius);
        context.lineTo(bounds.x, bounds.y + safeRadius);
        context.quadraticCurveTo(bounds.x, bounds.y, bounds.x + safeRadius, bounds.y);
        context.closePath();
    }
}
exports.Button = Button;
