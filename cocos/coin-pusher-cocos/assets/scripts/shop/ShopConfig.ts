import { _decorator, Component } from 'cc';
import {
    NormalizedShopBusinessBonusConfig,
    NormalizedShopOrderConfig,
    ShopBusinessBonusConfigSource,
    ShopOrderConfigSource,
    normalizeShopBusinessBonusConfig,
    normalizeShopOrderConfig,
} from './ShopTypes';

const { ccclass, property } = _decorator;

@ccclass('StockOrderConfig')
export class StockOrderConfig implements ShopOrderConfigSource {
    @property({
        displayName: '进货单 ID',
        tooltip: '进货单的唯一标识，例如 apple_stock。购买记录和按钮点击会用这个 ID 查找配置，后续调数值时不要随意改。',
    })
    public id = '';

    @property({
        displayName: '物品 ID',
        tooltip: '这个进货单影响的物品 ID，例如 apple、banana、lemon。需要和物品 Prefab 上的 ItemPrefabConfig.itemId 一致。',
    })
    public itemId = '';

    @property({
        displayName: '显示名称',
        tooltip: '玩家在商店里看到的商品名称，例如“苹果进货单”。',
    })
    public displayName = '';

    @property({
        displayName: '说明',
        tooltip: '商店卡片上的说明。留空时会按名称和权重加成自动生成。',
    })
    public description = '';

    @property({
        displayName: '价格',
        tooltip: '购买该进货单需要消耗的资金。数值越高，玩家越晚买得起。',
    })
    public price = 0;

    @property({
        displayName: '权重加成值',
        tooltip: '购买后给对应物品增加的下一日投放权重。数值越大，下一日越容易出现该物品。',
    })
    public weightBonus = 1;

    @property({
        displayName: '允许重复购买',
        tooltip: '开启后，同一天商店里可以重复购买这个进货单并累加权重。关闭后，购买过一次后会显示已购买。',
    })
    public canRepeat = true;
}

@ccclass('BusinessBonusConfig')
export class BusinessBonusConfig implements ShopBusinessBonusConfigSource {
    @property({
        displayName: '经营加成 ID',
        tooltip: '经营加成的唯一标识，例如 apple_hot_sale。玩家已拥有状态只记录这个 ID，不会写入整份配置。',
    })
    public id = '';

    @property({
        displayName: '物品 ID',
        tooltip: '每日结算时检查的物品 ID，例如 apple、banana、lemon。需要和物品 Prefab 上的 ItemPrefabConfig.itemId 一致。',
    })
    public itemId = '';

    @property({
        displayName: '显示名称',
        tooltip: '玩家在商店和结算面板里看到的名称，例如“苹果热销”。',
    })
    public displayName = '';

    @property({
        displayName: '说明',
        tooltip: '商店卡片上的说明。留空时会按触发数量和奖励资金自动生成。',
    })
    public description = '';

    @property({
        displayName: '价格',
        tooltip: '购买该经营加成需要消耗的资金。经营加成为永久拥有，通常价格应高于进货单。',
    })
    public price = 0;

    @property({
        displayName: '触发数量',
        tooltip: '每日结算时，对应物品当天获得数量达到或超过这个值，就会触发经营加成。',
    })
    public requiredCount = 0;

    @property({
        displayName: '奖励资金',
        tooltip: '经营加成触发后，本日结算额外获得的资金数量。',
    })
    public rewardMoney = 0;

    @property({
        displayName: '允许重复购买',
        tooltip: '第一版建议保持关闭。经营加成默认永久拥有一次，不做叠加层数。',
    })
    public canRepeat = false;
}

@ccclass('ShopConfig')
export class ShopConfig extends Component {
    @property({
        type: [StockOrderConfig],
        displayName: '进货单配置列表',
        tooltip: '商店出售的进货单模板，只定义商品参数，不记录玩家是否购买过。',
    })
    public stockOrders: StockOrderConfig[] = createDefaultStockOrderConfigs();

    @property({
        type: [BusinessBonusConfig],
        displayName: '经营加成配置列表',
        tooltip: '商店出售的永久经营加成模板，只定义商品参数，不记录玩家是否拥有。',
    })
    public businessBonuses: BusinessBonusConfig[] = createDefaultBusinessBonusConfigs();

    public getStockOrders(): NormalizedShopOrderConfig[] {
        const normalizedOrders = this.stockOrders
            .filter((order) => !!order)
            .map((order, index) => normalizeShopOrderConfig(order, index))
            .filter((order) => order.id.length > 0 && order.itemId.length > 0);

        return normalizedOrders.length > 0 ? normalizedOrders : createDefaultNormalizedStockOrders();
    }

    public getBusinessBonuses(): NormalizedShopBusinessBonusConfig[] {
        const normalizedBonuses = this.businessBonuses
            .filter((bonus) => !!bonus)
            .map((bonus, index) => normalizeShopBusinessBonusConfig(bonus, index))
            .filter((bonus) => bonus.id.length > 0 && bonus.itemId.length > 0);

        return normalizedBonuses.length > 0 ? normalizedBonuses : createDefaultNormalizedBusinessBonuses();
    }
}

export function createDefaultNormalizedStockOrders(): NormalizedShopOrderConfig[] {
    return createDefaultStockOrderConfigs().map((order, index) => normalizeShopOrderConfig(order, index));
}

export function createDefaultNormalizedBusinessBonuses(): NormalizedShopBusinessBonusConfig[] {
    return createDefaultBusinessBonusConfigs().map((bonus, index) => normalizeShopBusinessBonusConfig(bonus, index));
}

export function createDefaultStockOrderConfigs(): StockOrderConfig[] {
    return [
        createStockOrder('apple_stock', 'apple', '苹果进货单', 3, '下一日苹果出现权重提高'),
        createStockOrder('banana_stock', 'banana', '香蕉进货单', 5, '下一日香蕉出现权重提高'),
        createStockOrder('lemon_stock', 'lemon', '柠檬进货单', 10, '下一日柠檬出现权重提高'),
    ];
}

export function createDefaultBusinessBonusConfigs(): BusinessBonusConfig[] {
    return [
        createBusinessBonus('apple_hot_sale', 'apple', '苹果热销', 8, 10, 1, '永久生效：每日苹果数量 ≥ 10 时，结算额外 +￥1'),
        createBusinessBonus('banana_hot_sale', 'banana', '香蕉热卖', 12, 10, 2, '永久生效：每日香蕉数量 ≥ 10 时，结算额外 +￥2'),
        createBusinessBonus('lemon_popular', 'lemon', '柠檬人气', 20, 5, 4, '永久生效：每日柠檬数量 ≥ 5 时，结算额外 +￥4'),
    ];
}

function createStockOrder(
    id: string,
    itemId: string,
    displayName: string,
    price: number,
    description: string,
    weightBonus = 1,
    canRepeat = true,
): StockOrderConfig {
    const config = new StockOrderConfig();
    config.id = id;
    config.itemId = itemId;
    config.displayName = displayName;
    config.description = description;
    config.price = price;
    config.weightBonus = weightBonus;
    config.canRepeat = canRepeat;
    return config;
}

function createBusinessBonus(
    id: string,
    itemId: string,
    displayName: string,
    price: number,
    requiredCount: number,
    rewardMoney: number,
    description: string,
    canRepeat = false,
): BusinessBonusConfig {
    const config = new BusinessBonusConfig();
    config.id = id;
    config.itemId = itemId;
    config.displayName = displayName;
    config.description = description;
    config.price = price;
    config.requiredCount = requiredCount;
    config.rewardMoney = rewardMoney;
    config.canRepeat = canRepeat;
    return config;
}
