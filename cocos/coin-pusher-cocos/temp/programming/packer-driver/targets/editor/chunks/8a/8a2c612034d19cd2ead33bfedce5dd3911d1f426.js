System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Quat, RigidBody, Vec3, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _crd, ccclass, property, WORLD_UP, LOCAL_UP, CoinBehaviour;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clamp01(value) {
    return clamp(value, 0, 1);
  }

  function clampVec3Magnitude(vector, maxLength) {
    const length = Vec3.len(vector);

    if (length <= maxLength || length === 0) {
      return;
    }

    Vec3.multiplyScalar(vector, vector, maxLength / length);
  }

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Quat = _cc.Quat;
      RigidBody = _cc.RigidBody;
      Vec3 = _cc.Vec3;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "162c9rkczlAM4/X9f6TaVBV", "CoinBehaviour", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Quat', 'RigidBody', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator);
      WORLD_UP = new Vec3(0, 1, 0);
      LOCAL_UP = new Vec3(0, 1, 0);

      _export("CoinBehaviour", CoinBehaviour = (_dec = ccclass('CoinBehaviour'), _dec2 = property({
        tooltip: 'How long the spawn stabilizer should suppress tumble right after the coin is created.'
      }), _dec3 = property({
        tooltip: 'Clamp for horizontal speed during the spawn assist window.'
      }), _dec4 = property({
        tooltip: 'Clamp for vertical speed during the spawn assist window.'
      }), _dec5 = property({
        tooltip: 'Maximum spin speed along the coin normal during the spawn assist window.'
      }), _dec6 = property({
        tooltip: 'Maximum tumble speed across the coin plane during the spawn assist window.'
      }), _dec7 = property({
        tooltip: 'Delay before the coin starts trying to settle flatter on the board.'
      }), _dec8 = property({
        tooltip: 'Only apply the settle assist when horizontal motion is already slow.'
      }), _dec9 = property({
        tooltip: 'Only apply the settle assist when vertical motion is already small.'
      }), _dec10 = property({
        tooltip: 'Only apply the settle assist when angular speed is already under control.'
      }), _dec11 = property({
        tooltip: 'Target angular speed used to help a resting coin topple toward flat.'
      }), _dec12 = property({
        tooltip: 'Blend factor for the settle assist. Higher values flatten faster.'
      }), _dec13 = property({
        tooltip: 'Keep this low so the body does not fall asleep while still balancing on its edge.'
      }), _dec(_class = (_class2 = class CoinBehaviour extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "coinValue", _descriptor, this);

          _initializerDefineProperty(this, "spawnAssistDuration", _descriptor2, this);

          _initializerDefineProperty(this, "maxSpawnHorizontalSpeed", _descriptor3, this);

          _initializerDefineProperty(this, "maxSpawnVerticalSpeed", _descriptor4, this);

          _initializerDefineProperty(this, "maxSpawnSpinSpeed", _descriptor5, this);

          _initializerDefineProperty(this, "maxSpawnTumbleSpeed", _descriptor6, this);

          _initializerDefineProperty(this, "settleAssistDelay", _descriptor7, this);

          _initializerDefineProperty(this, "settleAssistSpeedThreshold", _descriptor8, this);

          _initializerDefineProperty(this, "settleAssistVerticalSpeedThreshold", _descriptor9, this);

          _initializerDefineProperty(this, "settleAssistAngularSpeedThreshold", _descriptor10, this);

          _initializerDefineProperty(this, "settleAssistAngularSpeed", _descriptor11, this);

          _initializerDefineProperty(this, "settleAssistBlend", _descriptor12, this);

          _initializerDefineProperty(this, "sleepThreshold", _descriptor13, this);

          this._linearVelocity = new Vec3();
          this._angularVelocity = new Vec3();
          this._parallelAngular = new Vec3();
          this._tumbleAngular = new Vec3();
          this._desiredAngular = new Vec3();
          this._correctedAngular = new Vec3();
          this._flattenAxis = new Vec3();
          this._coinNormal = new Vec3();
          this._worldRotation = new Quat();
          this._zeroVelocity = new Vec3();
          this._body = null;
          this._coinId = 0;
          this._hasScored = false;
          this._aliveSeconds = 0;
        }

        get coinId() {
          return this._coinId;
        }

        get hasScored() {
          return this._hasScored;
        }

        onLoad() {
          this._body = this.getComponent(RigidBody);

          if (this._body) {
            this._body.sleepThreshold = this.sleepThreshold;
          }
        }

        initialize(coinId) {
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

        update(deltaTime) {
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

        applyLaunchImpulse(impulse, torque) {
          if (!this._body) {
            return;
          }

          this._body.wakeUp();

          this._body.applyImpulse(impulse);

          if (Vec3.lengthSqr(torque) > 0) {
            this._body.applyTorque(torque);
          }
        }

        tryMarkScored() {
          if (this._hasScored) {
            return false;
          }

          this._hasScored = true;
          return true;
        }

        onScored() {
          this.scheduleOnce(() => {
            if (this.node.isValid) {
              this.node.destroy();
            }
          }, 0);
        }

        applySpawnAssist() {
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

          this._linearVelocity.y = clamp(this._linearVelocity.y, -this.maxSpawnVerticalSpeed, this.maxSpawnVerticalSpeed);

          this._body.setLinearVelocity(this._linearVelocity);

          this._body.getAngularVelocity(this._angularVelocity);

          this.getCoinNormal(this._coinNormal);
          const spinSpeed = Vec3.dot(this._angularVelocity, this._coinNormal);
          Vec3.multiplyScalar(this._parallelAngular, this._coinNormal, clamp(spinSpeed, -this.maxSpawnSpinSpeed, this.maxSpawnSpinSpeed));
          Vec3.subtract(this._tumbleAngular, this._angularVelocity, this._parallelAngular);
          clampVec3Magnitude(this._tumbleAngular, this.maxSpawnTumbleSpeed);
          Vec3.add(this._correctedAngular, this._parallelAngular, this._tumbleAngular);

          this._body.setAngularVelocity(this._correctedAngular);
        }

        applySettleAssist(deltaTime) {
          if (!this._body) {
            return;
          }

          this._body.getLinearVelocity(this._linearVelocity);

          const horizontalSpeed = Math.hypot(this._linearVelocity.x, this._linearVelocity.z);
          const verticalSpeed = Math.abs(this._linearVelocity.y);

          if (horizontalSpeed > this.settleAssistSpeedThreshold || verticalSpeed > this.settleAssistVerticalSpeedThreshold) {
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
          Vec3.multiplyScalar(this._desiredAngular, this._flattenAxis, this.settleAssistAngularSpeed * tiltFactor);
          const retainedSpin = Vec3.dot(this._angularVelocity, this._coinNormal) * 0.15;
          Vec3.scaleAndAdd(this._desiredAngular, this._desiredAngular, this._coinNormal, retainedSpin);
          const blend = 1 - Math.exp(-this.settleAssistBlend * deltaTime);
          Vec3.lerp(this._correctedAngular, this._angularVelocity, this._desiredAngular, blend);

          this._body.setAngularVelocity(this._correctedAngular);

          this._body.wakeUp();
        }

        getCoinNormal(out) {
          this.node.getWorldRotation(this._worldRotation);
          Vec3.transformQuat(out, LOCAL_UP, this._worldRotation);

          if (out.y < 0) {
            Vec3.multiplyScalar(out, out, -1);
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "coinValue", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "spawnAssistDuration", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.18;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "maxSpawnHorizontalSpeed", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.16;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "maxSpawnVerticalSpeed", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.22;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "maxSpawnSpinSpeed", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.2;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "maxSpawnTumbleSpeed", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.35;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "settleAssistDelay", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.12;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "settleAssistSpeedThreshold", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.08;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "settleAssistVerticalSpeedThreshold", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.06;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "settleAssistAngularSpeedThreshold", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.1;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "settleAssistAngularSpeed", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.4;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "settleAssistBlend", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 7;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "sleepThreshold", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.02;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=8a2c612034d19cd2ead33bfedce5dd3911d1f426.js.map