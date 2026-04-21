System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, director, Enum, Label, warn, CoinSpawner, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _crd, ccclass, property, SHARED_SCENE_NAME, RoundState, MapSelection, runtimeProgress, GameManager;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

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
      director = _cc.director;
      Enum = _cc.Enum;
      Label = _cc.Label;
      warn = _cc.warn;
    }, function (_unresolved_2) {
      CoinSpawner = _unresolved_2.CoinSpawner;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "6bf28UBX7VLWZLqKnI8PwJ+", "GameManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'director', 'Enum', 'Label', 'warn']);

      ({
        ccclass,
        property
      } = _decorator);
      SHARED_SCENE_NAME = 'Prototype01';

      RoundState = /*#__PURE__*/function (RoundState) {
        RoundState["Ready"] = "Ready";
        RoundState["Playing"] = "Playing";
        RoundState["NoCoins"] = "NoCoins";
        return RoundState;
      }(RoundState || {});

      MapSelection = /*#__PURE__*/function (MapSelection) {
        MapSelection[MapSelection["Map01"] = 0] = "Map01";
        MapSelection[MapSelection["Map02"] = 1] = "Map02";
        return MapSelection;
      }(MapSelection || {});

      runtimeProgress = {
        initialized: false,
        currentMapId: 'Map01',
        currentCoins: 0,
        maxCoins: 0,
        coinRegenInterval: 0,
        lifetimeCoinsDropped: 0,
        totalToyCars: 0,
        regenProgressSeconds: 0
      };

      _export("GameManager", GameManager = (_dec = ccclass('GameManager'), _dec2 = property(_crd && CoinSpawner === void 0 ? (_reportPossibleCrUseOfCoinSpawner({
        error: Error()
      }), CoinSpawner) : CoinSpawner), _dec3 = property({
        type: Enum(MapSelection),
        tooltip: 'Inspector map selection used on first boot and by applyInspectorMapSelection().'
      }), _dec4 = property({
        tooltip: 'Initial wallet coin amount written into the persistent runtime data on first boot.'
      }), _dec5 = property({
        tooltip: 'Natural regeneration cap. Wallet coins may exceed this through drops.'
      }), _dec6 = property({
        tooltip: 'Seconds needed to regenerate 1 coin back into the wallet while currentCoins is below maxCoins.'
      }), _dec7 = property({
        tooltip: 'Wallet coin reward granted when a normal coin drops, before map multiplier.'
      }), _dec8 = property({
        tooltip: 'Wallet coin reward granted when a special reward coin drops, before map multiplier.'
      }), _dec9 = property({
        tooltip: 'Optional wallet coin reward granted when a ToyCar drops. Keep 0 if ToyCar should only count as a collectible.'
      }), _dec10 = property({
        tooltip: 'How many wallet coins are consumed per spawn button click.'
      }), _dec11 = property({
        tooltip: 'Map01 wallet reward multiplier.'
      }), _dec12 = property({
        tooltip: 'Map01 special reward coin chance.'
      }), _dec13 = property({
        tooltip: 'Map01 exclusive ToyCar drop toggle. Keep this off for the basic map.'
      }), _dec14 = property({
        tooltip: 'Reserved ToyCar chance for Map01 if you ever enable its exclusive drop later.'
      }), _dec15 = property({
        tooltip: 'Map01 future leak-risk hint. Reserved for later board-difficulty tuning.'
      }), _dec16 = property({
        tooltip: 'Map02 wallet reward multiplier.'
      }), _dec17 = property({
        tooltip: 'Map02 special reward coin chance.'
      }), _dec18 = property({
        tooltip: 'Map02 enables the exclusive ToyCar drop.'
      }), _dec19 = property({
        tooltip: 'ToyCar chance used only when the current map allows it.'
      }), _dec20 = property({
        tooltip: 'Map02 future leak-risk hint. Reserved for harder map variants later.'
      }), _dec21 = property(Label), _dec22 = property(Label), _dec23 = property(Label), _dec24 = property(Label), _dec(_class = (_class2 = class GameManager extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "coinSpawner", _descriptor, this);

          _initializerDefineProperty(this, "mapSelection", _descriptor2, this);

          _initializerDefineProperty(this, "startCoins", _descriptor3, this);

          _initializerDefineProperty(this, "maxCoins", _descriptor4, this);

          _initializerDefineProperty(this, "coinRegenInterval", _descriptor5, this);

          _initializerDefineProperty(this, "normalCoinReward", _descriptor6, this);

          _initializerDefineProperty(this, "specialCoinReward", _descriptor7, this);

          _initializerDefineProperty(this, "toyCarCoinReward", _descriptor8, this);

          _initializerDefineProperty(this, "spawnCostPerCoin", _descriptor9, this);

          _initializerDefineProperty(this, "map01CoinRewardMultiplier", _descriptor10, this);

          _initializerDefineProperty(this, "map01SpecialCoinChance", _descriptor11, this);

          _initializerDefineProperty(this, "map01AllowToyCarDrop", _descriptor12, this);

          _initializerDefineProperty(this, "map01ToyCarChance", _descriptor13, this);

          _initializerDefineProperty(this, "map01RiskLevelHint", _descriptor14, this);

          _initializerDefineProperty(this, "map02CoinRewardMultiplier", _descriptor15, this);

          _initializerDefineProperty(this, "map02SpecialCoinChance", _descriptor16, this);

          _initializerDefineProperty(this, "map02AllowToyCarDrop", _descriptor17, this);

          _initializerDefineProperty(this, "map02ToyCarChance", _descriptor18, this);

          _initializerDefineProperty(this, "map02RiskLevelHint", _descriptor19, this);

          _initializerDefineProperty(this, "scoreLabel", _descriptor20, this);

          _initializerDefineProperty(this, "dropCountLabel", _descriptor21, this);

          _initializerDefineProperty(this, "spawnCountLabel", _descriptor22, this);

          _initializerDefineProperty(this, "statusLabel", _descriptor23, this);

          this._state = RoundState.Ready;
          this._sessionSpawnedCoinCount = 0;
          this._statusText = '\u51c6\u5907\u8fdb\u5165\u6301\u7eed\u5b58\u6863';
        }

        start() {
          this.ensureRuntimeProgress();
          this._sessionSpawnedCoinCount = 0;
          this.syncStateFromResources();
          this.setStatus(`\u5f53\u524d\u5730\u56fe: ${this.getCurrentMapConfig().mapName}`);
        }

        update(deltaTime) {
          if (!runtimeProgress.initialized) {
            return;
          }

          if (!this.tryRegenerateCoins(deltaTime)) {
            return;
          }

          this.syncStateFromResources();
          this.refreshUi();
        }

        spawnCoinFromButton() {
          const spawnCost = this.getConfiguredSpawnCost();

          if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('\u7f3a\u5c11 CoinSpawner \u5f15\u7528');
            return false;
          }

          if (runtimeProgress.currentCoins < spawnCost) {
            this.syncStateFromResources();
            this.setStatus('\u6ca1\u5e01\u4e86');
            return false;
          }

          const spawnedCoin = this.coinSpawner.spawnCoin();

          if (!spawnedCoin) {
            this.setStatus('\u6295\u5e01\u5931\u8d25');
            return false;
          }

          this.configureSpawnedReward(spawnedCoin, this.getCurrentMapConfig());
          this._sessionSpawnedCoinCount += 1;
          runtimeProgress.currentCoins -= spawnCost;
          this.syncStateFromResources();

          if (runtimeProgress.currentCoins < spawnCost) {
            this.setStatus('\u6295\u51fa\u672c\u6b21\u540e\uff0c\u6ca1\u5e01\u4e86');
            return true;
          }

          this.setStatus(`${this.getCurrentMapConfig().mapName} \u6295\u51fa\u7b2c ${this._sessionSpawnedCoinCount} \u679a`);
          return true;
        }

        resolveCoinDrop(coin) {
          if (!coin.tryMarkScored()) {
            return;
          }

          const rewardCoins = this.normalizeNonNegativeInteger(coin.coinValue);

          if (coin.isToyCarReward) {
            runtimeProgress.totalToyCars += 1;

            if (rewardCoins > 0) {
              runtimeProgress.currentCoins += rewardCoins;
              this.setStatus(`ToyCar \u6389\u843d +${rewardCoins} \u5e01\uff0c\u6536\u85cf\u603b\u6570 ${runtimeProgress.totalToyCars}`);
            } else {
              this.setStatus(`ToyCar \u6389\u843d\uff0c\u6536\u85cf\u603b\u6570 ${runtimeProgress.totalToyCars}`);
            }
          } else {
            runtimeProgress.lifetimeCoinsDropped += 1;
            runtimeProgress.currentCoins += rewardCoins;
            this.setStatus(`${coin.coinTypeLabel} \u6389\u843d +${rewardCoins} \u5e01`);
          }

          this.syncStateFromResources();
          coin.onScored();
        }

        restartGame() {
          const currentScene = director.getScene();

          if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('\u91cd\u5f00\u5931\u8d25\uff1a\u5f53\u524d\u573a\u666f\u4e0d\u5b58\u5728');
            return;
          }

          director.loadScene(currentScene.name);
        }

        switchToMap01() {
          this.switchMapInternal('Map01');
        }

        switchToMap02() {
          this.switchMapInternal('Map02');
        }

        applyInspectorMapSelection() {
          this.switchMapInternal(this.getMapIdFromSelection(this.mapSelection));
        }

        canSpawnCoin() {
          return !!this.coinSpawner && runtimeProgress.currentCoins >= this.getConfiguredSpawnCost();
        }

        ensureRuntimeProgress() {
          if (!runtimeProgress.initialized) {
            runtimeProgress.initialized = true;
            runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
            runtimeProgress.lifetimeCoinsDropped = 0;
            runtimeProgress.totalToyCars = 0;
            runtimeProgress.regenProgressSeconds = 0;
            return;
          }

          runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
          runtimeProgress.currentCoins = Math.max(0, runtimeProgress.currentCoins);
          runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
        }

        switchMapInternal(mapId) {
          var _director$getScene$na, _director$getScene;

          const nextConfig = this.getMapConfig(mapId);

          if (!nextConfig) {
            warn(`[GameManager] Unknown map id: ${mapId}`);
            this.setStatus('\u5730\u56fe\u5207\u6362\u5931\u8d25');
            return;
          }

          runtimeProgress.currentMapId = mapId;
          this.syncStateFromResources();
          const currentSceneName = (_director$getScene$na = (_director$getScene = director.getScene()) == null ? void 0 : _director$getScene.name) != null ? _director$getScene$na : '';

          if (nextConfig.sceneName && currentSceneName && nextConfig.sceneName !== currentSceneName) {
            director.loadScene(nextConfig.sceneName);
            return;
          }

          this.setStatus(`\u5df2\u5207\u6362\u5230 ${nextConfig.mapName}`);
        }

        configureSpawnedReward(coin, mapConfig) {
          if (this.rollToyCarDrop(mapConfig)) {
            coin.configureAsToyCar(this.getConfiguredToyCarCoinReward());
            return;
          }

          if (this.rollSpecialCoin(mapConfig)) {
            coin.configureAsSpecial(this.applyMapRewardMultiplier(this.getConfiguredSpecialCoinReward(), mapConfig));
            return;
          }

          coin.configureAsNormal(this.applyMapRewardMultiplier(this.getConfiguredNormalCoinReward(), mapConfig));
        }

        tryRegenerateCoins(deltaTime) {
          const regenInterval = runtimeProgress.coinRegenInterval;

          if (regenInterval <= 0 || runtimeProgress.currentCoins >= runtimeProgress.maxCoins) {
            runtimeProgress.regenProgressSeconds = 0;
            return false;
          }

          runtimeProgress.regenProgressSeconds += deltaTime;
          let regenerated = false;

          while (runtimeProgress.regenProgressSeconds >= regenInterval && runtimeProgress.currentCoins < runtimeProgress.maxCoins) {
            runtimeProgress.regenProgressSeconds -= regenInterval;
            runtimeProgress.currentCoins += 1;
            regenerated = true;
          }

          return regenerated;
        }

        syncStateFromResources() {
          if (runtimeProgress.currentCoins < this.getConfiguredSpawnCost()) {
            this._state = RoundState.NoCoins;
            return;
          }

          this._state = this._sessionSpawnedCoinCount > 0 ? RoundState.Playing : RoundState.Ready;
        }

        refreshUi() {
          const mapConfig = this.getCurrentMapConfig();

          if (this.scoreLabel) {
            this.scoreLabel.string = `\u5f53\u524d\u5e01\u6570: ${runtimeProgress.currentCoins}`;
          }

          if (this.dropCountLabel) {
            this.dropCountLabel.string = `\u6062\u590d\u4e0a\u9650: ${runtimeProgress.maxCoins}`;
          }

          if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `\u6536\u85cf\u7269: ToyCar ${runtimeProgress.totalToyCars}`;
          }

          if (this.statusLabel) {
            this.statusLabel.string = `\u5730\u56fe: ${mapConfig.mapName} | ${this.getStateText()} | ${this._statusText}`;
          }
        }

        setStatus(statusText) {
          this._statusText = statusText;
          this.refreshUi();
        }

        getCurrentMapConfig() {
          var _this$getMapConfig;

          return (_this$getMapConfig = this.getMapConfig(runtimeProgress.currentMapId)) != null ? _this$getMapConfig : this.buildMapConfig('Map01');
        }

        getMapConfig(mapId) {
          switch (mapId) {
            case 'Map02':
              return this.buildMapConfig('Map02');

            case 'Map01':
              return this.buildMapConfig('Map01');

            default:
              return null;
          }
        }

        buildMapConfig(mapId) {
          if (mapId === 'Map02') {
            return {
              mapId: 'Map02',
              mapName: 'Map02 \u9ad8\u98ce\u9669\u9ad8\u6536\u76ca',
              sceneName: SHARED_SCENE_NAME,
              coinRewardMultiplier: this.normalizePositiveNumber(this.map02CoinRewardMultiplier, 1),
              specialCoinChance: this.normalizeChance(this.map02SpecialCoinChance),
              allowToyCarDrop: this.map02AllowToyCarDrop,
              toyCarChance: this.normalizeChance(this.map02ToyCarChance),
              riskLevelHint: this.normalizePositiveNumber(this.map02RiskLevelHint, 2)
            };
          }

          return {
            mapId: 'Map01',
            mapName: 'Map01 \u57fa\u7840\u5730\u56fe',
            sceneName: SHARED_SCENE_NAME,
            coinRewardMultiplier: this.normalizePositiveNumber(this.map01CoinRewardMultiplier, 1),
            specialCoinChance: this.normalizeChance(this.map01SpecialCoinChance),
            allowToyCarDrop: this.map01AllowToyCarDrop,
            toyCarChance: this.normalizeChance(this.map01ToyCarChance),
            riskLevelHint: this.normalizePositiveNumber(this.map01RiskLevelHint, 1)
          };
        }

        getMapIdFromSelection(selection) {
          return selection === MapSelection.Map02 ? 'Map02' : 'Map01';
        }

        rollSpecialCoin(mapConfig) {
          return Math.random() < mapConfig.specialCoinChance;
        }

        rollToyCarDrop(mapConfig) {
          return mapConfig.allowToyCarDrop && Math.random() < mapConfig.toyCarChance;
        }

        applyMapRewardMultiplier(baseReward, mapConfig) {
          return Math.max(0, Math.round(baseReward * mapConfig.coinRewardMultiplier));
        }

        getStateText() {
          switch (this._state) {
            case RoundState.Playing:
              return '\u72b6\u6001: \u8fdb\u884c\u4e2d';

            case RoundState.NoCoins:
              return '\u72b6\u6001: \u6ca1\u5e01';

            case RoundState.Ready:
            default:
              return '\u72b6\u6001: \u51c6\u5907\u4e2d';
          }
        }

        getConfiguredInitialCoins() {
          return this.normalizeNonNegativeInteger(this.startCoins);
        }

        getConfiguredMaxCoins() {
          return this.normalizeNonNegativeInteger(this.maxCoins);
        }

        getConfiguredCoinRegenInterval() {
          return this.normalizeNonNegativeNumber(this.coinRegenInterval);
        }

        getConfiguredNormalCoinReward() {
          return this.normalizeNonNegativeInteger(this.normalCoinReward);
        }

        getConfiguredSpecialCoinReward() {
          return this.normalizeNonNegativeInteger(this.specialCoinReward);
        }

        getConfiguredToyCarCoinReward() {
          return this.normalizeNonNegativeInteger(this.toyCarCoinReward);
        }

        getConfiguredSpawnCost() {
          return Math.max(1, this.normalizeNonNegativeInteger(this.spawnCostPerCoin, 1));
        }

        normalizeChance(value) {
          if (!Number.isFinite(value)) {
            return 0;
          }

          return clamp(value, 0, 1);
        }

        normalizePositiveNumber(value, fallback = 1) {
          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.max(0, value);
        }

        normalizeNonNegativeNumber(value, fallback = 0) {
          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.max(0, value);
        }

        normalizeNonNegativeInteger(value, fallback = 0) {
          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.max(0, Math.round(value));
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "coinSpawner", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "mapSelection", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return MapSelection.Map01;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "startCoins", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 300;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "maxCoins", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 300;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "coinRegenInterval", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 15;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "normalCoinReward", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "specialCoinReward", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "toyCarCoinReward", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "spawnCostPerCoin", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "map01CoinRewardMultiplier", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "map01SpecialCoinChance", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "map01AllowToyCarDrop", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "map01ToyCarChance", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "map01RiskLevelHint", [_dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "map02CoinRewardMultiplier", [_dec16], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "map02SpecialCoinChance", [_dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.16;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "map02AllowToyCarDrop", [_dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "map02ToyCarChance", [_dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.05;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "map02RiskLevelHint", [_dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "scoreLabel", [_dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "dropCountLabel", [_dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "spawnCountLabel", [_dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "statusLabel", [_dec24], {
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