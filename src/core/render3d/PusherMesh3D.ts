import { RuntimeGameConfig } from "../../data/gameConfig";
import { PusherRig3DState } from "../../gameplay3d/PusherRig3D";
import { vec3 } from "./math3d";
import { Surface3D, Vector3 } from "./types";

function createQuad(
  vertices: [Vector3, Vector3, Vector3, Vector3],
  normal: Vector3,
  color: string,
  strokeColor?: string,
  renderOrder?: number,
  opacity?: number
): Surface3D {
  return {
    vertices,
    normal,
    color,
    strokeColor,
    renderOrder,
    opacity
  };
}

export class PusherMesh3D {
  constructor(private readonly config: RuntimeGameConfig) {}

  buildSurfaces(state: PusherRig3DState): Surface3D[] {
    const halfWidth = state.width / 2;
    const frontZ = state.frontZ;
    const topBackZ = state.backZ;
    const visibleHullBackZ = Math.min(state.backZ, state.hiddenSupportFrontZ);
    const bottomY = state.baseY;
    const topY = bottomY + state.height;
    const sideLayer = 16;
    const topLayer = 18;
    const frontLayer = 17;
    const colors = this.config.colors;
    const topSlices = this.buildTopSurfaceSlices(
      halfWidth,
      topY,
      frontZ,
      topBackZ,
      topLayer
    );

    const surfaces: Surface3D[] = [
      ...topSlices,
      createQuad(
        [
          vec3(-halfWidth, bottomY, frontZ),
          vec3(halfWidth, bottomY, frontZ),
          vec3(halfWidth, topY, frontZ),
          vec3(-halfWidth, topY, frontZ)
        ],
        vec3(0, 0, -1),
        "#ffbf7a",
        colors.pusherEdge,
        frontLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, visibleHullBackZ),
          vec3(-halfWidth, bottomY, frontZ),
          vec3(-halfWidth, topY, frontZ),
          vec3(-halfWidth, topY, visibleHullBackZ)
        ],
        vec3(1, 0, 0),
        "#cb7024",
        colors.pusherEdge,
        sideLayer
      ),
      createQuad(
        [
          vec3(halfWidth, bottomY, frontZ),
          vec3(halfWidth, bottomY, visibleHullBackZ),
          vec3(halfWidth, topY, visibleHullBackZ),
          vec3(halfWidth, topY, frontZ)
        ],
        vec3(-1, 0, 0),
        "#c2681d",
        colors.pusherEdge,
        sideLayer
      )
    ];

    if (topBackZ <= visibleHullBackZ + 0.5) {
      surfaces.push(
        createQuad(
          [
            vec3(-halfWidth, bottomY, topBackZ),
            vec3(halfWidth, bottomY, topBackZ),
            vec3(halfWidth, topY, topBackZ),
            vec3(-halfWidth, topY, topBackZ)
          ],
          vec3(0, 0, 1),
          "#8f4717",
          colors.pusherEdge,
          sideLayer
        )
      );
    }

    return surfaces;
  }

  private buildTopSurfaceSlices(
    halfWidth: number,
    topY: number,
    frontZ: number,
    backZ: number,
    renderOrder: number
  ): Surface3D[] {
    const visibleDepth = Math.max(1, backZ - frontZ);
    const sliceCount = Math.max(
      5,
      Math.ceil(visibleDepth / Math.max(18, this.config.threeD.coin.radius * 1.25))
    );
    const overlap = Math.min(0.18, visibleDepth / sliceCount / 6);
    const topFill = "#f4a454";
    const slices: Surface3D[] = [];

    // Keep the board looking like one clean top face; these slices only exist
    // to stabilize painter sorting against coins, not to visually segment the wood.
    for (let sliceIndex = 0; sliceIndex < sliceCount; sliceIndex += 1) {
      const rawFrontZ = frontZ + (visibleDepth * sliceIndex) / sliceCount;
      const rawBackZ = frontZ + (visibleDepth * (sliceIndex + 1)) / sliceCount;
      const sliceFrontZ = sliceIndex === 0 ? rawFrontZ : rawFrontZ - overlap;
      const sliceBackZ =
        sliceIndex === sliceCount - 1 ? rawBackZ : rawBackZ + overlap;

      slices.push(
        createQuad(
          [
            vec3(-halfWidth, topY, sliceFrontZ),
            vec3(halfWidth, topY, sliceFrontZ),
            vec3(halfWidth, topY, sliceBackZ),
            vec3(-halfWidth, topY, sliceBackZ)
          ],
          vec3(0, 1, 0),
          topFill,
          undefined,
          renderOrder
        )
      );
    }

    return slices;
  }

  buildDebugSurfaces(state: PusherRig3DState): Surface3D[] {
    if (
      !this.config.threeD.debug3DPhysics ||
      state.hiddenSupportBackZ <= state.hiddenSupportFrontZ + 0.5
    ) {
      return [];
    }

    const halfWidth = state.hiddenSupportWidth / 2;
    const topY = state.topY + this.config.threeD.cabinet.wallThickness * 0.12;
    const bottomY = state.baseY - this.config.threeD.cabinet.wallThickness * 0.08;
    const frontZ = state.hiddenSupportFrontZ;
    const backZ = state.hiddenSupportBackZ;
    const debugLayer = 220;

    return [
      createQuad(
        [
          vec3(-halfWidth, topY, frontZ),
          vec3(halfWidth, topY, frontZ),
          vec3(halfWidth, topY, backZ),
          vec3(-halfWidth, topY, backZ)
        ],
        vec3(0, 1, 0),
        "#22c55e",
        "#166534",
        debugLayer,
        0.3
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, backZ),
          vec3(halfWidth, bottomY, backZ),
          vec3(halfWidth, bottomY, frontZ),
          vec3(-halfWidth, bottomY, frontZ)
        ],
        vec3(0, -1, 0),
        "#16a34a",
        "#166534",
        debugLayer - 1,
        0.12
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, backZ),
          vec3(-halfWidth, bottomY, frontZ),
          vec3(-halfWidth, topY, frontZ),
          vec3(-halfWidth, topY, backZ)
        ],
        vec3(1, 0, 0),
        "#22c55e",
        "#166534",
        debugLayer,
        0.18
      ),
      createQuad(
        [
          vec3(halfWidth, bottomY, frontZ),
          vec3(halfWidth, bottomY, backZ),
          vec3(halfWidth, topY, backZ),
          vec3(halfWidth, topY, frontZ)
        ],
        vec3(-1, 0, 0),
        "#22c55e",
        "#166534",
        debugLayer,
        0.18
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, frontZ),
          vec3(halfWidth, bottomY, frontZ),
          vec3(halfWidth, topY, frontZ),
          vec3(-halfWidth, topY, frontZ)
        ],
        vec3(0, 0, -1),
        "#ef4444",
        "#991b1b",
        debugLayer + 1,
        0.16
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, backZ),
          vec3(halfWidth, bottomY, backZ),
          vec3(halfWidth, topY, backZ),
          vec3(-halfWidth, topY, backZ)
        ],
        vec3(0, 0, 1),
        "#22c55e",
        "#166534",
        debugLayer,
        0.18
      )
    ];
  }
}
