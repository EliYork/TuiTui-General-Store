import { _decorator, Component, ImageAsset, Sprite, SpriteFrame, warn } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('StaticImageSprite')
export class StaticImageSprite extends Component {
    @property({
        type: ImageAsset,
        displayName: '图片资源',
        tooltip: '用于生成静态 UI 图标的 PNG 图片资源。运行时会把它转换成 SpriteFrame 并显示到目标 Sprite 上。',
    })
    public imageAsset: ImageAsset | null = null;

    @property({
        type: Sprite,
        displayName: '目标 Sprite',
        tooltip: '接收图片显示的 Sprite。为空时会自动使用当前节点上的 Sprite 组件。',
    })
    public targetSprite: Sprite | null = null;

    private _spriteFrame: SpriteFrame | null = null;

    protected onLoad(): void {
        this.applyImage();
    }

    protected onEnable(): void {
        this.applyImage();
    }

    private applyImage(): void {
        const sprite = this.targetSprite ?? this.getComponent(Sprite);
        if (!sprite) {
            warn('[StaticImageSprite] targetSprite is not assigned and no Sprite was found on this node.');
            return;
        }

        if (!this.imageAsset) {
            sprite.spriteFrame = null;
            return;
        }

        this._spriteFrame = SpriteFrame.createWithImage(this.imageAsset);
        sprite.spriteFrame = this._spriteFrame;
    }
}
