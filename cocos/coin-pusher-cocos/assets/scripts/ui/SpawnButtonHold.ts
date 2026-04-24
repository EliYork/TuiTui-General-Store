import { _decorator, Component, Label, Node, warn } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('SpawnButtonHold')
export class SpawnButtonHold extends Component {
    @property(GameManager)
    public gameManager: GameManager | null = null;

    @property(Label)
    public stateLabel: Label | null = null;

    @property({ tooltip: 'Text shown when automatic spawning is enabled.' })
    public autoSpawnOnText = '自动投放：开';

    @property({ tooltip: 'Text shown when automatic spawning is disabled.' })
    public autoSpawnOffText = '自动投放：关';

    private _resolvedLabel: Label | null = null;

    protected onLoad(): void {
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
