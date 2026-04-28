import { _decorator, Component, find } from 'cc';
import { BusinessModeController } from '../modes/business/BusinessModeController';
import {
    DEFAULT_SHOP_ORDER_CONFIGS,
    NormalizedShopOrderConfig,
    SHOP_RUNTIME_STATE,
    ShopOrderDeckSnapshot,
    ShopBuyResult,
    ShopOrderConfig,
    addShopOrderWeight,
    getShopOrderWeight,
    normalizeNonNegativeInteger,
    normalizeShopOrderConfig,
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
        displayName: '当前资金',
        tooltip: '玩家当前可用于购买订购单的资金。第一版默认 0；进入商店时会读取经营模式结算后的资金。',
    })
    public currentMoney = 0;

    @property({
        type: [ShopOrderConfig],
        displayName: '商店订单配置',
        tooltip: '商店出售的订购单配置。留空时使用默认三项：苹果订单、香蕉订单、柠檬订单。',
    })
    public shopOrders: ShopOrderConfig[] = [];

    protected onLoad(): void {
        this.bindBusinessModeController();
        this.syncInitialMoney();
    }

    public getShopOrders(): NormalizedShopOrderConfig[] {
        const configuredOrders = this.shopOrders
            .filter((order) => !!order)
            .map((order, index) => normalizeShopOrderConfig(order, index))
            .filter((order) => order.id.length > 0 && order.itemId.length > 0);

        if (configuredOrders.length > 0) {
            return configuredOrders;
        }

        return DEFAULT_SHOP_ORDER_CONFIGS.map((order) => ({ ...order }));
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
                message: '订单不存在',
                order: null,
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
        const displayName = order.title.replace(/订单$/, '');
        const newWeight = this.businessModeController
            ? this.businessModeController.addOrderDeckWeight(order.itemId, displayName, order.weightDelta)
            : addShopOrderWeight(order.itemId, displayName, order.weightDelta);

        return {
            success: true,
            message: `已购买：${order.title}（累计加权 +${newWeight}）`,
            order,
        };
    }

    public getOrderDeckSnapshots(): ShopOrderDeckSnapshot[] {
        return this.getShopOrders().map((order) => ({
            id: order.id,
            title: order.title,
            itemId: order.itemId,
            weight: this.businessModeController?.getOrderDeckWeight(order.itemId) ?? getShopOrderWeight(order.itemId),
        }));
    }

    private setCurrentMoney(value: number): void {
        const normalizedMoney = normalizeNonNegativeInteger(value);
        this.currentMoney = normalizedMoney;
        SHOP_RUNTIME_STATE.currentMoney = normalizedMoney;
        this.businessModeController?.setCurrentMoney(normalizedMoney);
    }

    private bindBusinessModeController(): void {
        if (this.businessModeController) {
            return;
        }

        this.businessModeController = this.node.parent?.getComponent(BusinessModeController)
            ?? find('Canvas/UIRoot/经营模式界面')?.getComponent(BusinessModeController)
            ?? null;
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
