import { normalizeVec3, vec3 } from "../core/render3d/math3d";
import { randomRange } from "../utils/math";
import { CoinBody3D } from "./entities/CoinBody3D";

export class CoinSpawner3D {
  private nextId = 1;

  constructor(
    private readonly config: {
      radius: number;
      thickness: number;
      spawnX: number;
      spawnY: number;
      spawnZ: number;
      spawnSpreadX: number;
      spawnSpreadZ: number;
      initialVelocityXMin: number;
      initialVelocityXMax: number;
      initialVelocityYMin: number;
      initialVelocityYMax: number;
      initialVelocityZMin: number;
      initialVelocityZMax: number;
      initialNormalYMin: number;
      initialNormalYMax: number;
      initialAngularVelocityXMin: number;
      initialAngularVelocityXMax: number;
      initialAngularVelocityYMin: number;
      initialAngularVelocityYMax: number;
      initialAngularVelocityZMin: number;
      initialAngularVelocityZMax: number;
    }
  ) {}

  spawn(): CoinBody3D {
    const horizontalBias = normalizeVec3(
      vec3(randomRange(-1, 1), 0, randomRange(-0.42, 0.42))
    );
    const normalY = randomRange(
      this.config.initialNormalYMin,
      this.config.initialNormalYMax
    );
    const horizontalMagnitude = Math.sqrt(Math.max(0, 1 - normalY * normalY));
    const normal = normalizeVec3(
      vec3(
        horizontalBias.x * horizontalMagnitude,
        normalY,
        horizontalBias.z * horizontalMagnitude
      )
    );

    const coin = new CoinBody3D(
      this.nextId,
      this.config.spawnX +
        randomRange(-this.config.spawnSpreadX, this.config.spawnSpreadX),
      this.config.spawnY,
      this.config.spawnZ +
        randomRange(-this.config.spawnSpreadZ, this.config.spawnSpreadZ),
      vec3(
        randomRange(
          this.config.initialVelocityXMin,
          this.config.initialVelocityXMax
        ),
        randomRange(
          this.config.initialVelocityYMin,
          this.config.initialVelocityYMax
        ),
        randomRange(
          this.config.initialVelocityZMin,
          this.config.initialVelocityZMax
        )
      ),
      normal,
      vec3(
        randomRange(
          this.config.initialAngularVelocityXMin,
          this.config.initialAngularVelocityXMax
        ),
        randomRange(
          this.config.initialAngularVelocityYMin,
          this.config.initialAngularVelocityYMax
        ),
        randomRange(
          this.config.initialAngularVelocityZMin,
          this.config.initialAngularVelocityZMax
        )
      ),
      this.config.radius,
      this.config.thickness
    );

    this.nextId += 1;
    return coin;
  }
}
