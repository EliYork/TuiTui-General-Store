import { sys, warn } from 'cc';
import { NormalizedShopBusinessBonusConfig, ShopOrderDeckSnapshot } from '../shop/ShopTypes';
import { DIARY_FORMAT_VERSION, PROJECT_VERSION } from '../config/ProjectVersion';

export const BUSINESS_RUN_LOG_STORAGE_KEY = 'TUITUI_BUSINESS_RUN_LOG_CURRENT';

export type BusinessDiarySpawnSource = 'manual' | 'random';

export interface BusinessDiaryItemCountSnapshot {
    itemId: string;
    displayName: string;
    count: number;
}

export interface BusinessDiaryDaySnapshot {
    day: number;
    targetScore: number;
    dailyTargetIncrease: number;
    currentMoney: number;
    remainingStock: number;
    currentResource: number;
    maxResource: number;
    orderDeck: ShopOrderDeckSnapshot[];
    ownedBusinessBonuses: NormalizedShopBusinessBonusConfig[];
    boardCounts: BusinessDiaryItemCountSnapshot[] | null;
    sceneName: string;
}

export interface BusinessDiaryFinishDayPayload extends BusinessDiaryDaySnapshot {
    score: number;
    reachedTarget: boolean;
    obtainedItems: BusinessDiaryItemCountSnapshot[];
    baseRewardMoney: number;
    businessBonusRewardMoney: number;
    earnedMoney: number;
    settledMoney: number;
}

export interface BusinessDiaryPurchasePayload {
    day: number;
    itemName: string;
    itemType: '进货单' | '经营加成';
    price: number;
    moneyBefore: number;
    moneyAfter: number;
    orderDeck: ShopOrderDeckSnapshot[];
    ownedBusinessBonuses: NormalizedShopBusinessBonusConfig[];
}

export interface BusinessDiaryStoredCounts {
    counts: Record<string, number>;
    names: Record<string, string>;
}

export interface BusinessDiaryDayStats {
    day: number;
    manualGenerated: BusinessDiaryStoredCounts;
    randomGenerated: BusinessDiaryStoredCounts;
    dropped: BusinessDiaryStoredCounts;
}

export interface BusinessDiaryData {
    version: 1;
    startedAt: string;
    runId?: string;
    entries: string[];
    dayStats: Record<string, BusinessDiaryDayStats>;
}

const EMPTY_DIARY_TEXT = '暂无经营日记。开始一局经营模式后会自动记录。';
const ORDERED_ITEM_IDS = ['apple', 'banana', 'lemon'];
const FALLBACK_ITEM_NAMES: Record<string, string> = {
    apple: '苹果',
    banana: '香蕉',
    lemon: '柠檬',
};

export class BusinessRunLogger {
    private static _data: BusinessDiaryData | null = null;
    private static _hasLoaded = false;
    private static _pendingNewRun = false;

    public static requestNewRunOnNextBusinessScene(): void {
        this._pendingNewRun = true;
    }

    public static consumeNewRunRequest(): boolean {
        const requested = this._pendingNewRun;
        this._pendingNewRun = false;
        return requested;
    }

    public static hasCurrentRun(): boolean {
        return !!this.load();
    }

    public static createNewRun(snapshot: BusinessDiaryDaySnapshot): void {
        const startedDate = new Date();
        const startedAt = startedDate.toISOString();
        const runId = buildRunId(startedDate);
        this._data = {
            version: 1,
            startedAt,
            runId,
            entries: [
                [
                    '【本局信息】',
                    `日记格式：${safeText(DIARY_FORMAT_VERSION, '未设置')}`,
                    `游戏版本：${safeText(PROJECT_VERSION, '未设置')}`,
                    `构建类型：${getBuildTypeText()}`,
                    `运行平台：${getRuntimePlatformText()}`,
                    `本局编号：${runId}`,
                    `开始时间：${formatLocalTime(startedDate)}`,
                    `场景：${safeText(snapshot.sceneName, '未知')}`,
                    '',
                    '【初始配置】',
                    `第 1 天目标：${formatInteger(snapshot.targetScore)}`,
                    `每日目标增长：${formatInteger(snapshot.dailyTargetIncrease)}`,
                    `初始资金：￥${formatInteger(snapshot.currentMoney)}`,
                    `初始进货：${formatInteger(snapshot.remainingStock)}`,
                    `初始进货单：${formatOrderDeck(snapshot.orderDeck)}`,
                    `初始经营加成：${formatBusinessBonuses(snapshot.ownedBusinessBonuses)}`,
                ].join('\n'),
            ],
            dayStats: Object.create(null),
        };
        this.save();
    }

    public static startDay(snapshot: BusinessDiaryDaySnapshot): void {
        const data = this.ensureData();
        if (!data) {
            return;
        }

        data.dayStats[String(snapshot.day)] = createEmptyDayStats(snapshot.day);
        data.entries.push([
            `【第 ${formatInteger(snapshot.day)} 天开始】`,
            `目标：${formatInteger(snapshot.targetScore)}`,
            `资金：￥${formatInteger(snapshot.currentMoney)}`,
            formatResourceLine(snapshot),
            `进货单：${formatOrderDeck(snapshot.orderDeck)}`,
            `经营加成：${formatBusinessBonuses(snapshot.ownedBusinessBonuses)}`,
            `场上已有：${formatOptionalCounts(snapshot.boardCounts)}`,
        ].join('\n'));
        this.save();
    }

    public static recordSpawn(day: number, itemId: string, displayName: string, source: BusinessDiarySpawnSource): void {
        const data = this.ensureData();
        if (!data) {
            return;
        }

        const stats = this.ensureDayStats(data, day);
        addCount(source === 'random' ? stats.randomGenerated : stats.manualGenerated, itemId, displayName, 1);
        this.save();
    }

    public static recordDrop(day: number, itemId: string, displayName: string): void {
        const data = this.ensureData();
        if (!data) {
            return;
        }

        const stats = this.ensureDayStats(data, day);
        addCount(stats.dropped, itemId, displayName, 1);
        this.save();
    }

    public static finishDay(payload: BusinessDiaryFinishDayPayload): void {
        const data = this.ensureData();
        if (!data) {
            return;
        }

        const stats = this.ensureDayStats(data, payload.day);
        const generated = mergeCounts(stats.manualGenerated, stats.randomGenerated);
        const dropped = hasAnyCount(stats.dropped) ? stats.dropped : fromCountSnapshots(payload.obtainedItems);

        data.entries.push([
            `【第 ${formatInteger(payload.day)} 天结束经营】`,
            `当日生成水果：${formatStoredCounts(generated)}`,
            `手动投放：${formatStoredCounts(stats.manualGenerated)}`,
            `随机掉落：${formatStoredCounts(stats.randomGenerated)}`,
            `推下水果：${formatStoredCounts(dropped)}`,
            `得分：${formatInteger(payload.score)} / ${formatInteger(payload.targetScore)}`,
            `结果：${payload.reachedTarget ? '达标' : '未达标'}`,
            `场上剩余：${formatOptionalCounts(payload.boardCounts)}`,
            `基础奖励：￥${formatInteger(payload.baseRewardMoney)}`,
            `加成奖励：￥${formatInteger(payload.businessBonusRewardMoney)}`,
            `本日获得：￥${formatInteger(payload.earnedMoney)}`,
            `结算后资金：￥${formatInteger(payload.settledMoney)}`,
        ].join('\n'));
        this.save();
    }

    public static recordPurchase(payload: BusinessDiaryPurchasePayload): void {
        const data = this.ensureData();
        if (!data) {
            return;
        }

        data.entries.push([
            `【第 ${formatInteger(payload.day)} 天商店】`,
            `购买：${payload.itemName}`,
            `类型：${payload.itemType}`,
            `花费：￥${formatInteger(payload.price)}`,
            `购买前资金：￥${formatInteger(payload.moneyBefore)}`,
            `购买后资金：￥${formatInteger(payload.moneyAfter)}`,
            `当前进货单：${formatOrderDeck(payload.orderDeck)}`,
            `经营加成：${formatBusinessBonuses(payload.ownedBusinessBonuses)}`,
        ].join('\n'));
        this.save();
    }

    public static enterNextDay(snapshot: BusinessDiaryDaySnapshot): void {
        const data = this.ensureData();
        if (!data) {
            return;
        }

        data.entries.push([
            `【进入第 ${formatInteger(snapshot.day)} 天】`,
            `资金：￥${formatInteger(snapshot.currentMoney)}`,
            `目标：${formatInteger(snapshot.targetScore)}`,
            formatResourceLine(snapshot),
            `进货单：${formatOrderDeck(snapshot.orderDeck)}`,
            `经营加成：${formatBusinessBonuses(snapshot.ownedBusinessBonuses)}`,
        ].join('\n'));
        this.save();
    }

    public static getCurrentLogText(): string {
        const data = this.load();
        if (!data || data.entries.length === 0) {
            return EMPTY_DIARY_TEXT;
        }

        return data.entries.join('\n\n');
    }

    public static clearCurrentLog(): void {
        this._data = null;
        this._hasLoaded = true;
        try {
            sys.localStorage.removeItem(BUSINESS_RUN_LOG_STORAGE_KEY);
        } catch (error) {
            warn('[BusinessRunLogger] 清空经营日记失败。', error);
        }
    }

    public static save(): void {
        if (!this._data) {
            return;
        }

        try {
            sys.localStorage.setItem(BUSINESS_RUN_LOG_STORAGE_KEY, JSON.stringify(this._data));
        } catch (error) {
            warn('[BusinessRunLogger] 保存经营日记失败。', error);
        }
    }

    public static load(): BusinessDiaryData | null {
        if (this._hasLoaded) {
            return this._data;
        }

        this._hasLoaded = true;
        try {
            const raw = sys.localStorage.getItem(BUSINESS_RUN_LOG_STORAGE_KEY);
            if (!raw) {
                this._data = null;
                return null;
            }

            const parsed = JSON.parse(raw) as BusinessDiaryData;
            if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.entries)) {
                this._data = null;
                return null;
            }

            parsed.dayStats = parsed.dayStats ?? Object.create(null);
            this._data = parsed;
            return this._data;
        } catch (error) {
            warn('[BusinessRunLogger] 读取经营日记失败。', error);
            this._data = null;
            return null;
        }
    }

    private static ensureData(): BusinessDiaryData | null {
        return this.load();
    }

    private static ensureDayStats(data: BusinessDiaryData, day: number): BusinessDiaryDayStats {
        const key = String(Math.max(1, Math.round(day)));
        data.dayStats[key] = data.dayStats[key] ?? createEmptyDayStats(day);
        return data.dayStats[key];
    }
}

function createEmptyDayStats(day: number): BusinessDiaryDayStats {
    return {
        day: Math.max(1, Math.round(day)),
        manualGenerated: createEmptyCounts(),
        randomGenerated: createEmptyCounts(),
        dropped: createEmptyCounts(),
    };
}

function createEmptyCounts(): BusinessDiaryStoredCounts {
    return {
        counts: Object.create(null),
        names: Object.create(null),
    };
}

function addCount(target: BusinessDiaryStoredCounts, itemId: string, displayName: string, count: number): void {
    const normalizedItemId = (itemId || '').trim();
    if (!normalizedItemId) {
        return;
    }

    target.counts[normalizedItemId] = normalizeInteger(target.counts[normalizedItemId]) + Math.max(0, Math.round(count));
    target.names[normalizedItemId] = (displayName || '').trim() || target.names[normalizedItemId] || FALLBACK_ITEM_NAMES[normalizedItemId] || normalizedItemId;
}

function mergeCounts(...sources: BusinessDiaryStoredCounts[]): BusinessDiaryStoredCounts {
    const merged = createEmptyCounts();
    sources.forEach((source) => {
        Object.keys(source.counts).forEach((itemId) => addCount(merged, itemId, source.names[itemId], source.counts[itemId]));
    });
    return merged;
}

function fromCountSnapshots(snapshots: BusinessDiaryItemCountSnapshot[]): BusinessDiaryStoredCounts {
    const counts = createEmptyCounts();
    snapshots.forEach((snapshot) => addCount(counts, snapshot.itemId, snapshot.displayName, snapshot.count));
    return counts;
}

function hasAnyCount(source: BusinessDiaryStoredCounts): boolean {
    return Object.keys(source.counts).some((itemId) => source.counts[itemId] > 0);
}

function formatResourceLine(snapshot: BusinessDiaryDaySnapshot): string {
    return `剩余进货：${formatInteger(snapshot.remainingStock)}`;
}

function formatOrderDeck(orderDeck: ShopOrderDeckSnapshot[]): string {
    const visibleOrders = orderDeck
        .filter((order) => order && order.itemId && order.weight > 0)
        .sort((a, b) => compareItemIds(a.itemId, b.itemId));

    if (visibleOrders.length === 0) {
        return '无';
    }

    return visibleOrders.map((order) => `${order.title || FALLBACK_ITEM_NAMES[order.itemId] || order.itemId} x${formatInteger(order.weight)}`).join('，');
}

function formatBusinessBonuses(bonuses: NormalizedShopBusinessBonusConfig[]): string {
    const names = bonuses
        .filter((bonus) => !!bonus)
        .map((bonus) => bonus.displayName || bonus.title || bonus.id)
        .filter((name) => name.length > 0);
    return names.length > 0 ? names.join('，') : '无';
}

function formatOptionalCounts(counts: BusinessDiaryItemCountSnapshot[] | null): string {
    if (!counts) {
        return '待接入';
    }

    return formatStoredCounts(fromCountSnapshots(counts));
}

function formatStoredCounts(source: BusinessDiaryStoredCounts): string {
    const itemIds = Object.keys(source.counts)
        .filter((itemId) => source.counts[itemId] > 0)
        .sort(compareItemIds);

    if (itemIds.length === 0) {
        return '无';
    }

    return itemIds.map((itemId) => `${source.names[itemId] || FALLBACK_ITEM_NAMES[itemId] || itemId} x${formatInteger(source.counts[itemId])}`).join('，');
}

function getItemSortIndex(itemId: string): number {
    const index = ORDERED_ITEM_IDS.indexOf(itemId);
    return index >= 0 ? index : ORDERED_ITEM_IDS.length;
}

function compareItemIds(a: string, b: string): number {
    const indexDelta = getItemSortIndex(a) - getItemSortIndex(b);
    return indexDelta !== 0 ? indexDelta : a.localeCompare(b);
}

function normalizeInteger(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.round(value));
}

function formatInteger(value: number): string {
    return String(normalizeInteger(value));
}

function buildRunId(date: Date): string {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    const seconds = pad2(date.getSeconds());
    return `run-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function formatLocalTime(date: Date): string {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function safeText(value: unknown, fallback: string): string {
    if (value === undefined || value === null) {
        return fallback;
    }

    const text = String(value).trim();
    if (!text || text === 'undefined' || text === 'null' || text === 'NaN') {
        return fallback;
    }

    return text;
}

function getBuildTypeText(): string {
    const runtimeSys = sys as unknown as {
        isBrowser?: boolean;
        isNative?: boolean;
        platform?: unknown;
    };
    const platformText = getRuntimePlatformText().toLowerCase();
    const locationHost = (globalThis as unknown as { location?: { hostname?: string } }).location?.hostname ?? '';

    if (platformText.indexOf('android') >= 0) {
        return 'Android';
    }
    if (platformText.indexOf('wechat') >= 0 || platformText.indexOf('minigame') >= 0) {
        return '微信小游戏';
    }
    if (runtimeSys.isBrowser) {
        return locationHost === 'localhost' || locationHost === '127.0.0.1'
            ? '编辑器预览'
            : 'Web';
    }
    if (runtimeSys.isNative) {
        return '未知';
    }

    return '未知';
}

function getRuntimePlatformText(): string {
    const runtimeSys = sys as unknown as {
        platform?: unknown;
        Platform?: Record<string, unknown>;
    };
    const platform = runtimeSys.platform;
    if (typeof platform === 'string') {
        return safeText(platform, '未知');
    }
    if (typeof platform === 'number' && Number.isFinite(platform)) {
        const platformName = Object.keys(runtimeSys.Platform ?? {})
            .find((key) => runtimeSys.Platform?.[key] === platform);
        if (platformName) {
            return platformName;
        }
        return `CocosPlatform-${platform}`;
    }

    return '未知';
}
