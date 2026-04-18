import { RuntimeGameConfig } from "../../data/gameConfig";
import { PusherRig3DState } from "../../gameplay3d/PusherRig3D";
import { vec3 } from "./math3d";
import { Surface3D, Vector3 } from "./types";

function createQuad(
  vertices: [Vector3, Vector3, Vector3, Vector3],
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

export class PusherMesh3D {
  constructor(private readonly config: RuntimeGameConfig) {}

  buildSurfaces(state: PusherRig3DState): Surface3D[] {
    const halfWidth = state.width / 2;
    const frontZ = state.frontZ;
    const backZ = state.backZ;
    const concealedBackZ =
      backZ + this.config.threeD.cabinet.wallThickness * 2.2;
    const bottomY = state.baseY;
    const topY = bottomY + state.height;
    const concealedTopY = topY - this.config.threeD.cabinet.wallThickness * 0.16;
    const plateLayer = 18;
    const concealedPlateLayer = 12;
    const colors = this.config.colors;

    return [
      createQuad(
        [
          vec3(-halfWidth, concealedTopY, backZ),
          vec3(halfWidth, concealedTopY, backZ),
          vec3(halfWidth, concealedTopY, concealedBackZ),
          vec3(-halfWidth, concealedTopY, concealedBackZ)
        ],
        vec3(0, 1, 0),
        "#ce7e33",
        undefined,
        concealedPlateLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, concealedBackZ),
          vec3(-halfWidth, bottomY, backZ),
          vec3(-halfWidth, concealedTopY, backZ),
          vec3(-halfWidth, concealedTopY, concealedBackZ)
        ],
        vec3(1, 0, 0),
        "#a35a22",
        undefined,
        concealedPlateLayer
      ),
      createQuad(
        [
          vec3(halfWidth, bottomY, backZ),
          vec3(halfWidth, bottomY, concealedBackZ),
          vec3(halfWidth, concealedTopY, concealedBackZ),
          vec3(halfWidth, concealedTopY, backZ)
        ],
        vec3(-1, 0, 0),
        "#9a5119",
        undefined,
        concealedPlateLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, topY, frontZ),
          vec3(halfWidth, topY, frontZ),
          vec3(halfWidth, topY, backZ),
          vec3(-halfWidth, topY, backZ)
        ],
        vec3(0, 1, 0),
        "#f4a454",
        colors.pusherEdge,
        plateLayer
      ),
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
        plateLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, backZ),
          vec3(-halfWidth, bottomY, frontZ),
          vec3(-halfWidth, topY, frontZ),
          vec3(-halfWidth, topY, backZ)
        ],
        vec3(1, 0, 0),
        "#cb7024",
        colors.pusherEdge,
        plateLayer
      ),
      createQuad(
        [
          vec3(halfWidth, bottomY, frontZ),
          vec3(halfWidth, bottomY, backZ),
          vec3(halfWidth, topY, backZ),
          vec3(halfWidth, topY, frontZ)
        ],
        vec3(-1, 0, 0),
        "#c2681d",
        colors.pusherEdge,
        plateLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, bottomY, backZ),
          vec3(halfWidth, bottomY, backZ),
          vec3(halfWidth, topY, backZ),
          vec3(-halfWidth, topY, backZ)
        ],
        vec3(0, 0, 1),
        "#8f4717",
        colors.pusherEdge,
        plateLayer - 1
      )
    ];
  }
}
