import { _decorator } from 'cc';

const { ccclass, property } = _decorator;

export interface NormalizedBusinessStallDetectionConfig {
    enableStallDetection: boolean;
    firstDayGraceSeconds: number;
    laterDayGraceSeconds: number;
    noScoreTimeoutSeconds: number;
    firstDayRequiresFirstSpawn: boolean;
    laterDaysRequireFirstSpawn: boolean;
    showStallCountdown: boolean;
    countdownDecimalPlaces: number;
}

@ccclass('StallDetectionConfig')
export class StallDetectionConfig {
    @property({
        displayName: '启用停滞检测',
        tooltip: '是否启用每日停滞检测。关闭后不会因为长时间没有得分而自动结算或失败，主要用于开发期调试。',
    })
    public enableStallDetection = true;

    @property({
        displayName: '第 1 天缓冲时间',
        tooltip: '第 1 天开始后多少秒进入停滞检测准备阶段。默认 20 秒，调小会更快进入判定。',
    })
    public firstDayGraceSeconds = 20;

    @property({
        displayName: '后续天数缓冲时间',
        tooltip: '第 2 天及以后每天开始后多少秒启用停滞检测。默认 20 秒。',
    })
    public laterDayGraceSeconds = 20;

    @property({
        displayName: '无得分判定时间',
        tooltip: '停滞检测启用后，连续多少秒没有获得分数就自动判定。默认 3 秒。',
    })
    public noScoreTimeoutSeconds = 3;

    @property({
        displayName: '第 1 天等待首次投放',
        tooltip: '开启后，第 1 天缓冲结束但还没有生成过水果时，不会直接失败，会等待玩家首次投放。',
    })
    public firstDayRequiresFirstSpawn = true;

    @property({
        displayName: '后续天数等待首次投放',
        tooltip: '开启后，第 2 天及以后也会等待首次投放才启用检测。默认关闭，用于防止靠旧水果挂机。',
    })
    public laterDaysRequireFirstSpawn = false;

    @property({
        displayName: '显示倒计时 UI',
        tooltip: '是否显示右上角停滞检测倒计时文本。只影响显示，不改变判定规则。',
    })
    public showStallCountdown = true;

    @property({
        displayName: '倒计时小数位',
        tooltip: '右上角倒计时保留几位小数。默认 1，会显示 20.0s / 3.0s；设为 0 时显示整数秒。',
    })
    public countdownDecimalPlaces = 1;

    public getNormalizedConfig(): NormalizedBusinessStallDetectionConfig {
        return normalizeStallDetectionConfig(this);
    }
}

export function createDefaultNormalizedStallDetectionConfig(): NormalizedBusinessStallDetectionConfig {
    return {
        enableStallDetection: true,
        firstDayGraceSeconds: 20,
        laterDayGraceSeconds: 20,
        noScoreTimeoutSeconds: 3,
        firstDayRequiresFirstSpawn: true,
        laterDaysRequireFirstSpawn: false,
        showStallCountdown: true,
        countdownDecimalPlaces: 1,
    };
}

export function normalizeStallDetectionConfig(
    source: Partial<NormalizedBusinessStallDetectionConfig> | null | undefined,
): NormalizedBusinessStallDetectionConfig {
    const fallback = createDefaultNormalizedStallDetectionConfig();

    return {
        enableStallDetection: normalizeBoolean(source?.enableStallDetection, fallback.enableStallDetection),
        firstDayGraceSeconds: normalizeNonNegativeNumber(source?.firstDayGraceSeconds ?? fallback.firstDayGraceSeconds, fallback.firstDayGraceSeconds),
        laterDayGraceSeconds: normalizeNonNegativeNumber(source?.laterDayGraceSeconds ?? fallback.laterDayGraceSeconds, fallback.laterDayGraceSeconds),
        noScoreTimeoutSeconds: normalizeNonNegativeNumber(source?.noScoreTimeoutSeconds ?? fallback.noScoreTimeoutSeconds, fallback.noScoreTimeoutSeconds),
        firstDayRequiresFirstSpawn: normalizeBoolean(source?.firstDayRequiresFirstSpawn, fallback.firstDayRequiresFirstSpawn),
        laterDaysRequireFirstSpawn: normalizeBoolean(source?.laterDaysRequireFirstSpawn, fallback.laterDaysRequireFirstSpawn),
        showStallCountdown: normalizeBoolean(source?.showStallCountdown, fallback.showStallCountdown),
        countdownDecimalPlaces: normalizeIntegerInRange(source?.countdownDecimalPlaces, fallback.countdownDecimalPlaces, 0, 3),
    };
}

function normalizeBoolean(value: boolean | undefined, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function normalizeNonNegativeNumber(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return Math.max(0, fallback);
    }

    return Math.max(0, value);
}

function normalizeNonNegativeInteger(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return Math.max(0, Math.round(fallback));
    }

    return Math.max(0, Math.round(value));
}

function normalizeIntegerInRange(value: number | undefined, fallback: number, min: number, max: number): number {
    const normalized = normalizeNonNegativeInteger(value ?? fallback, fallback);
    return Math.min(max, Math.max(min, normalized));
}
