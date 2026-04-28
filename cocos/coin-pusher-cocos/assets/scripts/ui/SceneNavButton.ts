import { _decorator, Button, Component, Node, director, warn } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SceneNavButton')
export class SceneNavButton extends Component {
    @property({
        displayName: '目标场景',
        tooltip: '点击按钮后加载的场景名，不带 .scene 后缀。比如 MainMenu 或 Prototype01。填错会导致按钮点击后无法切换场景。',
    })
    public targetSceneName = '';

    private _button: Button | null = null;
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
        director.loadScene(sceneName, (error: Error | null) => {
            if (!error) {
                return;
            }

            this._isLoading = false;
            warn(`[SceneNavButton] Failed to load scene: ${sceneName}`, error);
        });
    }
}
