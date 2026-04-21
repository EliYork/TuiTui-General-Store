import { _decorator, Component, Node, warn } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;
const MIN_HOLD_START_DELAY = 0.05;
const MIN_HOLD_SPAWN_INTERVAL = 0.02;

@ccclass('SpawnButtonHold')
export class SpawnButtonHold extends Component {
    @property(GameManager)
    public gameManager: GameManager | null = null;

    @property({ tooltip: 'How long the button must be held before auto-spawn starts.' })
    public holdStartDelay = 0.25;

    @property({ tooltip: 'Seconds between each spawn while the button is held.' })
    public holdSpawnInterval = 0.12;

    private _isPressing = false;
    private _holdModeStarted = false;

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.stopPressing();
    }

    private onTouchStart(): void {
        this.stopPressing();
        this._isPressing = true;
        this._holdModeStarted = false;
        this.scheduleOnce(this.beginHoldSpawn, this.getHoldStartDelay());
    }

    private onTouchEnd(): void {
        const shouldSpawnSingleCoin = this._isPressing && !this._holdModeStarted;
        this.stopPressing();

        if (shouldSpawnSingleCoin) {
            this.trySpawnOnce();
        }
    }

    private onTouchCancel(): void {
        this.stopPressing();
    }

    private beginHoldSpawn(): void {
        if (!this._isPressing) {
            return;
        }

        this._holdModeStarted = true;
        if (!this.trySpawnOnce()) {
            return;
        }

        if (!this.gameManager?.canSpawnCoin()) {
            return;
        }

        this.schedule(this.repeatHoldSpawn, this.getHoldSpawnInterval());
    }

    private repeatHoldSpawn(): void {
        if (!this._isPressing) {
            this.stopRepeating();
            return;
        }

        if (!this.trySpawnOnce() || !this.gameManager?.canSpawnCoin()) {
            this.stopRepeating();
        }
    }

    private trySpawnOnce(): boolean {
        if (!this.gameManager) {
            warn('[SpawnButtonHold] gameManager is not assigned.');
            return false;
        }

        return this.gameManager.spawnCoinFromButton();
    }

    private stopPressing(): void {
        this._isPressing = false;
        this.unschedule(this.beginHoldSpawn);
        this.stopRepeating();
    }

    private stopRepeating(): void {
        this.unschedule(this.repeatHoldSpawn);
    }

    private getHoldStartDelay(): number {
        return Math.max(MIN_HOLD_START_DELAY, this.holdStartDelay);
    }

    private getHoldSpawnInterval(): number {
        return Math.max(MIN_HOLD_SPAWN_INTERVAL, this.holdSpawnInterval);
    }
}
