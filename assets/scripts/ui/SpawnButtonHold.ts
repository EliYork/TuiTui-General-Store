import { _decorator, Button, Component, Label, Node, warn } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('SpawnButtonHold')
export class SpawnButtonHold extends Component {
    @property({
        type: GameManager,
        displayName: '游戏管理器',
        tooltip: '绑定场景中的 GameManager。按钮点击后会调用它切换自动投放状态。',
    })
    public gameManager: GameManager | null = null;

    @property({
        type: Label,
        displayName: '按钮文字',
        tooltip: '显示自动投放开关状态的 Label。为空时会自动在按钮子节点中查找第一个 Label。',
    })
    public stateLabel: Label | null = null;

    @property({
        displayName: '开启文案',
        tooltip: '自动投放开启时显示在按钮上的文字。建议保持中文，方便玩家理解当前状态。',
    })
    public autoSpawnOnText = 'Auto：开';

    @property({
        displayName: '关闭文案',
        tooltip: '自动投放关闭时显示在按钮上的文字。Restart 或资源不足自动停止后会回到这个文案。',
    })
    public autoSpawnOffText = 'Auto：关';

    private _resolvedLabel: Label | null = null;
    private _button: Button | null = null;

    protected onLoad(): void {
        this._button = this.getComponent(Button);
        this._resolvedLabel = this.stateLabel ?? this.findLabelInChildren(this.node);

        if (!this.gameManager) {
            warn('[SpawnButtonHold] gameManager is not assigned.');
        }

        this.refreshLabel();
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.refreshLabel();
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected update(): void {
        this.refreshLabel();
    }

    private onTouchEnd(): void {
        if (this._button && !this._button.interactable) {
            return;
        }

        if (!this.gameManager) {
            warn('[SpawnButtonHold] gameManager is not assigned.');
            return;
        }

        this.gameManager.toggleAutoSpawn();
        this.refreshLabel();
    }

    private refreshLabel(): void {
        const label = this.stateLabel ?? this._resolvedLabel;
        if (!label) {
            return;
        }

        label.string = this.gameManager?.isAutoSpawnEnabled()
            ? this.autoSpawnOnText
            : this.autoSpawnOffText;
    }

    private findLabelInChildren(node: Node): Label | null {
        const label = node.getComponent(Label);
        if (label) {
            return label;
        }

        for (const child of node.children) {
            const childLabel = this.findLabelInChildren(child);
            if (childLabel) {
                return childLabel;
            }
        }

        return null;
    }
}
