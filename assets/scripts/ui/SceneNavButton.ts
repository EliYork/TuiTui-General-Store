import { _decorator, Button, Color, Component, director, find, Graphics, Label, log, Node, UITransform, warn } from 'cc';
import { setPendingModeId } from '../config/ModeConfigTable';

const { ccclass, property } = _decorator;

const DEBUG_OVERLAY_NAME = 'SceneLoadDebugOverlay';
const DEBUG_OVERLAY_WIDTH = 460;
const DEBUG_OVERLAY_HEIGHT = 76;
const DEBUG_OVERLAY_COLOR = new Color(255, 56, 128, 245);
const DEBUG_TEXT_COLOR = new Color(255, 255, 255, 255);

@ccclass('SceneNavButton')
export class SceneNavButton extends Component {
    @property({
        displayName: '目标场景',
        tooltip: '点击按钮后加载的场景名，不带 .scene 后缀。比如 MainMenu 或 Prototype01。填错会导致按钮点击后无法切换场景。',
    })
    public targetSceneName = '';

    @property({
        displayName: '目标模式 ID',
        tooltip: '可选。进入共用玩法场景前临时切换模式，例如 business 或 collection。为空时使用目标场景自己的默认模式。',
    })
    public targetModeId = '';

    private _button: Button | null = null;
    private _debugOverlay: Node | null = null;
    private _debugLabel: Label | null = null;
    private _isLoading = false;

    protected onLoad(): void {
        this._button = this.getComponent(Button);

        if (!this._button) {
            warn('[SceneNavButton] Button component is required on the same node.');
        }
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onDisable(): void {
        try {
            this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        } catch {
            // Scene transitions may already be tearing down node event data.
        }
        this._isLoading = false;
    }

    private onTouchEnd(): void {
        if (this._isLoading || (this._button && !this._button.interactable)) {
            return;
        }

        const sceneName = this.targetSceneName.trim();
        if (!sceneName) {
            warn('[SceneNavButton] targetSceneName is empty.');
            return;
        }

        this._isLoading = true;
        const modeId = this.targetModeId.trim();
        if (modeId) {
            setPendingModeId(modeId);
        }

        this.setDebugMessage(`Loading ${sceneName}...`);
        log(`[SceneNavButton] load scene: ${sceneName}${modeId ? ` mode=${modeId}` : ''}`);

        director.loadScene(sceneName, (loadError: Error | null) => {
            if (!loadError) {
                log(`[SceneNavButton] scene loaded: ${sceneName}`);
                return;
            }

            this.setDebugMessage(`Load failed: ${sceneName}`);
            this._isLoading = false;
            warn(`[SceneNavButton] Failed to load scene: ${sceneName}`, loadError);
        });
    }

    private setDebugMessage(message: string): void {
        const label = this.getDebugLabel();
        if (label) {
            label.string = message;
        }
    }

    private getDebugLabel(): Label | null {
        if (this._debugLabel && this._debugLabel.isValid) {
            return this._debugLabel;
        }

        const parent = find('Canvas') ?? this.node.parent;
        if (!parent) {
            return null;
        }

        let overlay = parent.getChildByName(DEBUG_OVERLAY_NAME);
        if (!overlay) {
            overlay = new Node(DEBUG_OVERLAY_NAME);
            overlay.layer = parent.layer;
            parent.addChild(overlay);
            overlay.setPosition(-390, 282, 1000);

            const transform = overlay.addComponent(UITransform);
            transform.setAnchorPoint(0.5, 0.5);
            transform.setContentSize(DEBUG_OVERLAY_WIDTH, DEBUG_OVERLAY_HEIGHT);

            const graphics = overlay.addComponent(Graphics);
            graphics.fillColor = DEBUG_OVERLAY_COLOR;
            graphics.roundRect(-DEBUG_OVERLAY_WIDTH * 0.5, -DEBUG_OVERLAY_HEIGHT * 0.5, DEBUG_OVERLAY_WIDTH, DEBUG_OVERLAY_HEIGHT, 8);
            graphics.fill();

            const labelNode = new Node('SceneLoadDebugLabel');
            labelNode.layer = parent.layer;
            overlay.addChild(labelNode);
            labelNode.setPosition(0, 0, 0);

            const labelTransform = labelNode.addComponent(UITransform);
            labelTransform.setAnchorPoint(0.5, 0.5);
            labelTransform.setContentSize(DEBUG_OVERLAY_WIDTH - 24, DEBUG_OVERLAY_HEIGHT - 12);

            const label = labelNode.addComponent(Label);
            label.fontSize = 22;
            label.lineHeight = 30;
            label.color = DEBUG_TEXT_COLOR;
            label.horizontalAlign = 1;
            label.verticalAlign = 1;
            label.overflow = 1;
            label.enableWrapText = true;
            this._debugLabel = label;
        } else {
            this._debugLabel = overlay.getChildByName('SceneLoadDebugLabel')?.getComponent(Label) ?? null;
        }

        this._debugOverlay = overlay;
        this._debugOverlay.setSiblingIndex(parent.children.length - 1);
        return this._debugLabel;
    }
}
