import {
    _decorator,
    Component,
    instantiate,
    Node,
    Prefab,
    ScrollView,
    UITransform,
    Vec3,
    warn,
} from 'cc';
import { GameManager } from '../core/GameManager';
import { EncyclopediaItemCard } from './EncyclopediaItemCard';

const { ccclass, property } = _decorator;

const CARD_WIDTH = 720;
const CARD_HEIGHT = 118;
const CARD_SPACING = 12;
const CONTENT_PADDING_TOP = 16;
const CONTENT_PADDING_BOTTOM = 18;

@ccclass('EncyclopediaPanel')
export class EncyclopediaPanel extends Component {
    @property({
        type: GameManager,
        displayName: '游戏管理器',
        tooltip: '图鉴读取物品配置、收集数量、解锁状态、价值、权重和 iconImage 的来源。保持绑定到当前场景的 GameManager。',
    })
    public gameManager: GameManager | null = null;

    @property({
        type: Prefab,
        displayName: '物品卡片 Prefab',
        tooltip: 'ScrollView content 中实例化的图鉴卡片。Prefab 内部节点可在编辑器里调整，运行时只填充数据。',
    })
    public itemCardPrefab: Prefab | null = null;

    @property({
        type: Node,
        displayName: '打开按钮',
        tooltip: '点击后打开图鉴面板。默认绑定 EncyclopediaPanelRoot/EncyclopediaOpenButton。',
    })
    public openButton: Node | null = null;

    @property({
        type: Node,
        displayName: '图鉴面板节点',
        tooltip: '图鉴主体节点。默认 inactive，点击打开按钮后 active=true；关闭后 active=false。',
    })
    public panelNode: Node | null = null;

    @property({
        type: Node,
        displayName: '卡片内容容器',
        tooltip: 'ScrollView/view/content 节点。运行时只会清空并实例化 ItemCard，不会新建面板结构。',
    })
    public contentNode: Node | null = null;

    @property({
        type: Node,
        displayName: '关闭按钮',
        tooltip: '点击后关闭图鉴面板。默认绑定 EncyclopediaPanel/PanelBg/CloseButton。',
    })
    public closeButton: Node | null = null;

    private _scrollView: ScrollView | null = null;

    protected onLoad(): void {
        this.resolveSceneNodes();
        this.bindButtons();
        this.closePanel();
    }

    protected onDestroy(): void {
        this.unbindButtons();
    }

    public openPanel(): void {
        this.resolveSceneNodes();

        if (!this.panelNode) {
            warn('[EncyclopediaPanel] panelNode is not assigned.');
            return;
        }

        if (this.openButton) {
            this.openButton.active = false;
        }

        this.panelNode.active = true;
        this.refreshCards();
    }

    public closePanel(): void {
        if (this.panelNode) {
            this.panelNode.active = false;
        }

        if (this.openButton) {
            this.openButton.active = true;
        }
    }

    public togglePanel(): void {
        if (this.panelNode?.active) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    private resolveSceneNodes(): void {
        this.openButton = this.openButton ?? this.node.getChildByName('EncyclopediaOpenButton');
        this.panelNode = this.panelNode ?? this.node.getChildByName('EncyclopediaPanel');
        this.closeButton = this.closeButton ?? this.findChildRecursive(this.panelNode, 'CloseButton');
        this.contentNode = this.contentNode ?? this.findChildRecursive(this.panelNode, 'content');

        const scrollNode = this.contentNode?.parent?.parent ?? this.findChildRecursive(this.panelNode, 'ScrollView');
        this._scrollView = scrollNode?.getComponent(ScrollView) ?? null;

        if (this._scrollView && this.contentNode) {
            this._scrollView.content = this.contentNode;
        }
    }

    private bindButtons(): void {
        if (!this.openButton) {
            warn('[EncyclopediaPanel] openButton is not assigned.');
        } else {
            this.openButton.off(Node.EventType.TOUCH_END, this.togglePanel, this);
            this.openButton.on(Node.EventType.TOUCH_END, this.togglePanel, this);
        }

        if (!this.closeButton) {
            warn('[EncyclopediaPanel] closeButton is not assigned.');
        } else {
            this.closeButton.off(Node.EventType.TOUCH_END, this.closePanel, this);
            this.closeButton.on(Node.EventType.TOUCH_END, this.closePanel, this);
        }
    }

    private unbindButtons(): void {
        this.openButton?.off(Node.EventType.TOUCH_END, this.togglePanel, this);
        this.closeButton?.off(Node.EventType.TOUCH_END, this.closePanel, this);
    }

    private refreshCards(): void {
        if (!this.gameManager) {
            warn('[EncyclopediaPanel] gameManager is not assigned.');
            return;
        }

        if (!this.itemCardPrefab) {
            warn('[EncyclopediaPanel] itemCardPrefab is not assigned.');
            return;
        }

        if (!this.contentNode) {
            warn('[EncyclopediaPanel] contentNode is not assigned.');
            return;
        }

        for (const child of [...this.contentNode.children]) {
            child.destroy();
        }

        const items = this.gameManager.getEncyclopediaItems();
        const contentHeight = Math.max(
            this.getViewportHeight(),
            CONTENT_PADDING_TOP + CONTENT_PADDING_BOTTOM
                + items.length * CARD_HEIGHT
                + Math.max(0, items.length - 1) * CARD_SPACING,
        );

        const contentTransform = this.contentNode.getComponent(UITransform);
        const contentWidth = contentTransform?.contentSize.width ?? CARD_WIDTH;
        contentTransform?.setContentSize(contentWidth, contentHeight);
        this.contentNode.setPosition(new Vec3(0, this.getViewportHeight() * 0.5, 0));

        items.forEach((item, index) => {
            const cardNode = instantiate(this.itemCardPrefab as Prefab);
            cardNode.name = `ItemCard_${item.itemId}`;
            cardNode.layer = this.contentNode?.layer ?? cardNode.layer;
            cardNode.parent = this.contentNode;
            cardNode.setPosition(
                new Vec3(
                    0,
                    -CONTENT_PADDING_TOP - CARD_HEIGHT * 0.5 - index * (CARD_HEIGHT + CARD_SPACING),
                    0,
                ),
            );

            const cardTransform = cardNode.getComponent(UITransform);
            cardTransform?.setContentSize(CARD_WIDTH, CARD_HEIGHT);
            cardNode.getComponent(EncyclopediaItemCard)?.setup(item);
        });

        this._scrollView?.scrollToTop(0);
    }

    private getViewportHeight(): number {
        const viewTransform = this.contentNode?.parent?.getComponent(UITransform);
        return viewTransform?.contentSize.height ?? 410;
    }

    private findChildRecursive(root: Node | null, name: string): Node | null {
        if (!root) {
            return null;
        }

        for (const child of root.children) {
            if (child.name === name) {
                return child;
            }

            const found = this.findChildRecursive(child, name);
            if (found) {
                return found;
            }
        }

        return null;
    }
}
