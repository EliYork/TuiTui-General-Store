import { _decorator, Button, Color, Component, Graphics, Label, Node, UITransform, log, sys, warn } from 'cc';
import { BusinessDiaryRunRecord, BusinessRunLogger } from '../business/BusinessRunLogger';

const { ccclass } = _decorator;

const PANEL_WIDTH = 900;
const PANEL_HEIGHT = 610;
const CONTENT_WIDTH = 810;
const CONTENT_HEIGHT = 410;
const LIST_PAGE_SIZE = 5;

const COLOR_BUTTON = new Color(255, 198, 216, 255);
const COLOR_BUTTON_PRESSED = new Color(250, 184, 206, 255);
const COLOR_PANEL = new Color(255, 246, 250, 248);
const COLOR_TEXT = new Color(82, 42, 59, 255);
const COLOR_MUTED_TEXT = new Color(120, 82, 96, 255);
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
    private _listRoot: Node | null = null;
    private _detailRoot: Node | null = null;
    private _listContent: Node | null = null;
    private _detailTextLabel: Label | null = null;
    private _hintLabel: Label | null = null;
    private _selectedRunId = '';
    private _listPage = 0;

    protected onLoad(): void {
        this.buildUi();
        this.closePanel();
    }

    protected onDestroy(): void {
        this.safeOff(this._openButton, this.openPanel);
        this._openButton = null;
        this._panelRoot = null;
        this._listRoot = null;
        this._detailRoot = null;
        this._listContent = null;
        this._detailTextLabel = null;
        this._hintLabel = null;
        this._selectedRunId = '';
    }

    public openPanel(): void {
        if (this._panelRoot) {
            this._panelRoot.active = true;
        }
        this._listPage = 0;
        this.showList();
    }

    public closePanel(): void {
        if (this._panelRoot) {
            this._panelRoot.active = false;
        }
        this.setHint('');
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

        const panelBg = new Node('经营日记背景');
        panelBg.layer = layer;
        this._panelRoot.addChild(panelBg);
        panelBg.setPosition(0, 0, 1);
        this.addTransform(panelBg, PANEL_WIDTH, PANEL_HEIGHT);
        this.drawRect(panelBg, PANEL_WIDTH, PANEL_HEIGHT, COLOR_PANEL, 10);
        this.drawRect(panelBg, PANEL_WIDTH - 4, PANEL_HEIGHT - 4, new Color(0, 0, 0, 0), 8, COLOR_LINE);

        this.createLabel('经营日记标题', panelBg, '经营日记', 0, PANEL_HEIGHT * 0.5 - 52, 36, PANEL_WIDTH - 96, 52, 1);

        this._listRoot = new Node('经营日记列表页');
        this._listRoot.layer = layer;
        panelBg.addChild(this._listRoot);
        this._listRoot.setPosition(0, 0, 2);
        this.addTransform(this._listRoot, PANEL_WIDTH, PANEL_HEIGHT);

        this._listContent = new Node('经营日记列表内容');
        this._listContent.layer = layer;
        this._listRoot.addChild(this._listContent);
        this._listContent.setPosition(0, 28, 1);
        this.addTransform(this._listContent, CONTENT_WIDTH, CONTENT_HEIGHT);
        this.drawRect(this._listContent, CONTENT_WIDTH, CONTENT_HEIGHT, COLOR_TEXT_AREA, 6, COLOR_LINE);

        const clearAllButton = this.createButton('清空全部日记按钮', this._listRoot, '清空全部', -96, -PANEL_HEIGHT * 0.5 + 42, 150, 46);
        clearAllButton.on(Node.EventType.TOUCH_END, this.clearAllLogs, this);
        const closeListButton = this.createButton('关闭日记列表按钮', this._listRoot, '关闭', 96, -PANEL_HEIGHT * 0.5 + 42, 150, 46);
        closeListButton.on(Node.EventType.TOUCH_END, this.closePanel, this);
        const previousPageButton = this.createButton('上一页日记按钮', this._listRoot, '上一页', -96, -PANEL_HEIGHT * 0.5 + 92, 150, 42, 20);
        previousPageButton.on(Node.EventType.TOUCH_END, this.showPreviousListPage, this);
        const nextPageButton = this.createButton('下一页日记按钮', this._listRoot, '下一页', 96, -PANEL_HEIGHT * 0.5 + 92, 150, 42, 20);
        nextPageButton.on(Node.EventType.TOUCH_END, this.showNextListPage, this);

        this._detailRoot = new Node('经营日记详情页');
        this._detailRoot.layer = layer;
        panelBg.addChild(this._detailRoot);
        this._detailRoot.setPosition(0, 0, 2);
        this.addTransform(this._detailRoot, PANEL_WIDTH, PANEL_HEIGHT);

        const textArea = new Node('经营日记详情文本区域');
        textArea.layer = layer;
        this._detailRoot.addChild(textArea);
        textArea.setPosition(0, 28, 1);
        this.addTransform(textArea, CONTENT_WIDTH, CONTENT_HEIGHT);
        this.drawRect(textArea, CONTENT_WIDTH, CONTENT_HEIGHT, COLOR_TEXT_AREA, 6, COLOR_LINE);

        const textNode = new Node('经营日记详情文本');
        textNode.layer = layer;
        textArea.addChild(textNode);
        textNode.setPosition(0, 0, 2);
        this.addTransform(textNode, CONTENT_WIDTH - 36, CONTENT_HEIGHT - 32);
        this._detailTextLabel = textNode.addComponent(Label);
        this._detailTextLabel.fontSize = 19;
        this._detailTextLabel.lineHeight = 26;
        this._detailTextLabel.color = COLOR_TEXT;
        this._detailTextLabel.horizontalAlign = 0;
        this._detailTextLabel.verticalAlign = 0;
        this._detailTextLabel.enableWrapText = true;
        this._detailTextLabel.overflow = 1;

        const copyButton = this.createButton('复制当前日记按钮', this._detailRoot, '复制', -258, -PANEL_HEIGHT * 0.5 + 42, 126, 46);
        copyButton.on(Node.EventType.TOUCH_END, this.copySelectedLog, this);
        const deleteButton = this.createButton('删除当前日记按钮', this._detailRoot, '删除', -86, -PANEL_HEIGHT * 0.5 + 42, 126, 46);
        deleteButton.on(Node.EventType.TOUCH_END, this.deleteSelectedLog, this);
        const backButton = this.createButton('返回日记列表按钮', this._detailRoot, '返回列表', 86, -PANEL_HEIGHT * 0.5 + 42, 126, 46);
        backButton.on(Node.EventType.TOUCH_END, this.showList, this);
        const closeDetailButton = this.createButton('关闭日记详情按钮', this._detailRoot, '关闭', 258, -PANEL_HEIGHT * 0.5 + 42, 126, 46);
        closeDetailButton.on(Node.EventType.TOUCH_END, this.closePanel, this);

        this._hintLabel = this.createLabel('经营日记提示文本', panelBg, '', 0, -PANEL_HEIGHT * 0.5 + 92, 20, PANEL_WIDTH - 96, 32, 1);
    }

    private showList(): void {
        this._selectedRunId = '';
        if (this._listRoot) {
            this._listRoot.active = true;
        }
        if (this._detailRoot) {
            this._detailRoot.active = false;
        }
        this.refreshList();
        this.setHint('');
    }

    private showDetail(runId: string): void {
        this._selectedRunId = runId;
        if (this._listRoot) {
            this._listRoot.active = false;
        }
        if (this._detailRoot) {
            this._detailRoot.active = true;
        }
        if (this._detailTextLabel) {
            this._detailTextLabel.string = BusinessRunLogger.getRunText(runId);
        }
        this.setHint('');
    }

    private refreshList(): void {
        if (!this._listContent) {
            return;
        }

        this._listContent.children.slice().forEach((child) => {
            child.removeFromParent();
            child.destroy();
        });
        const runs = BusinessRunLogger.getRuns();
        if (runs.length === 0) {
            this._listPage = 0;
            const label = this.createLabel(
                '暂无经营日记文本',
                this._listContent,
                '暂无经营日记。开始一局经营模式后会自动记录。',
                0,
                0,
                24,
                CONTENT_WIDTH - 80,
                120,
                1,
            );
            label.color = COLOR_MUTED_TEXT;
            return;
        }

        const maxPage = Math.max(0, Math.ceil(runs.length / LIST_PAGE_SIZE) - 1);
        this._listPage = Math.max(0, Math.min(this._listPage, maxPage));
        const pageRuns = runs.slice(this._listPage * LIST_PAGE_SIZE, (this._listPage + 1) * LIST_PAGE_SIZE);
        const rowHeight = 64;
        const gap = 8;
        const startY = CONTENT_HEIGHT * 0.5 - rowHeight * 0.5 - 18;
        pageRuns.forEach((run, index) => {
            const row = this.createButton(
                `经营日记条目${index + 1}`,
                this._listContent!,
                this.formatRunListText(run),
                0,
                startY - index * (rowHeight + gap),
                CONTENT_WIDTH - 42,
                rowHeight,
                18,
                0,
            );
            row.on(Node.EventType.TOUCH_END, () => this.showDetail(run.runId), this);
        });

        this.createLabel(
            '经营日记分页提示',
            this._listContent,
            `第 ${this._listPage + 1} / ${maxPage + 1} 页，共 ${runs.length} 条`,
            0,
            -CONTENT_HEIGHT * 0.5 + 16,
            16,
            CONTENT_WIDTH - 48,
            28,
            1,
        );
    }

    private showPreviousListPage(): void {
        this._listPage = Math.max(0, this._listPage - 1);
        this.refreshList();
    }

    private showNextListPage(): void {
        const runs = BusinessRunLogger.getRuns();
        const maxPage = Math.max(0, Math.ceil(runs.length / LIST_PAGE_SIZE) - 1);
        this._listPage = Math.min(maxPage, this._listPage + 1);
        this.refreshList();
    }

    private formatRunListText(run: BusinessDiaryRunRecord): string {
        return [
            `${run.startedAt}  |  ${run.gameVersion}  |  ${this.formatStatus(run.status)}  |  第 ${run.lastDay} 天`,
            run.summary || '无摘要',
        ].join('\n');
    }

    private formatStatus(status: string): string {
        switch (status) {
        case 'failed':
            return '失败';
        case 'abandoned':
            return '已中断';
        case 'completed':
            return '已完成';
        case 'in_progress':
        default:
            return '进行中';
        }
    }

    private copySelectedLog(): void {
        if (!this._selectedRunId) {
            this.setHint('请先选择一条日记。');
            return;
        }

        const text = BusinessRunLogger.getRunText(this._selectedRunId);
        log(`[BusinessDiaryPanel] 当前经营日记：\n${text}`);

        void this.copyText(text).then((copied) => {
            this.setHint(copied ? '已复制当前日记。' : '复制失败，请手动选中文本复制。');
        });
    }

    private deleteSelectedLog(): void {
        if (!this._selectedRunId) {
            this.setHint('请先选择一条日记。');
            return;
        }

        BusinessRunLogger.deleteRun(this._selectedRunId);
        this.showList();
        this.setHint('已删除当前日记。');
    }

    private clearAllLogs(): void {
        BusinessRunLogger.clearAllLogs();
        this.refreshList();
        this.setHint('已清空全部经营日记。');
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
            warn('[BusinessDiaryPanel] 浏览器兜底复制经营日记失败。', error);
            return false;
        } finally {
            try {
                documentRef.body.removeChild(textArea);
            } catch {
                // The browser may remove the temporary node during page teardown.
            }
        }
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

    private createButton(
        name: string,
        parent: Node,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize = 22,
        horizontalAlign = 1,
    ): Node {
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

        this.createLabel(`${name}文本`, buttonNode, text, 0, 0, fontSize, width - 24, height - 8, horizontalAlign);
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
