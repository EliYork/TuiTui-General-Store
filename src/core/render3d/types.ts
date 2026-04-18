export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Viewport3D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Camera3D {
  position: Vector3;
  target: Vector3;
  up: Vector3;
  fovDegrees: number;
  near: number;
}

export interface DirectionalLight3D {
  direction: Vector3;
  ambient: number;
  diffuse: number;
}

export interface Surface3D {
  vertices: Vector3[];
  normal: Vector3;
  color: string;
  strokeColor?: string;
  opacity?: number;
  renderOrder?: number;
}

export interface ProjectedPoint3D {
  x: number;
  y: number;
  depth: number;
}

export interface ProjectedSurface3D {
  points: ProjectedPoint3D[];
  depth: number;
  fillStyle: string;
  strokeStyle?: string;
  opacity: number;
  renderOrder: number;
}
