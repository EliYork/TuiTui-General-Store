import { _decorator, Component, Quat, RigidBody, Vec3 } from 'cc';

const { ccclass, property } = _decorator;
const WORLD_UP = new Vec3(0, 1, 0);
const LOCAL_UP = new Vec3(0, 1, 0);

@ccclass('CoinBehaviour')
export class CoinBehaviour extends Component {
    @property
    public coinValue = 1;

    @property({ tooltip: 'How long the spawn stabilizer should suppress tumble right after the coin is created.' })
    public spawnAssistDuration = 0.18;

    @property({ tooltip: 'Clamp for horizontal speed during the spawn assist window.' })
    public maxSpawnHorizontalSpeed = 0.16;

    @property({ tooltip: 'Clamp for vertical speed during the spawn assist window.' })
    public maxSpawnVerticalSpeed = 0.22;

    @property({ tooltip: 'Maximum spin speed along the coin normal during the spawn assist window.' })
    public maxSpawnSpinSpeed = 1.2;

    @property({ tooltip: 'Maximum tumble speed across the coin plane during the spawn assist window.' })
    public maxSpawnTumbleSpeed = 0.35;

    @property({ tooltip: 'Delay before the coin starts trying to settle flatter on the board.' })
    public settleAssistDelay = 0.12;

    @property({ tooltip: 'Only apply the settle assist when horizontal motion is already slow.' })
    public settleAssistSpeedThreshold = 0.08;

    @property({ tooltip: 'Only apply the settle assist when vertical motion is already small.' })
    public settleAssistVerticalSpeedThreshold = 0.06;

    @property({ tooltip: 'Only apply the settle assist when angular speed is already under control.' })
    public settleAssistAngularSpeedThreshold = 1.1;

    @property({ tooltip: 'Target angular speed used to help a resting coin topple toward flat.' })
    public settleAssistAngularSpeed = 1.4;

    @property({ tooltip: 'Blend factor for the settle assist. Higher values flatten faster.' })
    public settleAssistBlend = 7;

    @property({ tooltip: 'Keep this low so the body does not fall asleep while still balancing on its edge.' })
    public sleepThreshold = 0.02;

    private readonly _linearVelocity = new Vec3();
    private readonly _angularVelocity = new Vec3();
    private readonly _parallelAngular = new Vec3();
    private readonly _tumbleAngular = new Vec3();
    private readonly _desiredAngular = new Vec3();
    private readonly _correctedAngular = new Vec3();
    private readonly _flattenAxis = new Vec3();
    private readonly _coinNormal = new Vec3();
    private readonly _worldRotation = new Quat();
    private readonly _zeroVelocity = new Vec3();
    private _body: RigidBody | null = null;
    private _coinId = 0;
    private _hasScored = false;
    private _aliveSeconds = 0;

    public get coinId(): number {
        return this._coinId;
    }

    public get hasScored(): boolean {
        return this._hasScored;
    }

    protected onLoad(): void {
        this._body = this.getComponent(RigidBody);
        if (this._body) {
            this._body.sleepThreshold = this.sleepThreshold;
        }
    }

    public initialize(coinId: number): void {
        this._coinId = coinId;
        this._hasScored = false;
        this._aliveSeconds = 0;
        this.node.name = `Coin_${coinId}`;

        if (!this._body) {
            return;
        }

        this._body.sleepThreshold = this.sleepThreshold;
        this._body.wakeUp();
        this._body.setLinearVelocity(this._zeroVelocity);
        this._body.setAngularVelocity(this._zeroVelocity);
    }

    protected update(deltaTime: number): void {
        if (!this._body || this._hasScored) {
            return;
        }

        this._aliveSeconds += deltaTime;

        if (this._aliveSeconds <= this.spawnAssistDuration) {
            this.applySpawnAssist();
        }

        if (this._aliveSeconds >= this.settleAssistDelay) {
            this.applySettleAssist(deltaTime);
        }
    }

    public applyLaunchImpulse(impulse: Vec3, torque: Vec3): void {
        if (!this._body) {
            return;
        }

        this._body.wakeUp();
        this._body.applyImpulse(impulse);

        if (Vec3.lengthSqr(torque) > 0) {
            this._body.applyTorque(torque);
        }
    }

    public tryMarkScored(): boolean {
        if (this._hasScored) {
            return false;
        }

        this._hasScored = true;
        return true;
    }

    public onScored(): void {
        this.scheduleOnce(() => {
            if (this.node.isValid) {
                this.node.destroy();
            }
        }, 0);
    }

    private applySpawnAssist(): void {
        if (!this._body) {
            return;
        }

        this._body.getLinearVelocity(this._linearVelocity);
        const horizontalSpeed = Math.hypot(this._linearVelocity.x, this._linearVelocity.z);
        if (horizontalSpeed > this.maxSpawnHorizontalSpeed && horizontalSpeed > 0) {
            const ratio = this.maxSpawnHorizontalSpeed / horizontalSpeed;
            this._linearVelocity.x *= ratio;
            this._linearVelocity.z *= ratio;
        }

        this._linearVelocity.y = clamp(
            this._linearVelocity.y,
            -this.maxSpawnVerticalSpeed,
            this.maxSpawnVerticalSpeed,
        );
        this._body.setLinearVelocity(this._linearVelocity);

        this._body.getAngularVelocity(this._angularVelocity);
        this.getCoinNormal(this._coinNormal);

        const spinSpeed = Vec3.dot(this._angularVelocity, this._coinNormal);
        Vec3.multiplyScalar(
            this._parallelAngular,
            this._coinNormal,
            clamp(spinSpeed, -this.maxSpawnSpinSpeed, this.maxSpawnSpinSpeed),
        );

        Vec3.subtract(this._tumbleAngular, this._angularVelocity, this._parallelAngular);
        clampVec3Magnitude(this._tumbleAngular, this.maxSpawnTumbleSpeed);

        Vec3.add(this._correctedAngular, this._parallelAngular, this._tumbleAngular);
        this._body.setAngularVelocity(this._correctedAngular);
    }

    private applySettleAssist(deltaTime: number): void {
        if (!this._body) {
            return;
        }

        this._body.getLinearVelocity(this._linearVelocity);
        const horizontalSpeed = Math.hypot(this._linearVelocity.x, this._linearVelocity.z);
        const verticalSpeed = Math.abs(this._linearVelocity.y);
        if (
            horizontalSpeed > this.settleAssistSpeedThreshold ||
            verticalSpeed > this.settleAssistVerticalSpeedThreshold
        ) {
            return;
        }

        this._body.getAngularVelocity(this._angularVelocity);
        if (Vec3.len(this._angularVelocity) > this.settleAssistAngularSpeedThreshold) {
            return;
        }

        this.getCoinNormal(this._coinNormal);
        if (this._coinNormal.y > 0.995) {
            return;
        }

        Vec3.cross(this._flattenAxis, this._coinNormal, WORLD_UP);
        const axisLength = Vec3.len(this._flattenAxis);
        if (axisLength <= 0.0001) {
            return;
        }

        Vec3.multiplyScalar(this._flattenAxis, this._flattenAxis, 1 / axisLength);

        const tiltFactor = clamp01(1 - this._coinNormal.y);
        Vec3.multiplyScalar(
            this._desiredAngular,
            this._flattenAxis,
            this.settleAssistAngularSpeed * tiltFactor,
        );

        const retainedSpin = Vec3.dot(this._angularVelocity, this._coinNormal) * 0.15;
        Vec3.scaleAndAdd(this._desiredAngular, this._desiredAngular, this._coinNormal, retainedSpin);

        const blend = 1 - Math.exp(-this.settleAssistBlend * deltaTime);
        Vec3.lerp(this._correctedAngular, this._angularVelocity, this._desiredAngular, blend);
        this._body.setAngularVelocity(this._correctedAngular);
        this._body.wakeUp();
    }

    private getCoinNormal(out: Vec3): void {
        this.node.getWorldRotation(this._worldRotation);
        Vec3.transformQuat(out, LOCAL_UP, this._worldRotation);

        if (out.y < 0) {
            Vec3.multiplyScalar(out, out, -1);
        }
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
    return clamp(value, 0, 1);
}

function clampVec3Magnitude(vector: Vec3, maxLength: number): void {
    const length = Vec3.len(vector);
    if (length <= maxLength || length === 0) {
        return;
    }

    Vec3.multiplyScalar(vector, vector, maxLength / length);
}
