import {
    _decorator,
    Component,
    Quat,
    RigidBody,
    Vec3,
    warn,
} from 'cc';
import { ItemPrefabConfig } from './ItemPrefabConfig';

const { ccclass, property } = _decorator;
const WORLD_UP = new Vec3(0, 1, 0);
const LOCAL_UP = new Vec3(0, 1, 0);

@ccclass('CoinBehaviour')
export class CoinBehaviour extends Component {
    @property({
        displayName: '生成稳定时长',
        tooltip: '物体刚生成后用于抑制过度翻滚的时间。数值越大越稳但手感更钝，数值太小可能刚生成就乱滚。',
    })
    public spawnAssistDuration = 0.18;

    @property({
        displayName: '生成水平限速',
        tooltip: '生成稳定期内限制水平速度的上限。数值越小越稳，数值越大物体更容易快速滑动。',
    })
    public maxSpawnHorizontalSpeed = 0.16;

    @property({
        displayName: '生成垂直限速',
        tooltip: '生成稳定期内限制垂直速度的上限。数值越小越不容易弹高，数值越大弹跳更明显。',
    })
    public maxSpawnVerticalSpeed = 0.22;

    @property({
        displayName: '生成自旋限速',
        tooltip: '生成稳定期内限制沿物体法线自旋的速度。数值越小旋转越少，数值越大旋转更活跃。',
    })
    public maxSpawnSpinSpeed = 1.2;

    @property({
        displayName: '生成翻滚限速',
        tooltip: '生成稳定期内限制横向翻滚速度。数值越小更不容易立起来，数值越大翻滚感更强。',
    })
    public maxSpawnTumbleSpeed = 0.35;

    @property({
        displayName: '贴平辅助延迟',
        tooltip: '生成后等待多久开始尝试让物体更平稳地贴到台面。数值越小越快介入，数值越大更自然但可能更乱。',
    })
    public settleAssistDelay = 0.12;

    @property({
        displayName: '贴平水平速度阈值',
        tooltip: '只有水平速度低于该值时才启用贴平辅助。数值越大越容易介入，数值越小只在很慢时介入。',
    })
    public settleAssistSpeedThreshold = 0.08;

    @property({
        displayName: '贴平垂直速度阈值',
        tooltip: '只有垂直速度低于该值时才启用贴平辅助。数值越大更早稳定，数值越小更少干预弹跳。',
    })
    public settleAssistVerticalSpeedThreshold = 0.06;

    @property({
        displayName: '贴平角速度阈值',
        tooltip: '只有角速度低于该值时才启用贴平辅助。数值越大更容易介入，数值越小只在旋转较慢时介入。',
    })
    public settleAssistAngularSpeedThreshold = 1.1;

    @property({
        displayName: '贴平目标角速度',
        tooltip: '贴平辅助使用的目标角速度。数值越大贴平动作更明显，太大可能显得不自然。',
    })
    public settleAssistAngularSpeed = 1.4;

    @property({
        displayName: '贴平混合强度',
        tooltip: '贴平辅助的混合强度。数值越大变平越快，数值越小更自然但稳定更慢。',
    })
    public settleAssistBlend = 7;

    @property({
        displayName: '睡眠阈值',
        tooltip: '物理刚体进入睡眠的速度阈值。保持较低可避免物体还卡在边缘时过早静止。',
    })
    public sleepThreshold = 0.02;

    @property({
        displayName: '低处销毁 Y',
        tooltip: '越界清理阈值：物体低于这个世界 Y 坐标会被销毁，不会触发得分。',
    })
    public despawnBelowY = -10;

    @property({
        displayName: '远处销毁距离',
        tooltip: '越界清理阈值：物体距离场景中心过远会被销毁，用于防止飞出地图后长期占用性能。设为 0 可关闭距离清理。',
    })
    public despawnBeyondDistance = 30;

    private readonly _linearVelocity = new Vec3();
    private readonly _angularVelocity = new Vec3();
    private readonly _parallelAngular = new Vec3();
    private readonly _tumbleAngular = new Vec3();
    private readonly _desiredAngular = new Vec3();
    private readonly _correctedAngular = new Vec3();
    private readonly _flattenAxis = new Vec3();
    private readonly _itemNormal = new Vec3();
    private readonly _worldRotation = new Quat();
    private readonly _worldPosition = new Vec3();
    private readonly _zeroVelocity = new Vec3();
    private _body: RigidBody | null = null;
    private _coinId = 0;
    private _hasScored = false;
    private _aliveSeconds = 0;
    private _itemId = '';
    private _itemName = '';
    private _fallbackItemId = '';

    public get coinId(): number {
        return this._coinId;
    }

    public get hasScored(): boolean {
        return this._hasScored;
    }

    public get itemId(): string {
        return this._itemId;
    }

    public get itemName(): string {
        return this._itemName;
    }

    public get itemTypeLabel(): string {
        return this._itemName || this._itemId || 'BoardItem';
    }

    protected onLoad(): void {
        this._body = this.getComponent(RigidBody);
        this._fallbackItemId = this.node.name;

        if (this._body) {
            this._body.sleepThreshold = this.sleepThreshold;
        } else {
            warn('[CoinBehaviour] Each runtime item prefab should include its own RigidBody.');
        }

        this.refreshItemIdentity();
    }

    public initialize(coinId: number): void {
        this._coinId = coinId;
        this._hasScored = false;
        this._aliveSeconds = 0;
        this.refreshItemIdentity();

        if (!this._body) {
            return;
        }

        this._body.sleepThreshold = this.sleepThreshold;
        this._body.wakeUp();
        this._body.setLinearVelocity(this._zeroVelocity);
        this._body.setAngularVelocity(this._zeroVelocity);
    }

    protected update(deltaTime: number): void {
        if (this._hasScored) {
            return;
        }

        if (this.isOutOfWorldBounds()) {
            this.node.destroy();
            return;
        }

        if (!this._body) {
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

    private refreshItemIdentity(): void {
        const prefabConfig = ItemPrefabConfig.readFromNode(
            this.node,
            this._fallbackItemId || this.node.name,
            this._itemName,
        );
        this._itemId = prefabConfig.itemId;
        this._itemName = prefabConfig.itemName;
        this.updateItemName();
    }

    private updateItemName(): void {
        const baseName = this._itemId || this._fallbackItemId || 'BoardItem';
        this.node.name = this._coinId > 0 ? `${baseName}_${this._coinId}` : baseName;
    }

    private isOutOfWorldBounds(): boolean {
        this.node.getWorldPosition(this._worldPosition);
        if (this._worldPosition.y < this.despawnBelowY) {
            return true;
        }

        const maxDistance = Math.max(0, this.despawnBeyondDistance);
        return maxDistance > 0 && Vec3.lengthSqr(this._worldPosition) > maxDistance * maxDistance;
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
        this.getItemNormal(this._itemNormal);

        const spinSpeed = Vec3.dot(this._angularVelocity, this._itemNormal);
        Vec3.multiplyScalar(
            this._parallelAngular,
            this._itemNormal,
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

        this.getItemNormal(this._itemNormal);
        if (this._itemNormal.y > 0.995) {
            return;
        }

        Vec3.cross(this._flattenAxis, this._itemNormal, WORLD_UP);
        const axisLength = Vec3.len(this._flattenAxis);
        if (axisLength <= 0.0001) {
            return;
        }

        Vec3.multiplyScalar(this._flattenAxis, this._flattenAxis, 1 / axisLength);

        const tiltFactor = clamp01(1 - this._itemNormal.y);
        Vec3.multiplyScalar(
            this._desiredAngular,
            this._flattenAxis,
            this.settleAssistAngularSpeed * tiltFactor,
        );

        const retainedSpin = Vec3.dot(this._angularVelocity, this._itemNormal) * 0.15;
        Vec3.scaleAndAdd(this._desiredAngular, this._desiredAngular, this._itemNormal, retainedSpin);

        const blend = 1 - Math.exp(-this.settleAssistBlend * deltaTime);
        Vec3.lerp(this._correctedAngular, this._angularVelocity, this._desiredAngular, blend);
        this._body.setAngularVelocity(this._correctedAngular);
        this._body.wakeUp();
    }

    private getItemNormal(out: Vec3): void {
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
