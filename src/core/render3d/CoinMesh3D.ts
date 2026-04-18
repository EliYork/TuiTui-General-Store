import { RuntimeGameConfig } from "../../data/gameConfig";
import { CoinBody3D } from "../../gameplay3d/entities/CoinBody3D";
import { Surface3D, Vector3 } from "./types";
import {
  addVec3,
  crossVec3,
  normalizeVec3,
  scaleVec3,
  vec3
} from "./math3d";

function createSurface(
  vertices: Vector3[],
  normal: Vector3,
  color: string,
  strokeColor?: string,
  renderOrder?: number
): Surface3D {
  return {
    vertices,
    normal,
    color,
    strokeColor,
    renderOrder
  };
}

export class CoinMesh3D {
  constructor(private readonly config: RuntimeGameConfig) {}

  buildSurfaces(coins: CoinBody3D[]): Surface3D[] {
    const surfaces: Surface3D[] = [];
    for (const coin of coins) {
      surfaces.push(...this.buildCoinSurfaces(coin));
    }
    return surfaces;
  }

  private buildCoinSurfaces(coin: CoinBody3D): Surface3D[] {
    const state = coin.getRenderState();
    const segmentCount = this.config.threeD.coin.sides;
    const halfThickness = state.thickness / 2;
    const capNormal = normalizeVec3(state.normal);
    const referenceAxis =
      Math.abs(capNormal.y) < 0.92 ? vec3(0, 1, 0) : vec3(1, 0, 0);
    const tangent = normalizeVec3(crossVec3(referenceAxis, capNormal));
    const bitangent = normalizeVec3(crossVec3(capNormal, tangent));
    const topCenter = addVec3(
      state.position,
      scaleVec3(capNormal, halfThickness)
    );
    const bottomCenter = addVec3(
      state.position,
      scaleVec3(capNormal, -halfThickness)
    );
    const topRing: Vector3[] = [];
    const bottomRing: Vector3[] = [];
    const surfaces: Surface3D[] = [];
    const capLayer = 18;
    const sideLayer = 18;
    const debugPalette = this.getCoinDebugPalette(coin);

    for (let index = 0; index < segmentCount; index += 1) {
      const angle = (index / segmentCount) * Math.PI * 2;
      const rimOffset = addVec3(
        scaleVec3(tangent, Math.cos(angle) * state.radius),
        scaleVec3(bitangent, Math.sin(angle) * state.radius)
      );

      topRing.push(addVec3(topCenter, rimOffset));
      bottomRing.push(addVec3(bottomCenter, rimOffset));
    }

    surfaces.push(
      createSurface(
        topRing,
        capNormal,
        debugPalette.fill,
        debugPalette.edge,
        capLayer
      )
    );
    surfaces.push(
      createSurface(
        [...bottomRing].reverse(),
        scaleVec3(capNormal, -1),
        debugPalette.fill,
        debugPalette.edge,
        capLayer
      )
    );

    for (let index = 0; index < segmentCount; index += 1) {
      const nextIndex = (index + 1) % segmentCount;
      const currentTop = topRing[index];
      const nextTop = topRing[nextIndex];
      const currentBottom = bottomRing[index];
      const nextBottom = bottomRing[nextIndex];
      const rimNormal = normalizeVec3(
        addVec3(
          scaleVec3(tangent, Math.cos((index + 0.5) / segmentCount * Math.PI * 2)),
          scaleVec3(bitangent, Math.sin((index + 0.5) / segmentCount * Math.PI * 2))
        )
      );

      surfaces.push(
        createSurface(
          [currentBottom, nextBottom, nextTop, currentTop],
          rimNormal,
          debugPalette.side,
          debugPalette.edge,
          sideLayer
        )
      );
    }

    return surfaces;
  }

  private getCoinDebugPalette(coin: CoinBody3D): {
    fill: string;
    side: string;
    edge: string;
  } {
    if (!this.config.threeD.debug3DPhysics) {
      return {
        fill: this.config.colors.coinFill,
        side: this.config.colors.coinSide,
        edge: this.config.colors.coinEdge
      };
    }

    const linearSpeed = Math.hypot(coin.velocity.x, coin.velocity.z);
    const angularSpeed = Math.hypot(
      coin.angularVelocity.x,
      coin.angularVelocity.y,
      coin.angularVelocity.z
    );
    const isUnstable =
      !coin.isGrounded ||
      linearSpeed > this.config.physics3d.sleepLinearSpeed * 0.8 ||
      angularSpeed > this.config.physics3d.sleepAngularSpeed * 0.8;

    if (coin.isSleeping) {
      return {
        fill: "#4ade80",
        side: "#22c55e",
        edge: "#166534"
      };
    }

    if (isUnstable) {
      return {
        fill: "#f87171",
        side: "#ef4444",
        edge: "#7f1d1d"
      };
    }

    return {
      fill: "#facc15",
      side: "#eab308",
      edge: "#854d0e"
    };
  }
}
