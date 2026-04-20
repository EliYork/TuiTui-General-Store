System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, warn, CoinSpawner, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _crd, ccclass, property, GameManager;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfCoinBehaviour(extras) {
    _reporterNs.report("CoinBehaviour", "../gameplay/CoinBehaviour", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCoinSpawner(extras) {
    _reporterNs.report("CoinSpawner", "../gameplay/CoinSpawner", _context.meta, extras);
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
      Label = _cc.Label;
      warn = _cc.warn;
    }, function (_unresolved_2) {
      CoinSpawner = _unresolved_2.CoinSpawner;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "6bf28UBX7VLWZLqKnI8PwJ+", "GameManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'warn']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("GameManager", GameManager = (_dec = ccclass('GameManager'), _dec2 = property(_crd && CoinSpawner === void 0 ? (_reportPossibleCrUseOfCoinSpawner({
        error: Error()
      }), CoinSpawner) : CoinSpawner), _dec3 = property(Label), _dec4 = property(Label), _dec5 = property(Label), _dec6 = property(Label), _dec(_class = (_class2 = class GameManager extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "coinSpawner", _descriptor, this);

          _initializerDefineProperty(this, "scoreLabel", _descriptor2, this);

          _initializerDefineProperty(this, "dropCountLabel", _descriptor3, this);

          _initializerDefineProperty(this, "spawnCountLabel", _descriptor4, this);

          _initializerDefineProperty(this, "statusLabel", _descriptor5, this);

          this._score = 0;
          this._droppedCoinCount = 0;
          this._spawnedCoinCount = 0;
        }

        start() {
          this.refreshUi('Ready to spawn coins');
        }

        spawnCoinFromButton() {
          if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.refreshUi('Missing CoinSpawner reference');
            return;
          }

          const spawnedCoin = this.coinSpawner.spawnCoin();

          if (!spawnedCoin) {
            this.refreshUi('Spawn failed');
            return;
          }

          this._spawnedCoinCount += 1;
          this.refreshUi(`Spawned coin #${this._spawnedCoinCount}`);
        }

        resolveCoinDrop(coin) {
          if (!coin.tryMarkScored()) {
            return;
          }

          this._score += coin.coinValue;
          this._droppedCoinCount += 1;
          this.refreshUi(`Coin #${coin.coinId} +${coin.coinValue}`);
          coin.onScored();
        }

        refreshUi(statusText) {
          if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this._score}`;
          }

          if (this.dropCountLabel) {
            this.dropCountLabel.string = `Drops: ${this._droppedCoinCount}`;
          }

          if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `Spawned: ${this._spawnedCoinCount}`;
          }

          if (this.statusLabel && statusText) {
            this.statusLabel.string = statusText;
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "coinSpawner", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "scoreLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "dropCountLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "spawnCountLabel", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "statusLabel", [_dec6], {
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
//# sourceMappingURL=7e0d17b40a9513aab3872a981088d039553c9992.js.map