import { sys, warn } from 'cc';
import { NormalizedShopBusinessBonusConfig, ShopOrderDeckSnapshot } from '../shop/ShopTypes';
import { DIARY_FORMAT_VERSION, PROJECT_VERSION } from '../config/ProjectVersion';

export const BUSINESS_RUN_LOG_LEGACY_STORAGE_KEY = 'TUITUI_BUSINESS_RUN_LOG_CURRENT';
export const BUSINESS_RUN_LOG_LIST_STORAGE_KEY = 'TUITUI_BUSINESS_RUN_LOG_LIST';
export const BUSINESS_RUN_LOG_CURRENT_ID_KEY = 'TUITUI_BUSINESS_RUN_LOG_CURRENT_ID';

export type BusinessDiarySpawnSource = 'manual' | 'random';
export type BusinessDiaryRunStatus = 'in_progress' | 'completed' | 'failed' | 'abandoned';

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
    dailyRestock: number;
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

export interface BusinessDiaryFailurePayload extends BusinessDiaryDaySnapshot {
    score: number;
    reason: string;
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

export interface BusinessDiaryEntry {
    type: string;
    day: number;
    text: string;
}

export interface BusinessDiaryRunRecord {
    runId: string;
    startedAt: string;
    updatedAt: string;
    gameVersion: string;
    diaryFormatVersion: string;
    platform: string;
    buildType: string;
    scene: string;
    status: BusinessDiaryRunStatus;
    lastDay: number;
    summary: string;
    entries: BusinessDiaryEntry[];
    dayStats: Record<string, BusinessDiaryDayStats>;
}

interface BusinessDiaryListData {
    version: 2;
    runs: BusinessDiaryRunRecord[];
}

interface LegacyBusinessDiaryData {
    version: 1;
    startedAt: string;
    runId?: string;
    entries: string[];
    dayStats?: Record<string, BusinessDiaryDayStats>;
}

const EMPTY_DIARY_TEXT = '暂无经营日记。开始一局经营模式后会自动记录。';
const ORDERED_ITEM_IDS = ['apple', 'banana', 'lemon'];
const FALLBACK_ITEM_NAMES: Record<string, string> = {
    apple: '苹果',
    banana: '香蕉',
    lemon: '柠檬',
};

export class BusinessRunLogger {
    private static _list: BusinessDiaryListData = { version: 2, runs: [] };
    private static _currentRunId = '';
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
        return !!this.getCurrentRun();
    }

    public static createNewRun(snapshot: BusinessDiaryDaySnapshot): void {
        this.markCurrentRunAbandoned();
        const startedDate = new Date();
        const startedAt = formatLocalTime(startedDate);
        const runId = buildUniqueRunId(startedDate, this.loadList().runs);
        const buildType = getBuildTypeText();
        const platform = getRuntimePlatformText();
        const scene = safeText(snapshot.sceneName, '未知');
        const runInfoText = [
            '【本局信息】',
            `日记格式：${safeText(DIARY_FORMAT_VERSION, '未设置')}`,
            `游戏版本：${safeText(PROJECT_VERSION, '未设置')}`,
            `构建类型：${buildType}`,
            `运行平台：${platform}`,
            `本局编号：${runId}`,
            `开始时间：${startedAt}`,
            `场景：${scene}`,
            '',
            '【初始配置】',
            `第 1 天目标：${formatInteger(snapshot.targetScore)}`,
            `每日目标增长：${formatInteger(snapshot.dailyTargetIncrease)}`,
            `初始资金：￥${formatInteger(snapshot.currentMoney)}`,
            `初始进货：${formatInteger(snapshot.remainingStock)}`,
            `每日补货：${formatInteger(snapshot.dailyRestock)}`,
            `初始进货单权重：${formatOrderDeck(snapshot.orderDeck)}`,
            `初始经营加成：${formatBusinessBonuses(snapshot.ownedBusinessBonuses)}`,
        ].join('\n');

        this._currentRunId = runId;
        this._list.runs.unshift({
            runId,
            startedAt,
            updatedAt: startedAt,
            gameVersion: safeText(PROJECT_VERSION, '未设置'),
            diaryFormatVersion: safeText(DIARY_FORMAT_VERSION, '未设置'),
            platform,
            buildType,
            scene,
            status: 'in_progress',
            lastDay: Math.max(1, Math.round(snapshot.day)),
            summary: '进行中 · 第 1 天',
            entries: [{ type: 'run_info', day: 1, text: runInfoText }],
            dayStats: Object.create(null),
        });
        this.save();
    }

    public static startDay(snapshot: BusinessDiaryDaySnapshot): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        run.dayStats[String(snapshot.day)] = createEmptyDayStats(snapshot.day);
        this.appendEntry(run, 'day_start', snapshot.day, [
            `【第 ${formatInteger(snapshot.day)} 天开始】`,
            `目标：${formatInteger(snapshot.targetScore)}`,
            `资金：￥${formatInteger(snapshot.currentMoney)}`,
            formatResourceLine(snapshot),
            `进货单权重：${formatOrderDeck(snapshot.orderDeck)}`,
            `经营加成：${formatBusinessBonuses(snapshot.ownedBusinessBonuses)}`,
            `场上已有：${formatOptionalCounts(snapshot.boardCounts)}`,
        ].join('\n'), 'in_progress', `进行中 · 第 ${formatInteger(snapshot.day)} 天`);
    }

    public static recordSpawn(day: number, itemId: string, displayName: string, source: BusinessDiarySpawnSource): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        const stats = this.ensureDayStats(run, day);
        addCount(source === 'random' ? stats.randomGenerated : stats.manualGenerated, itemId, displayName, 1);
        this.touchRun(run, day, `进行中 · 第 ${formatInteger(day)} 天`);
        this.save();
    }

    public static recordDrop(day: number, itemId: string, displayName: string): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        const stats = this.ensureDayStats(run, day);
        addCount(stats.dropped, itemId, displayName, 1);
        this.touchRun(run, day, `进行中 · 第 ${formatInteger(day)} 天`);
        this.save();
    }

    public static finishDay(payload: BusinessDiaryFinishDayPayload): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        const stats = this.ensureDayStats(run, payload.day);
        const generated = mergeCounts(stats.manualGenerated, stats.randomGenerated);
        const dropped = hasAnyCount(stats.dropped) ? stats.dropped : fromCountSnapshots(payload.obtainedItems);

        this.appendEntry(run, 'day_finish', payload.day, [
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
        ].join('\n'), 'in_progress', `已结算 · 第 ${formatInteger(payload.day)} 天`);
    }

    public static failDay(payload: BusinessDiaryFailurePayload): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        const stats = this.ensureDayStats(run, payload.day);
        const generated = mergeCounts(stats.manualGenerated, stats.randomGenerated);

        this.appendEntry(run, 'day_failed', payload.day, [
            `【第 ${formatInteger(payload.day)} 天经营失败】`,
            `当日生成水果：${formatStoredCounts(generated)}`,
            `手动投放：${formatStoredCounts(stats.manualGenerated)}`,
            `随机掉落：${formatStoredCounts(stats.randomGenerated)}`,
            `推下水果：${formatStoredCounts(stats.dropped)}`,
            formatResourceLine(payload),
            `当前分数：${formatInteger(payload.score)} / ${formatInteger(payload.targetScore)}`,
            `失败原因：${safeText(payload.reason, '未知')}`,
            `当前资金：￥${formatInteger(payload.currentMoney)}`,
            `场上剩余：${formatOptionalCounts(payload.boardCounts)}`,
        ].join('\n'), 'failed', `失败 · 第 ${formatInteger(payload.day)} 天`);
        this._currentRunId = '';
        this.save();
    }

    public static recordPurchase(payload: BusinessDiaryPurchasePayload): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        this.appendEntry(run, 'purchase', payload.day, [
            `【第 ${formatInteger(payload.day)} 天商店】`,
            `购买：${payload.itemName}`,
            `类型：${payload.itemType}`,
            `花费：￥${formatInteger(payload.price)}`,
            `购买前资金：￥${formatInteger(payload.moneyBefore)}`,
            `购买后资金：￥${formatInteger(payload.moneyAfter)}`,
            `当前进货单权重：${formatOrderDeck(payload.orderDeck)}`,
            `经营加成：${formatBusinessBonuses(payload.ownedBusinessBonuses)}`,
        ].join('\n'), 'in_progress', `商店采购 · 第 ${formatInteger(payload.day)} 天`);
    }

    public static enterNextDay(snapshot: BusinessDiaryDaySnapshot): void {
        const run = this.ensureCurrentRun();
        if (!run) {
            return;
        }

        this.appendEntry(run, 'enter_next_day', snapshot.day, [
            `【进入第 ${formatInteger(snapshot.day)} 天】`,
            `资金：￥${formatInteger(snapshot.currentMoney)}`,
            `目标：${formatInteger(snapshot.targetScore)}`,
            formatResourceLine(snapshot),
            `进货单权重：${formatOrderDeck(snapshot.orderDeck)}`,
            `经营加成：${formatBusinessBonuses(snapshot.ownedBusinessBonuses)}`,
        ].join('\n'), 'in_progress', `进行中 · 第 ${formatInteger(snapshot.day)} 天`);
    }

    public static markCurrentRunAbandoned(): void {
        const run = this.getCurrentRun();
        if (!run || run.status !== 'in_progress') {
            return;
        }

        run.status = 'abandoned';
        run.summary = `已中断 · 第 ${formatInteger(run.lastDay)} 天`;
        run.updatedAt = formatLocalTime(new Date());
        this._currentRunId = '';
        this.save();
    }

    public static getRuns(): BusinessDiaryRunRecord[] {
        return this.loadList().runs.map(cloneRunRecord);
    }

    public static getRunText(runId: string): string {
        const run = this.findRun(runId);
        if (!run || run.entries.length === 0) {
            return EMPTY_DIARY_TEXT;
        }

        return run.entries.map((entry) => entry.text).join('\n\n');
    }

    public static getCurrentLogText(): string {
        const run = this.getCurrentRun();
        if (!run) {
            return EMPTY_DIARY_TEXT;
        }

        return this.getRunText(run.runId);
    }

    public static deleteRun(runId: string): void {
        this.loadList();
        this._list.runs = this._list.runs.filter((run) => run.runId !== runId);
        if (this._currentRunId === runId) {
            this._currentRunId = '';
        }
        this.save();
    }

    public static clearAllLogs(): void {
        this._list = { version: 2, runs: [] };
        this._currentRunId = '';
        this._hasLoaded = true;
        this.save();
        try {
            sys.localStorage.removeItem(BUSINESS_RUN_LOG_LEGACY_STORAGE_KEY);
        } catch (error) {
            warn('[BusinessRunLogger] 清理旧经营日记失败。', error);
        }
    }

    public static clearCurrentLog(): void {
        const run = this.getCurrentRun();
        if (!run) {
            return;
        }

        this.deleteRun(run.runId);
    }

    public static save(): void {
        try {
            sys.localStorage.setItem(BUSINESS_RUN_LOG_LIST_STORAGE_KEY, JSON.stringify(this._list));
            if (this._currentRunId) {
                sys.localStorage.setItem(BUSINESS_RUN_LOG_CURRENT_ID_KEY, this._currentRunId);
            } else {
                sys.localStorage.removeItem(BUSINESS_RUN_LOG_CURRENT_ID_KEY);
            }
        } catch (error) {
            warn('[BusinessRunLogger] 保存经营日记失败。', error);
        }
    }

    private static loadList(): BusinessDiaryListData {
        if (this._hasLoaded) {
            return this._list;
        }

        this._hasLoaded = true;
        this._list = { version: 2, runs: [] };
        try {
            const rawList = sys.localStorage.getItem(BUSINESS_RUN_LOG_LIST_STORAGE_KEY);
            if (rawList) {
                const parsed = JSON.parse(rawList) as BusinessDiaryListData;
                if (parsed && parsed.version === 2 && Array.isArray(parsed.runs)) {
                    this._list = {
                        version: 2,
                        runs: parsed.runs.map(normalizeRunRecord).filter((run) => run.runId.length > 0),
                    };
                }
            } else {
                this.migrateLegacyCurrentLog();
            }

            this._currentRunId = safeText(sys.localStorage.getItem(BUSINESS_RUN_LOG_CURRENT_ID_KEY), '');
        } catch (error) {
            warn('[BusinessRunLogger] 读取经营日记失败。', error);
            this._list = { version: 2, runs: [] };
            this._currentRunId = '';
        }

        return this._list;
    }

    private static migrateLegacyCurrentLog(): void {
        const rawLegacy = sys.localStorage.getItem(BUSINESS_RUN_LOG_LEGACY_STORAGE_KEY);
        if (!rawLegacy) {
            return;
        }

        try {
            const legacy = JSON.parse(rawLegacy) as LegacyBusinessDiaryData;
            if (!legacy || legacy.version !== 1 || !Array.isArray(legacy.entries)) {
                return;
            }

            const startedAt = safeText(legacy.startedAt, formatLocalTime(new Date()));
            const runId = safeText(legacy.runId, buildUniqueRunId(new Date(), this._list.runs));
            this._list.runs.push({
                runId,
                startedAt,
                updatedAt: startedAt,
                gameVersion: safeText(PROJECT_VERSION, '未设置'),
                diaryFormatVersion: safeText(DIARY_FORMAT_VERSION, '未设置'),
                platform: getRuntimePlatformText(),
                buildType: getBuildTypeText(),
                scene: '未知',
                status: 'abandoned',
                lastDay: 1,
                summary: '已迁移旧日记',
                entries: legacy.entries.map((text, index) => ({
                    type: index === 0 ? 'legacy_run_info' : 'legacy_entry',
                    day: 1,
                    text: safeText(text, ''),
                })).filter((entry) => entry.text.length > 0),
                dayStats: legacy.dayStats ?? Object.create(null),
            });
            this.save();
        } catch (error) {
            warn('[BusinessRunLogger] 迁移旧经营日记失败。', error);
        }
    }

    private static ensureCurrentRun(): BusinessDiaryRunRecord | null {
        const run = this.getCurrentRun();
        if (!run || run.status === 'failed' || run.status === 'completed' || run.status === 'abandoned') {
            return null;
        }

        return run;
    }

    private static getCurrentRun(): BusinessDiaryRunRecord | null {
        this.loadList();
        if (!this._currentRunId) {
            return null;
        }

        return this.findRun(this._currentRunId);
    }

    private static findRun(runId: string): BusinessDiaryRunRecord | null {
        const normalizedRunId = safeText(runId, '');
        if (!normalizedRunId) {
            return null;
        }

        return this.loadList().runs.find((run) => run.runId === normalizedRunId) ?? null;
    }

    private static appendEntry(
        run: BusinessDiaryRunRecord,
        type: string,
        day: number,
        text: string,
        status: BusinessDiaryRunStatus,
        summary: string,
    ): void {
        run.entries.push({ type, day: Math.max(1, Math.round(day)), text });
        run.status = status;
        this.touchRun(run, day, summary);
        this.save();
    }

    private static touchRun(run: BusinessDiaryRunRecord, day: number, summary: string): void {
        run.updatedAt = formatLocalTime(new Date());
        run.lastDay = Math.max(run.lastDay, Math.max(1, Math.round(day)));
        run.summary = safeText(summary, run.summary);
    }

    private static ensureDayStats(run: BusinessDiaryRunRecord, day: number): BusinessDiaryDayStats {
        const key = String(Math.max(1, Math.round(day)));
        run.dayStats[key] = run.dayStats[key] ?? createEmptyDayStats(day);
        return run.dayStats[key];
    }
}

function normalizeRunRecord(run: BusinessDiaryRunRecord): BusinessDiaryRunRecord {
    return {
        runId: safeText(run.runId, ''),
        startedAt: safeText(run.startedAt, '未知'),
        updatedAt: safeText(run.updatedAt, safeText(run.startedAt, '未知')),
        gameVersion: safeText(run.gameVersion, '未设置'),
        diaryFormatVersion: safeText(run.diaryFormatVersion, '未设置'),
        platform: safeText(run.platform, '未知'),
        buildType: safeText(run.buildType, '未知'),
        scene: safeText(run.scene, '未知'),
        status: normalizeStatus(run.status),
        lastDay: normalizeInteger(run.lastDay || 1),
        summary: safeText(run.summary, '无摘要'),
        entries: Array.isArray(run.entries)
            ? run.entries.map((entry) => ({
                type: safeText(entry.type, 'entry'),
                day: normalizeInteger(entry.day || 1),
                text: safeText(entry.text, ''),
            })).filter((entry) => entry.text.length > 0)
            : [],
        dayStats: run.dayStats ?? Object.create(null),
    };
}

function cloneRunRecord(run: BusinessDiaryRunRecord): BusinessDiaryRunRecord {
    return {
        ...run,
        entries: run.entries.map((entry) => ({ ...entry })),
        dayStats: run.dayStats,
    };
}

function normalizeStatus(status: string): BusinessDiaryRunStatus {
    switch (status) {
    case 'completed':
    case 'failed':
    case 'abandoned':
        return status;
    case 'in_progress':
    default:
        return 'in_progress';
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

function buildUniqueRunId(date: Date, runs: BusinessDiaryRunRecord[]): string {
    const baseRunId = buildRunId(date);
    if (!runs.some((run) => run.runId === baseRunId)) {
        return baseRunId;
    }

    let index = 2;
    while (runs.some((run) => run.runId === `${baseRunId}-${index}`)) {
        index += 1;
    }
    return `${baseRunId}-${index}`;
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
