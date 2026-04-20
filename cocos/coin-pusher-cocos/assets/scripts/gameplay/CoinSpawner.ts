import { _decorator, Component, instantiate, Node, Prefab, Quat, Vec3, warn } from 'cc';
import { CoinBehaviour } from './CoinBehaviour';

const { ccclass, property } = _decorator;
const LOCAL_RIGHT = new Vec3(1, 0, 0);
const LOCAL_UP = new Vec3(0, 1, 0);
const LOCAL_FORWARD = new Vec3(0, 0, 1);

function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

@ccclass('CoinSpawner')
export class CoinSpawner extends Component {
    @property(Prefab)
    public coinPrefab: Prefab | null = null;

    @property(Node)
    public spawnPoint: Node | null = null;

    @property(Node)
    public coinRoot: Node | null = null;

    @property
    public spawnSpreadX = 0.18;

    @property
    public spawnSpreadZ = 0.08;

    @property
    public spawnHeightOffset = 0;

    @property({ tooltip: 'Base local yaw added on spawn. Keep at 0 unless the spawn point needs an offset.' })
    public spawnYawDegrees = 0;

    @property({ tooltip: 'Random yaw range around the coin normal. This adds visual variation without making the coin stand up.' })
    public randomYawDegrees = 180;

    @property({ tooltip: 'Small base tilt on the X axis. 0 means spawn almost flat.' })
    public baseTiltXDegrees = 0;

    @property({ tooltip: 'Small base tilt on the Z axis. 0 means spawn almost flat.' })
    public baseTiltZDegrees = 0;

    @property({ tooltip: 'Random X tilt range. Keep this small so the coin does not spawn on edge.' })
    public randomTiltXDegrees = 4;

    @property({ tooltip: 'Random Z tilt range. Keep this small so the coin does not spawn on edge.' })
    public randomTiltZDegrees = 4;

    @property
    public launchUpImpulse = 0.008;

    @property
    public launchForwardImpulse = -0.02;

    @property
    public randomSideImpulse = 0.003;

    @property
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
    private readonly _coinNormal = new Vec3();

    public spawnCoin(): CoinBehaviour | null {
        if (!this.coinPrefab) {
            warn('[CoinSpawner] coinPrefab is not assigned.');
            return null;
        }

        const coinNode = instantiate(this.coinPrefab);
        const parent = this.coinRoot ?? this.node;
        parent.addChild(coinNode);

        const basePosition = this.spawnPoint ? this.spawnPoint.worldPosition : this.node.worldPosition;
        const rotationSource = this.spawnPoint ?? this.node;
        rotationSource.getWorldRotation(this._spawnBaseRotation);

        coinNode.setWorldPosition(new Vec3(
            basePosition.x + randomRange(-this.spawnSpreadX, this.spawnSpreadX),
            basePosition.y + this.spawnHeightOffset,
            basePosition.z + randomRange(-this.spawnSpreadZ, this.spawnSpreadZ),
        ));

        const tiltX = this.baseTiltXDegrees + randomRange(-this.randomTiltXDegrees, this.randomTiltXDegrees);
        const tiltZ = this.baseTiltZDegrees + randomRange(-this.randomTiltZDegrees, this.randomTiltZDegrees);
        const yaw = this.spawnYawDegrees + randomRange(-this.randomYawDegrees, this.randomYawDegrees);

        Quat.fromEuler(this._spawnRotationOffset, tiltX, yaw, tiltZ);
        Quat.multiply(this._spawnRotation, this._spawnBaseRotation, this._spawnRotationOffset);
        coinNode.setWorldRotation(this._spawnRotation);

        const coin = coinNode.getComponent(CoinBehaviour);
        if (!coin) {
            warn('[CoinSpawner] Spawned prefab is missing CoinBehaviour.');
            coinNode.destroy();
            return null;
        }

        coin.initialize(this._nextCoinId);

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

        Vec3.transformQuat(this._coinNormal, LOCAL_UP, this._spawnRotation);
        Vec3.multiplyScalar(
            this._spawnTorque,
            this._coinNormal,
            randomRange(-this.spinTorque, this.spinTorque),
        );

        coin.applyLaunchImpulse(this._spawnImpulse, this._spawnTorque);

        this._nextCoinId += 1;
        return coin;
    }
}
