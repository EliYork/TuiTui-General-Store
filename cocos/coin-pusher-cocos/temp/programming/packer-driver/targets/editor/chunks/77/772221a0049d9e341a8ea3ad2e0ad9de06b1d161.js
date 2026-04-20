System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _descriptor3, _crd, ccclass, property, PusherController;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

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

      _export("PusherController", PusherController = (_dec = ccclass('PusherController'), _dec2 = property({
        type: Vec3,
        tooltip: 'Local-space offset from the resting position to the fully extended position.'
      }), _dec3 = property({
        tooltip: '0 means start fully retracted, 1 means start fully extended.'
      }), _dec(_class = (_class2 = class PusherController extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "cycleSeconds", _descriptor, this);

          _initializerDefineProperty(this, "travelOffset", _descriptor2, this);

          _initializerDefineProperty(this, "startNormalizedTime", _descriptor3, this);

          this._retractedPosition = new Vec3();
          this._extendedPosition = new Vec3();
          this._workingPosition = new Vec3();
          this._elapsedSeconds = 0;
        }

        onLoad() {
          this.node.getPosition(this._retractedPosition);
          Vec3.set(this._extendedPosition, this._retractedPosition.x + this.travelOffset.x, this._retractedPosition.y + this.travelOffset.y, this._retractedPosition.z + this.travelOffset.z);
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
          const phase = this._elapsedSeconds / Math.max(this.cycleSeconds, 0.01);
          const pingPong = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
          Vec3.lerp(this._workingPosition, this._retractedPosition, this._extendedPosition, pingPong);
          this.node.setPosition(this._workingPosition);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "cycleSeconds", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2.2;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "travelOffset", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, -1.6);
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "startNormalizedTime", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=772221a0049d9e341a8ea3ad2e0ad9de06b1d161.js.map