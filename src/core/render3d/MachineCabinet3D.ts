import { RuntimeGameConfig } from "../../data/gameConfig";
import { shadeHexColor, vec3 } from "./math3d";
import { Surface3D, Vector3 } from "./types";

function createQuad(
  vertices: [Vector3, Vector3, Vector3, Vector3],
  normal: Vector3,
  color: string,
  strokeColor?: string,
  opacity?: number,
  renderOrder?: number
): Surface3D {
  return {
    vertices,
    normal,
    color,
    strokeColor,
    opacity,
    renderOrder
  };
}

export class MachineCabinet3D {
  constructor(private readonly config: RuntimeGameConfig) {}

  buildSurfaces(): Surface3D[] {
    const { cabinet } = this.config.threeD;
    const halfWidth = cabinet.width / 2;
    const height = cabinet.height;
    const depth = cabinet.depth;
    const openingHalfWidth = cabinet.rearOpeningWidth / 2;
    const openingHeight = cabinet.rearOpeningHeight;
    const openingShadowHalfWidth = Math.min(
      openingHalfWidth - cabinet.wallThickness * 0.12,
      this.config.threeD.pusher.width / 2 + cabinet.wallThickness * 0.2
    );
    const openingFrontZ = depth - cabinet.rearOpeningInsetDepth;
    const openingShadowZ = depth + cabinet.wallThickness * 1.3;
    const platformFrontZ = cabinet.platformFrontZ;
    const dropFloorY = -cabinet.dropWellDepth;
    const colors = this.config.colors;
    const dropSideLeftColor = shadeHexColor(colors.sideWall, 0.78);
    const dropSideRightColor = shadeHexColor(colors.sideWallDark, 0.82);
    const shellLayer = 0;
    const playfieldLayer = 8;
    const dropLayer = 10;
    const openingShadowLayer = 14;
    const openingLipLayer = 28;

    return [
      createQuad(
        [
          vec3(-halfWidth, height, 0),
          vec3(halfWidth, height, 0),
          vec3(halfWidth, height, depth),
          vec3(-halfWidth, height, depth)
        ],
        vec3(0, -1, 0),
        "#edf3ff",
        "#95a7c0",
        undefined,
        shellLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, 0, platformFrontZ),
          vec3(halfWidth, 0, platformFrontZ),
          vec3(halfWidth, 0, depth),
          vec3(-halfWidth, 0, depth)
        ],
        vec3(0, 1, 0),
        "#eef4ff",
        "#8ea0b8",
        undefined,
        playfieldLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, dropFloorY, 0),
          vec3(halfWidth, dropFloorY, 0),
          vec3(halfWidth, dropFloorY, platformFrontZ),
          vec3(-halfWidth, dropFloorY, platformFrontZ)
        ],
        vec3(0, 1, 0),
        "#0b1220",
        "#273545",
        undefined,
        dropLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, dropFloorY, platformFrontZ),
          vec3(halfWidth, dropFloorY, platformFrontZ),
          vec3(halfWidth, 0, platformFrontZ),
          vec3(-halfWidth, 0, platformFrontZ)
        ],
        vec3(0, 0, -1),
        "#59687b",
        "#74879e",
        undefined,
        dropLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, dropFloorY, 0),
          vec3(-halfWidth, dropFloorY, platformFrontZ),
          vec3(-halfWidth, 0, platformFrontZ),
          vec3(-halfWidth, 0, 0)
        ],
        vec3(1, 0, 0),
        dropSideLeftColor,
        "#7d95b6",
        undefined,
        dropLayer
      ),
      createQuad(
        [
          vec3(halfWidth, dropFloorY, platformFrontZ),
          vec3(halfWidth, dropFloorY, 0),
          vec3(halfWidth, 0, 0),
          vec3(halfWidth, 0, platformFrontZ)
        ],
        vec3(-1, 0, 0),
        dropSideRightColor,
        "#6d87aa",
        undefined,
        dropLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, 0, 0),
          vec3(-halfWidth, 0, depth),
          vec3(-halfWidth, height, depth),
          vec3(-halfWidth, height, 0)
        ],
        vec3(1, 0, 0),
        colors.sideWall,
        "#7f97b7",
        undefined,
        shellLayer
      ),
      createQuad(
        [
          vec3(halfWidth, 0, depth),
          vec3(halfWidth, 0, 0),
          vec3(halfWidth, height, 0),
          vec3(halfWidth, height, depth)
        ],
        vec3(-1, 0, 0),
        colors.sideWallDark,
        "#6d87aa",
        undefined,
        shellLayer
      ),
      createQuad(
        [
          vec3(-halfWidth, 0, depth),
          vec3(-openingHalfWidth, 0, depth),
          vec3(-openingHalfWidth, height, depth),
          vec3(-halfWidth, height, depth)
        ],
        vec3(0, 0, -1),
        colors.tableBackWall,
        "#7b95b8",
        undefined,
        shellLayer
      ),
      createQuad(
        [
          vec3(openingHalfWidth, 0, depth),
          vec3(halfWidth, 0, depth),
          vec3(halfWidth, height, depth),
          vec3(openingHalfWidth, height, depth)
        ],
        vec3(0, 0, -1),
        colors.tableBackWall,
        "#7b95b8",
        undefined,
        shellLayer
      ),
      createQuad(
        [
          vec3(-openingHalfWidth, openingHeight, depth),
          vec3(openingHalfWidth, openingHeight, depth),
          vec3(openingHalfWidth, height, depth),
          vec3(-openingHalfWidth, height, depth)
        ],
        vec3(0, 0, -1),
        "#dce8f7",
        "#7b95b8",
        undefined,
        shellLayer
      ),
      createQuad(
        [
          vec3(-openingShadowHalfWidth, 0, openingShadowZ),
          vec3(openingShadowHalfWidth, 0, openingShadowZ),
          vec3(openingShadowHalfWidth, openingHeight, openingShadowZ),
          vec3(-openingShadowHalfWidth, openingHeight, openingShadowZ)
        ],
        vec3(0, 0, -1),
        "#152334",
        undefined,
        0.82,
        openingShadowLayer
      ),
      // A simple top lip is enough here; deep dark side walls read as two black bricks.
      createQuad(
        [
          vec3(-openingHalfWidth, openingHeight, openingFrontZ),
          vec3(openingHalfWidth, openingHeight, openingFrontZ),
          vec3(openingHalfWidth, openingHeight, depth),
          vec3(-openingHalfWidth, openingHeight, depth)
        ],
        vec3(0, -1, 0),
        "#152230",
        "#26384b",
        undefined,
        openingLipLayer
      )
    ];
  }
}
