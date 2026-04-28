import { _decorator } from 'cc';

const { ccclass, property } = _decorator;

export interface NormalizedShopOrderConfig {
    id: string;
    title: string;
    itemId: string;
    price: number;
    weightDelta: number;
    description: string;
}

export interface ShopOrderDeckSnapshot {
    id: string;
    title: string;
    itemId: string;
    weight: number;
}

export interface ShopBuyResult {
    success: boolean;
    message: string;
    order: NormalizedShopOrderConfig | null;
}

export interface ShopRuntimeState {
    currentMoney: number;
    orderWeights: Record<string, number>;
    orderDisplayNames: Record<string, string>;
    returnSceneName: string;
    pendingEnterNextBusinessDay: boolean;
}

export const SHOP_SCENE_NAME = 'ShopScene';
export const DEFAULT_GAME_SCENE_NAME = 'Prototype01';

export const SHOP_RUNTIME_STATE: ShopRuntimeState = {
    currentMoney: 0,
    orderWeights: Object.create(null),
    orderDisplayNames: Object.create(null),
    returnSceneName: DEFAULT_GAME_SCENE_NAME,
    pendingEnterNextBusinessDay: false,
};

@ccclass('ShopOrderConfig')
export class ShopOrderConfig {
    @property({
        displayName: '订单 ID',
        tooltip: '商店订单的唯一 ID，例如 apple_order。后续调数值时请保持唯一，避免购买按钮找错配置。',
    })
    public id = '';

    @property({
        displayName: '订单标题',
        tooltip: '玩家在商店里看到的订单名称，例如苹果订单、香蕉订单、柠檬订单。',
    })
    public title = '';

    @property({
        displayName: '物品 ID',
        tooltip: '该订购单会增加哪个物品在订购单牌组中的权重，例如 apple、banana、lemon。',
    })
    public itemId = '';

    @property({
        displayName: '价格',
        tooltip: '购买该订购单需要消耗的资金。数值越高，玩家越晚买得起。',
    })
    public price = 0;

    @property({
        displayName: '权重增加',
        tooltip: '购买后给对应订购单增加的权重。第一版默认 +1，数值越高越容易刷到该物品。',
    })
    public weightDelta = 1;

    @property({
        displayName: '订单描述',
        tooltip: '商店卡片上的说明。留空时会自动生成“购买后某某订购单权重 +1”。',
    })
    public description = '';
}

export const DEFAULT_SHOP_ORDER_CONFIGS: NormalizedShopOrderConfig[] = [
    createDefaultOrder('apple_order', '苹果订单', 'apple', 3),
    createDefaultOrder('banana_order', '香蕉订单', 'banana', 5),
    createDefaultOrder('lemon_order', '柠檬订单', 'lemon', 10),
];

export function normalizeShopOrderConfig(source: ShopOrderConfig | NormalizedShopOrderConfig, index: number): NormalizedShopOrderConfig {
    const fallback = DEFAULT_SHOP_ORDER_CONFIGS[index] ?? DEFAULT_SHOP_ORDER_CONFIGS[DEFAULT_SHOP_ORDER_CONFIGS.length - 1];
    const id = normalizeText(source.id, fallback?.id ?? `shop_order_${index + 1}`);
    const title = normalizeText(source.title, fallback?.title ?? id);
    const itemId = normalizeText(source.itemId, fallback?.itemId ?? '');
    const price = normalizeNonNegativeInteger(source.price, fallback?.price ?? 0);
    const weightDelta = Math.max(1, normalizeNonNegativeInteger(source.weightDelta, fallback?.weightDelta ?? 1));
    const description = normalizeText(
        source.description,
        buildShopOrderDescription(title, weightDelta),
    );

    return {
        id,
        title,
        itemId,
        price,
        weightDelta,
        description,
    };
}

export function buildShopOrderDescription(title: string, weightDelta: number): string {
    const itemName = title.replace(/订单$/, '') || '物品';
    return `购买后${itemName}订购单权重 +${Math.max(1, normalizeNonNegativeInteger(weightDelta, 1))}`;
}

export function addShopOrderWeight(itemId: string, displayName: string, count: number): number {
    const normalizedItemId = (itemId || '').trim();
    if (!normalizedItemId) {
        return 0;
    }

    const normalizedCount = Math.max(1, normalizeNonNegativeInteger(count));
    SHOP_RUNTIME_STATE.orderWeights[normalizedItemId] = getShopOrderWeight(normalizedItemId) + normalizedCount;
    SHOP_RUNTIME_STATE.orderDisplayNames[normalizedItemId] = (displayName || '').trim() || normalizedItemId;
    return getShopOrderWeight(normalizedItemId);
}

export function getShopOrderWeight(itemId: string): number {
    const normalizedItemId = (itemId || '').trim();
    if (!normalizedItemId) {
        return 0;
    }

    return normalizeNonNegativeInteger(SHOP_RUNTIME_STATE.orderWeights[normalizedItemId] ?? 0);
}

function createDefaultOrder(id: string, title: string, itemId: string, price: number): NormalizedShopOrderConfig {
    const weightDelta = 1;
    return {
        id,
        title,
        itemId,
        price,
        weightDelta,
        description: buildShopOrderDescription(title, weightDelta),
    };
}

function normalizeText(value: string, fallback: string): string {
    const trimmed = (value || '').trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

export function normalizeNonNegativeInteger(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return Math.max(0, Math.round(fallback));
    }

    return Math.max(0, Math.round(value));
}
