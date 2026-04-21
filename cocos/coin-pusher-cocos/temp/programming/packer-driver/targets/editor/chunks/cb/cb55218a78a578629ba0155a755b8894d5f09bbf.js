System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, warn, GameManager, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, _crd, ccclass, property, MIN_HOLD_START_DELAY, MIN_HOLD_SPAWN_INTERVAL, SpawnButtonHold;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfGameManager(extras) {
    _reporterNs.report("GameManager", "../core/GameManager", _context.meta, extras);
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
      Node = _cc.Node;
      warn = _cc.warn;
    }, function (_unresolved_2) {
      GameManager = _unresolved_2.GameManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "f4c3fnFLQ5KcqHfQOteQKLm", "SpawnButtonHold", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'warn']);

      ({
        ccclass,
        property
      } = _decorator);
      MIN_HOLD_START_DELAY = 0.05;
      MIN_HOLD_SPAWN_INTERVAL = 0.02;

      _export("SpawnButtonHold", SpawnButtonHold = (_dec = ccclass('SpawnButtonHold'), _dec2 = property(_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
        error: Error()
      }), GameManager) : GameManager), _dec3 = property({
        tooltip: 'How long the button must be held before auto-spawn starts.'
      }), _dec4 = property({
        tooltip: 'Seconds between each spawn while the button is held.'
      }), _dec(_class = (_class2 = class SpawnButtonHold extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "gameManager", _descriptor, this);

          _initializerDefineProperty(this, "holdStartDelay", _descriptor2, this);

          _initializerDefineProperty(this, "holdSpawnInterval", _descriptor3, this);

          this._isPressing = false;
          this._holdModeStarted = false;
        }

        onEnable() {
          this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
          this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
          this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }

        onDisable() {
          this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
          this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
          this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
          this.stopPressing();
        }

        onTouchStart() {
          this.stopPressing();
          this._isPressing = true;
          this._holdModeStarted = false;
          this.scheduleOnce(this.beginHoldSpawn, this.getHoldStartDelay());
        }

        onTouchEnd() {
          const shouldSpawnSingleCoin = this._isPressing && !this._holdModeStarted;
          this.stopPressing();

          if (shouldSpawnSingleCoin) {
            this.trySpawnOnce();
          }
        }

        onTouchCancel() {
          this.stopPressing();
        }

        beginHoldSpawn() {
          var _this$gameManager;

          if (!this._isPressing) {
            return;
          }

          this._holdModeStarted = true;

          if (!this.trySpawnOnce()) {
            return;
          }

          if (!((_this$gameManager = this.gameManager) != null && _this$gameManager.canSpawnCoin())) {
            return;
          }

          this.schedule(this.repeatHoldSpawn, this.getHoldSpawnInterval());
        }

        repeatHoldSpawn() {
          var _this$gameManager2;

          if (!this._isPressing) {
            this.stopRepeating();
            return;
          }

          if (!this.trySpawnOnce() || !((_this$gameManager2 = this.gameManager) != null && _this$gameManager2.canSpawnCoin())) {
            this.stopRepeating();
          }
        }

        trySpawnOnce() {
          if (!this.gameManager) {
            warn('[SpawnButtonHold] gameManager is not assigned.');
            return false;
          }

          return this.gameManager.spawnCoinFromButton();
        }

        stopPressing() {
          this._isPressing = false;
          this.unschedule(this.beginHoldSpawn);
          this.stopRepeating();
        }

        stopRepeating() {
          this.unschedule(this.repeatHoldSpawn);
        }

        getHoldStartDelay() {
          return Math.max(MIN_HOLD_START_DELAY, this.holdStartDelay);
        }

        getHoldSpawnInterval() {
          return Math.max(MIN_HOLD_SPAWN_INTERVAL, this.holdSpawnInterval);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "gameManager", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "holdStartDelay", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.25;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "holdSpawnInterval", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.12;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=cb55218a78a578629ba0155a755b8894d5f09bbf.js.map