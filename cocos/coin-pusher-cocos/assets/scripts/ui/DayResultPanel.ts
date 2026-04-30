import { _decorator, Button, Component, Label, Node } from 'cc';

const { ccclass, property } = _decorator;

type DayResultButtonHandler = (passed: boolean) => void;

export interface DayResultPanelData {
    reachedTarget: boolean;
    score: number;
    targetScore: number;
    earnedMoney?: number;
    detailText?: string;
}

@ccclass('DayResultPanel')
export class DayResultPanel extends Component {
    @property({
        type: Label,
        displayName: '结算标题文本',
        tooltip: '显示本日结算标题。当前固定显示“本日结算！”。'
    })
    public titleLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '结算分数文本',
        tooltip: '显示今日分数和目标分数，例如“今日分数：12 / 20”。'
    })
    public scoreLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '结算说明文本',
        tooltip: '显示完整本日结算账单，包括商品数量、分数、奖励明细和最终获得资金。'
    })
    public descriptionLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '主按钮文本',
        tooltip: '结算面板主按钮上的文字。未达标时显示“继续本日”，达标时显示“进入商店”。'
    })
    public mainButtonLabel: Label | null = null;

    @property({
        type: Button,
        displayName: '主按钮',
        tooltip: '结算面板主按钮。未达标时关闭面板继续本日，达标时通知 GameManager 进入下一天。'
    })
    public mainButton: Button | null = null;

    private _passed = false;
    private _mainButtonHandler: DayResultButtonHandler | null = null;
    private _buttonLocked = false;

    protected onEnable(): void {
        this.mainButton?.node.on(Node.EventType.TOUCH_END, this.onMainButtonTouched, this);
    }

    protected onDisable(): void {
        this.mainButton?.node.off(Node.EventType.TOUCH_END, this.onMainButtonTouched, this);
    }

    public setMainButtonHandler(handler: DayResultButtonHandler | null): void {
        this._mainButtonHandler = handler;
    }

    public showResult(result: DayResultPanelData): void {
        this._passed = result.reachedTarget;
        this._buttonLocked = false;
        const safeScore = normalizeScore(result.score);
        const safeTargetScore = normalizeScore(result.targetScore);

        this.node.active = true;

        if (this.titleLabel) {
            this.titleLabel.string = '本日结算！';
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = `今日分数：${formatScore(safeScore)} / ${formatScore(safeTargetScore)}`;
        }

        if (this.descriptionLabel) {
            this.descriptionLabel.string = result.detailText || this.buildFallbackDetailText(result, safeScore, safeTargetScore);
        }

        if (this.mainButtonLabel) {
            this.mainButtonLabel.string = result.reachedTarget ? '进入商店' : '继续本日';
        }
    }

    public hide(): void {
        this.node.active = false;
    }

    public isShowing(): boolean {
        return this.node.activeInHierarchy;
    }

    private onMainButtonTouched(): void {
        if (this._buttonLocked) {
            return;
        }

        this._buttonLocked = true;
        if (this._mainButtonHandler) {
            this._mainButtonHandler(this._passed);
            return;
        }

        this.hide();
    }

    private buildFallbackDetailText(result: DayResultPanelData, score: number, targetScore: number): string {
        const statusLine = result.reachedTarget ? '本日达标！' : '本日未达标';
        const earnedMoney = normalizeScore(result.earnedMoney ?? 0);
        return [
            '今日没有获得商品',
            '',
            `今日分数：${formatScore(score)} / ${formatScore(targetScore)}`,
            statusLine,
            '',
            '基础收益：',
            result.reachedTarget ? formatRewardLine('营业目标达成', 5) : '暂无基础收益',
            '',
            '经营加成：',
            '暂无触发加成',
            '────────────',
            formatTotalMoneyLine(earnedMoney),
        ].join('\n');
    }
}

function normalizeScore(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function formatScore(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatTotalMoneyLine(amount: number): string {
    const label = '获得资金：';
    const moneyText = `￥${formatScore(amount)}`;
    const totalLength = 24;
    const spaceCount = Math.max(4, totalLength - label.length - moneyText.length);
    return `${label}${' '.repeat(spaceCount)}${moneyText}`;
}

function formatRewardLine(label: string, amount: number): string {
    const safeLabel = (label || '').trim() || '奖励';
    const moneyText = `￥${formatScore(amount)}`;
    const totalLength = 24;
    const dotCount = Math.max(4, totalLength - safeLabel.length - moneyText.length);
    return `${safeLabel} ${'·'.repeat(dotCount)} ${moneyText}`;
}
