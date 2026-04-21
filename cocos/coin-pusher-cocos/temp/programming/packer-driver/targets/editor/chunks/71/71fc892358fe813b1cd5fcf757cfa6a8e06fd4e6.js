System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, instantiate, Node, Quat, Vec3, warn, CoinBehaviour, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _crd, ccclass, property, LOCAL_RIGHT, LOCAL_UP, LOCAL_FORWARD, CoinSpawner;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function _reportPossibleCrUseOfCoinBehaviour(extras) {
    _reporterNs.report("CoinBehaviour", "./CoinBehaviour", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      instantiate = _cc.instantiate;
      Node = _cc.Node;
      Quat = _cc.Quat;
      Vec3 = _cc.Vec3;
      warn = _cc.warn;
    }, function (_unresolved_2) {
      CoinBehaviour = _unresolved_2.CoinBehaviour;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "08942/Jny5P4LKne0Lc4Arp", "CoinSpawner", undefined);

      __checkObsolete__(['_decorator', 'Component', 'instantiate', 'Node', 'Prefab', 'Quat', 'Vec3', 'warn']);

      ({
        ccclass,
        property
      } = _decorator);
      LOCAL_RIGHT = new Vec3(1, 0, 0);
      LOCAL_UP = new Vec3(0, 1, 0);
      LOCAL_FORWARD = new Vec3(0, 0, 1);

      _export("CoinSpawner", CoinSpawner = (_dec = ccclass('CoinSpawner'), _dec2 = property(Node), _dec3 = property(Node), _dec4 = property({
        tooltip: 'Base local yaw added on spawn. Keep at 0 unless the spawn point needs an offset.'
      }), _dec5 = property({
        tooltip: 'Random yaw range around the item normal. This adds visual variation without making the body stand up.'
      }), _dec6 = property({
        tooltip: 'Small base tilt on the X axis. 0 means spawn almost flat.'
      }), _dec7 = property({
        tooltip: 'Small base tilt on the Z axis. 0 means spawn almost flat.'
      }), _dec8 = property({
        tooltip: 'Random X tilt range. Keep this small so the body does not spawn on edge.'
      }), _dec9 = property({
        tooltip: 'Random Z tilt range. Keep this small so the body does not spawn on edge.'
      }), _dec(_class = (_class2 = class CoinSpawner extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "spawnPoint", _descriptor, this);

          _initializerDefineProperty(this, "coinRoot", _descriptor2, this);

          _initializerDefineProperty(this, "spawnSpreadX", _descriptor3, this);

          _initializerDefineProperty(this, "spawnSpreadZ", _descriptor4, this);

          _initializerDefineProperty(this, "spawnHeightOffset", _descriptor5, this);

          _initializerDefineProperty(this, "spawnYawDegrees", _descriptor6, this);

          _initializerDefineProperty(this, "randomYawDegrees", _descriptor7, this);

          _initializerDefineProperty(this, "baseTiltXDegrees", _descriptor8, this);

          _initializerDefineProperty(this, "baseTiltZDegrees", _descriptor9, this);

          _initializerDefineProperty(this, "randomTiltXDegrees", _descriptor10, this);

          _initializerDefineProperty(this, "randomTiltZDegrees", _descriptor11, this);

          _initializerDefineProperty(this, "launchUpImpulse", _descriptor12, this);

          _initializerDefineProperty(this, "launchForwardImpulse", _descriptor13, this);

          _initializerDefineProperty(this, "randomSideImpulse", _descriptor14, this);

          _initializerDefineProperty(this, "spinTorque", _descriptor15, this);

          this._nextCoinId = 1;
          this._spawnBaseRotation = new Quat();
          this._spawnRotationOffset = new Quat();
          this._spawnRotation = new Quat();
          this._rightAxis = new Vec3();
          this._upAxis = new Vec3();
          this._forwardAxis = new Vec3();
          this._spawnImpulse = new Vec3();
          this._spawnTorque = new Vec3();
          this._itemNormal = new Vec3();
        }

        spawnCoin(itemPrefab, request = null) {
          var _this$coinRoot, _this$spawnPoint;

          if (!itemPrefab) {
            warn('[CoinSpawner] item prefab is not assigned.');
            return null;
          }

          const itemNode = instantiate(itemPrefab);
          const parent = (_this$coinRoot = this.coinRoot) != null ? _this$coinRoot : this.node;
          parent.addChild(itemNode);
          const basePosition = this.resolveBasePosition(request);
          const shouldRandomize = this.shouldRandomizePosition(request);
          const rotationSource = (_this$spawnPoint = this.spawnPoint) != null ? _this$spawnPoint : this.node;
          rotationSource.getWorldRotation(this._spawnBaseRotation);
          itemNode.setWorldPosition(new Vec3(basePosition.x + (shouldRandomize ? randomRange(-this.spawnSpreadX, this.spawnSpreadX) : 0), basePosition.y + this.spawnHeightOffset, basePosition.z + (shouldRandomize ? randomRange(-this.spawnSpreadZ, this.spawnSpreadZ) : 0)));
          const tiltX = this.baseTiltXDegrees + randomRange(-this.randomTiltXDegrees, this.randomTiltXDegrees);
          const tiltZ = this.baseTiltZDegrees + randomRange(-this.randomTiltZDegrees, this.randomTiltZDegrees);
          const yaw = this.spawnYawDegrees + randomRange(-this.randomYawDegrees, this.randomYawDegrees);
          Quat.fromEuler(this._spawnRotationOffset, tiltX, yaw, tiltZ);
          Quat.multiply(this._spawnRotation, this._spawnBaseRotation, this._spawnRotationOffset);
          itemNode.setWorldRotation(this._spawnRotation);
          const item = itemNode.getComponent(_crd && CoinBehaviour === void 0 ? (_reportPossibleCrUseOfCoinBehaviour({
            error: Error()
          }), CoinBehaviour) : CoinBehaviour);

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
          Vec3.scaleAndAdd(this._spawnImpulse, this._spawnImpulse, this._rightAxis, randomRange(-this.randomSideImpulse, this.randomSideImpulse));
          Vec3.scaleAndAdd(this._spawnImpulse, this._spawnImpulse, this._upAxis, this.launchUpImpulse);
          Vec3.scaleAndAdd(this._spawnImpulse, this._spawnImpulse, this._forwardAxis, this.launchForwardImpulse);
          Vec3.transformQuat(this._itemNormal, LOCAL_UP, this._spawnRotation);
          Vec3.multiplyScalar(this._spawnTorque, this._itemNormal, randomRange(-this.spinTorque, this.spinTorque));
          item.applyLaunchImpulse(this._spawnImpulse, this._spawnTorque);
          this._nextCoinId += 1;
          return item;
        }

        resolveBasePosition(request) {
          if (request != null && request.worldPosition) {
            return request.worldPosition;
          }

          return this.spawnPoint ? this.spawnPoint.worldPosition : this.node.worldPosition;
        }

        shouldRandomizePosition(request) {
          if (typeof (request == null ? void 0 : request.randomizeAroundPosition) === 'boolean') {
            return request.randomizeAroundPosition;
          }

          return !(request != null && request.worldPosition);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "spawnPoint", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "coinRoot", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "spawnSpreadX", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.18;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "spawnSpreadZ", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.08;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "spawnHeightOffset", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "spawnYawDegrees", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "randomYawDegrees", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 180;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "baseTiltXDegrees", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "baseTiltZDegrees", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "randomTiltXDegrees", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 4;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "randomTiltZDegrees", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 4;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "launchUpImpulse", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.008;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "launchForwardImpulse", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -0.02;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "randomSideImpulse", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.003;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "spinTorque", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0025;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=71fc892358fe813b1cd5fcf757cfa6a8e06fd4e6.js.map