import { _decorator, Component, instantiate, Node, Prefab, Quat, Vec3, warn } from 'cc';
import { CoinBehaviour } from './CoinBehaviour';

const { ccclass, property } = _decorator;
const LOCAL_RIGHT = new Vec3(1, 0, 0);
const LOCAL_UP = new Vec3(0, 1, 0);
const LOCAL_FORWARD = new Vec3(0, 0, 1);

export interface CoinSpawnRequest {
    worldPosition?: Vec3 | null;
    randomizeAroundPosition?: boolean;
}

function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

@ccclass('CoinSpawner')
export class CoinSpawner extends Component {
    @property({
        type: Node,
        displayName: '投放点',
        tooltip: '生成物体时参考的世界位置和朝向。为空时使用当前节点自身位置；绑定 SpawnPoint 可更直观地调整落点。',
    })
    public spawnPoint: Node | null = null;

    @property({
        type: Node,
        displayName: '物体根节点',
        tooltip: '新生成物体会挂到这个节点下，方便统一管理和清理。为空时会挂到 CoinSpawner 所在节点。',
    })
    public coinRoot: Node | null = null;

    @property({
        displayName: '随机 X 范围',
        tooltip: '随机掉落时在 X 方向的散布范围。数值越大左右分布越宽；手动指定位置的投放不会使用这个随机范围。',
    })
    public spawnSpreadX = 0.18;

    @property({
        displayName: '随机 Z 范围',
        tooltip: '随机掉落时在 Z 方向的散布范围。数值越大前后分布越散；手动指定位置的投放不会使用这个随机范围。',
    })
    public spawnSpreadZ = 0.08;

    @property({
        displayName: '生成高度偏移',
        tooltip: '在基础投放点 Y 上额外增加的高度。数值越大生成越高，太小可能贴住台面，太大可能弹跳明显。',
    })
    public spawnHeightOffset = 0;

    @property({
        displayName: '基础水平旋转',
        tooltip: '生成时额外叠加的基础 Yaw 角度。通常保持 0，只有投放点朝向需要整体偏转时再调整。',
    })
    public spawnYawDegrees = 0;

    @property({
        displayName: '随机水平旋转',
        tooltip: '生成时围绕物体法线随机旋转的角度范围。数值越大外观变化越多，但不会让物体明显竖起来。',
    })
    public randomYawDegrees = 180;

    @property({
        displayName: '基础 X 倾斜',
        tooltip: '生成时在 X 轴上的基础倾斜角。0 表示尽量平放，数值过大可能让物体更容易翻滚。',
    })
    public baseTiltXDegrees = 0;

    @property({
        displayName: '基础 Z 倾斜',
        tooltip: '生成时在 Z 轴上的基础倾斜角。0 表示尽量平放，数值过大可能让物体更容易卡边或翻滚。',
    })
    public baseTiltZDegrees = 0;

    @property({
        displayName: '随机 X 倾斜',
        tooltip: '生成时额外随机的 X 倾斜范围。保持较小可避免物体一生成就立起来。',
    })
    public randomTiltXDegrees = 4;

    @property({
        displayName: '随机 Z 倾斜',
        tooltip: '生成时额外随机的 Z 倾斜范围。保持较小可避免物体一生成就卡住或弹飞。',
    })
    public randomTiltZDegrees = 4;

    @property({
        displayName: '向上冲量',
        tooltip: '生成后施加的向上冲量。数值越大越容易弹起，数值太小会显得投放缺少动感。',
    })
    public launchUpImpulse = 0.008;

    @property({
        displayName: '向前冲量',
        tooltip: '生成后沿投放点前方施加的冲量。负值会向机器前方推进；绝对值越大初速度越明显。',
    })
    public launchForwardImpulse = -0.02;

    @property({
        displayName: '随机侧向冲量',
        tooltip: '生成后左右方向的随机冲量范围。数值越大落点越不稳定，太大可能飞出机器区域。',
    })
    public randomSideImpulse = 0.003;

    @property({
        displayName: '随机旋转力矩',
        tooltip: '生成后施加的随机旋转力矩。数值越大旋转越明显，太大可能导致物体翻滚过强。',
    })
    public spinTorque = 0.0025;

    private _nextCoinId = 1;
    private readonly _spawnBaseRotation = new Quat();
    private readonly _spawnRotationOffset = new Quat();
    private readonly _spawnRotation = new Quat();
    private readonly _rightAxis = new Vec3();
    private readonly _upAxis = new Vec3();
    private readonly _forwardAxis = new Vec3();
    private readonly _spawnImpulse = new Vec3();
    private readonly _spawnTorque = new Vec3();
    private readonly _itemNormal = new Vec3();
    private readonly _resolvedBasePosition = new Vec3();

    public spawnCoin(itemPrefab: Prefab | null, request: CoinSpawnRequest | null = null): CoinBehaviour | null {
        if (!itemPrefab) {
            warn('[CoinSpawner] item prefab is not assigned.');
            return null;
        }

        const itemNode = instantiate(itemPrefab);
        const parent = this.coinRoot ?? this.node;
        parent.addChild(itemNode);

        const basePosition = this.resolveBasePosition(request);
        const shouldRandomize = this.shouldRandomizePosition(request);
        const rotationSource = this.spawnPoint ?? this.node;
        rotationSource.getWorldRotation(this._spawnBaseRotation);

        itemNode.setWorldPosition(new Vec3(
            basePosition.x + (shouldRandomize ? randomRange(-this.spawnSpreadX, this.spawnSpreadX) : 0),
            basePosition.y + this.spawnHeightOffset,
            basePosition.z + (shouldRandomize ? randomRange(-this.spawnSpreadZ, this.spawnSpreadZ) : 0),
        ));

        const tiltX = this.baseTiltXDegrees + randomRange(-this.randomTiltXDegrees, this.randomTiltXDegrees);
        const tiltZ = this.baseTiltZDegrees + randomRange(-this.randomTiltZDegrees, this.randomTiltZDegrees);
        const yaw = this.spawnYawDegrees + randomRange(-this.randomYawDegrees, this.randomYawDegrees);

        Quat.fromEuler(this._spawnRotationOffset, tiltX, yaw, tiltZ);
        Quat.multiply(this._spawnRotation, this._spawnBaseRotation, this._spawnRotationOffset);
        itemNode.setWorldRotation(this._spawnRotation);

        const item = itemNode.getComponent(CoinBehaviour);
        if (!item) {
            warn('[CoinSpawner] Spawned item prefab is missing CoinBehaviour.');
            itemNode.destroy();
            return null;
        }

        item.initialize(this._nextCoinId);

        Vec3.transformQuat(this._rightAxis, LOCAL_RIGHT, this._spawnBaseRotation);
        Vec3.transformQuat(this._upAxis, LOCAL_UP, this._spawnBaseRotation);
        Vec3.transformQuat(this._forwardAxis, LOCAL_FORWARD, this._spawnBaseRotation);

        Vec3.set(this._spawnImpulse, 0, 0, 0);
        Vec3.scaleAndAdd(
            this._spawnImpulse,
            this._spawnImpulse,
            this._rightAxis,
            randomRange(-this.randomSideImpulse, this.randomSideImpulse),
        );
        Vec3.scaleAndAdd(this._spawnImpulse, this._spawnImpulse, this._upAxis, this.launchUpImpulse);
        Vec3.scaleAndAdd(this._spawnImpulse, this._spawnImpulse, this._forwardAxis, this.launchForwardImpulse);

        Vec3.transformQuat(this._itemNormal, LOCAL_UP, this._spawnRotation);
        Vec3.multiplyScalar(
            this._spawnTorque,
            this._itemNormal,
            randomRange(-this.spinTorque, this.spinTorque),
        );

        item.applyLaunchImpulse(this._spawnImpulse, this._spawnTorque);

        this._nextCoinId += 1;
        return item;
    }

    public getBaseSpawnWorldPosition(out: Vec3 | null = null): Vec3 {
        const target = out ?? new Vec3();
        const source = this.spawnPoint?.worldPosition ?? this.node.worldPosition;
        Vec3.copy(target, source);
        return target;
    }

    private resolveBasePosition(request: CoinSpawnRequest | null): Vec3 {
        if (request?.worldPosition) {
            return request.worldPosition;
        }

        return this.getBaseSpawnWorldPosition(this._resolvedBasePosition);
    }

    private shouldRandomizePosition(request: CoinSpawnRequest | null): boolean {
        if (typeof request?.randomizeAroundPosition === 'boolean') {
            return request.randomizeAroundPosition;
        }

        return !request?.worldPosition;
    }
}
