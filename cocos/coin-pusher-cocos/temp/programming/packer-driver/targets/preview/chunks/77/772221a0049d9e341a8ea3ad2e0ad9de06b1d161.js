System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _crd, ccclass, property, DEFAULT_LEGACY_TRAVEL_OFFSET, DEFAULT_PUSH_OFFSET_X, DEFAULT_PUSH_FLOAT_Y, DEFAULT_PUSH_OFFSET_Z, EPSILON, PusherController;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function nearlyEqual(a, b) {
    return Math.abs(a - b) <= EPSILON;
  }

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Vec3 = _cc.Vec3;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "db135qDP3lN/ZQSNqQTKDNl", "PusherController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator);
      DEFAULT_LEGACY_TRAVEL_OFFSET = new Vec3(0, 0, -1.6);
      DEFAULT_PUSH_OFFSET_X = 0;
      DEFAULT_PUSH_FLOAT_Y = 0;
      DEFAULT_PUSH_OFFSET_Z = -1.6;
      EPSILON = 0.0001;

      _export("PusherController", PusherController = (_dec = ccclass('PusherController'), _dec2 = property({
        tooltip: 'Full extension offset on local X. Use this when the pusher needs sideways drift.'
      }), _dec3 = property({
        tooltip: 'Full extension offset on local Y. This is the pusher float amount.'
      }), _dec4 = property({
        tooltip: 'Full extension offset on local Z. Negative values push forward into the board.'
      }), _dec5 = property({
        visible: false,
        type: Vec3,
        tooltip: 'Legacy serialized offset kept only for backward compatibility.'
      }), _dec6 = property({
        tooltip: '0 means start fully retracted, 1 means start fully extended.'
      }), _dec(_class = (_class2 = class PusherController extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "cycleSeconds", _descriptor, this);

          _initializerDefineProperty(this, "pushOffsetX", _descriptor2, this);

          _initializerDefineProperty(this, "pushFloatY", _descriptor3, this);

          _initializerDefineProperty(this, "pushOffsetZ", _descriptor4, this);

          _initializerDefineProperty(this, "travelOffset", _descriptor5, this);

          _initializerDefineProperty(this, "startNormalizedTime", _descriptor6, this);

          this._resolvedTravelOffset = new Vec3();
          this._retractedPosition = new Vec3();
          this._extendedPosition = new Vec3();
          this._workingPosition = new Vec3();
          this._elapsedSeconds = 0;
        }

        onLoad() {
          this.migrateLegacyTravelOffsetIfNeeded();
          this.updateResolvedTravelOffset();
          this.node.getPosition(this._retractedPosition);
          Vec3.set(this._extendedPosition, this._retractedPosition.x + this._resolvedTravelOffset.x, this._retractedPosition.y + this._resolvedTravelOffset.y, this._retractedPosition.z + this._resolvedTravelOffset.z);
          this._elapsedSeconds = this.startNormalizedTime * Math.max(this.cycleSeconds, 0.01);
          this.syncPosition();
        }

        update(deltaTime) {
          if (this.cycleSeconds <= 0) {
            return;
          }

          this._elapsedSeconds = (this._elapsedSeconds + deltaTime) % this.cycleSeconds;
          this.syncPosition();
        }

        syncPosition() {
          var phase = this._elapsedSeconds / Math.max(this.cycleSeconds, 0.01);
          var pingPong = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
          Vec3.lerp(this._workingPosition, this._retractedPosition, this._extendedPosition, pingPong);
          this.node.setPosition(this._workingPosition);
        }

        migrateLegacyTravelOffsetIfNeeded() {
          var splitParamsStillDefault = nearlyEqual(this.pushOffsetX, DEFAULT_PUSH_OFFSET_X) && nearlyEqual(this.pushFloatY, DEFAULT_PUSH_FLOAT_Y) && nearlyEqual(this.pushOffsetZ, DEFAULT_PUSH_OFFSET_Z);
          var legacyOffsetChanged = !nearlyEqual(this.travelOffset.x, DEFAULT_LEGACY_TRAVEL_OFFSET.x) || !nearlyEqual(this.travelOffset.y, DEFAULT_LEGACY_TRAVEL_OFFSET.y) || !nearlyEqual(this.travelOffset.z, DEFAULT_LEGACY_TRAVEL_OFFSET.z);

          if (!splitParamsStillDefault || !legacyOffsetChanged) {
            return;
          }

          this.pushOffsetX = this.travelOffset.x;
          this.pushFloatY = this.travelOffset.y;
          this.pushOffsetZ = this.travelOffset.z;
        }

        updateResolvedTravelOffset() {
          Vec3.set(this._resolvedTravelOffset, this.pushOffsetX, this.pushFloatY, this.pushOffsetZ);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "cycleSeconds", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 2.2;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "pushOffsetX", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return DEFAULT_PUSH_OFFSET_X;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "pushFloatY", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return DEFAULT_PUSH_FLOAT_Y;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "pushOffsetZ", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return DEFAULT_PUSH_OFFSET_Z;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "travelOffset", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return new Vec3(DEFAULT_LEGACY_TRAVEL_OFFSET.x, DEFAULT_LEGACY_TRAVEL_OFFSET.y, DEFAULT_LEGACY_TRAVEL_OFFSET.z);
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "startNormalizedTime", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=772221a0049d9e341a8ea3ad2e0ad9de06b1d161.js.map