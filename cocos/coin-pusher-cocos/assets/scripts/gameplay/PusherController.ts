import { _decorator, Component, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PusherController')
export class PusherController extends Component {
    @property
    public cycleSeconds = 2.2;

    @property({ type: Vec3, tooltip: 'Local-space offset from the resting position to the fully extended position.' })
    public travelOffset = new Vec3(0, 0, -1.6);

    @property({ tooltip: '0 means start fully retracted, 1 means start fully extended.' })
    public startNormalizedTime = 0;

    private readonly _retractedPosition = new Vec3();
    private readonly _extendedPosition = new Vec3();
    private readonly _workingPosition = new Vec3();
    private _elapsedSeconds = 0;

    protected onLoad(): void {
        this.node.getPosition(this._retractedPosition);
        Vec3.set(
            this._extendedPosition,
            this._retractedPosition.x + this.travelOffset.x,
            this._retractedPosition.y + this.travelOffset.y,
            this._retractedPosition.z + this.travelOffset.z,
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
}
