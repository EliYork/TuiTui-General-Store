System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, director, Enum, Label, Prefab, Vec3, warn, PhysicsSystem, EPhysicsDrawFlags, CoinSpawner, ItemPrefabConfig, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _class4, _class5, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _crd, ccclass, property, SHARED_SCENE_NAME, RoundState, MapSelection, CatalogItemConfig, DEFAULT_TEST_ITEMS, runtimeProgress, GameManager;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfCoinBehaviour(extras) {
    _reporterNs.report("CoinBehaviour", "../gameplay/CoinBehaviour", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCoinSpawner(extras) {
    _reporterNs.report("CoinSpawner", "../gameplay/CoinSpawner", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCoinSpawnRequest(extras) {
    _reporterNs.report("CoinSpawnRequest", "../gameplay/CoinSpawner", _context.meta, extras);
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
      Vec3 = _cc.Vec3;
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

      __checkObsolete__(['_decorator', 'Component', 'director', 'Enum', 'Event', 'Label', 'Prefab', 'Vec3', 'warn', 'PhysicsSystem', 'EPhysicsDrawFlags']);

      ({
        ccclass,
        property
      } = _decorator);
      SHARED_SCENE_NAME = 'Prototype01';

      RoundState = /*#__PURE__*/function (RoundState) {
        RoundState["Ready"] = "Ready";
        RoundState["Playing"] = "Playing";
        RoundState["LowResources"] = "LowResources";
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
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "prefab", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "unlockRequiredCount", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "startSpawnUnlocked", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "startDiscovered", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "allowDropInMap01", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "allowDropInMap02", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
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
        resourceRegenProgressSeconds: 0,
        worldDropProgressSeconds: 0,
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
        tooltip: 'Initial active-spawn resource written into the runtime progress on first boot.'
      }), _dec11 = property({
        tooltip: 'Resource cap used only by automatic regeneration. Drop rewards may exceed this value.'
      }), _dec12 = property({
        tooltip: 'Seconds between each automatic resource regeneration tick.'
      }), _dec13 = property({
        tooltip: 'How much resource is restored on each regeneration tick.'
      }), _dec14 = property({
        tooltip: 'How much resource is consumed per manual spawn. This is tracked, but no longer blocks spawning.'
      }), _dec15 = property({
        type: [CatalogItemConfig],
        tooltip: 'Logic-only item catalog. Each item prefab is a complete runtime object.'
      }), _dec16 = property({
        tooltip: 'How many map-pool items should be seeded onto the board when Map01 starts.'
      }), _dec17 = property({
        tooltip: 'Map01 future leak-risk hint. Reserved for later board-difficulty tuning.'
      }), _dec18 = property({
        tooltip: 'How many map-pool items should be seeded onto the board when Map02 starts.'
      }), _dec19 = property({
        tooltip: 'Map02 future leak-risk hint. Reserved for later board-difficulty tuning.'
      }), _dec20 = property({
        tooltip: 'Enable or disable timed world drops without affecting manual spawn or resource recovery.'
      }), _dec21 = property({
        tooltip: 'Seconds between each timed world drop batch.'
      }), _dec22 = property({
        tooltip: 'How many random map-pool items are spawned each time the world drop timer fires.'
      }), _dec23 = property(Label), _dec24 = property(Label), _dec25 = property(Label), _dec26 = property(Label), _dec7(_class4 = (_class5 = class GameManager extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "coinSpawner", _descriptor8, this);

          _initializerDefineProperty(this, "mapSelection", _descriptor9, this);

          _initializerDefineProperty(this, "startCoins", _descriptor10, this);

          _initializerDefineProperty(this, "maxCoins", _descriptor11, this);

          _initializerDefineProperty(this, "resourceRegenInterval", _descriptor12, this);

          _initializerDefineProperty(this, "resourceRegenAmount", _descriptor13, this);

          _initializerDefineProperty(this, "spawnCostPerCoin", _descriptor14, this);

          _initializerDefineProperty(this, "itemCatalog", _descriptor15, this);

          _initializerDefineProperty(this, "map01InitialMapItemCount", _descriptor16, this);

          _initializerDefineProperty(this, "map01RiskLevelHint", _descriptor17, this);

          _initializerDefineProperty(this, "map02InitialMapItemCount", _descriptor18, this);

          _initializerDefineProperty(this, "map02RiskLevelHint", _descriptor19, this);

          _initializerDefineProperty(this, "worldDropEnabled", _descriptor20, this);

          _initializerDefineProperty(this, "worldDropInterval", _descriptor21, this);

          _initializerDefineProperty(this, "worldDropAmount", _descriptor22, this);

          _initializerDefineProperty(this, "scoreLabel", _descriptor23, this);

          _initializerDefineProperty(this, "dropCountLabel", _descriptor24, this);

          _initializerDefineProperty(this, "spawnCountLabel", _descriptor25, this);

          _initializerDefineProperty(this, "statusLabel", _descriptor26, this);

          _initializerDefineProperty(this, "showColliderDebug", _descriptor27, this);

          this._state = RoundState.Ready;
          this._sessionSpawnedCoinCount = 0;
          this._statusText = 'Preparing runtime progress';
          this._manualSpawnPosition = new Vec3();
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
          this.syncStateFromResources();
          const missingPrefabs = this.getResolvedCatalog().filter(item => !item.prefab);

          if (missingPrefabs.length > 0) {
            this.setStatus(`Assign prefabs in GameManager.itemCatalog: ${missingPrefabs.map(item => item.itemName).join(' / ')}`);
            return;
          }

          this.seedInitialMapItems();
          this.setStatus(`Current map: ${this.getCurrentMapConfig().mapName}`);
        }

        update(deltaTime) {
          if (!runtimeProgress.initialized) {
            return;
          }

          let shouldRefreshUi = false;

          if (this.tryRegenerateResources(deltaTime)) {
            this.syncStateFromResources();
            shouldRefreshUi = true;
          }

          if (this.trySpawnWorldDrops(deltaTime)) {
            shouldRefreshUi = true;
          }

          if (shouldRefreshUi) {
            this.refreshUi();
          }
        }

        spawnCoinFromButton() {
          return this.spawnCurrentSpawnItem();
        }

        spawnCoinFromManualPosition(worldX, worldZ) {
          if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('Missing CoinSpawner reference');
            return false;
          }

          const basePosition = this.coinSpawner.getBaseSpawnWorldPosition(this._manualSpawnPosition);
          const baseX = basePosition.x;
          const baseY = basePosition.y;
          const baseZ = basePosition.z;
          Vec3.set(this._manualSpawnPosition, this.normalizeFiniteNumber(worldX, baseX), baseY, this.normalizeFiniteNumber(worldZ, baseZ));
          return this.spawnCurrentSpawnItem({
            worldPosition: this._manualSpawnPosition,
            randomizeAroundPosition: false
          });
        }

        spawnCurrentSpawnItem(request = null) {
          const currentSpawnItem = this.getCurrentSpawnItem();

          if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('Missing CoinSpawner reference');
            return false;
          }

          if (!currentSpawnItem) {
            this.setStatus('No active spawn item is currently available');
            return false;
          }

          const spawnedItem = this.spawnCatalogItem(currentSpawnItem, request);

          if (!spawnedItem) {
            this.setStatus('Spawn failed');
            return false;
          }

          this._sessionSpawnedCoinCount += 1;
          runtimeProgress.currentCoins -= this.getConfiguredSpawnCost();
          this.syncStateFromResources();
          this.setStatus(`Spawned ${currentSpawnItem.itemName}, resource ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins}`);
          return true;
        }

        resolveCoinDrop(item) {
          if (!item.tryMarkScored()) {
            return;
          }

          const collectedItem = this.findResolvedCatalogItemById(item.itemId);

          if (!collectedItem) {
            warn(`[GameManager] Dropped item is missing catalog registration: ${item.itemId || item.node.name}`);
            this.setStatus(`Dropped item is not registered: ${item.itemTypeLabel}`);
            item.onScored();
            return;
          }

          const progress = runtimeProgress.itemProgress[collectedItem.itemId];
          progress.ownedCount += 1;
          progress.isDiscovered = true;
          runtimeProgress.lastDroppedItemId = collectedItem.itemId;
          runtimeProgress.currentCoins += collectedItem.value;
          let unlockedItemName = '';

          if (!progress.isSpawnUnlocked && progress.ownedCount >= collectedItem.unlockRequiredCount) {
            progress.isSpawnUnlocked = true;
            unlockedItemName = collectedItem.itemName;
          }

          this.ensureRuntimeProgress();
          this.syncStateFromResources();
          item.onScored();
          const rewardText = `resource +${collectedItem.value}`;

          if (unlockedItemName) {
            this.setStatus(`Received ${collectedItem.itemName} x1, ${rewardText}, owned ${progress.ownedCount}, unlocked spawn: ${unlockedItemName}`);
            return;
          }

          this.setStatus(`Received ${collectedItem.itemName} x1, ${rewardText}, owned ${progress.ownedCount}`);
        }

        restartGame() {
          const currentScene = director.getScene();

          if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('Restart failed: current scene is missing');
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
          return !!this.coinSpawner && !!this.getCurrentSpawnItem();
        }

        onSpawnItemButtonClicked(_event, itemId) {
          this.selectSpawnItemById(itemId);
        }

        selectSpawnItemById(itemId) {
          const nextItem = this.findResolvedCatalogItemById(itemId);

          if (!nextItem) {
            this.setStatus(`Unknown spawn item: ${itemId}`);
            return false;
          }

          if (!nextItem.isSpawnUnlocked) {
            this.setStatus(`${nextItem.itemName} is not unlocked for spawning yet`);
            return false;
          }

          if (!nextItem.prefab) {
            this.setStatus(`${nextItem.itemName} is missing its prefab`);
            return false;
          }

          runtimeProgress.currentSpawnItemId = nextItem.itemId;
          this.refreshUi();
          this.setStatus(`Active spawn item switched to ${nextItem.itemName}`);
          return true;
        }

        ensureRuntimeProgress() {
          const catalogConfigs = this.getNormalizedCatalogConfigs();

          if (!runtimeProgress.initialized) {
            runtimeProgress.initialized = true;
            runtimeProgress.currentMapId = this.getMapIdFromSelection(this.mapSelection);
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = this.getConfiguredInitialCoins();
            runtimeProgress.resourceRegenProgressSeconds = 0;
            runtimeProgress.worldDropProgressSeconds = 0;
            runtimeProgress.currentSpawnItemId = '';
            runtimeProgress.lastDroppedItemId = '';
            runtimeProgress.itemProgress = {};
          } else {
            runtimeProgress.maxCoins = this.getConfiguredMaxCoins();
            runtimeProgress.currentCoins = this.normalizeFiniteInteger(runtimeProgress.currentCoins, 0);
          }

          for (const config of catalogConfigs) {
            var _runtimeProgress$item;

            const progress = (_runtimeProgress$item = runtimeProgress.itemProgress[config.itemId]) != null ? _runtimeProgress$item : {
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

          const selectableItems = catalogConfigs.filter(config => {
            const progress = runtimeProgress.itemProgress[config.itemId];
            return !!config.prefab && !!(progress != null && progress.isSpawnUnlocked);
          });
          const fallbackUnlockedItem = (_ref = (_ref2 = (_selectableItems$ = selectableItems[0]) != null ? _selectableItems$ : catalogConfigs.find(config => {
            var _runtimeProgress$item2;

            return (_runtimeProgress$item2 = runtimeProgress.itemProgress[config.itemId]) == null ? void 0 : _runtimeProgress$item2.isSpawnUnlocked;
          })) != null ? _ref2 : catalogConfigs[0]) != null ? _ref : null;

          if (!fallbackUnlockedItem) {
            runtimeProgress.currentSpawnItemId = '';
            return;
          }

          const currentConfig = (_catalogConfigs$find = catalogConfigs.find(config => config.itemId === runtimeProgress.currentSpawnItemId)) != null ? _catalogConfigs$find : null;
          const currentProgress = currentConfig ? runtimeProgress.itemProgress[currentConfig.itemId] : null;
          const currentIsSelectable = !!currentConfig && !!currentConfig.prefab && !!(currentProgress != null && currentProgress.isSpawnUnlocked);

          if (!currentIsSelectable) {
            runtimeProgress.currentSpawnItemId = fallbackUnlockedItem.itemId;
          }
        }

        switchMapInternal(mapId) {
          var _director$getScene$na, _director$getScene;

          const nextConfig = this.getMapConfig(mapId);

          if (!nextConfig) {
            warn(`[GameManager] Unknown map id: ${mapId}`);
            this.setStatus('Map switch failed');
            return;
          }

          runtimeProgress.currentMapId = mapId;
          runtimeProgress.worldDropProgressSeconds = 0;
          this.syncStateFromResources();
          const currentSceneName = (_director$getScene$na = (_director$getScene = director.getScene()) == null ? void 0 : _director$getScene.name) != null ? _director$getScene$na : '';

          if (nextConfig.sceneName && currentSceneName && nextConfig.sceneName !== currentSceneName) {
            director.loadScene(nextConfig.sceneName);
            return;
          }

          this.seedInitialMapItems();
          this.setStatus(`Switched to ${nextConfig.mapName}`);
        }

        seedInitialMapItems() {
          const mapConfig = this.getCurrentMapConfig();
          const initialCount = this.normalizeNonNegativeInteger(mapConfig.initialMapItemCount);

          for (let index = 0; index < initialCount; index += 1) {
            this.spawnRandomWorldDrop();
          }
        }

        tryRegenerateResources(deltaTime) {
          const interval = this.getConfiguredResourceRegenInterval();
          const amount = this.getConfiguredResourceRegenAmount();

          if (interval <= 0 || amount <= 0 || runtimeProgress.currentCoins >= runtimeProgress.maxCoins) {
            runtimeProgress.resourceRegenProgressSeconds = 0;
            return false;
          }

          runtimeProgress.resourceRegenProgressSeconds += deltaTime;
          let regenerated = false;

          while (runtimeProgress.resourceRegenProgressSeconds >= interval && runtimeProgress.currentCoins < runtimeProgress.maxCoins) {
            runtimeProgress.resourceRegenProgressSeconds -= interval;
            runtimeProgress.currentCoins = Math.min(runtimeProgress.maxCoins, runtimeProgress.currentCoins + amount);
            regenerated = true;
          }

          return regenerated;
        }

        trySpawnWorldDrops(deltaTime) {
          const interval = this.getConfiguredWorldDropInterval();
          const amount = this.getConfiguredWorldDropAmount();

          if (!this.worldDropEnabled || interval <= 0 || amount <= 0) {
            runtimeProgress.worldDropProgressSeconds = 0;
            return false;
          }

          runtimeProgress.worldDropProgressSeconds += deltaTime;
          let spawned = false;

          while (runtimeProgress.worldDropProgressSeconds >= interval) {
            runtimeProgress.worldDropProgressSeconds -= interval;

            for (let index = 0; index < amount; index += 1) {
              if (this.spawnRandomWorldDrop()) {
                spawned = true;
              }
            }
          }

          return spawned;
        }

        spawnRandomWorldDrop(request = null) {
          const mapPoolItem = this.pickRandomMapPoolItem();

          if (!mapPoolItem) {
            return false;
          }

          return !!this.spawnCatalogItem(mapPoolItem, request);
        }

        spawnCatalogItem(item, request = null) {
          if (!this.coinSpawner || !(item != null && item.prefab)) {
            return null;
          }

          return this.coinSpawner.spawnCoin(item.prefab, request);
        }

        pickRandomMapPoolItem() {
          var _dropPool;

          const dropPool = this.getResolvedCatalog().filter(item => item.allowDropOnCurrentMap && !!item.prefab && item.weight > 0);

          if (dropPool.length === 0) {
            return null;
          }

          const totalWeight = dropPool.reduce((sum, item) => sum + item.weight, 0);

          if (totalWeight <= 0) {
            return null;
          }

          let roll = Math.random() * totalWeight;

          for (const item of dropPool) {
            roll -= item.weight;

            if (roll < 0) {
              return item;
            }
          }

          return (_dropPool = dropPool[dropPool.length - 1]) != null ? _dropPool : null;
        }

        syncStateFromResources() {
          if (!this.getCurrentSpawnItem()) {
            this._state = RoundState.Ready;
            return;
          }

          if (runtimeProgress.currentCoins < 0) {
            this._state = RoundState.LowResources;
            return;
          }

          this._state = this._sessionSpawnedCoinCount > 0 ? RoundState.Playing : RoundState.Ready;
        }

        refreshUi() {
          const mapConfig = this.getCurrentMapConfig();
          const resolvedCatalog = this.getResolvedCatalog();
          const currentSpawnItem = this.getCurrentSpawnItem();
          const latestDroppedItem = runtimeProgress.lastDroppedItemId ? this.findResolvedCatalogItemById(runtimeProgress.lastDroppedItemId) : null;
          const unlockedItems = resolvedCatalog.filter(item => item.isSpawnUnlocked).map(item => item.itemName);
          const pocketSummary = resolvedCatalog.map(item => `${item.itemName} ${item.ownedCount}`).join(' / ');
          const worldDropSummary = this.worldDropEnabled ? `${this.getConfiguredWorldDropAmount()} items / ${this.getConfiguredWorldDropInterval()}s` : 'disabled';

          if (this.scoreLabel) {
            this.scoreLabel.string = `Resource: ${runtimeProgress.currentCoins}/${runtimeProgress.maxCoins} | Regen ${this.getConfiguredResourceRegenAmount()} / ${this.getConfiguredResourceRegenInterval()}s`;
          }

          if (this.dropCountLabel) {
            var _currentSpawnItem$ite;

            this.dropCountLabel.string = `Spawn item: ${(_currentSpawnItem$ite = currentSpawnItem == null ? void 0 : currentSpawnItem.itemName) != null ? _currentSpawnItem$ite : 'None'} | World drop: ${worldDropSummary}`;
          }

          if (this.spawnCountLabel) {
            var _latestDroppedItem$it;

            this.spawnCountLabel.string = `Latest drop: ${(_latestDroppedItem$it = latestDroppedItem == null ? void 0 : latestDroppedItem.itemName) != null ? _latestDroppedItem$it : 'None'} | Collection: ${pocketSummary || 'None'} | Unlocked: ${unlockedItems.join(' / ') || 'None'}`;
          }

          if (this.statusLabel) {
            this.statusLabel.string = `Map: ${mapConfig.mapName} | ${this.getStateText()} | ${this._statusText}`;
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
              mapName: 'Map02 Reserve',
              sceneName: SHARED_SCENE_NAME,
              initialMapItemCount: this.normalizeNonNegativeInteger(this.map02InitialMapItemCount, 3),
              riskLevelHint: this.normalizeNonNegativeNumber(this.map02RiskLevelHint, 2)
            };
          }

          return {
            mapId: 'Map01',
            mapName: 'Map01 Base',
            sceneName: SHARED_SCENE_NAME,
            initialMapItemCount: this.normalizeNonNegativeInteger(this.map01InitialMapItemCount, 2),
            riskLevelHint: this.normalizeNonNegativeNumber(this.map01RiskLevelHint, 1)
          };
        }

        getMapIdFromSelection(selection) {
          return selection === MapSelection.Map02 ? 'Map02' : 'Map01';
        }

        getStateText() {
          switch (this._state) {
            case RoundState.Playing:
              return 'State: Playing';

            case RoundState.LowResources:
              return 'State: Resource below zero, spawning still allowed';

            case RoundState.Ready:
            default:
              return 'State: Ready';
          }
        }

        getResolvedCatalog(mapId = runtimeProgress.currentMapId) {
          return this.getNormalizedCatalogConfigs().map(config => {
            var _runtimeProgress$item3;

            const progress = (_runtimeProgress$item3 = runtimeProgress.itemProgress[config.itemId]) != null ? _runtimeProgress$item3 : {
              ownedCount: 0,
              isSpawnUnlocked: false,
              isDiscovered: false
            };
            const allowDropOnCurrentMap = mapId === 'Map02' ? config.allowDropInMap02 : config.allowDropInMap01;
            const prefabMetadata = this.resolvePrefabMetadata(config);
            return { ...config,
              ...prefabMetadata,
              ownedCount: progress.ownedCount,
              isSpawnUnlocked: progress.isSpawnUnlocked,
              isDiscovered: progress.isDiscovered,
              allowDropOnCurrentMap,
              canBeCurrentSpawnItem: progress.isSpawnUnlocked && !!config.prefab
            };
          });
        }

        getNormalizedCatalogConfigs() {
          const normalizedItems = [];
          const usedIds = new Set();
          const sourceCount = Math.max(this.itemCatalog.length, DEFAULT_TEST_ITEMS.length);

          for (let index = 0; index < sourceCount; index += 1) {
            var _DEFAULT_TEST_ITEMS$i, _inspectorItem$prefab, _inspectorItem$unlock, _inspectorItem$startS, _inspectorItem$startD, _inspectorItem$allowD, _inspectorItem$allowD2;

            const inspectorItem = this.itemCatalog[index];
            const fallbackItem = (_DEFAULT_TEST_ITEMS$i = DEFAULT_TEST_ITEMS[index]) != null ? _DEFAULT_TEST_ITEMS$i : DEFAULT_TEST_ITEMS[DEFAULT_TEST_ITEMS.length - 1];
            const itemId = this.normalizeItemId((inspectorItem == null ? void 0 : inspectorItem.itemId) || fallbackItem.itemId, index);

            if (usedIds.has(itemId)) {
              warn(`[GameManager] Duplicate itemId detected and skipped: ${itemId}`);
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
          const fallbackName = this.humanizeItemId(config.itemId);
          const prefabConfig = (_crd && ItemPrefabConfig === void 0 ? (_reportPossibleCrUseOfItemPrefabConfig({
            error: Error()
          }), ItemPrefabConfig) : ItemPrefabConfig).readFromPrefab(config.prefab, config.itemId, fallbackName);
          return {
            itemName: prefabConfig.itemName || fallbackName,
            value: this.normalizeNonNegativeInteger(prefabConfig.value, 1),
            weight: this.normalizeNonNegativeNumber(prefabConfig.weight, 1)
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

          const currentSpawnItem = this.findResolvedCatalogItemById(runtimeProgress.currentSpawnItemId);

          if (!(currentSpawnItem != null && currentSpawnItem.canBeCurrentSpawnItem)) {
            return null;
          }

          return currentSpawnItem;
        }

        getConfiguredInitialCoins() {
          return this.normalizeNonNegativeInteger(this.startCoins);
        }

        getConfiguredMaxCoins() {
          return this.normalizeNonNegativeInteger(this.maxCoins);
        }

        getConfiguredResourceRegenInterval() {
          return this.normalizeNonNegativeNumber(this.resourceRegenInterval, 1);
        }

        getConfiguredResourceRegenAmount() {
          return this.normalizeNonNegativeInteger(this.resourceRegenAmount, 1);
        }

        getConfiguredWorldDropInterval() {
          return this.normalizeNonNegativeNumber(this.worldDropInterval, 5);
        }

        getConfiguredWorldDropAmount() {
          return this.normalizeNonNegativeInteger(this.worldDropAmount, 1);
        }

        getConfiguredSpawnCost() {
          return Math.max(1, this.normalizeNonNegativeInteger(this.spawnCostPerCoin, 1));
        }

        normalizeItemId(value, index) {
          var _DEFAULT_TEST_ITEMS$i2, _DEFAULT_TEST_ITEMS$i3;

          const trimmed = (value || '').trim();

          if (trimmed.length > 0) {
            return trimmed;
          }

          const fallback = (_DEFAULT_TEST_ITEMS$i2 = (_DEFAULT_TEST_ITEMS$i3 = DEFAULT_TEST_ITEMS[index]) == null ? void 0 : _DEFAULT_TEST_ITEMS$i3.itemId) != null ? _DEFAULT_TEST_ITEMS$i2 : `item_${index + 1}`;
          return fallback;
        }

        humanizeItemId(itemId) {
          const trimmed = (itemId || '').trim();

          if (!trimmed) {
            return 'Unnamed Item';
          }

          const spaced = trimmed.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
          return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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

        normalizeFiniteInteger(value, fallback = 0) {
          if (!Number.isFinite(value)) {
            return fallback;
          }

          return Math.round(value);
        }

        normalizeFiniteNumber(value, fallback = 0) {
          if (!Number.isFinite(value)) {
            return fallback;
          }

          return value;
        }

      }, (_descriptor8 = _applyDecoratedDescriptor(_class5.prototype, "coinSpawner", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class5.prototype, "mapSelection", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return MapSelection.Map01;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class5.prototype, "startCoins", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 300;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class5.prototype, "maxCoins", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 300;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class5.prototype, "resourceRegenInterval", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class5.prototype, "resourceRegenAmount", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class5.prototype, "spawnCostPerCoin", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class5.prototype, "itemCatalog", [_dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class5.prototype, "map01InitialMapItemCount", [_dec16], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class5.prototype, "map01RiskLevelHint", [_dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class5.prototype, "map02InitialMapItemCount", [_dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class5.prototype, "map02RiskLevelHint", [_dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class5.prototype, "worldDropEnabled", [_dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class5.prototype, "worldDropInterval", [_dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class5.prototype, "worldDropAmount", [_dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class5.prototype, "scoreLabel", [_dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class5.prototype, "dropCountLabel", [_dec24], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class5.prototype, "spawnCountLabel", [_dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class5.prototype, "statusLabel", [_dec26], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class5.prototype, "showColliderDebug", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      })), _class5)) || _class4));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=7e0d17b40a9513aab3872a981088d039553c9992.js.map