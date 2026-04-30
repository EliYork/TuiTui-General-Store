import { _decorator, Component, Node, sys, warn } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('FeedbackButton')
export class FeedbackButton extends Component {
    @property({
        displayName: '反馈表单链接',
        tooltip: '点击反馈按钮时打开的 WPS 表单链接。为空时只打印提示，不会跳转，也不会报错。',
    })
    public feedbackUrl = '';

    private _lastOpenTimeMs = 0;

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.openFeedback, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this.openFeedback, this);
    }

    public openFeedback(): void {
        const now = Date.now();
        if (now - this._lastOpenTimeMs < 300) {
            return;
        }

        this._lastOpenTimeMs = now;
        const url = this.feedbackUrl.trim();
        if (!url) {
            warn('[FeedbackButton] feedbackUrl 为空，无法打开反馈表单。');
            return;
        }

        sys.openURL(url);
    }
}
