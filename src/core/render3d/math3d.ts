import {
  Camera3D,
  DirectionalLight3D,
  ProjectedPoint3D,
  ProjectedSurface3D,
  Surface3D,
  Vector3,
  Viewport3D
} from "./types";

interface CameraBasis {
  forward: Vector3;
  right: Vector3;
  up: Vector3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function vec3(x: number, y: number, z: number): Vector3 {
  return { x, y, z };
}

export function addVec3(left: Vector3, right: Vector3): Vector3 {
  return vec3(left.x + right.x, left.y + right.y, left.z + right.z);
}

export function subtractVec3(left: Vector3, right: Vector3): Vector3 {
  return vec3(left.x - right.x, left.y - right.y, left.z - right.z);
}

export function scaleVec3(vector: Vector3, scalar: number): Vector3 {
  return vec3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
}

export function dotVec3(left: Vector3, right: Vector3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

export function crossVec3(left: Vector3, right: Vector3): Vector3 {
  return vec3(
    left.y * right.z - left.z * right.y,
    left.z * right.x - left.x * right.z,
    left.x * right.y - left.y * right.x
  );
}

export function lengthVec3(vector: Vector3): number {
  return Math.sqrt(dotVec3(vector, vector));
}

export function normalizeVec3(vector: Vector3): Vector3 {
  const length = lengthVec3(vector);
  if (length === 0) {
    return vec3(0, 0, 0);
  }

  return scaleVec3(vector, 1 / length);
}

export function averageVec3(points: Vector3[]): Vector3 {
  if (points.length === 0) {
    return vec3(0, 0, 0);
  }

  const sum = points.reduce(
    (accumulator, point) => addVec3(accumulator, point),
    vec3(0, 0, 0)
  );

  return scaleVec3(sum, 1 / points.length);
}

function buildCameraBasis(camera: Camera3D): CameraBasis {
  const forward = normalizeVec3(subtractVec3(camera.target, camera.position));
  const right = normalizeVec3(crossVec3(forward, camera.up));
  const up = normalizeVec3(crossVec3(right, forward));

  return {
    forward,
    right,
    up
  };
}

export function projectPoint3D(
  point: Vector3,
  camera: Camera3D,
  viewport: Viewport3D
): ProjectedPoint3D | null {
  const basis = buildCameraBasis(camera);
  const relative = subtractVec3(point, camera.position);
  const cameraX = dotVec3(relative, basis.right);
  const cameraY = dotVec3(relative, basis.up);
  const cameraZ = dotVec3(relative, basis.forward);

  if (cameraZ <= camera.near) {
    return null;
  }

  const focalLength =
    Math.min(viewport.width, viewport.height) /
    (2 * Math.tan((camera.fovDegrees * Math.PI) / 360));

  return {
    x: viewport.x + viewport.width / 2 + (cameraX * focalLength) / cameraZ,
    y: viewport.y + viewport.height / 2 - (cameraY * focalLength) / cameraZ,
    depth: cameraZ
  };
}

export function projectSurface3D(
  surface: Surface3D,
  camera: Camera3D,
  viewport: Viewport3D,
  light: DirectionalLight3D
): ProjectedSurface3D | null {
  const center = averageVec3(surface.vertices);
  const toCamera = normalizeVec3(subtractVec3(camera.position, center));
  const faceNormal = normalizeVec3(surface.normal);

  if (dotVec3(faceNormal, toCamera) <= 0) {
    return null;
  }

  const points: ProjectedPoint3D[] = [];
  for (const vertex of surface.vertices) {
    const projected = projectPoint3D(vertex, camera, viewport);
    if (!projected) {
      return null;
    }

    points.push(projected);
  }

  const lightDirection = normalizeVec3(light.direction);
  const brightness = clamp(
    light.ambient + Math.max(0, dotVec3(faceNormal, lightDirection)) * light.diffuse,
    0.86,
    1.02
  );

  return {
    points,
    depth: points.reduce((sum, point) => sum + point.depth, 0) / points.length,
    fillStyle: shadeHexColor(surface.color, brightness),
    strokeStyle: surface.strokeColor
      ? shadeHexColor(surface.strokeColor, brightness * 0.96)
      : undefined,
    opacity: surface.opacity ?? 1,
    renderOrder: surface.renderOrder ?? 0
  };
}

export function shadeHexColor(hexColor: string, brightness: number): string {
  const normalized = hexColor.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hexColor;
  }

  const red = clamp(
    Math.round(parseInt(normalized.slice(0, 2), 16) * brightness),
    0,
    255
  );
  const green = clamp(
    Math.round(parseInt(normalized.slice(2, 4), 16) * brightness),
    0,
    255
  );
  const blue = clamp(
    Math.round(parseInt(normalized.slice(4, 6), 16) * brightness),
    0,
    255
  );

  return `rgb(${red}, ${green}, ${blue})`;
}
