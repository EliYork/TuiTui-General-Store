import { _decorator, Component, EventTouch, Node, UITransform, Vec3, warn } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;
const MIN_WIDTH = 0.0001;

@ccclass('ManualSpawnArea')
export class ManualSpawnArea extends Component {
    @property(GameManager)
    public gameManager: GameManager | null = null;

    @property({ tooltip: 'World-space X at the left edge of the manual spawn width.' })
    public worldLeftX = -1.5;

    @property({ tooltip: 'World-space X at the right edge of the manual spawn width.' })
    public worldRightX = 1.5;

    @property({ tooltip: 'Fixed world-space Z used by manual spawn. Keep this on the deepest drop line.' })
    public fixedDepthZ = -2;

    private _uiTransform: UITransform | null = null;
    private readonly _uiLocation = new Vec3();
    private readonly _localTouch = new Vec3();

    protected onLoad(): void {
        this._uiTransform = this.getComponent(UITransform);

        if (!this._uiTransform) {
            warn('[ManualSpawnArea] UITransform is required.');
        }

        if (!this.gameManager) {
            warn('[ManualSpawnArea] gameManager is not assigned.');
        }
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.gameManager || !this._uiTransform) {
            return;
        }

        const width = this._uiTransform.contentSize.width;
        if (width <= MIN_WIDTH) {
            return;
        }

        const uiLocation = event.getUILocation();
        Vec3.set(this._uiLocation, uiLocation.x, uiLocation.y, 0);
        this._uiTransform.convertToNodeSpaceAR(this._uiLocation, this._localTouch);

        const normalizedX = clamp01(
            (this._localTouch.x + width * this._uiTransform.anchorX) / width,
        );
        const worldX = lerp(this.worldLeftX, this.worldRightX, normalizedX);

        this.gameManager.spawnCoinFromManualPosition(worldX, this.fixedDepthZ);
    }
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    if (value <= 0) {
        return 0;
    }

    if (value >= 1) {
        return 1;
    }

    return value;
}

function lerp(from: number, to: number, ratio: number): number {
    return from + (to - from) * ratio;
}
