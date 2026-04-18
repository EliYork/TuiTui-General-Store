import { RuntimeGameConfig } from "../data/gameConfig";
import { randomRange } from "../utils/math";
import { Coin } from "./entities/Coin";

export class CoinSpawner {
  private nextId = 1;

  constructor(private readonly config: RuntimeGameConfig["coin"]) {}

  spawn(): Coin {
    const coin = new Coin(
      this.nextId,
      {
        x: this.config.spawnX + randomRange(-this.config.spawnSpreadX, this.config.spawnSpreadX),
        y: this.config.spawnDepth
      },
      {
        x: randomRange(this.config.initialSpeedXMin, this.config.initialSpeedXMax),
        y: randomRange(this.config.initialSpeedYMin, this.config.initialSpeedYMax)
      },
      this.config.radius,
      {
        height: randomRange(this.config.spawnHeightMin, this.config.spawnHeightMax),
        heightVelocity: randomRange(
          this.config.spawnHeightVelocityMin,
          this.config.spawnHeightVelocityMax
        ),
        stackLevel: this.config.stackLevel
      }
    );

    this.nextId += 1;
    return coin;
  }
}
