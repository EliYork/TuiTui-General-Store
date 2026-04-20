System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, BoxCollider, Component, warn, GameManager, CoinBehaviour, _dec, _dec2, _class, _class2, _descriptor, _crd, ccclass, property, DropZone;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfGameManager(extras) {
    _reporterNs.report("GameManager", "../core/GameManager", _context.meta, extras);
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
      BoxCollider = _cc.BoxCollider;
      Component = _cc.Component;
      warn = _cc.warn;
    }, function (_unresolved_2) {
      GameManager = _unresolved_2.GameManager;
    }, function (_unresolved_3) {
      CoinBehaviour = _unresolved_3.CoinBehaviour;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "703bbk/jlBP3YU7vvLfRAmj", "DropZone", undefined);

      __checkObsolete__(['_decorator', 'BoxCollider', 'Component', 'ITriggerEvent', 'Node', 'warn']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("DropZone", DropZone = (_dec = ccclass('DropZone'), _dec2 = property(_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
        error: Error()
      }), GameManager) : GameManager), _dec(_class = (_class2 = class DropZone extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "gameManager", _descriptor, this);

          this._collider = null;
        }

        onLoad() {
          this._collider = this.getComponent(BoxCollider);

          if (!this._collider) {
            warn('[DropZone] BoxCollider is required.');
          }
        }

        onEnable() {
          var _this$_collider, _this$_collider2;

          (_this$_collider = this._collider) == null || _this$_collider.on('onTriggerEnter', this.onTriggerEvent, this);
          (_this$_collider2 = this._collider) == null || _this$_collider2.on('onTriggerStay', this.onTriggerEvent, this);
        }

        onDisable() {
          var _this$_collider3, _this$_collider4;

          (_this$_collider3 = this._collider) == null || _this$_collider3.off('onTriggerEnter', this.onTriggerEvent, this);
          (_this$_collider4 = this._collider) == null || _this$_collider4.off('onTriggerStay', this.onTriggerEvent, this);
        }

        onTriggerEvent(event) {
          if (!this.gameManager) {
            warn('[DropZone] gameManager is not assigned.');
            return;
          }

          const coin = this.findCoin(event.otherCollider.node);

          if (!coin) {
            return;
          }

          this.gameManager.resolveCoinDrop(coin);
        }

        findCoin(startNode) {
          let current = startNode;

          while (current) {
            const coin = current.getComponent(_crd && CoinBehaviour === void 0 ? (_reportPossibleCrUseOfCoinBehaviour({
              error: Error()
            }), CoinBehaviour) : CoinBehaviour);

            if (coin) {
              return coin;
            }

            current = current.parent;
          }

          return null;
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "gameManager", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=aa43c29963af722499e377d831ec1a1af06fa6ce.js.map