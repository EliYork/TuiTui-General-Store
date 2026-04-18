import { FrameDriver } from "../platform/miniGameAdapter";
import { clamp } from "../utils/math";

export interface GameLoopCallbacks {
  update(deltaSeconds: number): void;
  render(): void;
}

export class GameLoop {
  private running = false;
  private lastTimeMs = 0;
  private frameId: number | null = null;

  constructor(
    private readonly frameDriver: FrameDriver,
    private readonly callbacks: GameLoopCallbacks,
    private readonly maxDeltaMs: number = 32
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTimeMs = this.frameDriver.now();
    this.frameId = this.frameDriver.schedule(this.tick);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.frameId !== null) {
      this.frameDriver.cancel(this.frameId);
      this.frameId = null;
    }
  }

  private readonly tick = (timeMs: number): void => {
    if (!this.running) {
      return;
    }

    const deltaMs = clamp(timeMs - this.lastTimeMs, 0, this.maxDeltaMs);
    this.lastTimeMs = timeMs;

    this.callbacks.update(deltaMs / 1000);
    this.callbacks.render();

    this.frameId = this.frameDriver.schedule(this.tick);
  };
}
