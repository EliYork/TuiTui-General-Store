import { _decorator, Component, find, warn } from 'cc';
import { BusinessModeController } from '../modes/business/BusinessModeController';
import { ShopConfig, createDefaultNormalizedBusinessBonuses, createDefaultNormalizedStockOrders } from './ShopConfig';
import { BusinessRunLogger } from '../business/BusinessRunLogger';
import {
    NormalizedShopBusinessBonusConfig,
    NormalizedShopOrderConfig,
    SHOP_RUNTIME_STATE,
    ShopOrderDeckSnapshot,
    ShopBuyResult,
    addShopOrderWeight,
    addOwnedBusinessBonus,
    getShopRuntimeBusinessBonuses,
    getShopRuntimeStockOrders,
    getOwnedBusinessBonusSnapshots,
    getShopOrderWeight,
    hasOwnedBusinessBonus,
    normalizeNonNegativeInteger,
} from './ShopTypes';

const { ccclass, property } = _decorator;

@ccclass('ShopManager')
export class ShopManager extends Component {
    @property({
        type: BusinessModeController,
        displayName: '经营模式控制器',
        tooltip: '在游戏场景内可绑定 BusinessModeController。商店独立场景可留空，会使用跨场景运行时状态保存资金和订购单权重。',
    })
    public businessModeController: BusinessModeController | null = null;

    @property({
        type: ShopConfig,
        displayName: '商店配置',
        tooltip: '商店商品模板配置。推荐绑定 GameRoot/ShopConfig 节点上的 ShopConfig 组件；未绑定时会尝试按节点名查找。',
    })
    public shopConfig: ShopConfig | null = null;

    @property({
        displayName: '当前资金',
        tooltip: '玩家当前可用于购买进货单和经营加成的资金。默认 0；进入商店时会读取经营模式结算后的资金。',
    })
    public currentMoney = 0;

    protected onLoad(): void {
        this.bindShopConfig();
        this.bindBusinessModeController();
        this.syncInitialMoney();
    }

    public getShopOrders(): NormalizedShopOrderConfig[] {
        return this.shopConfig?.getStockOrders()
            ?? getShopRuntimeStockOrders()
            ?? createDefaultNormalizedStockOrders();
    }

    public getShopBusinessBonuses(): NormalizedShopBusinessBonusConfig[] {
        return this.shopConfig?.getBusinessBonuses()
            ?? getShopRuntimeBusinessBonuses()
            ?? createDefaultNormalizedBusinessBonuses();
    }

    public getCurrentMoney(): number {
        if (this.businessModeController) {
            return this.businessModeController.getCurrentMoney();
        }

        this.currentMoney = normalizeNonNegativeInteger(SHOP_RUNTIME_STATE.currentMoney);
        return this.currentMoney;
    }

    public buyOrder(orderId: string): ShopBuyResult {
        const order = this.getShopOrders().find((candidate) => candidate.id === orderId) ?? null;
        if (!order) {
            return {
                success: false,
                message: '进货单不存在',
                order: null,
            };
        }

        if (!order.canRepeat && getShopOrderWeight(order.itemId) > 0) {
            return {
                success: false,
                message: `已购买：${order.displayName}`,
                order,
            };
        }

        const currentMoney = this.getCurrentMoney();
        if (currentMoney < order.price) {
            return {
                success: false,
                message: '资金不足',
                order,
            };
        }

        this.setCurrentMoney(currentMoney - order.price);
        const displayName = order.displayName.replace(/(?:进货单|订购单|订单)$/, '');
        const newWeight = this.businessModeController
            ? this.businessModeController.addOrderDeckWeight(order.itemId, displayName, order.weightBonus)
            : addShopOrderWeight(order.itemId, displayName, order.weightBonus);
        this.addRuntimeOrderDeckSnapshotWeight(order.itemId, displayName, order.weightBonus);
        BusinessRunLogger.recordPurchase({
            day: SHOP_RUNTIME_STATE.currentBusinessDay,
            itemName: order.displayName,
            itemType: '进货单',
            price: order.price,
            moneyBefore: currentMoney,
            moneyAfter: this.getCurrentMoney(),
            orderDeck: this.getOrderDeckSnapshots(),
            ownedBusinessBonuses: this.getOwnedBusinessBonuses(),
        });

        return {
            success: true,
            message: `已购买：${order.displayName}（累计权重 +${newWeight}）`,
            order,
        };
    }

    public buyBusinessBonus(bonusId: string): ShopBuyResult {
        const bonus = this.getShopBusinessBonuses().find((candidate) => candidate.id === bonusId) ?? null;
        if (!bonus) {
            return {
                success: false,
                message: '经营加成不存在',
                order: null,
                businessBonus: null,
            };
        }

        if (hasOwnedBusinessBonus(bonus.id)) {
            return {
                success: false,
                message: `已拥有：${bonus.displayName}`,
                order: null,
                businessBonus: bonus,
            };
        }

        const currentMoney = this.getCurrentMoney();
        if (currentMoney < bonus.price) {
            return {
                success: false,
                message: '资金不足',
                order: null,
                businessBonus: bonus,
            };
        }

        this.setCurrentMoney(currentMoney - bonus.price);
        addOwnedBusinessBonus(bonus.id);
        BusinessRunLogger.recordPurchase({
            day: SHOP_RUNTIME_STATE.currentBusinessDay,
            itemName: bonus.displayName,
            itemType: '经营加成',
            price: bonus.price,
            moneyBefore: currentMoney,
            moneyAfter: this.getCurrentMoney(),
            orderDeck: this.getOrderDeckSnapshots(),
            ownedBusinessBonuses: this.getOwnedBusinessBonuses(),
        });

        return {
            success: true,
            message: `已购买：${bonus.displayName}`,
            order: null,
            businessBonus: bonus,
        };
    }

    public getOrderDeckSnapshots(): ShopOrderDeckSnapshot[] {
        if (this.businessModeController) {
            return this.businessModeController.getOrderDeckSnapshots();
        }

        if (SHOP_RUNTIME_STATE.orderDeckSnapshots.length > 0) {
            return SHOP_RUNTIME_STATE.orderDeckSnapshots.map((snapshot) => ({ ...snapshot }));
        }

        return this.getShopOrders().map((order) => ({
            id: order.id,
            title: order.displayName,
            itemId: order.itemId,
            weight: getShopOrderWeight(order.itemId),
        }));
    }

    public getOwnedBusinessBonuses(): NormalizedShopBusinessBonusConfig[] {
        return getOwnedBusinessBonusSnapshots(this.getShopBusinessBonuses());
    }

    public hasOwnedBusinessBonus(bonusId: string): boolean {
        return hasOwnedBusinessBonus(bonusId);
    }

    public isStockOrderPurchased(orderId: string): boolean {
        const order = this.getShopOrders().find((candidate) => candidate.id === orderId) ?? null;
        return !!order && !order.canRepeat && getShopOrderWeight(order.itemId) > 0;
    }

    private setCurrentMoney(value: number): void {
        const normalizedMoney = normalizeNonNegativeInteger(value);
        this.currentMoney = normalizedMoney;
        SHOP_RUNTIME_STATE.currentMoney = normalizedMoney;
        this.businessModeController?.setCurrentMoney(normalizedMoney);
    }

    private addRuntimeOrderDeckSnapshotWeight(itemId: string, displayName: string, count: number): void {
        if (this.businessModeController) {
            SHOP_RUNTIME_STATE.orderDeckSnapshots = this.businessModeController.getOrderDeckSnapshots();
            return;
        }

        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return;
        }

        const existing = SHOP_RUNTIME_STATE.orderDeckSnapshots.find((snapshot) => snapshot.itemId === normalizedItemId);
        if (existing) {
            existing.weight = normalizeNonNegativeInteger(existing.weight + count);
            existing.title = existing.title || displayName || normalizedItemId;
            return;
        }

        SHOP_RUNTIME_STATE.orderDeckSnapshots.push({
            id: normalizedItemId,
            title: displayName || normalizedItemId,
            itemId: normalizedItemId,
            weight: normalizeNonNegativeInteger(count),
        });
    }

    private bindBusinessModeController(): void {
        if (this.businessModeController) {
            return;
        }

        this.businessModeController = this.node.parent?.getComponent(BusinessModeController)
            ?? find('Canvas/UIRoot/经营模式界面')?.getComponent(BusinessModeController)
            ?? null;
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
            warn('[ShopManager] 未绑定 ShopConfig，将优先使用进入商店前保存的运行时商品配置；没有快照时才使用脚本默认商品。');
        }
    }

    private syncInitialMoney(): void {
        if (this.businessModeController) {
            const businessMoney = this.businessModeController.getCurrentMoney();
            this.currentMoney = businessMoney;
            SHOP_RUNTIME_STATE.currentMoney = businessMoney;
            return;
        }

        this.currentMoney = normalizeNonNegativeInteger(SHOP_RUNTIME_STATE.currentMoney);
    }
}
