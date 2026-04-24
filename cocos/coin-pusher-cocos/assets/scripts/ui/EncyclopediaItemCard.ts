import {
    _decorator,
    Color,
    Component,
    ImageAsset,
    Label,
    Sprite,
    SpriteFrame,
    warn,
} from 'cc';
import type { EncyclopediaCatalogItemSnapshot } from '../core/GameManager';

const { ccclass, property } = _decorator;

const UNLOCKED_BACKGROUND = new Color(255, 244, 248, 255);
const LOCKED_BACKGROUND = new Color(226, 196, 208, 255);
const UNLOCKED_TEXT = new Color(88, 48, 62, 255);
const LOCKED_TEXT = new Color(112, 78, 90, 255);
const MUTED_TEXT = new Color(132, 82, 98, 255);
const LOCKED_MUTED_TEXT = new Color(128, 88, 102, 255);
const UNLOCKED_ICON = new Color(255, 255, 255, 255);
const LOCKED_ICON = new Color(210, 190, 198, 235);

@ccclass('EncyclopediaItemCard')
export class EncyclopediaItemCard extends Component {
    @property({
        type: Sprite,
        displayName: '卡片背景',
        tooltip: '卡片底图 Sprite。已解锁显示浅粉亮色，未解锁显示偏灰粉色，方便区分状态。',
    })
    public backgroundSprite: Sprite | null = null;

    @property({
        type: Sprite,
        displayName: '物品图标',
        tooltip: '显示物品 PNG 图标的 Sprite。由 GameManager 的 iconImage 生成 SpriteFrame；未解锁时会灰显。',
    })
    public iconSprite: Sprite | null = null;

    @property({
        type: Label,
        displayName: '名称文本',
        tooltip: '显示物品中文名。未发现物品会显示为 ???，避免提前暴露名称。',
    })
    public nameLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '解锁状态文本',
        tooltip: '显示物品当前是否已解锁投放。图鉴刷新时由 GameManager 的解锁进度驱动。',
    })
    public statusLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '收集进度文本',
        tooltip: '显示当前收集数量 / 解锁需求。需求越高，玩家需要收集越多次才会解锁。',
    })
    public progressLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '价值文本',
        tooltip: '显示掉入结算区后提供的资源价值，数值越高奖励越多。',
    })
    public valueLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '权重文本',
        tooltip: '显示随机掉落权重，权重越高越容易被随机掉落选中。',
    })
    public weightLabel: Label | null = null;

    private _iconImage: ImageAsset | null = null;
    private _iconSpriteFrame: SpriteFrame | null = null;

    protected onLoad(): void {
        this.resolvePrefabNodes();
    }

    public setup(item: EncyclopediaCatalogItemSnapshot): void {
        this.resolvePrefabNodes();

        const isUnlocked = item.isSpawnUnlocked;
        const isVisibleName = isUnlocked || item.isDiscovered;
        const mainTextColor = isUnlocked ? UNLOCKED_TEXT : LOCKED_TEXT;
        const secondaryTextColor = isUnlocked ? MUTED_TEXT : LOCKED_MUTED_TEXT;

        this.setBackground(isUnlocked);
        this.setIcon(item.iconImage, isUnlocked);
        this.setLabel(this.nameLabel, isVisibleName ? item.itemName : '???', mainTextColor);
        this.setLabel(this.statusLabel, isUnlocked ? '已解锁' : '未解锁', secondaryTextColor);
        this.setLabel(
            this.progressLabel,
            `收集 ${item.ownedCount}/${item.unlockRequiredCount}`,
            secondaryTextColor,
        );
        this.setLabel(this.valueLabel, `价值 ${item.value}`, secondaryTextColor);
        this.setLabel(this.weightLabel, `权重 ${formatWeight(item.weight)}`, secondaryTextColor);
    }

    private resolvePrefabNodes(): void {
        this.backgroundSprite = this.backgroundSprite ?? this.node.getChildByName('Bg')?.getComponent(Sprite) ?? null;
        this.iconSprite = this.iconSprite ?? this.node.getChildByName('Icon')?.getComponent(Sprite) ?? null;
        this.nameLabel = this.nameLabel ?? this.node.getChildByName('NameLabel')?.getComponent(Label) ?? null;
        this.statusLabel = this.statusLabel ?? this.node.getChildByName('StatusLabel')?.getComponent(Label) ?? null;
        this.progressLabel = this.progressLabel ?? this.node.getChildByName('ProgressLabel')?.getComponent(Label) ?? null;
        this.valueLabel = this.valueLabel ?? this.node.getChildByName('ValueLabel')?.getComponent(Label) ?? null;
        this.weightLabel = this.weightLabel ?? this.node.getChildByName('WeightLabel')?.getComponent(Label) ?? null;
    }

    private setBackground(isUnlocked: boolean): void {
        if (!this.backgroundSprite) {
            warn('[EncyclopediaItemCard] backgroundSprite is not assigned.');
            return;
        }

        this.backgroundSprite.color = isUnlocked ? UNLOCKED_BACKGROUND : LOCKED_BACKGROUND;
    }

    private setIcon(image: ImageAsset | null, isUnlocked: boolean): void {
        if (!this.iconSprite) {
            warn('[EncyclopediaItemCard] iconSprite is not assigned.');
            return;
        }

        if (!image) {
            this.iconSprite.spriteFrame = null;
            this.iconSprite.node.active = false;
            return;
        }

        this.iconSprite.node.active = true;
        this.iconSprite.spriteFrame = this.getIconSpriteFrame(image);
        this.iconSprite.grayscale = !isUnlocked;
        this.iconSprite.color = isUnlocked ? UNLOCKED_ICON : LOCKED_ICON;
    }

    private getIconSpriteFrame(image: ImageAsset): SpriteFrame {
        if (this._iconImage !== image || !this._iconSpriteFrame) {
            this._iconImage = image;
            this._iconSpriteFrame = SpriteFrame.createWithImage(image);
        }

        return this._iconSpriteFrame;
    }

    private setLabel(label: Label | null, value: string, color: Color): void {
        if (!label) {
            return;
        }

        label.string = value;
        label.color = color;
    }
}

function formatWeight(weight: number): string {
    if (!Number.isFinite(weight)) {
        return '0';
    }

    return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}
