import { _decorator, Color, Component, Label, Node, UITransform } from 'cc';
import { DIARY_FORMAT_VERSION, PROJECT_VERSION } from '../config/ProjectVersion';

const { ccclass } = _decorator;

const VERSION_LABEL_NODE_NAME = '版本信息文本';
const LABEL_WIDTH = 320;
const LABEL_HEIGHT = 32;
const FONT_SIZE = 16;
const MARGIN_RIGHT = 18;
const MARGIN_BOTTOM = 14;
const LABEL_COLOR = new Color(120, 82, 96, 190);

export function ensureMainMenuVersionLabel(parent: Node): Label | null {
    const transform = parent.getComponent(UITransform);
    if (!transform) {
        return null;
    }

    let labelNode = parent.getChildByName(VERSION_LABEL_NODE_NAME);
    if (!labelNode) {
        labelNode = new Node(VERSION_LABEL_NODE_NAME);
        labelNode.layer = parent.layer;
        parent.addChild(labelNode);
    }

    labelNode.setPosition(
        transform.contentSize.width * 0.5 - LABEL_WIDTH * 0.5 - MARGIN_RIGHT,
        -transform.contentSize.height * 0.5 + LABEL_HEIGHT * 0.5 + MARGIN_BOTTOM,
        10,
    );

    const labelTransform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    labelTransform.setAnchorPoint(0.5, 0.5);
    labelTransform.setContentSize(LABEL_WIDTH, LABEL_HEIGHT);

    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = `版本 ${PROJECT_VERSION} · 日记 ${DIARY_FORMAT_VERSION}`;
    label.fontSize = FONT_SIZE;
    label.lineHeight = FONT_SIZE + 4;
    label.horizontalAlign = 2;
    label.verticalAlign = 1;
    label.overflow = Label.Overflow.CLAMP;
    label.enableWrapText = false;
    label.color = LABEL_COLOR;
    return label;
}

@ccclass('MainMenuVersionLabel')
export class MainMenuVersionLabel extends Component {
    protected onLoad(): void {
        ensureMainMenuVersionLabel(this.node);
    }
}
