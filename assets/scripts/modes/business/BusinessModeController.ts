import { _decorator, Component, Label, Node, find, warn } from 'cc';
import {
    BUSINESS_REWARD_ITEM_COUNT_AT_LEAST,
    BUSINESS_REWARD_SCORE_AT_LEAST,
    BUSINESS_REWARD_TARGET_REACHED,
    BusinessModeConfig,
    NormalizedBusinessBaseRewardRule,
    NormalizedBusinessItemScoreConfig,
    createDefaultNormalizedBaseRewardRules,
    createDefaultNormalizedItemScoreConfigs,
} from '../../business/BusinessModeConfig';
import { ShopConfig, createDefaultNormalizedBusinessBonuses } from '../../shop/ShopConfig';
import {
    NormalizedShopBusinessBonusConfig,
    ShopOrderDeckSnapshot,
    SHOP_RUNTIME_STATE,
    addShopOrderWeight,
    getShopRuntimeBusinessBonuses,
    getOwnedBusinessBonusSnapshots,
    getShopOrderWeight,
    setShopRuntimeCatalog,
} from '../../shop/ShopTypes';

const { ccclass, property } = _decorator;

interface EffectivePurchaseOrder {
    itemId: string;
    displayName: string;
    count: number;
}

interface BusinessObtainedItemSnapshot {
    itemId: string;
    displayName: string;
    count: number;
    value: number;
}

interface BusinessDayRewardSnapshot {
    displayName: string;
    rewardMoney: number;
    achieved: boolean;
    category: 'base' | 'businessBonus';
    businessBonusId?: string;
}

export interface BusinessItemValueSnapshot {
    itemId: string;
    displayName: string;
    value: number;
}

export interface BusinessPickedItem {
    itemId: string;
    displayName: string;
    count: number;
    probability: number;
}

export interface BusinessDayResult {
    day: number;
    score: number;
    targetScore: number;
    reachedTarget: boolean;
    obtainedItems: BusinessObtainedItemSnapshot[];
    rewardLines: BusinessDayRewardSnapshot[];
    earnedMoney: number;
    detailText: string;
}

@ccclass('BusinessPurchaseOrderConfig')
class BusinessPurchaseOrderConfig {
    @property({
        displayName: '物品 ID',
        tooltip: '订购单对应的物品逻辑 ID，需要和 GameManager.itemCatalog 以及物品 Prefab 上的 ItemPrefabConfig.itemId 保持一致。',
    })
    public itemId = '';

    @property({
        displayName: '显示名称',
        tooltip: '左侧经营模式 UI 中显示给玩家看的中文名称，例如“苹果”“香蕉”。只影响显示，不影响匹配。',
    })
    public displayName = '';

    @property({
        displayName: '订购单张数',
        tooltip: '该物品在经营模式订购单牌组中的张数，也就是主动投放抽取权重。数值越大越容易被抽中，0 表示不参与抽取。',
    })
    public count = 0;
}

@ccclass('BusinessModeController')
export class BusinessModeController extends Component {
    @property({
        displayName: '启用订购单投放',
        tooltip: '开启后，经营模式主动投放会按订购单张数作为权重预抽下次投放物；关闭后会回到 GameManager 原本的当前投放物逻辑。',
    })
    public enableOrderDeckSpawn = true;

    @property({
        type: [BusinessPurchaseOrderConfig],
        displayName: '订购单配置',
        tooltip: '可选的完整订购单配置。这里有内容时会优先使用这份列表；留空时使用下面的默认苹果、香蕉、柠檬订购单数量。',
    })
    public purchaseOrders: BusinessPurchaseOrderConfig[] = [];

    @property({
        displayName: '默认苹果订购单数量',
        tooltip: '订购单配置为空时使用。苹果订购单张数越多，主动投放时抽到苹果的概率越高。默认 3。',
    })
    public defaultAppleOrderCount = 3;

    @property({
        displayName: '默认香蕉订购单数量',
        tooltip: '订购单配置为空时使用。香蕉订购单张数越多，主动投放时抽到香蕉的概率越高。默认 2。',
    })
    public defaultBananaOrderCount = 2;

    @property({
        displayName: '默认柠檬订购单数量',
        tooltip: '订购单配置为空时使用。默认 0，表示柠檬暂不进入经营模式主动投放牌组。',
    })
    public defaultLemonOrderCount = 0;

    @property({
        type: BusinessModeConfig,
        displayName: '经营模式配置',
        tooltip: '读取每日目标、物品计分和本日基础收益规则。推荐绑定 GameRoot/模式配置表/经营模式参数 节点上的 BusinessModeConfig 组件。',
    })
    public businessConfig: BusinessModeConfig | null = null;

    @property({
        type: ShopConfig,
        displayName: '商店配置',
        tooltip: '用于读取已拥有经营加成对应的商品模板。推荐绑定 GameRoot/ShopConfig 节点上的 ShopConfig 组件。',
    })
    public shopConfig: ShopConfig | null = null;

    @property({
        type: Label,
        displayName: '订购单信息 Label',
        tooltip: '显示当前订购单牌组组成和概率，例如“苹果 x3（60%）”。为空时不会刷新这段 UI。',
    })
    public orderDeckLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '下次投放 Label',
        tooltip: '显示经营模式已经预抽好的下次投放物。玩家点击或长按投放时会投出这里显示的物品，投放成功后再预抽下一次。',
    })
    public currentSpawnLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '当前获得汇总 Label',
        tooltip: '用一段多行文本显示本日当前获得分数和各进货单商品的小计，例如“苹果：1 x 2 = 2”。优先使用这个 Label，便于以后扩展更多商品。',
    })
    public obtainedSummaryLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '当前获得分数标题 Label',
        tooltip: '显示当前获得区域标题和局中分数，例如“当前获得分数：0 / 20”。如果未绑定，会把这行并入当前获得汇总 Label。',
    })
    public obtainedScoreTitleLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '现有资金 Label',
        tooltip: '显示经营模式当前累计资金，例如“现有资金：￥0”。本日达标后点击进入商店时会领取本日资金奖励并刷新这里。'
    })
    public dailyScoreLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '本日结果 Label',
        tooltip: '点击“结束本日”后显示当天是否达标，例如“本日达标！”或“本日未达标”。新一天开始后仍保留上一天结果，方便测试。'
    })
    public dayResultLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '苹果获得 Label',
        tooltip: '兼容旧布局用。当前推荐使用“当前获得汇总 Label”；如果旧苹果获得 Label 仍绑定，会同步更新数量文本。',
    })
    public appleGainedLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '香蕉获得 Label',
        tooltip: '兼容旧布局用。当前推荐使用“当前获得汇总 Label”；如果旧香蕉获得 Label 仍绑定，会同步更新数量文本。',
    })
    public bananaGainedLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '柠檬获得 Label',
        tooltip: '兼容旧布局用。当前推荐使用“当前获得汇总 Label”；如果旧柠檬获得 Label 仍绑定，会同步更新数量文本。',
    })
    public lemonGainedLabel: Label | null = null;

    @property({
        type: Node,
        displayName: '苹果获得项节点',
        tooltip: '兼容旧卡片布局用。绑定“当前获得汇总 Label”后，该旧卡片会自动隐藏，避免每个水果都占一个独立框。',
    })
    public appleGainedItemNode: Node | null = null;

    @property({
        type: Node,
        displayName: '香蕉获得项节点',
        tooltip: '兼容旧卡片布局用。绑定“当前获得汇总 Label”后，该旧卡片会自动隐藏，避免每个水果都占一个独立框。',
    })
    public bananaGainedItemNode: Node | null = null;

    @property({
        type: Node,
        displayName: '柠檬获得项节点',
        tooltip: '兼容旧卡片布局用。绑定“当前获得汇总 Label”后，该旧卡片会自动隐藏，避免每个水果都占一个独立框。',
    })
    public lemonGainedItemNode: Node | null = null;

    public nextItemId = '';
    public nextItemDisplayName = '';
    public currentDay = 1;
    public dailyTargetScore = 20;
    public dailyScore = 0;
    public money = 0;
    public todayEarnedMoney = 0;

    private readonly _obtainedCounts: Record<string, number> = Object.create(null);
    private readonly _obtainedItemNames: Record<string, string> = Object.create(null);
    private readonly _obtainedItemValues: Record<string, number> = Object.create(null);
    private readonly _itemDisplayNames: Record<string, string> = Object.create(null);
    private readonly _itemValues: Record<string, number> = Object.create(null);
    private _preparedNextItem: BusinessPickedItem | null = null;
    private _spawnMessageOverride = '';
    private _dayResultText = '';
    private _latestSettlement: BusinessDayResult | null = null;
    private _latestSettlementClaimed = false;

    protected onLoad(): void {
        this.bindBusinessConfig();
        this.bindShopConfig();
        if (!SHOP_RUNTIME_STATE.businessMoneyInitialized) {
            SHOP_RUNTIME_STATE.currentMoney = SHOP_RUNTIME_STATE.currentMoney > 0
                ? SHOP_RUNTIME_STATE.currentMoney
                : this.getConfiguredInitialMoney();
            SHOP_RUNTIME_STATE.businessMoneyInitialized = true;
        }
        this.money = SHOP_RUNTIME_STATE.currentMoney;
        this.dailyTargetScore = this.calculateDailyTargetScore(this.currentDay, 0, 0);
        this.applyBusinessItemScoreConfigs();
        this.prepareNextItem();
    }

    protected onEnable(): void {
        if (!this._preparedNextItem && this.hasAvailableOrders()) {
            this.prepareNextItem();
            return;
        }

        this.refreshUi();
    }

    public isOrderDeckSpawnEnabled(): boolean {
        return this.enableOrderDeckSpawn;
    }

    public hasAvailableOrders(): boolean {
        return this.getTotalOrderWeight() > 0;
    }

    public getPreparedNextItem(): BusinessPickedItem | null {
        return this._preparedNextItem;
    }

    public consumePreparedNextItemAndPrepareAnother(): BusinessPickedItem | null {
        const consumedItem = this._preparedNextItem;
        if (!consumedItem) {
            this.prepareNextItem();
            return null;
        }

        this.prepareNextItem();
        return consumedItem;
    }

    public pickNextItemByOrderDeck(): BusinessPickedItem | null {
        return this.consumePreparedNextItemAndPrepareAnother();
    }

    public startCurrentDay(day: number, baseTargetScore: number, targetScoreIncrease: number): void {
        this.currentDay = normalizePositiveInteger(day, 1);
        this.dailyTargetScore = this.calculateDailyTargetScore(this.currentDay, baseTargetScore, targetScoreIncrease);
        this.dailyScore = 0;
        this.todayEarnedMoney = 0;
        this._dayResultText = '';
        this._latestSettlement = null;
        this._latestSettlementClaimed = false;
        this.clearObtainedCounts();
        this.applyBusinessItemScoreConfigs();
        this.prepareNextItem();
        this.refreshUi();
    }

    public syncDailyTarget(day: number, baseTargetScore: number, targetScoreIncrease: number): void {
        this.currentDay = normalizePositiveInteger(day, 1);
        this.dailyTargetScore = this.calculateDailyTargetScore(this.currentDay, baseTargetScore, targetScoreIncrease);
        this.applyBusinessItemScoreConfigs();
        this.refreshUi();
    }

    public syncItemValues(items: BusinessItemValueSnapshot[]): void {
        Object.keys(this._itemDisplayNames).forEach((itemId) => {
            delete this._itemDisplayNames[itemId];
        });
        Object.keys(this._itemValues).forEach((itemId) => {
            delete this._itemValues[itemId];
        });

        for (const item of items) {
            const itemId = (item.itemId || '').trim();
            if (!itemId) {
                continue;
            }

            this._itemDisplayNames[itemId] = (item.displayName || '').trim() || itemId;
            this._itemValues[itemId] = normalizeNonNegativeNumber(item.value);
        }

        this.applyBusinessItemScoreConfigs();
        this.refreshUi();
    }

    public settleCurrentDay(): BusinessDayResult {
        if (this._latestSettlement) {
            return this._latestSettlement;
        }

        const reachedTarget = this.dailyScore >= this.dailyTargetScore;
        const obtainedItems = this.getObtainedItemSnapshots();
        const rewardLines = reachedTarget ? [
            ...this.calculateBaseRewardLines(obtainedItems),
            ...this.calculateBusinessBonusRewardLines(obtainedItems),
        ] : [];
        const earnedMoney = rewardLines.reduce((sum, line) => sum + (line.achieved ? line.rewardMoney : 0), 0);
        const result: BusinessDayResult = {
            day: this.currentDay,
            score: this.dailyScore,
            targetScore: this.dailyTargetScore,
            reachedTarget,
            obtainedItems,
            rewardLines,
            earnedMoney,
            detailText: '',
        };
        result.detailText = this.buildSettlementDetailText(result);
        this.todayEarnedMoney = earnedMoney;
        this._latestSettlement = result;
        this._latestSettlementClaimed = false;

        this._dayResultText = result.reachedTarget
            ? `本日达标！${formatScore(result.score)} / ${formatScore(result.targetScore)}`
            : `本日未达标 ${formatScore(result.score)} / ${formatScore(result.targetScore)}`;
        this.refreshUi();
        return result;
    }

    public endCurrentDayAndStartNextDay(
        nextDay: number,
        baseTargetScore: number,
        targetScoreIncrease: number,
    ): BusinessDayResult {
        const result = this.settleCurrentDay();
        this.currentDay = normalizePositiveInteger(nextDay, this.currentDay + 1);
        this.dailyTargetScore = this.calculateDailyTargetScore(this.currentDay, baseTargetScore, targetScoreIncrease);
        this.dailyScore = 0;
        this.todayEarnedMoney = 0;
        this._latestSettlement = null;
        this._latestSettlementClaimed = false;
        this.clearObtainedCounts();
        this.applyBusinessItemScoreConfigs();
        this.prepareNextItem();
        this.refreshUi();
        return result;
    }

    public claimSettledMoney(): number {
        const settlement = this._latestSettlement;
        if (!settlement || this._latestSettlementClaimed || !settlement.reachedTarget) {
            return 0;
        }

        const claimedMoney = normalizeNonNegativeInteger(settlement.earnedMoney);
        this.money += claimedMoney;
        SHOP_RUNTIME_STATE.currentMoney = this.money;
        SHOP_RUNTIME_STATE.businessMoneyInitialized = true;
        this.todayEarnedMoney = 0;
        this._latestSettlementClaimed = true;
        this.refreshUi();
        return claimedMoney;
    }

    public prepareNextItem(): BusinessPickedItem | null {
        this._spawnMessageOverride = '';
        const activeOrders = this.getActiveOrders();
        const totalWeight = activeOrders.reduce((sum, order) => sum + order.count, 0);

        if (totalWeight <= 0) {
            this._preparedNextItem = null;
            this.nextItemId = '';
            this.nextItemDisplayName = '';
            this.refreshUi();
            return null;
        }

        let roll = Math.random() * totalWeight;
        for (const order of activeOrders) {
            roll -= order.count;
            if (roll < 0) {
                return this.applyPreparedOrder(order, totalWeight);
            }
        }

        const fallbackOrder = activeOrders[activeOrders.length - 1] ?? null;
        return fallbackOrder ? this.applyPreparedOrder(fallbackOrder, totalWeight) : null;
    }

    public recordCollectedItem(itemId: string): void {
        this.recordDrop(itemId, 1);
    }

    public addDebugScore(amount: number): number {
        const scoreDelta = normalizeNonNegativeNumber(amount);
        if (scoreDelta <= 0) {
            return this.dailyScore;
        }

        this.dailyScore += scoreDelta;
        this._latestSettlement = null;
        this._latestSettlementClaimed = false;
        this.todayEarnedMoney = 0;
        this.refreshUi();
        return this.dailyScore;
    }

    public recordDrop(itemId: string, scoreValue: number, displayName = ''): void {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return;
        }

        const resolvedScoreValue = this.resolveBusinessItemScoreValue(normalizedItemId, scoreValue);
        const resolvedDisplayName = this.resolveBusinessItemDisplayName(normalizedItemId, displayName);
        this._obtainedCounts[normalizedItemId] = this.getObtainedCount(normalizedItemId) + 1;
        this._obtainedItemValues[normalizedItemId] = resolvedScoreValue;
        this._obtainedItemNames[normalizedItemId] = resolvedDisplayName;
        this._itemValues[normalizedItemId] = resolvedScoreValue;
        this._itemDisplayNames[normalizedItemId] = resolvedDisplayName;
        this.dailyScore += resolvedScoreValue;
        this._latestSettlement = null;
        this._latestSettlementClaimed = false;
        this.todayEarnedMoney = 0;
        this.refreshUi();
    }

    public showSpawnMessage(message: string): void {
        this._spawnMessageOverride = message;
        this.refreshUi();
    }

    public getNoAvailableOrderStatus(): string {
        return '没有可用进货单';
    }

    public getCurrentMoney(): number {
        return normalizeNonNegativeInteger(this.money);
    }

    public getCurrentDay(): number {
        return normalizePositiveInteger(this.currentDay, 1);
    }

    public getDailyTargetScore(): number {
        return normalizeNonNegativeNumber(this.dailyTargetScore);
    }

    public getDailyScore(): number {
        return normalizeNonNegativeNumber(this.dailyScore);
    }

    public isDailyTargetReached(): boolean {
        return this.getDailyScore() >= this.getDailyTargetScore();
    }

    public setCurrentMoney(value: number): void {
        this.money = normalizeNonNegativeInteger(value);
        SHOP_RUNTIME_STATE.currentMoney = this.money;
        SHOP_RUNTIME_STATE.businessMoneyInitialized = true;
        this.refreshUi();
    }

    public resetRunMoneyToInitial(): number {
        this.money = this.getConfiguredInitialMoney();
        SHOP_RUNTIME_STATE.currentMoney = this.money;
        SHOP_RUNTIME_STATE.businessMoneyInitialized = true;
        this.todayEarnedMoney = 0;
        this._latestSettlement = null;
        this._latestSettlementClaimed = false;
        this.refreshUi();
        return this.money;
    }

    public getTodayObtainedCount(itemId: string): number {
        return this.getObtainedCount(itemId);
    }

    public getOrderDeckSnapshots(): ShopOrderDeckSnapshot[] {
        return this.getEffectiveOrders()
            .filter((order) => order.itemId.length > 0 && order.count > 0)
            .map((order) => ({
                id: order.itemId,
                title: order.displayName,
                itemId: order.itemId,
                weight: order.count,
            }));
    }

    public getOwnedBusinessBonusSnapshots(): NormalizedShopBusinessBonusConfig[] {
        return getOwnedBusinessBonusSnapshots(this.getBusinessBonusCatalog());
    }

    public syncShopConfigToRuntime(): void {
        this.bindShopConfig();
        if (!this.shopConfig) {
            return;
        }

        setShopRuntimeCatalog(this.shopConfig.getStockOrders(), this.shopConfig.getBusinessBonuses());
    }

    public addOrderDeckWeight(itemId: string, displayName: string, count: number): number {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            warn('[BusinessModeController] 商店订购单缺少物品 ID，无法加入牌组。');
            return 0;
        }

        addShopOrderWeight(normalizedItemId, displayName, count);
        this.prepareNextItem();
        this.refreshUi();
        return this.getOrderDeckWeight(normalizedItemId);
    }

    public getOrderDeckWeight(itemId: string): number {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return 0;
        }

        const order = this.getEffectiveOrders().find((candidate) => candidate.itemId === normalizedItemId);
        return order?.count ?? 0;
    }

    private applyPreparedOrder(order: EffectivePurchaseOrder, totalWeight: number): BusinessPickedItem {
        const pickedItem = {
            itemId: order.itemId,
            displayName: order.displayName,
            count: order.count,
            probability: totalWeight > 0 ? order.count / totalWeight : 0,
        };

        this._preparedNextItem = pickedItem;
        this.nextItemId = pickedItem.itemId;
        this.nextItemDisplayName = pickedItem.displayName;
        this.refreshUi();
        return pickedItem;
    }

    private refreshUi(): void {
        this.refreshOrderDeckLabel();
        this.refreshCurrentSpawnLabel();
        this.refreshGainedLabels();
        this.refreshDailyScoreLabel();
        this.refreshDayResultLabel();
        this.refreshGainedItemVisibility();
    }

    private refreshOrderDeckLabel(): void {
        if (!this.orderDeckLabel) {
            return;
        }

        const activeOrders = this.getActiveOrders();
        const totalWeight = activeOrders.reduce((sum, order) => sum + order.count, 0);
        if (totalWeight <= 0) {
            this.orderDeckLabel.string = '当前进货单：\n无可用进货单';
            return;
        }

        const orderLines = activeOrders.map((order) => {
            const percentage = Math.round((order.count / totalWeight) * 100);
            return `${order.displayName} x${order.count}（${percentage}%）`;
        });
        this.orderDeckLabel.string = `当前进货单：\n${orderLines.join('\n')}`;
    }

    private refreshCurrentSpawnLabel(): void {
        if (!this.currentSpawnLabel) {
            return;
        }

        if (this._spawnMessageOverride) {
            this.currentSpawnLabel.string = this._spawnMessageOverride;
            return;
        }

        this.currentSpawnLabel.string = this.nextItemDisplayName
            ? `下次投放：${this.nextItemDisplayName}`
            : '下次投放：无';
    }

    private refreshGainedLabels(): void {
        const scoreTitleText = this.buildCurrentScoreTitleText();
        if (this.obtainedScoreTitleLabel) {
            this.obtainedScoreTitleLabel.string = scoreTitleText;
        }

        if (this.obtainedSummaryLabel) {
            const detailText = this.buildCurrentScoreItemDetailText();
            this.obtainedSummaryLabel.string = this.obtainedScoreTitleLabel
                ? detailText
                : `${scoreTitleText}\n\n${detailText}`;
        }

        if (this.appleGainedLabel) {
            this.appleGainedLabel.string = `苹果 x${this.getObtainedCount('apple')}`;
        }

        if (this.bananaGainedLabel) {
            this.bananaGainedLabel.string = `香蕉 x${this.getObtainedCount('banana')}`;
        }

        if (this.lemonGainedLabel) {
            this.lemonGainedLabel.string = `柠檬 x${this.getObtainedCount('lemon')}`;
        }
    }

    private refreshGainedItemVisibility(): void {
        if (this.obtainedSummaryLabel) {
            this.setNodeActive(this.appleGainedItemNode, false);
            this.setNodeActive(this.bananaGainedItemNode, false);
            this.setNodeActive(this.lemonGainedItemNode, false);
            return;
        }

        this.setLegacyGainedItemVisible(this.appleGainedItemNode, 'apple');
        this.setLegacyGainedItemVisible(this.bananaGainedItemNode, 'banana');
        this.setLegacyGainedItemVisible(this.lemonGainedItemNode, 'lemon');
    }

    private setLegacyGainedItemVisible(node: Node | null, itemId: string): void {
        if (!node) {
            return;
        }

        node.active = this.hasOrderForItem(itemId) || this.getObtainedCount(itemId) > 0;
    }

    private setNodeActive(node: Node | null, active: boolean): void {
        if (node) {
            node.active = active;
        }
    }

    private refreshDailyScoreLabel(): void {
        if (this.dailyScoreLabel) {
            this.dailyScoreLabel.string = `现有资金：￥${formatScore(this.money)}`;
        }
    }

    private refreshDayResultLabel(): void {
        if (this.dayResultLabel) {
            this.dayResultLabel.string = this._dayResultText;
        }
    }

    private hasOrderForItem(itemId: string): boolean {
        return this.getEffectiveOrders().some((order) => order.itemId === itemId && order.count > 0);
    }

    private getObtainedItemSnapshots(): BusinessObtainedItemSnapshot[] {
        const orderRanks = new Map<string, number>();
        this.getHudItemScoreConfigs().forEach((config, index) => {
            orderRanks.set(config.itemId, index);
        });
        this.getEffectiveOrders().forEach((order, index) => {
            if (!orderRanks.has(order.itemId)) {
                orderRanks.set(order.itemId, orderRanks.size + index);
            }
        });

        return Object.keys(this._obtainedCounts)
            .map((itemId) => ({
                itemId,
                displayName: this.resolveDisplayName(itemId, this._obtainedItemNames[itemId]),
                count: this.getObtainedCount(itemId),
                value: this.getItemValue(itemId),
            }))
            .filter((item) => item.count > 0)
            .sort((a, b) => {
                const rankA = orderRanks.get(a.itemId) ?? Number.MAX_SAFE_INTEGER;
                const rankB = orderRanks.get(b.itemId) ?? Number.MAX_SAFE_INTEGER;
                if (rankA !== rankB) {
                    return rankA - rankB;
                }

                return a.displayName.localeCompare(b.displayName, 'zh-Hans-CN');
            });
    }

    private buildCurrentScoreTitleText(): string {
        return `当前获得分数：${formatScore(this.dailyScore)} / ${formatScore(this.dailyTargetScore)}`;
    }

    private buildCurrentScoreItemDetailText(): string {
        const hudItems = this.getHudItemScoreConfigs();
        if (hudItems.length <= 0) {
            return '暂无经营物品';
        }

        return hudItems.map((item) => {
            const count = this.getObtainedCount(item.itemId);
            const value = this.getItemValue(item.itemId);
            const subtotal = count * value;
            return `${item.displayName}：${count} x ${formatScore(value)} = ${formatScore(subtotal)}`;
        }).join('\n');
    }

    public getOwnedBusinessBonuses(): NormalizedShopBusinessBonusConfig[] {
        return getOwnedBusinessBonusSnapshots(this.getBusinessBonusCatalog());
    }

    private calculateBaseRewardLines(obtainedItems: BusinessObtainedItemSnapshot[]): BusinessDayRewardSnapshot[] {
        const reachedTarget = this.dailyScore >= this.dailyTargetScore;
        return this.getConfiguredBaseRewardRules().map((rule) => {
            const displayName = (rule.displayName || '').trim() || rule.id || '未命名基础收益';
            const rewardMoney = normalizeNonNegativeInteger(rule.rewardMoney);
            const achieved = this.isBaseRewardRuleAchieved(rule, reachedTarget, obtainedItems);

            return {
                displayName,
                rewardMoney,
                achieved,
                category: 'base' as const,
            };
        });
    }

    private calculateBusinessBonusRewardLines(obtainedItems: BusinessObtainedItemSnapshot[]): BusinessDayRewardSnapshot[] {
        return getOwnedBusinessBonusSnapshots(this.getBusinessBonusCatalog()).map((bonus) => {
            const requiredCount = normalizeNonNegativeInteger(bonus.requiredCount);
            const rewardMoney = normalizeNonNegativeInteger(bonus.rewardMoney);
            const obtainedCount = this.getObtainedCountFromSnapshots(obtainedItems, bonus.itemId);

            return {
                displayName: bonus.displayName,
                rewardMoney,
                achieved: obtainedCount >= requiredCount,
                category: 'businessBonus' as const,
                businessBonusId: bonus.id,
            };
        });
    }

    private isBaseRewardRuleAchieved(
        rule: NormalizedBusinessBaseRewardRule,
        reachedTarget: boolean,
        obtainedItems: BusinessObtainedItemSnapshot[],
    ): boolean {
        if (rule.requireTargetReached && !reachedTarget) {
            return false;
        }

        const ruleType = (rule.ruleType || '').trim();
        if (ruleType === BUSINESS_REWARD_TARGET_REACHED) {
            return reachedTarget;
        }

        if (ruleType === BUSINESS_REWARD_ITEM_COUNT_AT_LEAST) {
            const itemId = (rule.itemId || '').trim();
            const threshold = normalizeNonNegativeInteger(rule.requiredCount);
            const item = obtainedItems.find((obtainedItem) => obtainedItem.itemId === itemId);
            return !!item && item.count >= threshold;
        }

        if (ruleType === BUSINESS_REWARD_SCORE_AT_LEAST) {
            return this.dailyScore >= normalizeNonNegativeNumber(rule.requiredScore);
        }

        warn(`[BusinessModeController] 未识别的本日基础收益规则类型：${ruleType || '空'}`);
        return false;
    }

    private getConfiguredInitialMoney(): number {
        return this.businessConfig?.getInitialMoney() ?? 0;
    }

    private getConfiguredItemScoreConfigs(): NormalizedBusinessItemScoreConfig[] {
        return this.businessConfig?.getItemScoreConfigs() ?? createDefaultNormalizedItemScoreConfigs();
    }

    private getHudItemScoreConfigs(): NormalizedBusinessItemScoreConfig[] {
        return this.getConfiguredItemScoreConfigs().filter((config) => config.showInHud);
    }

    private getConfiguredBaseRewardRules(): NormalizedBusinessBaseRewardRule[] {
        return this.businessConfig?.getBaseRewardRules() ?? createDefaultNormalizedBaseRewardRules();
    }

    private applyBusinessItemScoreConfigs(): void {
        this.getConfiguredItemScoreConfigs().forEach((config) => {
            this._itemDisplayNames[config.itemId] = config.displayName;
            this._itemValues[config.itemId] = normalizeNonNegativeNumber(config.scoreValue);
        });
    }

    private getBusinessItemScoreConfig(itemId: string): NormalizedBusinessItemScoreConfig | null {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return null;
        }

        return this.getConfiguredItemScoreConfigs().find((config) => config.itemId === normalizedItemId) ?? null;
    }

    private resolveBusinessItemScoreValue(itemId: string, fallbackScoreValue: number): number {
        const configuredItem = this.getBusinessItemScoreConfig(itemId);
        return configuredItem
            ? normalizeNonNegativeNumber(configuredItem.scoreValue)
            : normalizeNonNegativeNumber(fallbackScoreValue);
    }

    private resolveBusinessItemDisplayName(itemId: string, fallbackDisplayName: string): string {
        const configuredItem = this.getBusinessItemScoreConfig(itemId);
        return configuredItem?.displayName || this.resolveDisplayName(itemId, fallbackDisplayName);
    }

    private getBusinessBonusCatalog(): NormalizedShopBusinessBonusConfig[] {
        return this.shopConfig?.getBusinessBonuses()
            ?? getShopRuntimeBusinessBonuses()
            ?? createDefaultNormalizedBusinessBonuses();
    }

    private bindBusinessConfig(): void {
        if (this.businessConfig) {
            return;
        }

        this.businessConfig = find('GameRoot/模式配置表/经营模式参数')?.getComponent(BusinessModeConfig)
            ?? null;

        if (!this.businessConfig) {
            warn('[BusinessModeController] 未绑定 BusinessModeConfig，将使用经营模式安全默认值。');
        }
    }

    private bindShopConfig(): void {
        if (this.shopConfig) {
            return;
        }

        this.shopConfig = find('GameRoot/ShopConfig')?.getComponent(ShopConfig)
            ?? find('GameRoot/经营配置表')?.getComponent(ShopConfig)
            ?? find('Canvas/UIRoot/经营模式界面/ShopConfig')?.getComponent(ShopConfig)
            ?? null;

        if (!this.shopConfig) {
            warn('[BusinessModeController] 未绑定 ShopConfig，经营加成结算将使用默认商店配置。');
        }
    }

    private buildSettlementDetailText(result: BusinessDayResult): string {
        const obtainedLines = result.obtainedItems.length > 0
            ? result.obtainedItems.map((item) => `${item.displayName}：${item.count} x ${formatScore(item.value)}分`)
            : ['今日没有获得商品'];
        const statusLine = result.reachedTarget ? '本日达标！' : '本日未达标';
        const baseRewardLines = result.rewardLines
            .filter((line) => line.category === 'base' && line.achieved && line.rewardMoney > 0)
            .map((line) => formatRewardLine(line.displayName, line.rewardMoney));
        const businessBonusLines = result.rewardLines
            .filter((line) => line.category === 'businessBonus' && line.achieved && line.rewardMoney > 0)
            .map((line) => formatRewardLine(line.displayName, line.rewardMoney));

        return [
            ...obtainedLines,
            '',
            `今日分数：${formatScore(result.score)} / ${formatScore(result.targetScore)}`,
            statusLine,
            '',
            '基础收益：',
            ...(baseRewardLines.length > 0 ? baseRewardLines : ['暂无基础收益']),
            '',
            '经营加成：',
            ...(businessBonusLines.length > 0 ? businessBonusLines : ['暂无触发加成']),
            '────────────',
            formatTotalMoneyLine(result.earnedMoney),
        ].join('\n');
    }

    private getObtainedCountFromSnapshots(obtainedItems: BusinessObtainedItemSnapshot[], itemId: string): number {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return 0;
        }

        return obtainedItems.find((item) => item.itemId === normalizedItemId)?.count ?? 0;
    }

    private resolveDisplayName(itemId: string, fallbackDisplayName: string): string {
        const normalizedFallback = (fallbackDisplayName || '').trim();
        if (normalizedFallback) {
            return normalizedFallback;
        }

        const matchingOrder = this.getEffectiveOrders().find((order) => order.itemId === itemId);
        return matchingOrder?.displayName || this._itemDisplayNames[itemId] || itemId || '未命名商品';
    }

    private getItemValue(itemId: string): number {
        return this._obtainedItemValues[itemId] ?? this._itemValues[itemId] ?? 1;
    }

    private getObtainedCount(itemId: string): number {
        return this._obtainedCounts[itemId] ?? 0;
    }

    private clearObtainedCounts(): void {
        Object.keys(this._obtainedCounts).forEach((itemId) => {
            delete this._obtainedCounts[itemId];
        });
        Object.keys(this._obtainedItemNames).forEach((itemId) => {
            delete this._obtainedItemNames[itemId];
        });
        Object.keys(this._obtainedItemValues).forEach((itemId) => {
            delete this._obtainedItemValues[itemId];
        });
    }

    private calculateDailyTargetScore(day: number, baseTargetScore: number, targetScoreIncrease: number): number {
        if (this.businessConfig) {
            return this.businessConfig.getDailyTargetScore(day);
        }

        const normalizedDay = normalizePositiveInteger(day, 1);
        const normalizedBaseScore = normalizeNonNegativeNumber(baseTargetScore);
        const normalizedIncrease = normalizeNonNegativeNumber(targetScoreIncrease);
        return normalizedBaseScore + (normalizedDay - 1) * normalizedIncrease;
    }

    private getTotalOrderWeight(): number {
        return this.getActiveOrders().reduce((sum, order) => sum + order.count, 0);
    }

    private getActiveOrders(): EffectivePurchaseOrder[] {
        return this.getEffectiveOrders().filter((order) => order.count > 0);
    }

    private getEffectiveOrders(): EffectivePurchaseOrder[] {
        const configuredOrders = this.purchaseOrders
            .map((order) => this.normalizeOrder(order.itemId, order.displayName, order.count))
            .filter((order) => order.itemId.length > 0);

        const baseOrders = configuredOrders.length > 0
            ? configuredOrders
            : [
                this.normalizeOrder('apple', '苹果', this.defaultAppleOrderCount),
                this.normalizeOrder('banana', '香蕉', this.defaultBananaOrderCount),
                this.normalizeOrder('lemon', '柠檬', this.defaultLemonOrderCount),
            ];
        const mergedOrders: EffectivePurchaseOrder[] = [];
        const orderIndexes = new Map<string, number>();
        const appendOrder = (order: EffectivePurchaseOrder): void => {
            if (!order.itemId) {
                return;
            }

            const existingIndex = orderIndexes.get(order.itemId);
            if (existingIndex !== undefined) {
                const existingOrder = mergedOrders[existingIndex];
                existingOrder.count += order.count;
                if (!existingOrder.displayName && order.displayName) {
                    existingOrder.displayName = order.displayName;
                }
                return;
            }

            orderIndexes.set(order.itemId, mergedOrders.length);
            mergedOrders.push({ ...order });
        };

        baseOrders.forEach(appendOrder);
        Object.keys(SHOP_RUNTIME_STATE.orderWeights).forEach((itemId) => {
            appendOrder(this.normalizeOrder(
                itemId,
                SHOP_RUNTIME_STATE.orderDisplayNames[itemId] || itemId,
                getShopOrderWeight(itemId),
            ));
        });

        return mergedOrders;
    }

    private normalizeOrder(itemId: string, displayName: string, count: number): EffectivePurchaseOrder {
        const normalizedItemId = (itemId || '').trim();
        const normalizedDisplayName = (displayName || '').trim() || normalizedItemId || '未命名物品';
        const normalizedCount = normalizeNonNegativeInteger(count);

        if (normalizedItemId.length === 0 && normalizedCount > 0) {
            warn('[BusinessModeController] 订购单缺少物品 ID，已忽略。');
        }

        return {
            itemId: normalizedItemId,
            displayName: normalizedDisplayName,
            count: normalizedCount,
        };
    }
}

function normalizeNonNegativeInteger(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.round(value));
}

function normalizeNonNegativeNumber(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, value);
}

function normalizePositiveInteger(value: number, fallback: number): number {
    if (!Number.isFinite(value)) {
        return Math.max(1, Math.round(fallback));
    }

    return Math.max(1, Math.round(value));
}

function formatScore(value: number): string {
    if (!Number.isFinite(value)) {
        return '0';
    }

    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatRewardLine(label: string, amount: number): string {
    const safeLabel = (label || '').trim() || '奖励';
    const moneyText = `￥${normalizeNonNegativeInteger(amount)}`;
    const totalLength = 24;
    const dotCount = Math.max(4, totalLength - safeLabel.length - moneyText.length);
    return `${safeLabel} ${'·'.repeat(dotCount)} ${moneyText}`;
}

function formatTotalMoneyLine(amount: number): string {
    const label = '获得资金：';
    const moneyText = `￥${normalizeNonNegativeInteger(amount)}`;
    const totalLength = 24;
    const spaceCount = Math.max(4, totalLength - label.length - moneyText.length);
    return `${label}${' '.repeat(spaceCount)}${moneyText}`;
}
