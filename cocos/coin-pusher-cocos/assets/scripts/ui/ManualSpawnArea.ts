import { _decorator, Camera, Component, EventTouch, log, Node, UITransform, Vec2, Vec3, warn } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;
const MIN_WIDTH = 0.0001;
const MIN_HOLD_INTERVAL = 0.02;
const RAY_EPSILON = 0.000001;

@ccclass('ManualSpawnArea')
export class ManualSpawnArea extends Component {
    @property(GameManager)
    public gameManager: GameManager | null = null;

    @property({ type: Camera, tooltip: 'World camera used to raycast touch position onto the spawn reference plane.' })
    public worldCamera: Camera | null = null;

    @property({ tooltip: 'World-space X at the left edge of the manual spawn width.' })
    public worldLeftX = -1.5;

    @property({ tooltip: 'World-space X at the right edge of the manual spawn width.' })
    public worldRightX = 1.5;

    @property({ tooltip: 'Fixed world-space Z used by manual spawn. Keep this on the deepest drop line.' })
    public fixedDepthZ = -2;

    @property({ tooltip: 'World-space Y of the horizontal reference plane used by camera ray mapping.' })
    public referencePlaneY = 0;

    @property({ tooltip: 'World-space X offset applied after touch-to-world mapping.' })
    public xBias = 0;

    @property({ tooltip: 'World-space X scale around the configured spawn range center.' })
    public xScale = 1;

    @property({ tooltip: 'Optional response curve around center. 1 keeps linear mapping.' })
    public optionalCurvePower = 1;

    @property({ tooltip: 'Allow continuous spawning while the manual spawn area is held.' })
    public holdEnabled = true;

    @property({ tooltip: 'Spawn immediately when touch begins.' })
    public spawnOnTouchStart = true;

    @property({ tooltip: 'Seconds between repeated spawns while holding.' })
    public holdInterval = 0.18;

    @property({ tooltip: 'Print manual spawn touch mapping diagnostics.' })
    public debugLog = false;

    private _uiTransform: UITransform | null = null;
    private readonly _uiLocation = new Vec3();
    private readonly _localTouch = new Vec3();
    private readonly _latestScreenPosition = new Vec2();
    private readonly _latestUiPosition = new Vec2();
    private _isHolding = false;
    private _holdElapsedSeconds = 0;
    private _holdIntervalSpawnCount = 0;

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
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.stopHolding();
    }

    protected update(deltaTime: number): void {
        if (!this._isHolding || !this.holdEnabled) {
            return;
        }

        this._holdElapsedSeconds += deltaTime;
        const interval = Math.max(MIN_HOLD_INTERVAL, this.holdInterval);
        while (this._holdElapsedSeconds >= interval) {
            this._holdElapsedSeconds -= interval;
            this._holdIntervalSpawnCount += 1;
            this.spawnAtLatestTouch(true);
        }
    }

    private onTouchStart(event: EventTouch): void {
        this.recordTouchPosition(event);
        this._isHolding = true;
        this._holdElapsedSeconds = 0;
        this._holdIntervalSpawnCount = 0;

        if (this.spawnOnTouchStart) {
            this.spawnAtLatestTouch(false);
        }
    }

    private onTouchMove(event: EventTouch): void {
        this.recordTouchPosition(event);
    }

    private onTouchEnd(event: EventTouch): void {
        this.recordTouchPosition(event);
        this.stopHolding();
    }

    private onTouchCancel(): void {
        this.stopHolding();
    }

    private recordTouchPosition(event: EventTouch): void {
        const screenLocation = event.getLocation();
        const uiLocation = event.getUILocation();
        this._latestScreenPosition.set(screenLocation.x, screenLocation.y);
        this._latestUiPosition.set(uiLocation.x, uiLocation.y);
    }

    private spawnAtLatestTouch(isHoldIntervalSpawn: boolean): void {
        if (!this.gameManager) {
            return;
        }

        const sample = this.resolveWorldX(
            this._latestScreenPosition.x,
            this._latestScreenPosition.y,
            this._latestUiPosition.x,
            this._latestUiPosition.y,
        );

        if (this.debugLog) {
            log(
                `[ManualSpawnArea] touch=(${formatNumber(this._latestScreenPosition.x)}, ${formatNumber(this._latestScreenPosition.y)}) `
                + `calculatedWorldX=${formatNumber(sample.calculatedWorldX)} `
                + `clampedWorldX=${formatNumber(sample.clampedWorldX)} `
                + `fixedDepthZ=${formatNumber(this.fixedDepthZ)} `
                + `holdIntervalSpawnCount=${isHoldIntervalSpawn ? this._holdIntervalSpawnCount : 0}`,
            );
        }

        this.gameManager.spawnCoinFromManualPosition(sample.clampedWorldX, this.fixedDepthZ, this.debugLog);
    }

    private resolveWorldX(screenX: number, screenY: number, uiX: number, uiY: number): SpawnWorldXSample {
        const rawWorldX = this.tryResolveWorldXFromCameraRay(screenX, screenY)
            ?? this.resolveWorldXFromUiPosition(uiX, uiY);
        const calculatedWorldX = this.applyCalibration(rawWorldX);
        const clampedWorldX = clamp(calculatedWorldX, this.getMinWorldX(), this.getMaxWorldX());

        return {
            calculatedWorldX,
            clampedWorldX,
        };
    }

    private tryResolveWorldXFromCameraRay(screenX: number, screenY: number): number | null {
        if (!this.worldCamera) {
            return null;
        }

        const ray = this.worldCamera.screenPointToRay(screenX, screenY);
        if (Math.abs(ray.d.y) <= RAY_EPSILON) {
            return null;
        }

        const distance = (this.referencePlaneY - ray.o.y) / ray.d.y;
        if (distance < 0 || !Number.isFinite(distance)) {
            return null;
        }

        return ray.o.x + ray.d.x * distance;
    }

    private resolveWorldXFromUiPosition(uiX: number, uiY: number): number {
        if (!this._uiTransform) {
            return (this.worldLeftX + this.worldRightX) * 0.5;
        }

        const width = this._uiTransform.contentSize.width;
        if (width <= MIN_WIDTH) {
            return (this.worldLeftX + this.worldRightX) * 0.5;
        }

        Vec3.set(this._uiLocation, uiX, uiY, 0);
        this._uiTransform.convertToNodeSpaceAR(this._uiLocation, this._localTouch);

        const normalizedX = clamp01(
            (this._localTouch.x + width * this._uiTransform.anchorX) / width,
        );

        return lerp(this.worldLeftX, this.worldRightX, normalizedX);
    }

    private applyCalibration(worldX: number): number {
        const minWorldX = this.getMinWorldX();
        const maxWorldX = this.getMaxWorldX();
        const halfRange = (maxWorldX - minWorldX) * 0.5;

        if (halfRange <= MIN_WIDTH) {
            return worldX + this.xBias;
        }

        const centerX = (minWorldX + maxWorldX) * 0.5;
        const normalizedX = (worldX - centerX) / halfRange;
        const curvePower = this.optionalCurvePower > 0 && Number.isFinite(this.optionalCurvePower)
            ? this.optionalCurvePower
            : 1;
        const curvedX = Math.sign(normalizedX) * Math.pow(Math.abs(normalizedX), curvePower);
        const scale = Number.isFinite(this.xScale) ? this.xScale : 1;
        const bias = Number.isFinite(this.xBias) ? this.xBias : 0;

        return centerX + curvedX * halfRange * scale + bias;
    }

    private stopHolding(): void {
        this._isHolding = false;
        this._holdElapsedSeconds = 0;
    }

    private getMinWorldX(): number {
        return Math.min(this.worldLeftX, this.worldRightX);
    }

    private getMaxWorldX(): number {
        return Math.max(this.worldLeftX, this.worldRightX);
    }
}

interface SpawnWorldXSample {
    calculatedWorldX: number;
    clampedWorldX: number;
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
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

function formatNumber(value: number): string {
    return Number.isFinite(value) ? value.toFixed(3) : String(value);
}
