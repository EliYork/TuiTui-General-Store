import { _decorator, Component, Label, Node, warn } from 'cc';

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

const REWARD_RULE_TARGET_REACHED = 'TargetReached';
const REWARD_RULE_ITEM_COUNT_AT_LEAST = 'ItemCountAtLeast';

@ccclass('BusinessDayRewardRule')
class BusinessDayRewardRule {
    @property({
        displayName: '奖励类型',
        tooltip: '奖励条件类型。TargetReached 表示达成当日目标；ItemCountAtLeast 表示指定物品当天获得数量达到阈值。',
    })
    public ruleType = REWARD_RULE_TARGET_REACHED;

    @property({
        displayName: '奖励显示名',
        tooltip: '结算账单中显示的奖励条件名称，例如“目标达成”或“苹果个数大于10”。留空时会使用默认名称。',
    })
    public displayName = '';

    @property({
        displayName: '奖励资金',
        tooltip: '该奖励条件满足时获得的资金数量。只填写数字，结算面板会显示为 ￥数字。',
    })
    public rewardMoney = 0;

    @property({
        displayName: '物品 ID',
        tooltip: '奖励类型为 ItemCountAtLeast 时生效。填写要统计的物品 ID，例如 apple。',
    })
    public itemId = '';

    @property({
        displayName: '数量阈值',
        tooltip: '奖励类型为 ItemCountAtLeast 时生效。当天该物品获得数量达到或超过这个值时发放奖励。',
    })
    public threshold = 0;

    @property({
        displayName: '需要达标',
        tooltip: '开启后，只有当日分数达标时才会发放这条奖励。关闭后，即使未达标也会在结算账单中按条件计算。',
    })
    public requirePassed = false;
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
        type: [BusinessDayRewardRule],
        displayName: '本日资金奖励规则',
        tooltip: '本日结算时逐条检查的资金奖励条件。留空时使用默认规则：目标达成 +￥5，苹果数量达到 10 +￥1。',
    })
    public rewardRules: BusinessDayRewardRule[] = [];

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
        tooltip: '用一段多行文本显示本日当前获得分数和各订购单商品的小计，例如“苹果：1 x 2 = 2”。优先使用这个 Label，便于以后扩展更多商品。',
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
        this.prepareNextItem();
        this.refreshUi();
    }

    public syncDailyTarget(day: number, baseTargetScore: number, targetScoreIncrease: number): void {
        this.currentDay = normalizePositiveInteger(day, 1);
        this.dailyTargetScore = this.calculateDailyTargetScore(this.currentDay, baseTargetScore, targetScoreIncrease);
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

        this.refreshUi();
    }

    public settleCurrentDay(): BusinessDayResult {
        const obtainedItems = this.getObtainedItemSnapshots();
        const rewardLines = this.calculateRewardLines(obtainedItems);
        const earnedMoney = rewardLines.reduce((sum, line) => sum + (line.achieved ? line.rewardMoney : 0), 0);
        const result: BusinessDayResult = {
            day: this.currentDay,
            score: this.dailyScore,
            targetScore: this.dailyTargetScore,
            reachedTarget: this.dailyScore >= this.dailyTargetScore,
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
        this.prepareNextItem();
        this.refreshUi();
        return result;
    }

    public claimSettledMoney(): number {
        const settlement = this._latestSettlement;
        if (!settlement || !settlement.reachedTarget || this._latestSettlementClaimed) {
            return 0;
        }

        const claimedMoney = normalizeNonNegativeInteger(settlement.earnedMoney);
        this.money += claimedMoney;
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

    public recordDrop(itemId: string, scoreValue: number, displayName = ''): void {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return;
        }

        this._obtainedCounts[normalizedItemId] = this.getObtainedCount(normalizedItemId) + 1;
        this._obtainedItemValues[normalizedItemId] = normalizeNonNegativeNumber(scoreValue);
        this._obtainedItemNames[normalizedItemId] = this.resolveDisplayName(normalizedItemId, displayName);
        this._itemValues[normalizedItemId] = normalizeNonNegativeNumber(scoreValue);
        this._itemDisplayNames[normalizedItemId] = this.resolveDisplayName(normalizedItemId, displayName);
        this.dailyScore += normalizeNonNegativeNumber(scoreValue);
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
        return '没有可用订购单';
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
            this.orderDeckLabel.string = '当前订购单：\n无可用订购单';
            return;
        }

        const orderLines = activeOrders.map((order) => {
            const percentage = Math.round((order.count / totalWeight) * 100);
            return `${order.displayName} x${order.count}（${percentage}%）`;
        });
        this.orderDeckLabel.string = `当前订购单：\n${orderLines.join('\n')}`;
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
        this.getEffectiveOrders().forEach((order, index) => {
            orderRanks.set(order.itemId, index);
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
        const activeOrders = this.getActiveOrders();
        if (activeOrders.length <= 0) {
            return '暂无订购单商品';
        }

        return activeOrders.map((order) => {
            const count = this.getObtainedCount(order.itemId);
            const value = this.getItemValue(order.itemId);
            const subtotal = count * value;
            return `${order.displayName}：${count} x ${formatScore(value)} = ${formatScore(subtotal)}`;
        }).join('\n');
    }

    private calculateRewardLines(obtainedItems: BusinessObtainedItemSnapshot[]): BusinessDayRewardSnapshot[] {
        const reachedTarget = this.dailyScore >= this.dailyTargetScore;
        return this.getEffectiveRewardRules().map((rule) => {
            const normalizedRuleType = (rule.ruleType || '').trim();
            const displayName = (rule.displayName || '').trim() || this.getDefaultRewardDisplayName(rule);
            const rewardMoney = normalizeNonNegativeInteger(rule.rewardMoney);
            const achieved = this.isRewardRuleAchieved(normalizedRuleType, rule, reachedTarget, obtainedItems);

            return {
                displayName,
                rewardMoney,
                achieved,
            };
        });
    }

    private isRewardRuleAchieved(
        ruleType: string,
        rule: BusinessDayRewardRule,
        reachedTarget: boolean,
        obtainedItems: BusinessObtainedItemSnapshot[],
    ): boolean {
        if (rule.requirePassed && !reachedTarget) {
            return false;
        }

        if (ruleType === REWARD_RULE_TARGET_REACHED) {
            return reachedTarget;
        }

        if (ruleType === REWARD_RULE_ITEM_COUNT_AT_LEAST) {
            const itemId = (rule.itemId || '').trim();
            const threshold = normalizeNonNegativeInteger(rule.threshold);
            const item = obtainedItems.find((obtainedItem) => obtainedItem.itemId === itemId);
            return !!item && item.count >= threshold;
        }

        warn(`[BusinessModeController] 未识别的本日资金奖励类型：${ruleType || '空'}`);
        return false;
    }

    private getEffectiveRewardRules(): BusinessDayRewardRule[] {
        const configuredRules = this.rewardRules.filter((rule) => !!rule);
        if (configuredRules.length > 0) {
            return configuredRules;
        }

        const targetReachedRule = new BusinessDayRewardRule();
        targetReachedRule.ruleType = REWARD_RULE_TARGET_REACHED;
        targetReachedRule.displayName = '目标达成';
        targetReachedRule.rewardMoney = 5;
        targetReachedRule.requirePassed = true;

        const appleCountRule = new BusinessDayRewardRule();
        appleCountRule.ruleType = REWARD_RULE_ITEM_COUNT_AT_LEAST;
        appleCountRule.displayName = '苹果个数大于10';
        appleCountRule.itemId = 'apple';
        appleCountRule.threshold = 10;
        appleCountRule.rewardMoney = 1;
        appleCountRule.requirePassed = false;

        return [targetReachedRule, appleCountRule];
    }

    private getDefaultRewardDisplayName(rule: BusinessDayRewardRule): string {
        const ruleType = (rule.ruleType || '').trim();
        if (ruleType === REWARD_RULE_TARGET_REACHED) {
            return '目标达成';
        }

        if (ruleType === REWARD_RULE_ITEM_COUNT_AT_LEAST) {
            const itemName = this.resolveDisplayName(rule.itemId, '');
            return `${itemName}数量达到${normalizeNonNegativeInteger(rule.threshold)}`;
        }

        return '未命名奖励';
    }

    private buildSettlementDetailText(result: BusinessDayResult): string {
        const obtainedLines = result.obtainedItems.length > 0
            ? result.obtainedItems.map((item) => `${item.displayName}：${item.count} x ${formatScore(item.value)}分`)
            : ['今日没有获得商品'];
        const statusLine = result.reachedTarget ? '本日达标！' : '本日未达标';
        const achievedRewardLines = result.rewardLines
            .filter((line) => line.achieved && line.rewardMoney > 0)
            .map((line) => formatRewardLine(line.displayName, line.rewardMoney));
        const rewardLines = achievedRewardLines.length > 0 ? achievedRewardLines : ['暂无资金奖励'];

        return [
            ...obtainedLines,
            '',
            `今日分数：${formatScore(result.score)} / ${formatScore(result.targetScore)}`,
            statusLine,
            '',
            '────────────',
            ...rewardLines,
            '────────────',
            formatTotalMoneyLine(result.earnedMoney),
        ].join('\n');
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

        if (configuredOrders.length > 0) {
            return configuredOrders;
        }

        return [
            this.normalizeOrder('apple', '苹果', this.defaultAppleOrderCount),
            this.normalizeOrder('banana', '香蕉', this.defaultBananaOrderCount),
            this.normalizeOrder('lemon', '柠檬', this.defaultLemonOrderCount),
        ];
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
