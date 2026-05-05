import { _decorator, Component, Vec3 } from 'cc';

const { ccclass, property } = _decorator;
const DEFAULT_LEGACY_TRAVEL_OFFSET = new Vec3(0, 0, -1.6);
const DEFAULT_PUSH_OFFSET_X = 0;
const DEFAULT_PUSH_FLOAT_Y = 0;
const DEFAULT_PUSH_OFFSET_Z = -1.6;
const EPSILON = 0.0001;

@ccclass('PusherController')
export class PusherController extends Component {
    @property({
        displayName: '推板周期',
        tooltip: '推板完成一次往返运动所需秒数。数值越小推板越快，数值越大推板越慢。',
    })
    public cycleSeconds = 2.2;

    @property({
        displayName: '推板 X 位移',
        tooltip: '推板完全伸出时在本地 X 方向的偏移。通常保持 0，只有需要左右漂移时调整。',
    })
    public pushOffsetX = DEFAULT_PUSH_OFFSET_X;

    @property({
        displayName: '推板 Y 位移',
        tooltip: '推板完全伸出时在本地 Y 方向的偏移。数值越大推板越上浮，通常保持 0。',
    })
    public pushFloatY = DEFAULT_PUSH_FLOAT_Y;

    @property({
        displayName: '推板 Z 位移',
        tooltip: '推板完全伸出时在本地 Z 方向的偏移。负值会向台面前方推进，绝对值越大推得越远。',
    })
    public pushOffsetZ = DEFAULT_PUSH_OFFSET_Z;

    @property({
        visible: false,
        type: Vec3,
        displayName: '旧版位移',
        tooltip: '旧版本序列化保留字段，仅用于兼容迁移。不要在 Inspector 中手动调整。',
    })
    public travelOffset = new Vec3(
        DEFAULT_LEGACY_TRAVEL_OFFSET.x,
        DEFAULT_LEGACY_TRAVEL_OFFSET.y,
        DEFAULT_LEGACY_TRAVEL_OFFSET.z,
    );

    @property({
        displayName: '起始进度',
        tooltip: '推板动画的起始归一化进度。0 表示完全收回，1 表示完全伸出，可用于调试开局位置。',
    })
    public startNormalizedTime = 0;

    private readonly _resolvedTravelOffset = new Vec3();
    private readonly _retractedPosition = new Vec3();
    private readonly _extendedPosition = new Vec3();
    private readonly _workingPosition = new Vec3();
    private _elapsedSeconds = 0;

    protected onLoad(): void {
        this.migrateLegacyTravelOffsetIfNeeded();
        this.updateResolvedTravelOffset();
        this.node.getPosition(this._retractedPosition);
        Vec3.set(
            this._extendedPosition,
            this._retractedPosition.x + this._resolvedTravelOffset.x,
            this._retractedPosition.y + this._resolvedTravelOffset.y,
            this._retractedPosition.z + this._resolvedTravelOffset.z,
        );
        this._elapsedSeconds = this.startNormalizedTime * Math.max(this.cycleSeconds, 0.01);
        this.syncPosition();
    }

    protected update(deltaTime: number): void {
        if (this.cycleSeconds <= 0) {
            return;
        }

        this._elapsedSeconds = (this._elapsedSeconds + deltaTime) % this.cycleSeconds;
        this.syncPosition();
    }

    private syncPosition(): void {
        const phase = this._elapsedSeconds / Math.max(this.cycleSeconds, 0.01);
        const pingPong = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
        Vec3.lerp(this._workingPosition, this._retractedPosition, this._extendedPosition, pingPong);
        this.node.setPosition(this._workingPosition);
    }

    private migrateLegacyTravelOffsetIfNeeded(): void {
        const splitParamsStillDefault =
            nearlyEqual(this.pushOffsetX, DEFAULT_PUSH_OFFSET_X) &&
            nearlyEqual(this.pushFloatY, DEFAULT_PUSH_FLOAT_Y) &&
            nearlyEqual(this.pushOffsetZ, DEFAULT_PUSH_OFFSET_Z);
        const legacyOffsetChanged =
            !nearlyEqual(this.travelOffset.x, DEFAULT_LEGACY_TRAVEL_OFFSET.x) ||
            !nearlyEqual(this.travelOffset.y, DEFAULT_LEGACY_TRAVEL_OFFSET.y) ||
            !nearlyEqual(this.travelOffset.z, DEFAULT_LEGACY_TRAVEL_OFFSET.z);

        if (!splitParamsStillDefault || !legacyOffsetChanged) {
            return;
        }

        this.pushOffsetX = this.travelOffset.x;
        this.pushFloatY = this.travelOffset.y;
        this.pushOffsetZ = this.travelOffset.z;
    }

    private updateResolvedTravelOffset(): void {
        Vec3.set(
            this._resolvedTravelOffset,
            this.pushOffsetX,
            this.pushFloatY,
            this.pushOffsetZ,
        );
    }
}

function nearlyEqual(a: number, b: number): boolean {
    return Math.abs(a - b) <= EPSILON;
}
