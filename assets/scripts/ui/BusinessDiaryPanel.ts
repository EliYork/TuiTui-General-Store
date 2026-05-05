import { _decorator, Button, Color, Component, Graphics, Label, Node, UITransform, log, sys, warn } from 'cc';
import { BusinessRunLogger } from '../business/BusinessRunLogger';

const { ccclass } = _decorator;

const PANEL_WIDTH = 860;
const PANEL_HEIGHT = 590;
const TEXT_WIDTH = 780;
const TEXT_HEIGHT = 390;

const COLOR_BUTTON = new Color(255, 198, 216, 255);
const COLOR_BUTTON_PRESSED = new Color(250, 184, 206, 255);
const COLOR_PANEL = new Color(255, 246, 250, 248);
const COLOR_TEXT = new Color(82, 42, 59, 255);
const COLOR_LINE = new Color(207, 144, 166, 255);
const COLOR_TEXT_AREA = new Color(255, 255, 255, 245);
const COLOR_OVERLAY = new Color(68, 45, 56, 140);

interface BrowserClipboardHost {
    navigator?: {
        clipboard?: {
            writeText?: (value: string) => Promise<void>;
        };
    };
    document?: {
        body?: {
            appendChild: (node: unknown) => unknown;
            removeChild: (node: unknown) => unknown;
        };
        createElement?: (tagName: string) => {
            value: string;
            style: {
                position: string;
                opacity: string;
                left: string;
                top: string;
            };
            setAttribute: (name: string, value: string) => void;
            select: () => void;
        };
        execCommand?: (command: string) => boolean;
    };
}

@ccclass('BusinessDiaryPanel')
export class BusinessDiaryPanel extends Component {
    private _openButton: Node | null = null;
    private _panelRoot: Node | null = null;
    private _textLabel: Label | null = null;
    private _hintLabel: Label | null = null;

    protected onLoad(): void {
        this.buildUi();
        this.closePanel();
    }

    protected onDestroy(): void {
        this.safeOff(this._openButton, this.openPanel);
        this._openButton = null;
        this._panelRoot = null;
        this._textLabel = null;
        this._hintLabel = null;
    }

    public openPanel(): void {
        this.refreshDiaryText();
        if (this._panelRoot) {
            this._panelRoot.active = true;
        }
    }

    public closePanel(): void {
        if (this._panelRoot) {
            this._panelRoot.active = false;
        }
    }

    private buildUi(): void {
        if (this._openButton || this._panelRoot) {
            return;
        }

        const layer = this.node.layer;
        this._openButton = this.createButton('经营日记按钮', this.node, '经营日记', 0, -190, 320, 64);
        this._openButton.layer = layer;
        this._openButton.on(Node.EventType.TOUCH_END, this.openPanel, this);

        this._panelRoot = new Node('经营日记面板');
        this._panelRoot.layer = layer;
        this.node.addChild(this._panelRoot);
        this._panelRoot.setPosition(0, 0, 20);
        this.addTransform(this._panelRoot, 1280, 720);
        this.drawRect(this._panelRoot, 1280, 720, COLOR_OVERLAY, 0);

        const panelBg = new Node('面板背景');
        panelBg.layer = layer;
        this._panelRoot.addChild(panelBg);
        panelBg.setPosition(0, 0, 1);
        this.addTransform(panelBg, PANEL_WIDTH, PANEL_HEIGHT);
        this.drawRect(panelBg, PANEL_WIDTH, PANEL_HEIGHT, COLOR_PANEL, 10);
        this.drawRect(panelBg, PANEL_WIDTH - 4, PANEL_HEIGHT - 4, new Color(0, 0, 0, 0), 8, COLOR_LINE);

        this.createLabel('标题', panelBg, '经营日记', 0, PANEL_HEIGHT * 0.5 - 52, 36, PANEL_WIDTH - 96, 52, 1);

        const textArea = new Node('日记文本区域');
        textArea.layer = layer;
        panelBg.addChild(textArea);
        textArea.setPosition(0, 24, 1);
        this.addTransform(textArea, TEXT_WIDTH, TEXT_HEIGHT);
        this.drawRect(textArea, TEXT_WIDTH, TEXT_HEIGHT, COLOR_TEXT_AREA, 6, COLOR_LINE);

        const textNode = new Node('日记文本');
        textNode.layer = layer;
        textArea.addChild(textNode);
        textNode.setPosition(0, 0, 2);
        this.addTransform(textNode, TEXT_WIDTH - 36, TEXT_HEIGHT - 32);
        this._textLabel = textNode.addComponent(Label);
        this._textLabel.fontSize = 20;
        this._textLabel.lineHeight = 28;
        this._textLabel.color = COLOR_TEXT;
        this._textLabel.horizontalAlign = 0;
        this._textLabel.verticalAlign = 0;
        this._textLabel.enableWrapText = true;
        this._textLabel.overflow = 1;

        this._hintLabel = this.createLabel('提示文本', panelBg, '', 0, -PANEL_HEIGHT * 0.5 + 92, 20, PANEL_WIDTH - 96, 32, 1);

        const copyButton = this.createButton('复制按钮', panelBg, '复制', -160, -PANEL_HEIGHT * 0.5 + 42, 132, 46);
        copyButton.on(Node.EventType.TOUCH_END, this.copyDiary, this);

        const clearButton = this.createButton('清空按钮', panelBg, '清空', 0, -PANEL_HEIGHT * 0.5 + 42, 132, 46);
        clearButton.on(Node.EventType.TOUCH_END, this.clearDiary, this);

        const closeButton = this.createButton('关闭按钮', panelBg, '关闭', 160, -PANEL_HEIGHT * 0.5 + 42, 132, 46);
        closeButton.on(Node.EventType.TOUCH_END, this.closePanel, this);
    }

    private refreshDiaryText(): void {
        if (this._textLabel) {
            this._textLabel.string = BusinessRunLogger.getCurrentLogText();
        }
        this.setHint('');
    }

    private copyDiary(): void {
        const text = BusinessRunLogger.getCurrentLogText();
        log(`[BusinessDiaryPanel] 经营日记全文：\n${text}`);

        void this.copyText(text).then((copied) => {
            this.setHint(copied ? '已复制经营日记。' : '复制失败，请手动选中文本复制。');
        });
    }

    private async copyText(text: string): Promise<boolean> {
        const browser = globalThis as unknown as BrowserClipboardHost;

        try {
            if (browser.navigator?.clipboard?.writeText) {
                await browser.navigator.clipboard.writeText(text);
                return true;
            }

            const clipboard = sys as unknown as { copyTextToClipboard?: (value: string) => boolean | void };
            if (clipboard.copyTextToClipboard) {
                const result = clipboard.copyTextToClipboard(text);
                return result !== false;
            }
        } catch (error) {
            warn('[BusinessDiaryPanel] 复制经营日记失败。', error);
        }

        return this.copyTextWithTextareaFallback(browser, text);
    }

    private copyTextWithTextareaFallback(browser: BrowserClipboardHost, text: string): boolean {
        const documentRef = browser.document;
        if (!documentRef?.body || !documentRef.createElement || !documentRef.execCommand) {
            return false;
        }

        const textArea = documentRef.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', 'readonly');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';

        try {
            documentRef.body.appendChild(textArea);
            textArea.select();
            return documentRef.execCommand('copy');
        } catch (error) {
            warn('[BusinessDiaryPanel] 备用复制经营日记失败。', error);
            return false;
        } finally {
            try {
                documentRef.body.removeChild(textArea);
            } catch {
                // The browser may remove the temporary node during page teardown.
            }
        }
    }

    private clearDiary(): void {
        BusinessRunLogger.clearCurrentLog();
        this.refreshDiaryText();
        this.setHint('经营日记已清空。');
    }

    private setHint(message: string): void {
        if (this._hintLabel) {
            this._hintLabel.string = message;
        }
    }

    private safeOff(buttonNode: Node | null, handler: () => void): void {
        if (!buttonNode) {
            return;
        }

        try {
            buttonNode.off(Node.EventType.TOUCH_END, handler, this);
        } catch {
            // Scene switching can tear down node event storage before this component finishes destruction.
        }
    }

    private createButton(name: string, parent: Node, text: string, x: number, y: number, width: number, height: number): Node {
        const buttonNode = new Node(name);
        buttonNode.layer = parent.layer;
        parent.addChild(buttonNode);
        buttonNode.setPosition(x, y, 1);
        this.addTransform(buttonNode, width, height);
        this.drawRect(buttonNode, width, height, COLOR_BUTTON, 8, COLOR_LINE);

        const button = buttonNode.addComponent(Button);
        button.transition = 2;
        button.zoomScale = 1.04;

        buttonNode.on(Node.EventType.TOUCH_START, () => this.redrawButton(buttonNode, width, height, COLOR_BUTTON_PRESSED), this);
        buttonNode.on(Node.EventType.TOUCH_CANCEL, () => this.redrawButton(buttonNode, width, height, COLOR_BUTTON), this);
        buttonNode.on(Node.EventType.TOUCH_END, () => this.redrawButton(buttonNode, width, height, COLOR_BUTTON), this);

        this.createLabel(`${name}文本`, buttonNode, text, 0, 0, 22, width - 24, height - 8, 1);
        return buttonNode;
    }

    private redrawButton(buttonNode: Node, width: number, height: number, color: Color): void {
        const graphics = buttonNode.getComponent(Graphics);
        if (!graphics) {
            return;
        }

        graphics.clear();
        graphics.fillColor = color;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 8);
        graphics.fill();
        graphics.strokeColor = COLOR_LINE;
        graphics.lineWidth = 2;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 8);
        graphics.stroke();
    }

    private createLabel(
        name: string,
        parent: Node,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        width: number,
        height: number,
        horizontalAlign: number,
    ): Label {
        const labelNode = new Node(name);
        labelNode.layer = parent.layer;
        parent.addChild(labelNode);
        labelNode.setPosition(x, y, 2);
        this.addTransform(labelNode, width, height);

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.35);
        label.color = COLOR_TEXT;
        label.horizontalAlign = horizontalAlign;
        label.verticalAlign = 1;
        label.enableWrapText = true;
        label.overflow = 1;
        return label;
    }

    private addTransform(node: Node, width: number, height: number): UITransform {
        const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        transform.setAnchorPoint(0.5, 0.5);
        transform.setContentSize(width, height);
        return transform;
    }

    private drawRect(node: Node, width: number, height: number, fillColor: Color, radius: number, strokeColor: Color | null = null): void {
        const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
        graphics.clear();
        if (fillColor.a > 0) {
            graphics.fillColor = fillColor;
            graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
            graphics.fill();
        }

        if (strokeColor) {
            graphics.strokeColor = strokeColor;
            graphics.lineWidth = 2;
            graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
            graphics.stroke();
        }
    }
}
