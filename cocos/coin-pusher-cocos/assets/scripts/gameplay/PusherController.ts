import { _decorator, Component, Vec3 } from 'cc';

const { ccclass, property } = _decorator;
const DEFAULT_LEGACY_TRAVEL_OFFSET = new Vec3(0, 0, -1.6);
const DEFAULT_PUSH_OFFSET_X = 0;
const DEFAULT_PUSH_FLOAT_Y = 0;
const DEFAULT_PUSH_OFFSET_Z = -1.6;
const EPSILON = 0.0001;

@ccclass('PusherController')
export class PusherController extends Component {
    @property
    public cycleSeconds = 2.2;

    @property({ tooltip: 'Full extension offset on local X. Use this when the pusher needs sideways drift.' })
    public pushOffsetX = DEFAULT_PUSH_OFFSET_X;

    @property({ tooltip: 'Full extension offset on local Y. This is the pusher float amount.' })
    public pushFloatY = DEFAULT_PUSH_FLOAT_Y;

    @property({ tooltip: 'Full extension offset on local Z. Negative values push forward into the board.' })
    public pushOffsetZ = DEFAULT_PUSH_OFFSET_Z;

    @property({ visible: false, type: Vec3, tooltip: 'Legacy serialized offset kept only for backward compatibility.' })
    public travelOffset = new Vec3(
        DEFAULT_LEGACY_TRAVEL_OFFSET.x,
        DEFAULT_LEGACY_TRAVEL_OFFSET.y,
        DEFAULT_LEGACY_TRAVEL_OFFSET.z,
    );

    @property({ tooltip: '0 means start fully retracted, 1 means start fully extended.' })
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
