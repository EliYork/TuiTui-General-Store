export interface ShopOrderConfigSource {
    id?: string;
    displayName?: string;
    title?: string;
    itemId?: string;
    price?: number;
    weightBonus?: number;
    weightDelta?: number;
    canRepeat?: boolean;
    description?: string;
}

export interface ShopBusinessBonusConfigSource {
    id?: string;
    displayName?: string;
    title?: string;
    itemId?: string;
    price?: number;
    requiredCount?: number;
    rewardMoney?: number;
    canRepeat?: boolean;
    description?: string;
}

export interface NormalizedShopOrderConfig {
    id: string;
    displayName: string;
    title: string;
    itemId: string;
    price: number;
    weightBonus: number;
    weightDelta: number;
    canRepeat: boolean;
    description: string;
}

export interface NormalizedShopBusinessBonusConfig {
    id: string;
    displayName: string;
    title: string;
    itemId: string;
    price: number;
    requiredCount: number;
    rewardMoney: number;
    canRepeat: boolean;
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
    businessBonus?: NormalizedShopBusinessBonusConfig | null;
}

export interface ShopRuntimeState {
    currentMoney: number;
    currentBusinessDay: number;
    businessMoneyInitialized: boolean;
    stockOrderConfigs: NormalizedShopOrderConfig[] | null;
    businessBonusConfigs: NormalizedShopBusinessBonusConfig[] | null;
    orderWeights: Record<string, number>;
    orderDisplayNames: Record<string, string>;
    orderDeckSnapshots: ShopOrderDeckSnapshot[];
    ownedBusinessBonusIds: string[];
    returnSceneName: string;
    pendingEnterNextBusinessDay: boolean;
    businessAutoEndEnabled: boolean;
}

export const SHOP_SCENE_NAME = 'ShopScene';
export const DEFAULT_GAME_SCENE_NAME = 'Prototype01';

export const SHOP_RUNTIME_STATE: ShopRuntimeState = {
    currentMoney: 0,
    currentBusinessDay: 1,
    businessMoneyInitialized: false,
    stockOrderConfigs: null,
    businessBonusConfigs: null,
    orderWeights: Object.create(null),
    orderDisplayNames: Object.create(null),
    orderDeckSnapshots: [],
    ownedBusinessBonusIds: [],
    returnSceneName: DEFAULT_GAME_SCENE_NAME,
    pendingEnterNextBusinessDay: false,
    businessAutoEndEnabled: false,
};

export function resetShopRuntimeState(): void {
    SHOP_RUNTIME_STATE.currentMoney = 0;
    SHOP_RUNTIME_STATE.currentBusinessDay = 1;
    SHOP_RUNTIME_STATE.businessMoneyInitialized = false;
    SHOP_RUNTIME_STATE.stockOrderConfigs = null;
    SHOP_RUNTIME_STATE.businessBonusConfigs = null;
    SHOP_RUNTIME_STATE.orderWeights = Object.create(null);
    SHOP_RUNTIME_STATE.orderDisplayNames = Object.create(null);
    SHOP_RUNTIME_STATE.orderDeckSnapshots = [];
    SHOP_RUNTIME_STATE.ownedBusinessBonusIds = [];
    SHOP_RUNTIME_STATE.returnSceneName = DEFAULT_GAME_SCENE_NAME;
    SHOP_RUNTIME_STATE.pendingEnterNextBusinessDay = false;
    SHOP_RUNTIME_STATE.businessAutoEndEnabled = false;
}

export function setShopRuntimeCatalog(
    stockOrders: NormalizedShopOrderConfig[],
    businessBonuses: NormalizedShopBusinessBonusConfig[],
): void {
    SHOP_RUNTIME_STATE.stockOrderConfigs = stockOrders.map(cloneShopOrderConfig);
    SHOP_RUNTIME_STATE.businessBonusConfigs = businessBonuses.map(cloneBusinessBonusConfig);
}

export function getShopRuntimeStockOrders(): NormalizedShopOrderConfig[] | null {
    return SHOP_RUNTIME_STATE.stockOrderConfigs?.map(cloneShopOrderConfig) ?? null;
}

export function getShopRuntimeBusinessBonuses(): NormalizedShopBusinessBonusConfig[] | null {
    return SHOP_RUNTIME_STATE.businessBonusConfigs?.map(cloneBusinessBonusConfig) ?? null;
}

export function normalizeShopOrderConfig(source: ShopOrderConfigSource, index: number): NormalizedShopOrderConfig {
    const id = normalizeText(source.id, `stock_order_${index + 1}`);
    const displayName = normalizeText(source.displayName ?? source.title, id);
    const itemId = normalizeText(source.itemId, '');
    const price = normalizeNonNegativeInteger(source.price ?? 0);
    const weightBonus = Math.max(1, normalizeNonNegativeInteger(source.weightBonus ?? source.weightDelta ?? 1, 1));
    const canRepeat = source.canRepeat ?? true;
    const description = normalizeText(
        source.description,
        buildShopOrderDescription(displayName, weightBonus),
    );

    return {
        id,
        displayName,
        title: displayName,
        itemId,
        price,
        weightBonus,
        weightDelta: weightBonus,
        canRepeat,
        description,
    };
}

function cloneShopOrderConfig(config: NormalizedShopOrderConfig): NormalizedShopOrderConfig {
    return { ...config };
}

function cloneBusinessBonusConfig(config: NormalizedShopBusinessBonusConfig): NormalizedShopBusinessBonusConfig {
    return { ...config };
}

export function normalizeShopBusinessBonusConfig(
    source: ShopBusinessBonusConfigSource,
    index: number,
): NormalizedShopBusinessBonusConfig {
    const id = normalizeText(source.id, `business_bonus_${index + 1}`);
    const displayName = normalizeText(source.displayName ?? source.title, id);
    const itemId = normalizeText(source.itemId, '');
    const price = normalizeNonNegativeInteger(source.price ?? 0);
    const requiredCount = normalizeNonNegativeInteger(source.requiredCount ?? 0);
    const rewardMoney = normalizeNonNegativeInteger(source.rewardMoney ?? 0);
    const canRepeat = source.canRepeat ?? false;
    const description = normalizeText(
        source.description,
        buildBusinessBonusDescription(displayName, requiredCount, rewardMoney),
    );

    return {
        id,
        displayName,
        title: displayName,
        itemId,
        price,
        requiredCount,
        rewardMoney,
        canRepeat,
        description,
    };
}

export function buildShopOrderDescription(displayName: string, weightBonus: number): string {
    const itemName = displayName.replace(/(?:进货单|订购单|订单)$/, '') || '物品';
    const normalizedWeight = Math.max(1, normalizeNonNegativeInteger(weightBonus, 1));
    return normalizedWeight > 1
        ? `下一日${itemName}出现权重提高（权重 +${normalizedWeight}）`
        : `下一日${itemName}出现权重提高`;
}

export function buildBusinessBonusDescription(displayName: string, requiredCount: number, rewardMoney: number): string {
    const itemName = displayName
        .replace(/热销$/, '')
        .replace(/热卖$/, '')
        .replace(/人气$/, '') || '对应商品';
    return `永久生效：每日${itemName}数量 ≥ ${normalizeNonNegativeInteger(requiredCount)} 时，结算额外 +￥${normalizeNonNegativeInteger(rewardMoney)}`;
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

export function addOwnedBusinessBonus(bonus: string | { id: string }): boolean {
    const normalizedId = (typeof bonus === 'string' ? bonus : bonus.id || '').trim();
    if (!normalizedId || hasOwnedBusinessBonus(normalizedId)) {
        return false;
    }

    SHOP_RUNTIME_STATE.ownedBusinessBonusIds.push(normalizedId);
    return true;
}

export function hasOwnedBusinessBonus(bonusId: string): boolean {
    const normalizedId = (bonusId || '').trim();
    return normalizedId.length > 0 && SHOP_RUNTIME_STATE.ownedBusinessBonusIds.indexOf(normalizedId) >= 0;
}

export function getOwnedBusinessBonusIds(): string[] {
    return [...SHOP_RUNTIME_STATE.ownedBusinessBonusIds];
}

export function getOwnedBusinessBonusSnapshots(
    catalog: NormalizedShopBusinessBonusConfig[] = [],
): NormalizedShopBusinessBonusConfig[] {
    return SHOP_RUNTIME_STATE.ownedBusinessBonusIds
        .map((bonusId) => catalog.find((bonus) => bonus.id === bonusId) ?? null)
        .filter((bonus): bonus is NormalizedShopBusinessBonusConfig => !!bonus)
        .map((bonus) => ({ ...bonus }));
}

function normalizeText(value: string | undefined, fallback: string): string {
    const trimmed = (value || '').trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

export function normalizeNonNegativeInteger(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return Math.max(0, Math.round(fallback));
    }

    return Math.max(0, Math.round(value));
}
