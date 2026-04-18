export interface ComboConfig {
  windowSeconds: number;
  bonusPerExtra: number;
  maxBonus: number;
}

export interface ComboResult {
  comboCount: number;
  comboBonus: number;
}

export class ComboTracker {
  private currentCombo = 0;
  private timerSeconds = 0;

  constructor(private readonly config: ComboConfig) {}

  update(deltaSeconds: number): void {
    if (this.timerSeconds <= 0) {
      return;
    }

    this.timerSeconds = Math.max(0, this.timerSeconds - deltaSeconds);
    if (this.timerSeconds === 0) {
      this.currentCombo = 0;
    }
  }

  registerDrop(dropCount: number): ComboResult {
    if (dropCount <= 0) {
      return {
        comboCount: this.currentCombo,
        comboBonus: 0
      };
    }

    if (this.timerSeconds > 0) {
      this.currentCombo += dropCount;
    } else {
      this.currentCombo = dropCount;
    }

    this.timerSeconds = this.config.windowSeconds;

    return {
      comboCount: this.currentCombo,
      comboBonus: Math.min(
        this.config.maxBonus,
        Math.max(0, this.currentCombo - 1) * this.config.bonusPerExtra
      )
    };
  }

  getCurrentCombo(): number {
    if (this.timerSeconds <= 0) {
      return 0;
    }

    return this.currentCombo;
  }
}
