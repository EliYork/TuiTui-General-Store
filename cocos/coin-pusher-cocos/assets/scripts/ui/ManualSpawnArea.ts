import { _decorator, Camera, Component, EventTouch, log, Node, UITransform, Vec2, Vec3, warn } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;
const MIN_WIDTH = 0.0001;
const MIN_HOLD_INTERVAL = 0.02;
const RAY_EPSILON = 0.000001;

@ccclass('ManualSpawnArea')
export class ManualSpawnArea extends Component {
    @property({
        type: GameManager,
        displayName: '游戏管理器',
        tooltip: '绑定场景中的 GameManager。手动点击和长按投放都会通过它消耗资源并生成当前选中的水果。',
    })
    public gameManager: GameManager | null = null;

    @property({
        type: Camera,
        displayName: '世界相机',
        tooltip: '用于把屏幕触摸位置投射到世界坐标的相机。绑定错误会导致点击位置和实际投放位置不一致。',
    })
    public worldCamera: Camera | null = null;

    @property({
        displayName: '左侧世界 X',
        tooltip: '手动投放区域最左侧对应的世界 X 坐标。数值越小，玩家能投放到更左的位置。',
    })
    public worldLeftX = -1.5;

    @property({
        displayName: '右侧世界 X',
        tooltip: '手动投放区域最右侧对应的世界 X 坐标。数值越大，玩家能投放到更右的位置。',
    })
    public worldRightX = 1.5;

    @property({
        displayName: '固定世界 Z',
        tooltip: '手动投放时固定使用的世界 Z 坐标，决定水果落在前后哪个位置。当前场景实测值为 0.2。',
    })
    public fixedDepthZ = -2;

    @property({
        displayName: '映射参考 Y',
        tooltip: '触摸射线映射时使用的水平参考面世界 Y。通常保持在台面附近，改动会影响触摸到世界坐标的换算。',
    })
    public referencePlaneY = 0;

    @property({
        displayName: 'X 偏移',
        tooltip: '触摸映射完成后额外增加的世界 X 偏移。正数整体右移，负数整体左移，用于微调手感。',
    })
    public xBias = 0;

    @property({
        displayName: 'X 缩放',
        tooltip: '围绕投放范围中心缩放触摸映射的 X 坐标。大于 1 会放大横向响应，小于 1 会让横向移动更保守。',
    })
    public xScale = 1;

    @property({
        displayName: '响应曲线',
        tooltip: '围绕中心点调整横向响应曲线。1 表示线性；大于 1 中心更细腻、边缘变化更明显。',
    })
    public optionalCurvePower = 1;

    @property({
        displayName: '允许长按投放',
        tooltip: '开启后玩家按住手动投放区域会连续投放。关闭后只响应点击开始时的单次投放。',
    })
    public holdEnabled = true;

    @property({
        displayName: '触摸开始即投放',
        tooltip: '开启后手指按下时立即投放一次。关闭后只会在长按间隔到达时投放。',
    })
    public spawnOnTouchStart = true;

    @property({
        displayName: '长按投放间隔',
        tooltip: '长按连续投放的间隔，数值越小投放越快。当前 0.05 手感较好，不建议随意改大。',
    })
    public holdInterval = 0.18;

    @property({
        displayName: '调试日志',
        tooltip: '开启后打印手动投放的触摸映射信息，方便校准落点。正式体验应关闭，避免日志过多。',
    })
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
