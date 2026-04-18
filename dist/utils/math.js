"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.lerp = lerp;
exports.randomRange = randomRange;
exports.pointInRect = pointInRect;
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function lerp(start, end, t) {
    return start + (end - start) * t;
}
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}
function pointInRect(point, rect) {
    return (point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height);
}
