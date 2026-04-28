import { _decorator, Component, Label, Node, warn } from 'cc';

const { ccclass, property } = _decorator;

interface EffectivePurchaseOrder {
    itemId: string;
    displayName: string;
    count: number;
}

export interface BusinessPickedItem {
    itemId: string;
    displayName: string;
    count: number;
    probability: number;
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
        type: Label,
        displayName: '订购单信息 Label',
        tooltip: '显示当前订购单牌组组成和概率，例如“苹果订购单 x3（60%）”。为空时不会刷新这段 UI。',
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
        tooltip: '用一段弹性文本显示本日已经掉落结算的水果数量，例如“苹果 x0　香蕉 x0”。优先使用这个 Label，便于以后扩展更多水果。',
    })
    public obtainedSummaryLabel: Label | null = null;

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

    private readonly _obtainedCounts: Record<string, number> = Object.create(null);
    private _preparedNextItem: BusinessPickedItem | null = null;
    private _spawnMessageOverride = '';

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
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return;
        }

        this._obtainedCounts[normalizedItemId] = this.getObtainedCount(normalizedItemId) + 1;
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
            return `${order.displayName}订购单 x${order.count}（${percentage}%）`;
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
        if (this.obtainedSummaryLabel) {
            const activeOrders = this.getActiveOrders();
            this.obtainedSummaryLabel.string = activeOrders.length > 0
                ? activeOrders.map((order) => `${order.displayName} x${this.getObtainedCount(order.itemId)}`).join('　')
                : '暂无';
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

    private hasOrderForItem(itemId: string): boolean {
        return this.getEffectiveOrders().some((order) => order.itemId === itemId && order.count > 0);
    }

    private getObtainedCount(itemId: string): number {
        return this._obtainedCounts[itemId] ?? 0;
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
