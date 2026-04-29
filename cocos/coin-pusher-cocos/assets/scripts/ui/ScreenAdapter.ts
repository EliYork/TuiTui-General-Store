import {
    _decorator,
    Camera,
    Color,
    Component,
    director,
    log,
    Node,
    Rect,
    ResolutionPolicy,
    screen,
    sys,
    UITransform,
    view,
    Widget,
} from 'cc';

const { ccclass, property } = _decorator;

const BACKGROUND_CAMERA_NAME = 'BackgroundCamera';
const UI_CAMERA_NAME = 'UICamera';
const BACKGROUND_CAMERA_PRIORITY = -100;
const BACKGROUND_CLEAR_COLOR = new Color(244, 235, 232, 255);

export interface DesignSafeInsets {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

const FULL_SCREEN_NODE_NAMES = new Set([
    'UIRoot',
    '经营模式界面',
    '图鉴模式界面',
    '通用界面',
    '本日结算面板',
    '结算背景遮罩',
    'ShopPanel',
    '商店场景根',
    'Background',
]);

const LEFT_EDGE_NODE_NAMES = new Set([
    '左侧信息栏',
]);

const RIGHT_TOP_BUTTON_NAMES = new Set([
    '返回菜单按钮',
]);

export function getDesignSafeInsets(): DesignSafeInsets {
    const visibleSize = view.getVisibleSize();
    const fallbackRect = new Rect(0, 0, visibleSize.width, visibleSize.height);
    let safeRect = fallbackRect;

    try {
        safeRect = sys.getSafeAreaRect(false) ?? fallbackRect;
    } catch (_error) {
        safeRect = fallbackRect;
    }

    return {
        left: Math.max(0, safeRect.x),
        right: Math.max(0, visibleSize.width - safeRect.x - safeRect.width),
        top: Math.max(0, visibleSize.height - safeRect.y - safeRect.height),
        bottom: Math.max(0, safeRect.y),
    };
}

@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {
    @property({
        displayName: '设计宽度',
        tooltip: '横屏设计分辨率宽度。当前项目按 1280x720 设计，调大会让同屏可见的横向内容变多。',
    })
    public designWidth = 1280;

    @property({
        displayName: '设计高度',
        tooltip: '横屏设计分辨率高度。当前项目按 1280x720 设计，移动端以高度适配为准。',
    })
    public designHeight = 720;

    @property({
        displayName: '启用安全区',
        tooltip: '开启后会根据手机刘海、挖孔、圆角等安全区移动贴边 UI。关闭后 UI 会使用完整可见区域。',
    })
    public applySafeArea = true;

    private _lastCameraLayoutSignature = '';

    protected onLoad(): void {
        this.applyScreenLayout();
    }

    protected onEnable(): void {
        screen.on('window-resize', this.applyScreenLayout, this);
        screen.on('orientation-change', this.applyScreenLayout, this);
        this.applyScreenLayout();
    }

    protected start(): void {
        this.applyScreenLayout();
    }

    protected onDisable(): void {
        screen.off('window-resize', this.applyScreenLayout, this);
        screen.off('orientation-change', this.applyScreenLayout, this);
    }

    public applyScreenLayout(): void {
        this.applyDesignResolution();
        this.applyCameraLayout();
        this.applyFullScreenUiRoots();

        if (this.applySafeArea) {
            this.applySafeAreaToEdgeNodes();
        }
    }

    private applyDesignResolution(): void {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.FIXED_HEIGHT);
    }

    private applyCameraLayout(): void {
        const scene = director.getScene();
        if (!scene) {
            return;
        }

        const cameras = scene.getComponentsInChildren(Camera);
        cameras.forEach((camera) => {
            if (this.isBackgroundCamera(camera)) {
                camera.rect = new Rect(0, 0, 1, 1);
                camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
                camera.clearColor = BACKGROUND_CLEAR_COLOR;
                camera.priority = BACKGROUND_CAMERA_PRIORITY;
                camera.visibility = 0;
                return;
            }

            if (this.isGameCamera(camera)) {
                camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
                return;
            }

            if (this.isUiCamera(camera, cameras.length)) {
                camera.rect = new Rect(0, 0, 1, 1);
                camera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
                return;
            }

            camera.rect = new Rect(0, 0, 1, 1);
            if (cameras.length === 1) {
                camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
            } else if (camera.clearFlags === Camera.ClearFlag.DONT_CLEAR) {
                camera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
            }
        });

        this.logCameraLayout(cameras);
    }

    private isBackgroundCamera(camera: Camera): boolean {
        return camera.node.name === BACKGROUND_CAMERA_NAME;
    }

    private isGameCamera(camera: Camera): boolean {
        return camera.node.name === 'Main Camera' || camera.node.getComponent('CameraViewportLayout') !== null;
    }

    private isUiCamera(camera: Camera, cameraCount: number): boolean {
        if (cameraCount === 1) {
            return false;
        }

        return camera.node.name === UI_CAMERA_NAME || camera.visibility === 41943040;
    }

    private logCameraLayout(cameras: Camera[]): void {
        const signature = cameras
            .map((camera) => {
                const rect = camera.rect;
                return `${camera.node.name}:${formatNumber(rect.x)},${formatNumber(rect.y)},${formatNumber(rect.width)},${formatNumber(rect.height)}:${camera.clearFlags}:${camera.priority}`;
            })
            .join('|');

        if (signature === this._lastCameraLayoutSignature) {
            return;
        }

        this._lastCameraLayoutSignature = signature;
        cameras.forEach((camera) => {
            const rect = camera.rect;
            log(
                `[ScreenAdapter] Camera ${camera.node.name} rect=(${formatNumber(rect.x)}, ${formatNumber(rect.y)}, ${formatNumber(rect.width)}, ${formatNumber(rect.height)}) clearFlags=${camera.clearFlags} priority=${camera.priority}`,
            );
        });
    }

    private applyFullScreenUiRoots(): void {
        const scene = director.getScene();
        if (!scene) {
            return;
        }

        const visibleSize = view.getVisibleSize();
        this.walkNodes(scene, (node) => {
            if (!FULL_SCREEN_NODE_NAMES.has(node.name)) {
                return;
            }

            const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
            transform.setAnchorPoint(0.5, 0.5);
            transform.setContentSize(visibleSize.width, visibleSize.height);
            node.setPosition(0, 0, node.position.z);

            const widget = node.getComponent(Widget) ?? node.addComponent(Widget);
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.left = 0;
            widget.right = 0;
            widget.top = 0;
            widget.bottom = 0;
            widget.updateAlignment();
        });
    }

    private applySafeAreaToEdgeNodes(): void {
        const scene = director.getScene();
        if (!scene) {
            return;
        }

        const visibleSize = view.getVisibleSize();
        const safeInsets = getDesignSafeInsets();

        this.walkNodes(scene, (node) => {
            if (LEFT_EDGE_NODE_NAMES.has(node.name)) {
                this.placeLeftEdgeNode(node, visibleSize.width, safeInsets.left);
                return;
            }

            if (RIGHT_TOP_BUTTON_NAMES.has(node.name)) {
                this.placeRightTopButton(node, visibleSize.width, visibleSize.height, safeInsets);
            }
        });
    }

    private placeLeftEdgeNode(node: Node, visibleWidth: number, safeLeft: number): void {
        const transform = node.getComponent(UITransform);
        if (!transform) {
            return;
        }

        const x = -visibleWidth * 0.5 + safeLeft + transform.contentSize.width * transform.anchorX;
        node.setPosition(x, node.position.y, node.position.z);
    }

    private placeRightTopButton(node: Node, visibleWidth: number, visibleHeight: number, safeInsets: DesignSafeInsets): void {
        const transform = node.getComponent(UITransform);
        if (!transform) {
            return;
        }

        const margin = 20;
        const x = visibleWidth * 0.5 - safeInsets.right - transform.contentSize.width * (1 - transform.anchorX) - margin;
        const y = visibleHeight * 0.5 - safeInsets.top - transform.contentSize.height * (1 - transform.anchorY) - margin;
        node.setPosition(x, y, node.position.z);
    }

    private walkNodes(root: Node, visit: (node: Node) => void): void {
        visit(root);

        root.children.forEach((child) => {
            this.walkNodes(child, visit);
        });
    }
}

function formatNumber(value: number): string {
    return Number.isFinite(value) ? value.toFixed(3).replace(/\.?0+$/, '') : 'NaN';
}
