System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, director, Enum, Label, Prefab, warn, PhysicsSystem, EPhysicsDrawFlags, CoinSpawner, ItemPrefabConfig, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _class4, _class5, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _crd, ccclass, property, SHARED_SCENE_NAME, RoundState, MapSelection, CatalogItemConfig, DEFAULT_TEST_ITEMS, runtimeProgress, GameManager;

  function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfCoinBehaviour(extras) {
    _reporterNs.report("CoinBehaviour", "../gameplay/CoinBehaviour", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCoinSpawner(extras) {
    _reporterNs.report("CoinSpawner", "../gameplay/CoinSpawner", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemPrefabConfig(extras) {
    _reporterNs.report("ItemPrefabConfig", "../gameplay/ItemPrefabConfig", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemPrefabRuntimeConfig(extras) {
    _reporterNs.report("ItemPrefabRuntimeConfig", "../gameplay/ItemPrefabConfig", _context.meta, extras);
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
      Prefab = _cc.Prefab;
      warn = _cc.warn;
      PhysicsSystem = _cc.PhysicsSystem;
      EPhysicsDrawFlags = _cc.EPhysicsDrawFlags;
    }, function (_unresolved_2) {
      CoinSpawner = _unresolved_2.CoinSpawner;
    }, function (_unresolved_3) {
      ItemPrefabConfig = _unresolved_3.ItemPrefabConfig;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "6bf28UBX7VLWZLqKnI8PwJ+", "GameManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'director', 'Enum', 'Event', 'Label', 'Prefab', 'warn', 'PhysicsSystem', 'EPhysicsDrawFlags']);

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

      CatalogItemConfig = (_dec = ccclass('CatalogItemConfig'), _dec2 = property({
        tooltip: 'Stable item id used for runtime progress and button switching.'
      }), _dec3 = property(Prefab), _dec4 = property({
        tooltip: 'How many copies must be collected before the item becomes selectable for active spawning.'
      }), _dec5 = property({
        tooltip: 'Enable this for the very first base item that should be actively spawnable from the beginning.'
      }), _dec6 = property({
        tooltip: 'Enable this if the item should already be shown as discovered at runtime start.'
      }), _dec(_class = (_class2 = class CatalogItemConfig {
        constructor() {
          _initializerDefineProperty(this, "itemId", _descriptor, this);

          _initializerDefineProperty(this, "prefab", _descriptor2, this);

          _initializerDefineProperty(this, "unlockRequiredCount", _descriptor3, this);

          _initializerDefineProperty(this, "startSpawnUnlocked", _descriptor4, this);

          _initializerDefineProperty(this, "startDiscovered", _descriptor5, this);

          _initializerDefineProperty(this, "allowDropInMap01", _descriptor6, this);

          _initializerDefineProperty(this, "allowDropInMap02", _descriptor7, this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "itemId", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "prefab", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "unlockRequiredCount", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "startSpawnUnlocked", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "startDiscovered", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "allowDropInMap01", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return true;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "allowDropInMap02", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return true;
        }
      })), _class2)) || _class);
      DEFAULT_TEST_ITEMS = [{
        itemId: 'apple',
        prefab: null,
        unlockRequiredCount: 0,
        startSpawnUnlocked: true,
        startDiscovered: true,
        allowDropInMap01: true,
        allowDropInMap02: true
      }, {
        itemId: 'banana',
        prefab: null,
        unlockRequiredCount: 3,
        startSpawnUnlocked: false,
        startDiscovered: false,
        allowDropInMap01: true,
        allowDropInMap02: true
      }, {
        itemId: 'lemon',
        prefab: null,
        unlockRequiredCount: 5,
        startSpawnUnlocked: false,
        startDiscovered: false,
        allowDropInMap01: true,
        allowDropInMap02: true
      }];
      runtimeProgress = {
        initialized: false,
        currentMapId: 'Map01',
        currentCoins: 0,
        maxCoins: 0,
        coinRegenInterval: 0,
        regenProgressSeconds: 0,
        currentSpawnItemId: '',
        lastDroppedItemId: '',
        itemProgress: {}
      };

      _export("GameManager", GameManager = (_dec7 = ccclass('GameManager'), _dec8 = property(_crd && CoinSpawner === void 0 ? (_reportPossibleCrUseOfCoinSpawner({
        error: Error()
      }), CoinSpawner) : CoinSpawner), _dec9 = property({
        type: Enum(MapSelection),
        tooltip: 'Inspector map selection used on first boot and by applyInspectorMapSelection().'
      }), _dec10 = property({
        tooltip: 'Initial active-spawn resource written into the persistent runtime data on first boot.'
      }), _dec11 = property({
        tooltip: 'Natural regeneration cap. Active-spawn resource may exceed this only if you later add external rewards.'
      }), _dec12 = property({
        tooltip: 'Seconds needed to regenerate 1 active-spawn resource while currentCoins is below maxCoins.'
      }), _dec13 = property({
        tooltip: 'How many active-spawn resources are consumed per spawn button click.'
      }), _dec14 = property({
        type: [CatalogItemConfig],
        tooltip: 'Logic-only item catalog. Shape and collider parameters now live on each item prefab.'
      }), _dec15 = property({
        tooltip: 'How many map-pool items should be seeded onto the board when Map01 starts.'
      }), _dec16 = property({
        tooltip: 'Seconds between automatic Map01 map-pool spawns. Set 0 to disable ambient map refresh.'
      }), _dec17 = property({
        tooltip: 'Map01 future leak-risk hint. Reserved for later board-difficulty tuning.'
      }), _dec18 = property({
        tooltip: 'How many map-pool items should be seeded onto the board when Map02 starts.'
      }), _dec19 = property({
        tooltip: 'Seconds between automatic Map02 map-pool spawns. Set 0 to disable ambient map refresh.'
      }), _dec20 = property({
        tooltip: 'Map02 future leak-risk hint. Reserved for later board-difficulty tuning.'
      }), _dec21 = property({
        tooltip: 'Simple board safety cap so ambient map refresh does not flood the scene while idle.'
      }), _dec22 = property(Label), _dec23 = property(Label), _dec24 = property(Label), _dec25 = property(Label), _dec7(_class4 = (_class5 = class GameManager extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "coinSpawner", _descriptor8, this);

          _initializerDefineProperty(this, "mapSelection", _descriptor9, this);

          _initializerDefineProperty(this, "startCoins", _descriptor10, this);

          _initializerDefineProperty(this, "maxCoins", _descriptor11, this);

          _initializerDefineProperty(this, "coinRegenInterval", _descriptor12, this);

          _initializerDefineProperty(this, "spawnCostPerCoin", _descriptor13, this);

          _initializerDefineProperty(this, "itemCatalog", _descriptor14, this);

          _initializerDefineProperty(this, "map01InitialMapItemCount", _descriptor15, this);

          _initializerDefineProperty(this, "map01AmbientSpawnInterval", _descriptor16, this);

          _initializerDefineProperty(this, "map01RiskLevelHint", _descriptor17, this);

          _initializerDefineProperty(this, "map02InitialMapItemCount", _descriptor18, this);

          _initializerDefineProperty(this, "map02AmbientSpawnInterval", _descriptor19, this);

          _initializerDefineProperty(this, "map02RiskLevelHint", _descriptor20, this);

          _initializerDefineProperty(this, "maxBoardItemCount", _descriptor21, this);

          _initializerDefineProperty(this, "scoreLabel", _descriptor22, this);

          _initializerDefineProperty(this, "dropCountLabel", _descriptor23, this);

          _initializerDefineProperty(this, "spawnCountLabel", _descriptor24, this);

          _initializerDefineProperty(this, "statusLabel", _descriptor25, this);

          this._state = RoundState.Ready;
          this._sessionSpawnedCoinCount = 0;
          this._statusText = '准备进入持续存档';
          this._ambientSpawnProgressSeconds = 0;

          _initializerDefineProperty(this, "showColliderDebug", _descriptor26, this);
        }

        start() {
          PhysicsSystem.instance.enable = true;

          if (this.showColliderDebug) {
            PhysicsSystem.instance.debugDrawFlags = EPhysicsDrawFlags.WIRE_FRAME | EPhysicsDrawFlags.AABB;
          } else {
            PhysicsSystem.instance.debugDrawFlags = 0;
          }

          this.ensureRuntimeProgress();
          this._sessionSpawnedCoinCount = 0;
          this._ambientSpawnProgressSeconds = 0;
          this.syncStateFromResources();
          this.seedInitialMapItems();
          var missingPrefabs = this.getResolvedCatalog().filter(item => !item.prefab);

          if (missingPrefabs.length > 0) {
            this.setStatus("\u8BF7\u5148\u5728 GameManager.itemCatalog \u7ED1\u5B9A prefab: " + missingPrefabs.map(item => item.itemName).join(' / '));
            return;
          }

          this.setStatus("\u5F53\u524D\u5730\u56FE: " + this.getCurrentMapConfig().mapName);
        }

        update(deltaTime) {
          if (!runtimeProgress.initialized) {
            return;
          }

          var shouldRefreshUi = false;

          if (this.tryRegenerateCoins(deltaTime)) {
            this.syncStateFromResources();
            shouldRefreshUi = true;
          }

          if (this.trySpawnAmbientMapItem(deltaTime)) {
            shouldRefreshUi = true;
          }

          if (shouldRefreshUi) {
            this.refreshUi();
          }
        }

        spawnCoinFromButton() {
          var spawnCost = this.getConfiguredSpawnCost();
          var currentSpawnItem = this.getCurrentSpawnItem();

          if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('缺少 CoinSpawner 引用');
            return false;
          }

          if (!currentSpawnItem) {
            this.setStatus('当前没有可投放物，请先检查图鉴配置');
            return false;
          }

          if (runtimeProgress.currentCoins < spawnCost) {
            this.syncStateFromResources();
            this.setStatus('投放资源不足');
            return false;
          }

          var spawnedCoin = this.coinSpawner.spawnCoin(currentSpawnItem.prefab);

          if (!spawnedCoin) {
            this.setStatus('投放失败');
            return false;
          }

          this._sessionSpawnedCoinCount += 1;
          runtimeProgress.currentCoins -= spawnCost;
          this.syncStateFromResources();

          if (runtimeProgress.currentCoins < spawnCost) {
            this.setStatus("\u6295\u51FA " + currentSpawnItem.itemName + " \u540E\uFF0C\u6295\u653E\u8D44\u6E90\u4E0D\u8DB3");
            return true;
          }

          this.setStatus("\u5DF2\u6295\u653E " + currentSpawnItem.itemName);
          return true;
        }

        resolveCoinDrop(coin) {
          if (!coin.tryMarkScored()) {
            return;
          }

          var collectedItem = this.findResolvedCatalogItemById(coin.itemId);

          if (!collectedItem) {
            warn("[GameManager] Dropped item is missing catalog registration: " + (coin.itemId || coin.node.name));
            this.setStatus("\u6389\u843D\u7269\u672A\u767B\u8BB0: " + coin.itemTypeLabel);
            coin.onScored();
            return;
          }

          var progress = runtimeProgress.itemProgress[collectedItem.itemId];
          progress.ownedCount += 1;
          progress.isDiscovered = true;
          runtimeProgress.lastDroppedItemId = collectedItem.itemId;
          var unlockedItemName = '';

          if (!progress.isSpawnUnlocked && progress.ownedCount >= collectedItem.unlockRequiredCount) {
            progress.isSpawnUnlocked = true;
            unlockedItemName = collectedItem.itemName;
          }

          this.ensureRuntimeProgress();
          this.syncStateFromResources();
          coin.onScored();

          if (unlockedItemName) {
            this.setStatus("\u6536\u5230 " + collectedItem.itemName + " x1\uFF0C\u5DF2\u89E3\u9501\u53EF\u6295\u653E: " + unlockedItemName);
            return;
          }

          this.setStatus("\u6536\u5230 " + collectedItem.itemName + " x1\uFF0C\u53E3\u888B " + progress.ownedCount);
        }

        restartGame() {
          var currentScene = director.getScene();

          if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('重开失败：当前场景不存在');
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
          return !!this.coinSpawner && !!this.getCurrentSpawnItem() && runtimeProgress.currentCoins >= this.getConfiguredSpawnCost();
        }

        onSpawnItemButtonClicked(_event, itemId) {
          this.selectSpawnItemById(itemId);
        }

        selectSpawnItemById(itemId) {
          var nextItem = this.findResolvedCatalogItemById(itemId);

          if (!nextItem) {
            this.setStatus("\u672A\u627E\u5230\u6295\u653E\u7269: " + itemId);
            return false;
          }

          if (!nextItem.isSpawnUnlocked) {
            this.setStatus(nextItem.itemName + " \u8FD8\u6CA1\u6709\u89E3\u9501\u6295\u653E");
            return false;
          }

          if (!nextItem.prefab) {
            this.setStatus(nextItem.itemName + " \u7F3A\u5C11 prefab \u7ED1\u5B9A");
            return false;
          }

          runtimeProgress.currentSpawnItemId = nextItem.itemId;
          this.refreshUi();
          this.setStatus("\u5F53\u524D\u6295\u653E\u7269\u5207\u6362\u4E3A " + nextItem.itemName);
          return true;
        }

        ensureRuntimeProgress() {
          var catalogConfigs = this.getNormalizedCatalogConfigs();

          if (!runtimeProgress.initialized) {
            runtimeProgress.initialized = true;
            runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
            runtimeProgress.regenProgressSeconds = 0;
            runtimeProgress.currentSpawnItemId = '';
            runtimeProgress.lastDroppedItemId = '';
            runtimeProgress.itemProgress = {};
          } else {
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = Math.max(0, runtimeProgress.currentCoins);
            runtimeProgress.coinRegenInterval = this.getConfiguredCoinRegenInterval();
          }

          for (var config of catalogConfigs) {
            var _runtimeProgress$item;

            var progress = (_runtimeProgress$item = runtimeProgress.itemProgress[config.itemId]) != null ? _runtimeProgress$item : {
              ownedCount: 0,
              isSpawnUnlocked: false,
              isDiscovered: false
            };
            progress.isSpawnUnlocked = progress.isSpawnUnlocked || config.startSpawnUnlocked;
            progress.isDiscovered = progress.isDiscovered || config.startDiscovered || progress.isSpawnUnlocked;
            runtimeProgress.itemProgress[config.itemId] = progress;
          }

          this.ensureCurrentSpawnItemSelection(catalogConfigs);
        }

        ensureCurrentSpawnItemSelection(catalogConfigs) {
          var _ref, _ref2, _selectableItems$, _catalogConfigs$find;

          var selectableItems = catalogConfigs.filter(config => {
            var progress = runtimeProgress.itemProgress[config.itemId];
            return !!config.prefab && !!(progress != null && progress.isSpawnUnlocked);
          });
          var fallbackUnlockedItem = (_ref = (_ref2 = (_selectableItems$ = selectableItems[0]) != null ? _selectableItems$ : catalogConfigs.find(config => {
            var _runtimeProgress$item2;

            return (_runtimeProgress$item2 = runtimeProgress.itemProgress[config.itemId]) == null ? void 0 : _runtimeProgress$item2.isSpawnUnlocked;
          })) != null ? _ref2 : catalogConfigs[0]) != null ? _ref : null;

          if (!fallbackUnlockedItem) {
            runtimeProgress.currentSpawnItemId = '';
            return;
          }

          var currentConfig = (_catalogConfigs$find = catalogConfigs.find(config => config.itemId === runtimeProgress.currentSpawnItemId)) != null ? _catalogConfigs$find : null;
          var currentProgress = currentConfig ? runtimeProgress.itemProgress[currentConfig.itemId] : null;
          var currentIsSelectable = !!currentConfig && !!currentConfig.prefab && !!(currentProgress != null && currentProgress.isSpawnUnlocked);

          if (!currentIsSelectable) {
            runtimeProgress.currentSpawnItemId = fallbackUnlockedItem.itemId;
          }
        }

        switchMapInternal(mapId) {
          var _director$getScene$na, _director$getScene;

          var nextConfig = this.getMapConfig(mapId);

          if (!nextConfig) {
            warn("[GameManager] Unknown map id: " + mapId);
            this.setStatus('地图切换失败');
            return;
          }

          runtimeProgress.currentMapId = mapId;
          this._ambientSpawnProgressSeconds = 0;
          this.syncStateFromResources();
          var currentSceneName = (_director$getScene$na = (_director$getScene = director.getScene()) == null ? void 0 : _director$getScene.name) != null ? _director$getScene$na : '';

          if (nextConfig.sceneName && currentSceneName && nextConfig.sceneName !== currentSceneName) {
            director.loadScene(nextConfig.sceneName);
            return;
          }

          this.seedInitialMapItems();
          this.setStatus("\u5DF2\u5207\u6362\u5230 " + nextConfig.mapName);
        }

        seedInitialMapItems() {
          var mapConfig = this.getCurrentMapConfig();
          var initialCount = this.normalizeNonNegativeInteger(mapConfig.initialAmbientItemCount);

          for (var index = 0; index < initialCount; index += 1) {
            if (!this.spawnMapPoolItem()) {
              break;
            }
          }
        }

        trySpawnAmbientMapItem(deltaTime) {
          var mapConfig = this.getCurrentMapConfig();
          var interval = this.normalizeNonNegativeNumber(mapConfig.ambientSpawnInterval);

          if (interval <= 0) {
            this._ambientSpawnProgressSeconds = 0;
            return false;
          }

          this._ambientSpawnProgressSeconds += deltaTime;
          var spawned = false;

          while (this._ambientSpawnProgressSeconds >= interval) {
            this._ambientSpawnProgressSeconds -= interval;

            if (!this.spawnMapPoolItem()) {
              break;
            }

            spawned = true;
          }

          return spawned;
        }

        spawnMapPoolItem() {
          if (!this.coinSpawner) {
            return false;
          }

          if (this.getBoardItemCount() >= this.getConfiguredBoardItemLimit()) {
            return false;
          }

          var mapPoolItem = this.pickRandomMapPoolItem();

          if (!mapPoolItem) {
            return false;
          }

          return !!this.coinSpawner.spawnCoin(mapPoolItem.prefab);
        }

        pickRandomMapPoolItem() {
          var _dropPool$Math$floor;

          var dropPool = this.getResolvedCatalog().filter(item => item.allowDropOnCurrentMap && !!item.prefab);

          if (dropPool.length === 0) {
            return null;
          }

          return (_dropPool$Math$floor = dropPool[Math.floor(Math.random() * dropPool.length)]) != null ? _dropPool$Math$floor : null;
        }

        tryRegenerateCoins(deltaTime) {
          var regenInterval = runtimeProgress.coinRegenInterval;

          if (regenInterval <= 0 || runtimeProgress.currentCoins >= runtimeProgress.maxCoins) {
            runtimeProgress.regenProgressSeconds = 0;
            return false;
          }

          runtimeProgress.regenProgressSeconds += deltaTime;
          var regenerated = false;

          while (runtimeProgress.regenProgressSeconds >= regenInterval && runtimeProgress.currentCoins < runtimeProgress.maxCoins) {
            runtimeProgress.regenProgressSeconds -= regenInterval;
            runtimeProgress.currentCoins += 1;
            regenerated = true;
          }

          return regenerated;
        }

        syncStateFromResources() {
          if (!this.getCurrentSpawnItem()) {
            this._state = RoundState.Ready;
            return;
          }

          if (runtimeProgress.currentCoins < this.getConfiguredSpawnCost()) {
            this._state = RoundState.NoCoins;
            return;
          }

          this._state = this._sessionSpawnedCoinCount > 0 ? RoundState.Playing : RoundState.Ready;
        }

        refreshUi() {
          var mapConfig = this.getCurrentMapConfig();
          var resolvedCatalog = this.getResolvedCatalog();
          var currentSpawnItem = this.getCurrentSpawnItem();
          var latestDroppedItem = runtimeProgress.lastDroppedItemId ? this.findResolvedCatalogItemById(runtimeProgress.lastDroppedItemId) : null;
          var unlockedItems = resolvedCatalog.filter(item => item.isSpawnUnlocked).map(item => item.itemName);
          var pocketSummary = resolvedCatalog.map(item => item.itemName + " " + item.ownedCount).join(' / ');

          if (this.scoreLabel) {
            this.scoreLabel.string = "\u6295\u653E\u8D44\u6E90: " + runtimeProgress.currentCoins + "/" + runtimeProgress.maxCoins + " | \u81EA\u52A8\u6062\u590D " + runtimeProgress.coinRegenInterval + "s";
          }

          if (this.dropCountLabel) {
            var _currentSpawnItem$ite;

            this.dropCountLabel.string = "\u5F53\u524D\u6295\u653E\u7269: " + ((_currentSpawnItem$ite = currentSpawnItem == null ? void 0 : currentSpawnItem.itemName) != null ? _currentSpawnItem$ite : '未设置') + " | \u5DF2\u89E3\u9501: " + (unlockedItems.join(' / ') || '无');
          }

          if (this.spawnCountLabel) {
            var _latestDroppedItem$it;

            this.spawnCountLabel.string = "\u6700\u8FD1\u6389\u843D: " + ((_latestDroppedItem$it = latestDroppedItem == null ? void 0 : latestDroppedItem.itemName) != null ? _latestDroppedItem$it : '暂无') + " | \u53E3\u888B: " + (pocketSummary || '暂无物品');
          }

          if (this.statusLabel) {
            this.statusLabel.string = "\u5730\u56FE: " + mapConfig.mapName + " | " + this.getStateText() + " | " + this._statusText;
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
              mapName: 'Map02 预留地图',
              sceneName: SHARED_SCENE_NAME,
              ambientSpawnInterval: this.normalizeNonNegativeNumber(this.map02AmbientSpawnInterval, 6),
              initialAmbientItemCount: this.normalizeNonNegativeInteger(this.map02InitialMapItemCount, 3),
              riskLevelHint: this.normalizePositiveNumber(this.map02RiskLevelHint, 2)
            };
          }

          return {
            mapId: 'Map01',
            mapName: 'Map01 基础地图',
            sceneName: SHARED_SCENE_NAME,
            ambientSpawnInterval: this.normalizeNonNegativeNumber(this.map01AmbientSpawnInterval, 8),
            initialAmbientItemCount: this.normalizeNonNegativeInteger(this.map01InitialMapItemCount, 2),
            riskLevelHint: this.normalizePositiveNumber(this.map01RiskLevelHint, 1)
          };
        }

        getMapIdFromSelection(selection) {
          return selection === MapSelection.Map02 ? 'Map02' : 'Map01';
        }

        getStateText() {
          switch (this._state) {
            case RoundState.Playing:
              return '状态: 进行中';

            case RoundState.NoCoins:
              return '状态: 资源不足';

            case RoundState.Ready:
            default:
              return '状态: 准备中';
          }
        }

        getResolvedCatalog(mapId) {
          if (mapId === void 0) {
            mapId = runtimeProgress.currentMapId;
          }

          return this.getNormalizedCatalogConfigs().map(config => {
            var _runtimeProgress$item3;

            var progress = (_runtimeProgress$item3 = runtimeProgress.itemProgress[config.itemId]) != null ? _runtimeProgress$item3 : {
              ownedCount: 0,
              isSpawnUnlocked: false,
              isDiscovered: false
            };
            var allowDropOnCurrentMap = mapId === 'Map02' ? config.allowDropInMap02 : config.allowDropInMap01;
            var prefabMetadata = this.resolvePrefabMetadata(config);
            return _extends({}, config, prefabMetadata, {
              ownedCount: progress.ownedCount,
              isSpawnUnlocked: progress.isSpawnUnlocked,
              isDiscovered: progress.isDiscovered,
              allowDropOnCurrentMap,
              canBeCurrentSpawnItem: progress.isSpawnUnlocked && !!config.prefab
            });
          });
        }

        getNormalizedCatalogConfigs() {
          var normalizedItems = [];
          var usedIds = new Set();
          var sourceCount = Math.max(this.itemCatalog.length, DEFAULT_TEST_ITEMS.length);

          for (var index = 0; index < sourceCount; index += 1) {
            var _DEFAULT_TEST_ITEMS$i, _inspectorItem$prefab, _inspectorItem$unlock, _inspectorItem$startS, _inspectorItem$startD, _inspectorItem$allowD, _inspectorItem$allowD2;

            var inspectorItem = this.itemCatalog[index];
            var fallbackItem = (_DEFAULT_TEST_ITEMS$i = DEFAULT_TEST_ITEMS[index]) != null ? _DEFAULT_TEST_ITEMS$i : DEFAULT_TEST_ITEMS[DEFAULT_TEST_ITEMS.length - 1];
            var itemId = this.normalizeItemId((inspectorItem == null ? void 0 : inspectorItem.itemId) || fallbackItem.itemId, index);

            if (usedIds.has(itemId)) {
              warn("[GameManager] Duplicate itemId detected and skipped: " + itemId);
              continue;
            }

            usedIds.add(itemId);
            normalizedItems.push({
              itemId,
              prefab: (_inspectorItem$prefab = inspectorItem == null ? void 0 : inspectorItem.prefab) != null ? _inspectorItem$prefab : fallbackItem.prefab,
              unlockRequiredCount: this.normalizeNonNegativeInteger((_inspectorItem$unlock = inspectorItem == null ? void 0 : inspectorItem.unlockRequiredCount) != null ? _inspectorItem$unlock : fallbackItem.unlockRequiredCount),
              startSpawnUnlocked: (_inspectorItem$startS = inspectorItem == null ? void 0 : inspectorItem.startSpawnUnlocked) != null ? _inspectorItem$startS : fallbackItem.startSpawnUnlocked,
              startDiscovered: (_inspectorItem$startD = inspectorItem == null ? void 0 : inspectorItem.startDiscovered) != null ? _inspectorItem$startD : fallbackItem.startDiscovered,
              allowDropInMap01: (_inspectorItem$allowD = inspectorItem == null ? void 0 : inspectorItem.allowDropInMap01) != null ? _inspectorItem$allowD : fallbackItem.allowDropInMap01,
              allowDropInMap02: (_inspectorItem$allowD2 = inspectorItem == null ? void 0 : inspectorItem.allowDropInMap02) != null ? _inspectorItem$allowD2 : fallbackItem.allowDropInMap02
            });
          }

          return normalizedItems;
        }

        resolvePrefabMetadata(config) {
          var fallbackName = this.humanizeItemId(config.itemId);
          var prefabConfig = (_crd && ItemPrefabConfig === void 0 ? (_reportPossibleCrUseOfItemPrefabConfig({
            error: Error()
          }), ItemPrefabConfig) : ItemPrefabConfig).readFromPrefab(config.prefab, config.itemId, fallbackName);
          return {
            itemName: prefabConfig.itemName || fallbackName
          };
        }

        findResolvedCatalogItemById(itemId) {
          var _this$getResolvedCata;

          return (_this$getResolvedCata = this.getResolvedCatalog().find(item => item.itemId === itemId)) != null ? _this$getResolvedCata : null;
        }

        getCurrentSpawnItem() {
          if (!runtimeProgress.currentSpawnItemId) {
            return null;
          }

          var currentSpawnItem = this.findResolvedCatalogItemById(runtimeProgress.currentSpawnItemId);

          if (!(currentSpawnItem != null && currentSpawnItem.canBeCurrentSpawnItem)) {
            return null;
          }

          return currentSpawnItem;
        }

        getBoardItemCount() {
          var _this$coinSpawner$coi, _this$coinSpawner;

          return (_this$coinSpawner$coi = (_this$coinSpawner = this.coinSpawner) == null || (_this$coinSpawner = _this$coinSpawner.coinRoot) == null ? void 0 : _this$coinSpawner.children.length) != null ? _this$coinSpawner$coi : 0;
        }

        getConfiguredBoardItemLimit() {
          return Math.max(1, this.normalizeNonNegativeInteger(this.maxBoardItemCount, 12));
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

        getConfiguredSpawnCost() {
          return Math.max(1, this.normalizeNonNegativeInteger(this.spawnCostPerCoin, 1));
        }

        normalizeItemId(value, index) {
          var _DEFAULT_TEST_ITEMS$i2, _DEFAULT_TEST_ITEMS$i3;

          var trimmed = (value || '').trim();

          if (trimmed.length > 0) {
            return trimmed;
          }

          var fallback = (_DEFAULT_TEST_ITEMS$i2 = (_DEFAULT_TEST_ITEMS$i3 = DEFAULT_TEST_ITEMS[index]) == null ? void 0 : _DEFAULT_TEST_ITEMS$i3.itemId) != null ? _DEFAULT_TEST_ITEMS$i2 : "item_" + (index + 1);
          return fallback;
        }

        humanizeItemId(itemId) {
          var trimmed = (itemId || '').trim();

          if (!trimmed) {
            return 'Unnamed Item';
          }

          var spaced = trimmed.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
          return spaced.charAt(0).toUpperCase() + spaced.slice(1);
        }

        normalizePositiveNumber(value, fallback) {
          if (fallback === void 0) {
            fallback = 1;
          }

          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.max(0, value);
        }

        normalizeNonNegativeNumber(value, fallback) {
          if (fallback === void 0) {
            fallback = 0;
          }

          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.max(0, value);
        }

        normalizeNonNegativeInteger(value, fallback) {
          if (fallback === void 0) {
            fallback = 0;
          }

          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.max(0, Math.round(value));
        }

      }, (_descriptor8 = _applyDecoratedDescriptor(_class5.prototype, "coinSpawner", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class5.prototype, "mapSelection", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return MapSelection.Map01;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class5.prototype, "startCoins", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 300;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class5.prototype, "maxCoins", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 300;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class5.prototype, "coinRegenInterval", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 15;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class5.prototype, "spawnCostPerCoin", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 1;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class5.prototype, "itemCatalog", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return [];
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class5.prototype, "map01InitialMapItemCount", [_dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 2;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class5.prototype, "map01AmbientSpawnInterval", [_dec16], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 8;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class5.prototype, "map01RiskLevelHint", [_dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 1;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class5.prototype, "map02InitialMapItemCount", [_dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 3;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class5.prototype, "map02AmbientSpawnInterval", [_dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 6;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class5.prototype, "map02RiskLevelHint", [_dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 2;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class5.prototype, "maxBoardItemCount", [_dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 12;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class5.prototype, "scoreLabel", [_dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class5.prototype, "dropCountLabel", [_dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class5.prototype, "spawnCountLabel", [_dec24], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class5.prototype, "statusLabel", [_dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class5.prototype, "showColliderDebug", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return false;
        }
      })), _class5)) || _class4));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=7e0d17b40a9513aab3872a981088d039553c9992.js.map