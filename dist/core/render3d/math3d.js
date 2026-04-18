"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vec3 = vec3;
exports.addVec3 = addVec3;
exports.subtractVec3 = subtractVec3;
exports.scaleVec3 = scaleVec3;
exports.rotateVec3AroundAxis = rotateVec3AroundAxis;
exports.dotVec3 = dotVec3;
exports.crossVec3 = crossVec3;
exports.lengthVec3 = lengthVec3;
exports.normalizeVec3 = normalizeVec3;
exports.averageVec3 = averageVec3;
exports.projectPoint3D = projectPoint3D;
exports.projectSurface3D = projectSurface3D;
exports.shadeHexColor = shadeHexColor;
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function vec3(x, y, z) {
    return { x, y, z };
}
function addVec3(left, right) {
    return vec3(left.x + right.x, left.y + right.y, left.z + right.z);
}
function subtractVec3(left, right) {
    return vec3(left.x - right.x, left.y - right.y, left.z - right.z);
}
function scaleVec3(vector, scalar) {
    return vec3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
}
function rotateVec3AroundAxis(vector, axis, angleRadians) {
    const normalizedAxis = normalizeVec3(axis);
    const cosTheta = Math.cos(angleRadians);
    const sinTheta = Math.sin(angleRadians);
    const axisProjection = scaleVec3(normalizedAxis, dotVec3(normalizedAxis, vector) * (1 - cosTheta));
    return addVec3(addVec3(scaleVec3(vector, cosTheta), scaleVec3(crossVec3(normalizedAxis, vector), sinTheta)), axisProjection);
}
function dotVec3(left, right) {
    return left.x * right.x + left.y * right.y + left.z * right.z;
}
function crossVec3(left, right) {
    return vec3(left.y * right.z - left.z * right.y, left.z * right.x - left.x * right.z, left.x * right.y - left.y * right.x);
}
function lengthVec3(vector) {
    return Math.sqrt(dotVec3(vector, vector));
}
function normalizeVec3(vector) {
    const length = lengthVec3(vector);
    if (length === 0) {
        return vec3(0, 0, 0);
    }
    return scaleVec3(vector, 1 / length);
}
function averageVec3(points) {
    if (points.length === 0) {
        return vec3(0, 0, 0);
    }
    const sum = points.reduce((accumulator, point) => addVec3(accumulator, point), vec3(0, 0, 0));
    return scaleVec3(sum, 1 / points.length);
}
function buildCameraBasis(camera) {
    const forward = normalizeVec3(subtractVec3(camera.target, camera.position));
    const right = normalizeVec3(crossVec3(forward, camera.up));
    const up = normalizeVec3(crossVec3(right, forward));
    return {
        forward,
        right,
        up
    };
}
function projectPoint3D(point, camera, viewport) {
    const basis = buildCameraBasis(camera);
    const relative = subtractVec3(point, camera.position);
    const cameraX = dotVec3(relative, basis.right);
    const cameraY = dotVec3(relative, basis.up);
    const cameraZ = dotVec3(relative, basis.forward);
    if (cameraZ <= camera.near) {
        return null;
    }
    const focalLength = Math.min(viewport.width, viewport.height) /
        (2 * Math.tan((camera.fovDegrees * Math.PI) / 360));
    return {
        x: viewport.x + viewport.width / 2 + (cameraX * focalLength) / cameraZ,
        y: viewport.y + viewport.height / 2 - (cameraY * focalLength) / cameraZ,
        depth: cameraZ
    };
}
function projectSurface3D(surface, camera, viewport, light) {
    var _a, _b;
    const center = averageVec3(surface.vertices);
    const toCamera = normalizeVec3(subtractVec3(camera.position, center));
    const faceNormal = normalizeVec3(surface.normal);
    if (dotVec3(faceNormal, toCamera) <= 0) {
        return null;
    }
    const points = [];
    for (const vertex of surface.vertices) {
        const projected = projectPoint3D(vertex, camera, viewport);
        if (!projected) {
            return null;
        }
        points.push(projected);
    }
    const lightDirection = normalizeVec3(light.direction);
    const brightness = clamp(light.ambient + Math.max(0, dotVec3(faceNormal, lightDirection)) * light.diffuse, 0.86, 1.02);
    return {
        points,
        depth: points.reduce((sum, point) => sum + point.depth, 0) / points.length,
        fillStyle: shadeHexColor(surface.color, brightness),
        strokeStyle: surface.strokeColor
            ? shadeHexColor(surface.strokeColor, brightness * 0.96)
            : undefined,
        opacity: (_a = surface.opacity) !== null && _a !== void 0 ? _a : 1,
        renderOrder: (_b = surface.renderOrder) !== null && _b !== void 0 ? _b : 0
    };
}
function shadeHexColor(hexColor, brightness) {
    const normalized = hexColor.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return hexColor;
    }
    const red = clamp(Math.round(parseInt(normalized.slice(0, 2), 16) * brightness), 0, 255);
    const green = clamp(Math.round(parseInt(normalized.slice(2, 4), 16) * brightness), 0, 255);
    const blue = clamp(Math.round(parseInt(normalized.slice(4, 6), 16) * brightness), 0, 255);
    return `rgb(${red}, ${green}, ${blue})`;
}
