import { _decorator, Component } from 'cc';
import {
    NormalizedBusinessStallDetectionConfig,
    StallDetectionConfig,
} from '../modes/business/StallDetectionConfig';

const { ccclass, property } = _decorator;

export const BUSINESS_REWARD_TARGET_REACHED = 'TargetReached';
export const BUSINESS_REWARD_ITEM_COUNT_AT_LEAST = 'ItemCountAtLeast';
export const BUSINESS_REWARD_SCORE_AT_LEAST = 'ScoreAtLeast';

export type BusinessBaseRewardRuleType =
    | typeof BUSINESS_REWARD_TARGET_REACHED
    | typeof BUSINESS_REWARD_ITEM_COUNT_AT_LEAST
    | typeof BUSINESS_REWARD_SCORE_AT_LEAST
    | string;

export interface NormalizedBusinessItemScoreConfig {
    itemId: string;
    displayName: string;
    scoreValue: number;
    showInHud: boolean;
}

export interface NormalizedBusinessBaseRewardRule {
    id: string;
    displayName: string;
    rewardMoney: number;
    ruleType: BusinessBaseRewardRuleType;
    itemId: string;
    requiredCount: number;
    requiredScore: number;
    requireTargetReached: boolean;
}

@ccclass('BusinessItemScoreConfig')
export class BusinessItemScoreConfig {
    @property({
        displayName: '物品 ID',
        tooltip: '经营模式计分用的物品 ID，例如 apple、banana、lemon。需要和物品 Prefab 上的 ItemPrefabConfig.itemId 一致。',
    })
    public itemId = '';

    @property({
        displayName: '显示名',
        tooltip: '经营模式 HUD 和结算面板显示的中文名，例如“苹果”。',
    })
    public displayName = '';

    @property({
        displayName: '经营分数单价',
        tooltip: '该物品在经营模式中每掉落 1 个获得多少分。调大后更容易达成每日目标。',
    })
    public scoreValue = 1;

    @property({
        displayName: '显示在左侧 HUD',
        tooltip: '开启后会显示在经营模式左侧“当前获得分数”明细里。关闭后仍可计分，但不显示在 HUD 明细中。',
    })
    public showInHud = true;
}

@ccclass('BusinessBaseRewardRule')
export class BusinessBaseRewardRule {
    @property({
        displayName: '规则 ID',
        tooltip: '本日基础收益规则的唯一标识，例如 target_reached。只用于配置识别，不保存玩家状态。',
    })
    public id = '';

    @property({
        displayName: '显示名',
        tooltip: '结算面板“基础收益”区域显示的名称，例如“目标达成”。',
    })
    public displayName = '';

    @property({
        displayName: '奖励资金',
        tooltip: '该基础收益规则触发后获得的资金。target_reached 会优先使用上方“目标达成奖励资金”。',
    })
    public rewardMoney = 0;

    @property({
        displayName: '规则类型',
        tooltip: '支持 TargetReached、ItemCountAtLeast、ScoreAtLeast。TargetReached 判断当日分数是否达到每日目标。',
    })
    public ruleType: BusinessBaseRewardRuleType = BUSINESS_REWARD_TARGET_REACHED;

    @property({
        displayName: '物品 ID',
        tooltip: '规则类型为 ItemCountAtLeast 时填写，例如 apple。其他规则类型可留空。',
    })
    public itemId = '';

    @property({
        displayName: '数量阈值',
        tooltip: '规则类型为 ItemCountAtLeast 时使用。当天该物品数量达到或超过这个值时触发。',
    })
    public requiredCount = 0;

    @property({
        displayName: '分数阈值',
        tooltip: '规则类型为 ScoreAtLeast 时使用。当日总分达到或超过这个值时触发。',
    })
    public requiredScore = 0;

    @property({
        displayName: '要求本日达标',
        tooltip: '开启后，这条基础收益规则只有在本日总分达到每日目标时才会触发。',
    })
    public requireTargetReached = false;
}

@ccclass('BusinessModeConfig')
export class BusinessModeConfig extends Component {
    @property({
        displayName: '第 1 天目标分数',
        tooltip: '经营模式第 1 天需要达到的目标分数。HUD 和结算都会读取这里。',
    })
    public firstDayTargetScore = 20;

    @property({
        displayName: '每日目标分数增长',
        tooltip: '第 2 天开始每日目标额外增加的分数。当前默认 0，表示每天目标都等于“第 1 天目标分数”。',
    })
    public dailyTargetScoreGrowth = 0;

    @property({
        displayName: '目标达成奖励资金',
        tooltip: '本日基础收益中“目标达成”奖励的资金。target_reached 规则会优先读取这里。',
    })
    public dailyTargetRewardMoney = 5;

    @property({
        displayName: '初始资金',
        tooltip: '经营模式第一次进入时的玩家资金。运行后不会把玩家资金写回这里。',
    })
    public initialMoney = 0;

    @property({
        type: StallDetectionConfig,
        displayName: '停滞检测配置',
        tooltip: '经营模式每日停滞检测和右上角倒计时的参数配置。展开后可调整缓冲时间、无得分判定时间和显示规则。',
    })
    public stallDetectionConfig: StallDetectionConfig = new StallDetectionConfig();

    @property({
        type: [BusinessItemScoreConfig],
        displayName: '经营物品计分配置列表',
        tooltip: '经营模式每种物品的显示名、分数单价和 HUD 显示开关。这里不配置 prefab 或掉落权重。',
    })
    public itemScoreConfigs: BusinessItemScoreConfig[] = createDefaultItemScoreConfigs();

    @property({
        type: [BusinessBaseRewardRule],
        displayName: '本日基础收益规则',
        tooltip: '本日结算“基础收益”区域的规则列表。经营加成请继续在 ShopConfig 中配置。',
    })
    public baseRewardRules: BusinessBaseRewardRule[] = createDefaultBaseRewardRules();

    public getDailyTargetScore(day: number): number {
        const normalizedDay = Math.max(1, normalizeNonNegativeInteger(day, 1));
        const baseScore = this.getFirstDayTargetScore();
        const increase = this.getDailyTargetScoreGrowth();
        return baseScore + (normalizedDay - 1) * increase;
    }

    public getFirstDayTargetScore(): number {
        return normalizeNonNegativeNumber(this.firstDayTargetScore, 20);
    }

    public getDailyTargetScoreGrowth(): number {
        return normalizeNonNegativeNumber(this.dailyTargetScoreGrowth, 0);
    }

    public getInitialMoney(): number {
        return normalizeNonNegativeInteger(this.initialMoney, 0);
    }

    public getStallDetectionConfig(): NormalizedBusinessStallDetectionConfig {
        return this.stallDetectionConfig?.getNormalizedConfig() ?? new StallDetectionConfig().getNormalizedConfig();
    }

    public getItemScoreConfigs(): NormalizedBusinessItemScoreConfig[] {
        const normalizedConfigs = this.itemScoreConfigs
            .filter((config) => !!config)
            .map((config, index) => normalizeItemScoreConfig(config, index))
            .filter((config) => config.itemId.length > 0);

        return normalizedConfigs.length > 0 ? normalizedConfigs : createDefaultNormalizedItemScoreConfigs();
    }

    public getBaseRewardRules(): NormalizedBusinessBaseRewardRule[] {
        const normalizedRules = this.baseRewardRules
            .filter((rule) => !!rule)
            .map((rule, index) => normalizeBaseRewardRule(rule, index, this.dailyTargetRewardMoney))
            .filter((rule) => rule.id.length > 0 && rule.ruleType.length > 0);

        return normalizedRules.length > 0
            ? normalizedRules
            : createDefaultNormalizedBaseRewardRules(this.dailyTargetRewardMoney);
    }

    public findItemScoreConfig(itemId: string): NormalizedBusinessItemScoreConfig | null {
        const normalizedItemId = (itemId || '').trim();
        if (!normalizedItemId) {
            return null;
        }

        return this.getItemScoreConfigs().find((config) => config.itemId === normalizedItemId) ?? null;
    }
}

export function createDefaultNormalizedItemScoreConfigs(): NormalizedBusinessItemScoreConfig[] {
    return createDefaultItemScoreConfigs().map((config, index) => normalizeItemScoreConfig(config, index));
}

export function createDefaultNormalizedBaseRewardRules(
    dailyTargetRewardMoney = 5,
): NormalizedBusinessBaseRewardRule[] {
    return createDefaultBaseRewardRules().map((rule, index) => normalizeBaseRewardRule(rule, index, dailyTargetRewardMoney));
}

export function createDefaultItemScoreConfigs(): BusinessItemScoreConfig[] {
    return [
        createItemScoreConfig('apple', '苹果', 2),
        createItemScoreConfig('banana', '香蕉', 1),
        createItemScoreConfig('lemon', '柠檬', 3),
    ];
}

export function createDefaultBaseRewardRules(): BusinessBaseRewardRule[] {
    return [
        createBaseRewardRule('target_reached', '目标达成', BUSINESS_REWARD_TARGET_REACHED, 5),
    ];
}

function createItemScoreConfig(
    itemId: string,
    displayName: string,
    scoreValue: number,
    showInHud = true,
): BusinessItemScoreConfig {
    const config = new BusinessItemScoreConfig();
    config.itemId = itemId;
    config.displayName = displayName;
    config.scoreValue = scoreValue;
    config.showInHud = showInHud;
    return config;
}

function createBaseRewardRule(
    id: string,
    displayName: string,
    ruleType: BusinessBaseRewardRuleType,
    rewardMoney: number,
): BusinessBaseRewardRule {
    const rule = new BusinessBaseRewardRule();
    rule.id = id;
    rule.displayName = displayName;
    rule.ruleType = ruleType;
    rule.rewardMoney = rewardMoney;
    rule.requireTargetReached = false;
    return rule;
}

function normalizeItemScoreConfig(
    source: BusinessItemScoreConfig,
    index: number,
): NormalizedBusinessItemScoreConfig {
    const fallback = createDefaultItemScoreConfigs()[index] ?? null;
    const itemId = normalizeText(source.itemId, fallback?.itemId ?? `item_${index + 1}`);
    const displayName = normalizeText(source.displayName, fallback?.displayName ?? itemId);
    const scoreValue = normalizeNonNegativeNumber(source.scoreValue, fallback?.scoreValue ?? 1);

    return {
        itemId,
        displayName,
        scoreValue,
        showInHud: source.showInHud,
    };
}

function normalizeBaseRewardRule(
    source: BusinessBaseRewardRule,
    index: number,
    dailyTargetRewardMoney: number,
): NormalizedBusinessBaseRewardRule {
    const fallback = createDefaultBaseRewardRules()[index] ?? null;
    const id = normalizeText(source.id, fallback?.id ?? `base_reward_${index + 1}`);
    const ruleType = normalizeText(source.ruleType, fallback?.ruleType ?? BUSINESS_REWARD_TARGET_REACHED);
    const isDefaultTargetReward = id === 'target_reached' && ruleType === BUSINESS_REWARD_TARGET_REACHED;
    const rewardMoney = isDefaultTargetReward
        ? normalizeNonNegativeInteger(dailyTargetRewardMoney, 5)
        : normalizeNonNegativeInteger(source.rewardMoney, fallback?.rewardMoney ?? 0);

    return {
        id,
        displayName: normalizeText(source.displayName, fallback?.displayName ?? id),
        rewardMoney,
        ruleType,
        itemId: normalizeText(source.itemId, fallback?.itemId ?? ''),
        requiredCount: normalizeNonNegativeInteger(source.requiredCount, fallback?.requiredCount ?? 0),
        requiredScore: normalizeNonNegativeNumber(source.requiredScore, fallback?.requiredScore ?? 0),
        requireTargetReached: source.requireTargetReached,
    };
}

function normalizeText(value: string | undefined, fallback: string): string {
    const trimmed = (value || '').trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeNonNegativeInteger(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return Math.max(0, Math.round(fallback));
    }

    return Math.max(0, Math.round(value));
}

function normalizeNonNegativeNumber(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return Math.max(0, fallback);
    }

    return Math.max(0, value);
}
