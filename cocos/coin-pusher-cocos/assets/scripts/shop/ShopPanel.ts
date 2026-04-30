import {
    _decorator,
    BlockInputEvents,
    Button,
    Color,
    Component,
    director,
    Graphics,
    Label,
    Node,
    UITransform,
    view,
} from 'cc';
import { getDesignSafeInsets } from '../ui/ScreenAdapter';
import { ShopManager } from './ShopManager';
import { DEFAULT_GAME_SCENE_NAME, NormalizedShopBusinessBonusConfig, NormalizedShopOrderConfig, SHOP_RUNTIME_STATE } from './ShopTypes';

const { ccclass, property } = _decorator;

const FALLBACK_WIDTH = 1280;
const FALLBACK_HEIGHT = 720;

const COLOR_BACKGROUND = new Color(255, 235, 244, 255);
const COLOR_HEADER = COLOR_BACKGROUND;
const COLOR_CARD = new Color(255, 255, 255, 255);
const COLOR_BUTTON = new Color(255, 196, 216, 255);
const COLOR_BUTTON_PRESSED = new Color(248, 174, 202, 255);
const COLOR_BUTTON_TEXT = new Color(91, 45, 65, 255);
const COLOR_TEXT = new Color(82, 42, 59, 255);
const COLOR_HINT = new Color(142, 83, 106, 255);
const COLOR_LINE = new Color(255, 207, 223, 255);

type ShopPanelCloseHandler = () => void;

interface ShopOrderRowBinding {
    orderId: string;
    rowNode: Node;
    titleLabel: Label;
    descriptionLabel: Label;
    priceLabel: Label;
    buyButton: Button;
    buyButtonNode: Node;
    buyButtonLabel: Label;
    buttonWidth: number;
    buttonHeight: number;
}

interface ShopBusinessBonusRowBinding {
    bonusId: string;
    rowNode: Node;
    titleLabel: Label;
    descriptionLabel: Label;
    priceLabel: Label;
    buyButton: Button;
    buyButtonNode: Node;
    buyButtonLabel: Label;
    buttonWidth: number;
    buttonHeight: number;
}

@ccclass('ShopPanel')
export class ShopPanel extends Component {
    @property({
        type: ShopManager,
        displayName: '商店管理器',
        tooltip: '负责读取商店配置、资金和购买规则。商店界面只负责展示和按钮点击。',
    })
    public shopManager: ShopManager | null = null;

    @property({
        type: Button,
        displayName: '打开商店按钮',
        tooltip: '兼容旧版内嵌商店按钮。当前第一版商店改为每日结算后进入独立场景，这里通常留空。',
    })
    public openButton: Button | null = null;

    @property({
        type: Label,
        displayName: '打开按钮文字',
        tooltip: '兼容旧版内嵌商店按钮文字。独立商店场景不需要绑定。',
    })
    public openButtonLabel: Label | null = null;

    @property({
        displayName: '启动时显示',
        tooltip: '独立商店场景应开启。若未来重新做内嵌弹窗，可关闭并由外部按钮调用 open。',
    })
    public openOnLoad = true;

    private _panelRoot: Node | null = null;
    private _moneyLabel: Label | null = null;
    private _messageLabel: Label | null = null;
    private _currentOrdersLabel: Label | null = null;
    private _ownedBusinessBonusesLabel: Label | null = null;
    private readonly _orderRows: ShopOrderRowBinding[] = [];
    private readonly _businessBonusRows: ShopBusinessBonusRowBinding[] = [];
    private _closeHandler: ShopPanelCloseHandler | null = null;

    protected onLoad(): void {
        this.bindReferences();
        this.buildRuntimeUi();
        this.bindOpenButton();

        if (this.openOnLoad) {
            this.open();
        } else {
            this.hide();
        }
    }

    public open(): void {
        if (!this._panelRoot) {
            this.buildRuntimeUi();
        }

        if (this._panelRoot) {
            this._panelRoot.active = true;
        }

        this.showMessage('');
        this.refresh();
    }

    public close(): void {
        this.hide();

        if (this._closeHandler) {
            this._closeHandler();
            return;
        }

        director.loadScene(SHOP_RUNTIME_STATE.returnSceneName || DEFAULT_GAME_SCENE_NAME);
    }

    public hide(): void {
        if (this._panelRoot) {
            this._panelRoot.active = false;
        }
    }

    public setCloseHandler(handler: ShopPanelCloseHandler | null): void {
        this._closeHandler = handler;
    }

    public refresh(): void {
        const manager = this.shopManager;
        if (!manager) {
            this.showMessage('商店管理器未绑定');
            return;
        }

        if (this._moneyLabel) {
            this._moneyLabel.string = `当前资金：￥${manager.getCurrentMoney()}`;
        }

        this.refreshOrderRows(manager.getShopOrders());
        this.refreshBusinessBonusRows(manager.getShopBusinessBonuses());
        this.refreshPurchasedOrders();
        this.refreshOwnedBusinessBonuses();
    }

    private onBuyButtonClicked(orderId: string): void {
        const result = this.shopManager?.buyOrder(orderId) ?? {
            success: false,
            message: '商店管理器未绑定',
            order: null,
        };

        this.showMessage(result.message);
        this.refresh();
    }

    private onBuyBusinessBonusButtonClicked(bonusId: string): void {
        const result = this.shopManager?.buyBusinessBonus(bonusId) ?? {
            success: false,
            message: '商店管理器未绑定',
            order: null,
            businessBonus: null,
        };

        this.showMessage(result.message);
        this.refresh();
    }

    private buildRuntimeUi(): void {
        if (this._panelRoot) {
            return;
        }

        const size = this.getRootSize();
        const safeInsets = getDesignSafeInsets();
        const horizontalPadding = Math.max(96, safeInsets.left + safeInsets.right + 48);
        const verticalPadding = Math.max(72, safeInsets.top + safeInsets.bottom + 40);
        const contentWidth = Math.max(560, Math.min(size.width - horizontalPadding, 1120));
        const contentHeight = Math.max(520, Math.min(size.height - verticalPadding, 660));
        const cardWidth = Math.max(480, Math.min(contentWidth - 120, 920));
        const columnGap = 28;
        const columnWidth = (cardWidth - columnGap) * 0.5;
        const leftColumnX = -columnWidth * 0.5 - columnGap * 0.5;
        const rightColumnX = columnWidth * 0.5 + columnGap * 0.5;
        const leftX = -cardWidth * 0.5;
        const headerY = contentHeight * 0.5 - 56;
        const categoryTitleY = headerY - 58;
        const firstRowY = categoryTitleY - 58;
        const rowGap = 74;
        const summaryY = -contentHeight * 0.5 + 76;
        const summaryWidth = columnWidth;

        this._panelRoot = this.createNode('ShopPanelRoot', this.node, 0, 0, size.width, size.height);
        this._panelRoot.addComponent(BlockInputEvents);
        this.drawRect(this._panelRoot, size.width, size.height, COLOR_BACKGROUND, 0);

        const header = this.createNode('ShopHeader', this._panelRoot, 0, size.height * 0.5 - 48, size.width, 96);
        this.drawRect(header, size.width, 96, COLOR_HEADER, 0);
        this.createLabel('ShopTitleLabel', header, '商店', 0, 4, 260, 48, 34, COLOR_TEXT);

        const content = this.createNode('ShopContent', this._panelRoot, 0, -12, contentWidth, contentHeight);

        this._moneyLabel = this.createLabel('MoneyLabel', content, '当前资金：￥0', leftX + 140, headerY, 280, 34, 22, COLOR_TEXT, 0);
        this._messageLabel = this.createLabel('ShopMessageLabel', content, '', 0, headerY, 420, 34, 20, COLOR_HINT, 1);

        const closeButton = this.createButton('ShopCloseButton', content, '返回明日', cardWidth * 0.5 - 72, headerY + 2, 144, 48);
        closeButton.on(Node.EventType.TOUCH_END, this.close, this);

        this.createLabel('ShopOrdersTitleLabel', content, '进货单', leftColumnX - columnWidth * 0.5 + 80, categoryTitleY, 160, 30, 22, COLOR_HINT, 0);
        const orderColumn = this.createNode('ShopOrderColumn', content, leftColumnX, 0, columnWidth, contentHeight - 120);
        this.createShopOrderRows(orderColumn, columnWidth, firstRowY, rowGap);

        this.createLabel('ShopBusinessBonusTitleLabel', content, '经营加成', rightColumnX - columnWidth * 0.5 + 96, categoryTitleY, 180, 30, 22, COLOR_HINT, 0);
        const businessBonusColumn = this.createNode('BusinessBonusColumn', content, rightColumnX, 0, columnWidth, contentHeight - 120);
        this.createBusinessBonusRows(businessBonusColumn, columnWidth, firstRowY, rowGap);

        this.createLabel('CurrentOrdersTitleLabel', content, '下一日进货单', leftColumnX, summaryY + 62, summaryWidth, 26, 18, COLOR_HINT, 0);
        const summaryPanel = this.createNode('CurrentOrdersPanel', content, leftColumnX, summaryY, summaryWidth, 96);
        this._currentOrdersLabel = this.createLabel(
            'OrderListRoot',
            summaryPanel,
            '暂无\n购买进货单后显示累计权重',
            0,
            0,
            summaryWidth - 36,
            76,
            16,
            COLOR_TEXT,
            0,
        );

        this.createLabel('OwnedBusinessBonusTitleLabel', content, '已拥有经营加成', rightColumnX, summaryY + 62, summaryWidth, 26, 18, COLOR_HINT, 0);
        const ownedBonusPanel = this.createNode('OwnedBusinessBonusPanel', content, rightColumnX, summaryY, summaryWidth, 96);
        this._ownedBusinessBonusesLabel = this.createLabel(
            'OwnedBusinessBonusListRoot',
            ownedBonusPanel,
            '暂无',
            0,
            0,
            summaryWidth - 36,
            76,
            16,
            COLOR_TEXT,
            0,
        );
    }

    private createShopOrderRows(parent: Node, rowWidth: number, firstRowY: number, rowGap: number): void {
        const orders = this.shopManager?.getShopOrders() ?? [];

        orders.forEach((order, index) => {
            const y = firstRowY - index * rowGap;
            const rowHeight = 64;
            const buttonWidth = rowWidth < 600 ? 104 : 136;
            const buttonHeight = 40;
            const rowNode = this.createNode(`ShopOrderRoot_${order.id}`, parent, 0, y, rowWidth, rowHeight);
            this.drawRect(rowNode, rowWidth, rowHeight, COLOR_CARD, 8, COLOR_LINE, 1);

            const titleLabel = this.createLabel(`${order.id}_TitleLabel`, rowNode, order.displayName, -rowWidth * 0.5 + 86, 12, 160, 24, 20, COLOR_TEXT, 0);
            const descriptionLabel = this.createLabel(`${order.id}_DescriptionLabel`, rowNode, order.description, -rowWidth * 0.5 + 142, -17, rowWidth - 240, 24, 13, COLOR_HINT, 0);
            const priceLabel = this.createLabel(`${order.id}_PriceLabel`, rowNode, `￥${order.price}`, rowWidth * 0.5 - buttonWidth - 42, 2, 70, 30, 21, COLOR_TEXT, 1);
            const buyButtonNode = this.createButton(`${order.id}_BuyButton`, rowNode, '购买', rowWidth * 0.5 - buttonWidth * 0.5 - 16, 0, buttonWidth, buttonHeight);
            const buyButton = buyButtonNode.getComponent(Button) ?? buyButtonNode.addComponent(Button);
            const buyButtonLabel = buyButtonNode.children[0]?.getComponent(Label) ?? titleLabel;
            buyButtonNode.on(Node.EventType.TOUCH_END, () => this.onBuyButtonClicked(order.id), this);

            this._orderRows.push({
                orderId: order.id,
                rowNode,
                titleLabel,
                descriptionLabel,
                priceLabel,
                buyButton,
                buyButtonNode,
                buyButtonLabel,
                buttonWidth,
                buttonHeight,
            });
        });
    }

    private createBusinessBonusRows(parent: Node, rowWidth: number, firstRowY: number, rowGap: number): void {
        const bonuses = this.shopManager?.getShopBusinessBonuses() ?? [];

        bonuses.forEach((bonus, index) => {
            const y = firstRowY - index * rowGap;
            const rowHeight = 68;
            const buttonWidth = rowWidth < 600 ? 104 : 136;
            const buttonHeight = 40;
            const rowNode = this.createNode(`BusinessBonusRoot_${bonus.id}`, parent, 0, y, rowWidth, rowHeight);
            this.drawRect(rowNode, rowWidth, rowHeight, COLOR_CARD, 8, COLOR_LINE, 1);

            const titleLabel = this.createLabel(`${bonus.id}_TitleLabel`, rowNode, bonus.displayName, -rowWidth * 0.5 + 84, 14, 154, 24, 20, COLOR_TEXT, 0);
            const descriptionLabel = this.createLabel(`${bonus.id}_DescriptionLabel`, rowNode, bonus.description, -rowWidth * 0.5 + 142, -15, rowWidth - 240, 34, 13, COLOR_HINT, 0);
            const priceLabel = this.createLabel(`${bonus.id}_PriceLabel`, rowNode, `￥${bonus.price}`, rowWidth * 0.5 - buttonWidth - 42, 2, 70, 30, 21, COLOR_TEXT, 1);
            const buyButtonNode = this.createButton(`${bonus.id}_BuyButton`, rowNode, '购买', rowWidth * 0.5 - buttonWidth * 0.5 - 16, 0, buttonWidth, buttonHeight);
            const buyButton = buyButtonNode.getComponent(Button) ?? buyButtonNode.addComponent(Button);
            const buyButtonLabel = buyButtonNode.children[0]?.getComponent(Label) ?? titleLabel;
            buyButtonNode.on(Node.EventType.TOUCH_END, () => this.onBuyBusinessBonusButtonClicked(bonus.id), this);

            this._businessBonusRows.push({
                bonusId: bonus.id,
                rowNode,
                titleLabel,
                descriptionLabel,
                priceLabel,
                buyButton,
                buyButtonNode,
                buyButtonLabel,
                buttonWidth,
                buttonHeight,
            });
        });
    }

    private refreshOrderRows(orders: NormalizedShopOrderConfig[]): void {
        this._orderRows.forEach((row, index) => {
            const order = orders[index] ?? null;
            row.rowNode.active = !!order;

            if (!order) {
                return;
            }

            row.orderId = order.id;
            row.titleLabel.string = order.displayName;
            row.descriptionLabel.string = order.description;
            row.priceLabel.string = `￥${order.price}`;
            const purchased = this.shopManager?.isStockOrderPurchased(order.id) ?? false;
            row.buyButton.interactable = !purchased;
            row.buyButtonLabel.string = purchased ? '已购买' : '购买';
            row.buyButtonNode.setScale(1, 1, 1);
            this.redrawButton(row.buyButtonNode, row.buttonWidth, row.buttonHeight, purchased ? COLOR_LINE : COLOR_BUTTON);
        });
    }

    private refreshBusinessBonusRows(bonuses: NormalizedShopBusinessBonusConfig[]): void {
        this._businessBonusRows.forEach((row, index) => {
            const bonus = bonuses[index] ?? null;
            row.rowNode.active = !!bonus;

            if (!bonus) {
                return;
            }

            const owned = this.shopManager?.hasOwnedBusinessBonus(bonus.id) ?? false;
            row.bonusId = bonus.id;
            row.titleLabel.string = bonus.displayName;
            row.descriptionLabel.string = bonus.description;
            row.priceLabel.string = `￥${bonus.price}`;
            row.buyButton.interactable = !owned;
            row.buyButtonLabel.string = owned ? '已拥有' : '购买';
            row.buyButtonNode.setScale(1, 1, 1);
            this.redrawButton(row.buyButtonNode, row.buttonWidth, row.buttonHeight, owned ? COLOR_LINE : COLOR_BUTTON);
        });
    }

    private refreshPurchasedOrders(): void {
        const purchasedOrders = this.shopManager?.getOrderDeckSnapshots() ?? [];
        if (!this._currentOrdersLabel) {
            return;
        }

        const activeOrders = purchasedOrders.filter((order) => order.weight > 0);
        if (activeOrders.length <= 0) {
            this._currentOrdersLabel.string = '暂无\n购买进货单后显示累计权重';
            return;
        }

        const lines = activeOrders.map((order) => `- ${order.title.replace(/(?:进货单|订购单|订单)$/, '')}：权重 +${order.weight}`);
        this._currentOrdersLabel.string = lines.join('\n');
    }

    private refreshOwnedBusinessBonuses(): void {
        if (!this._ownedBusinessBonusesLabel) {
            return;
        }

        const ownedBonuses = this.shopManager?.getOwnedBusinessBonuses() ?? [];
        if (ownedBonuses.length <= 0) {
            this._ownedBusinessBonusesLabel.string = '暂无';
            return;
        }

        this._ownedBusinessBonusesLabel.string = ownedBonuses.map((bonus) => `- ${bonus.displayName}`).join('\n');
    }

    private createButton(name: string, parent: Node, text: string, x: number, y: number, width: number, height: number): Node {
        const buttonNode = this.createNode(name, parent, x, y, width, height);
        this.drawRect(buttonNode, width, height, COLOR_BUTTON, 8, new Color(248, 177, 202, 255), 1);
        const button = buttonNode.addComponent(Button);
        button.interactable = true;

        this.createLabel(`${name}Label`, buttonNode, text, 0, 0, width - 10, height - 4, 20, COLOR_BUTTON_TEXT);

        buttonNode.on(Node.EventType.TOUCH_START, () => this.setButtonPressed(buttonNode, width, height, true), this);
        buttonNode.on(Node.EventType.TOUCH_CANCEL, () => this.setButtonPressed(buttonNode, width, height, false), this);
        buttonNode.on(Node.EventType.TOUCH_END, () => this.setButtonPressed(buttonNode, width, height, false), this);
        return buttonNode;
    }

    private setButtonPressed(buttonNode: Node, width: number, height: number, pressed: boolean): void {
        const button = buttonNode.getComponent(Button);
        if (button && !button.interactable) {
            return;
        }

        buttonNode.setScale(pressed ? 0.98 : 1, pressed ? 0.98 : 1, 1);
        const graphics = buttonNode.getComponent(Graphics);
        if (!graphics) {
            return;
        }

        graphics.clear();
        this.redrawButton(buttonNode, width, height, pressed ? COLOR_BUTTON_PRESSED : COLOR_BUTTON);
    }

    private redrawButton(buttonNode: Node, width: number, height: number, fillColor: Color): void {
        const graphics = buttonNode.getComponent(Graphics);
        if (!graphics) {
            return;
        }

        graphics.clear();
        graphics.fillColor = fillColor;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 8);
        graphics.fill();
        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(248, 177, 202, 255);
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 8);
        graphics.stroke();
    }

    private createLabel(
        name: string,
        parent: Node,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: Color,
        horizontalAlign = 1,
    ): Label {
        const labelNode = this.createNode(name, parent, x, y, width, height);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.35);
        label.color = color;
        label.horizontalAlign = horizontalAlign;
        label.verticalAlign = 1;
        label.overflow = 1;
        label.enableWrapText = true;
        return label;
    }

    private createNode(name: string, parent: Node, x: number, y: number, width: number, height: number): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.setPosition(x, y, 0);

        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        transform.setAnchorPoint(0.5, 0.5);
        return node;
    }

    private drawRect(node: Node, width: number, height: number, fillColor: Color, radius: number, strokeColor: Color | null = null, lineWidth = 0): void {
        const graphics = node.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = fillColor;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
        graphics.fill();

        if (strokeColor && lineWidth > 0) {
            graphics.lineWidth = lineWidth;
            graphics.strokeColor = strokeColor;
            graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
            graphics.stroke();
        }
    }

    private showMessage(message: string): void {
        if (this._messageLabel) {
            this._messageLabel.string = message;
        }
    }

    private bindReferences(): void {
        this.shopManager = this.shopManager ?? this.getComponent(ShopManager);
    }

    private bindOpenButton(): void {
        if (!this.openButton) {
            return;
        }

        this.openButton.node.on(Node.EventType.TOUCH_END, this.open, this);
        if (this.openButtonLabel) {
            this.openButtonLabel.string = '商店';
        }
    }

    private getRootSize(): { width: number; height: number } {
        const visibleSize = view.getVisibleSize();
        const transform = this.node.getComponent(UITransform) ?? this.node.parent?.getComponent(UITransform) ?? null;
        const size = transform?.contentSize;
        const visibleWidth = isPositiveFinite(visibleSize.width) ? visibleSize.width : 0;
        const visibleHeight = isPositiveFinite(visibleSize.height) ? visibleSize.height : 0;
        const nodeWidth = isPositiveFinite(size?.width ?? 0) ? size!.width : FALLBACK_WIDTH;
        const nodeHeight = isPositiveFinite(size?.height ?? 0) ? size!.height : FALLBACK_HEIGHT;
        const width = Math.max(640, visibleWidth, nodeWidth);
        const height = Math.max(480, visibleHeight, nodeHeight);
        return { width, height };
    }
}

function isPositiveFinite(value: number): boolean {
    return Number.isFinite(value) && value > 0;
}
