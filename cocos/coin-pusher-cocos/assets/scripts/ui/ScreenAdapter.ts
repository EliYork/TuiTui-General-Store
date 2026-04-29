import {
    _decorator,
    Camera,
    Color,
    Component,
    director,
    Graphics,
    Label,
    log,
    Mask,
    Node,
    Rect,
    ResolutionPolicy,
    screen,
    Sprite,
    sys,
    UITransform,
    Vec3,
    view,
    warn,
    Widget,
} from 'cc';

const { ccclass, property } = _decorator;

const DEFAULT_DESIGN_WIDTH = 1280;
const DEFAULT_DESIGN_HEIGHT = 720;
const BACKGROUND_CAMERA_NAME = 'BackgroundCamera';
const UI_CAMERA_NAME = 'UICamera';
const MAIN_CAMERA_NAME = 'Main Camera';
const BACKGROUND_CAMERA_PRIORITY = -10;
const GAME_CAMERA_PRIORITY = 0;
const UI_CAMERA_PRIORITY = 10;
const BACKGROUND_CAMERA_EMPTY_VISIBILITY = 1;
const BACKGROUND_CLEAR_COLOR = new Color(244, 235, 232, 255);

const DEBUG_BADGE_NAME = 'AndroidScreenDebugBadge';
const DEBUG_BADGE_WIDTH = 360;
const DEBUG_BADGE_HEIGHT = 70;
const DEBUG_BADGE_MARGIN = 12;
const DEBUG_BADGE_COLOR = new Color(255, 56, 128, 245);
const DEBUG_BADGE_TEXT_COLOR = new Color(255, 255, 255, 255);

export interface DesignSafeInsets {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface ScreenMetrics {
    screenWidth: number;
    screenHeight: number;
    visibleWidth: number;
    visibleHeight: number;
    visibleValid: boolean;
    canvasScaleValid: boolean;
    safeRect: Rect;
    safeInsets: DesignSafeInsets;
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
    const visibleWidth = isPositiveFinite(visibleSize.width) ? visibleSize.width : DEFAULT_DESIGN_WIDTH;
    const visibleHeight = isPositiveFinite(visibleSize.height) ? visibleSize.height : DEFAULT_DESIGN_HEIGHT;
    const safeRect = readSafeAreaRect(visibleWidth, visibleHeight);

    return rectToInsets(safeRect, visibleWidth, visibleHeight);
}

@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {
    @property({
        displayName: '设计宽度',
        tooltip: '横屏设计分辨率宽度。当前项目按 1280x720 设计，调大会让同屏可见的横向内容变多。',
    })
    public designWidth = DEFAULT_DESIGN_WIDTH;

    @property({
        displayName: '设计高度',
        tooltip: '横屏设计分辨率高度。当前项目按 1280x720 设计，移动端以高度适配为准。',
    })
    public designHeight = DEFAULT_DESIGN_HEIGHT;

    @property({
        displayName: '启用安全区',
        tooltip: '开启后会根据手机刘海、挖孔、圆角等安全区移动贴边 UI。关闭后 UI 会使用完整可见区域。',
    })
    public applySafeArea = true;

    @property({
        displayName: '显示安卓调试角标',
        tooltip: '开启后在左上角显示界面存活角标，用来确认 Android 真机上 Canvas 和 UI Camera 是否正常。排查结束后应保持关闭。',
    })
    public showAndroidDebugBadge = false;

    private _debugBadge: Node | null = null;
    private _debugBadgeGraphics: Graphics | null = null;
    private _debugBadgeLabel: Label | null = null;
    private _lastCameraLayoutSignature = '';
    private _lastAndroidDebugSignature = '';
    private _lastPanelAuditSignature = '';

    protected onLoad(): void {
        // Android 上 view/safeArea 可能在 onLoad 仍未稳定，这里只保留组件注册，不做最终适配。
        log(`[AndroidScreenDebug] ScreenAdapter onLoad: scene=${director.getScene()?.name ?? 'none'} node=${this.node.name}`);
        this.ensureDebugBadge(this.collectScreenMetrics());
    }

    protected onEnable(): void {
        screen.on('window-resize', this.onScreenChanged, this);
        screen.on('orientation-change', this.onScreenChanged, this);
    }

    protected start(): void {
        this.ensureDebugBadge(this.collectScreenMetrics());
        this.scheduleApply('start-next-frame', 0);
        this.scheduleApply('start-0.2s', 0.2);
    }

    protected onDisable(): void {
        screen.off('window-resize', this.onScreenChanged, this);
        screen.off('orientation-change', this.onScreenChanged, this);
    }

    public applyScreenLayout(reason = 'manual'): void {
        if (!this.applyDesignResolution()) {
            return;
        }

        const metrics = this.collectScreenMetrics();
        this.ensureDebugBadge(metrics);
        this.updateDebugBadgePosition(metrics);
        this.logAndroidScreenDebug(reason, metrics);

        if (!metrics.visibleValid || !metrics.canvasScaleValid) {
            warn(
                `[AndroidScreenDebug] skip layout: visibleValid=${metrics.visibleValid} canvasScaleValid=${metrics.canvasScaleValid}`,
            );
            return;
        }

        this.applyCameraLayout();

        if (this.applySafeArea) {
            this.applySafeAreaToEdgeNodes(metrics);
        }

        this.auditPotentialBlockingPanels(metrics);
        this.bringDebugBadgeToTop();
    }

    private onScreenChanged(): void {
        this.scheduleApply('resize', 0);
    }

    private scheduleApply(reason: string, delay: number): void {
        this.scheduleOnce(() => this.applyScreenLayout(reason), delay);
    }

    private applyDesignResolution(): boolean {
        if (!isPositiveFinite(this.designWidth) || !isPositiveFinite(this.designHeight)) {
            warn(`[AndroidScreenDebug] skip design resolution: invalid design size ${this.designWidth}x${this.designHeight}`);
            return false;
        }

        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.FIXED_HEIGHT);
        return true;
    }

    private collectScreenMetrics(): ScreenMetrics {
        const screenSize = readScreenSize();
        const visibleSize = view.getVisibleSize();
        const visibleValid = isPositiveFinite(visibleSize.width) && isPositiveFinite(visibleSize.height);
        const visibleWidth = visibleValid ? visibleSize.width : 0;
        const visibleHeight = visibleValid ? visibleSize.height : 0;
        const fallbackWidth = visibleValid ? visibleWidth : DEFAULT_DESIGN_WIDTH;
        const fallbackHeight = visibleValid ? visibleHeight : DEFAULT_DESIGN_HEIGHT;
        const safeRect = readSafeAreaRect(fallbackWidth, fallbackHeight);
        const canvasNode = this.getCanvasNode();

        return {
            screenWidth: screenSize.width,
            screenHeight: screenSize.height,
            visibleWidth,
            visibleHeight,
            visibleValid,
            canvasScaleValid: canvasNode ? isNodeScaleValid(canvasNode) : true,
            safeRect,
            safeInsets: rectToInsets(safeRect, fallbackWidth, fallbackHeight),
        };
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
                camera.visibility = BACKGROUND_CAMERA_EMPTY_VISIBILITY;
                return;
            }

            if (this.isGameCamera(camera)) {
                camera.priority = GAME_CAMERA_PRIORITY;
                if (camera.clearFlags === Camera.ClearFlag.DONT_CLEAR) {
                    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
                }
                return;
            }

            if (this.isUiCamera(camera, cameras.length)) {
                camera.rect = new Rect(0, 0, 1, 1);
                camera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
                camera.priority = UI_CAMERA_PRIORITY;
                return;
            }

            camera.rect = new Rect(0, 0, 1, 1);
            if (cameras.length === 1) {
                camera.priority = GAME_CAMERA_PRIORITY;
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
        return camera.node.name === MAIN_CAMERA_NAME || camera.node.getComponent('CameraViewportLayout') !== null;
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

    private applyFullScreenUiRoots(metrics: ScreenMetrics): void {
        const scene = director.getScene();
        if (!scene || !metrics.visibleValid) {
            return;
        }

        this.walkNodes(scene, (node) => {
            if (!FULL_SCREEN_NODE_NAMES.has(node.name) || !isNodeScaleValid(node)) {
                return;
            }

            const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
            transform.setAnchorPoint(0.5, 0.5);
            transform.setContentSize(metrics.visibleWidth, metrics.visibleHeight);
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

    private applySafeAreaToEdgeNodes(metrics: ScreenMetrics): void {
        const scene = director.getScene();
        if (!scene || !metrics.visibleValid) {
            return;
        }

        this.walkNodes(scene, (node) => {
            if (!isNodeScaleValid(node)) {
                return;
            }

            if (LEFT_EDGE_NODE_NAMES.has(node.name)) {
                this.placeLeftEdgeNode(node, metrics.visibleWidth, metrics.safeInsets.left);
                return;
            }

            if (RIGHT_TOP_BUTTON_NAMES.has(node.name)) {
                this.placeRightTopButton(node, metrics.visibleWidth, metrics.visibleHeight, metrics.safeInsets);
            }
        });
    }

    private placeLeftEdgeNode(node: Node, visibleWidth: number, safeLeft: number): void {
        const transform = node.getComponent(UITransform);
        if (!transform || !isPositiveFinite(visibleWidth) || !isPositiveFinite(transform.contentSize.width)) {
            return;
        }

        const x = -visibleWidth * 0.5 + safeLeft + transform.contentSize.width * transform.anchorX;
        node.setPosition(x, node.position.y, node.position.z);
    }

    private placeRightTopButton(node: Node, visibleWidth: number, visibleHeight: number, safeInsets: DesignSafeInsets): void {
        const transform = node.getComponent(UITransform);
        if (
            !transform ||
            !isPositiveFinite(visibleWidth) ||
            !isPositiveFinite(visibleHeight) ||
            !isPositiveFinite(transform.contentSize.width) ||
            !isPositiveFinite(transform.contentSize.height)
        ) {
            return;
        }

        const margin = 20;
        const x = visibleWidth * 0.5 - safeInsets.right - transform.contentSize.width * (1 - transform.anchorX) - margin;
        const y = visibleHeight * 0.5 - safeInsets.top - transform.contentSize.height * (1 - transform.anchorY) - margin;
        node.setPosition(x, y, node.position.z);
    }

    private ensureDebugBadge(metrics: ScreenMetrics): void {
        if (!this.showAndroidDebugBadge) {
            if (this._debugBadge) {
                this._debugBadge.active = false;
            }
            return;
        }

        const parent = this.getCanvasNode() ?? this.node;
        const existing = parent.getChildByName(DEBUG_BADGE_NAME);
        this._debugBadge = existing ?? new Node(DEBUG_BADGE_NAME);
        this._debugBadge.layer = parent.layer;

        if (!existing) {
            parent.addChild(this._debugBadge);
            const transform = this._debugBadge.addComponent(UITransform);
            transform.setAnchorPoint(0.5, 0.5);
            transform.setContentSize(DEBUG_BADGE_WIDTH, DEBUG_BADGE_HEIGHT);

            this._debugBadgeGraphics = this._debugBadge.addComponent(Graphics);
            this.drawDebugBadgeBackground();

            const labelNode = new Node('AndroidScreenDebugLabel');
            labelNode.layer = parent.layer;
            this._debugBadge.addChild(labelNode);
            labelNode.setPosition(0, 0, 0);
            const labelTransform = labelNode.addComponent(UITransform);
            labelTransform.setAnchorPoint(0.5, 0.5);
            labelTransform.setContentSize(DEBUG_BADGE_WIDTH - 24, DEBUG_BADGE_HEIGHT - 12);

            this._debugBadgeLabel = labelNode.addComponent(Label);
            this._debugBadgeLabel.string = '界面已加载';
            this._debugBadgeLabel.fontSize = 24;
            this._debugBadgeLabel.lineHeight = 30;
            this._debugBadgeLabel.color = DEBUG_BADGE_TEXT_COLOR;
            this._debugBadgeLabel.horizontalAlign = 1;
            this._debugBadgeLabel.verticalAlign = 1;
        } else {
            this._debugBadgeGraphics = existing.getComponent(Graphics);
            this._debugBadgeLabel = existing.getChildByName('AndroidScreenDebugLabel')?.getComponent(Label) ?? null;
        }

        this._debugBadge.active = true;
        this.updateDebugBadgePosition(metrics);
        this.bringDebugBadgeToTop();
    }

    private drawDebugBadgeBackground(): void {
        if (!this._debugBadgeGraphics) {
            return;
        }

        this._debugBadgeGraphics.clear();
        this._debugBadgeGraphics.fillColor = DEBUG_BADGE_COLOR;
        this._debugBadgeGraphics.roundRect(-DEBUG_BADGE_WIDTH * 0.5, -DEBUG_BADGE_HEIGHT * 0.5, DEBUG_BADGE_WIDTH, DEBUG_BADGE_HEIGHT, 8);
        this._debugBadgeGraphics.fill();
    }

    private updateDebugBadgePosition(metrics: ScreenMetrics): void {
        if (!this._debugBadge || !this.showAndroidDebugBadge) {
            return;
        }

        const visibleWidth = metrics.visibleValid ? metrics.visibleWidth : DEFAULT_DESIGN_WIDTH;
        const visibleHeight = metrics.visibleValid ? metrics.visibleHeight : DEFAULT_DESIGN_HEIGHT;
        const x = -visibleWidth * 0.5 + metrics.safeInsets.left + DEBUG_BADGE_MARGIN + DEBUG_BADGE_WIDTH * 0.5;
        const y = visibleHeight * 0.5 - metrics.safeInsets.top - DEBUG_BADGE_MARGIN - DEBUG_BADGE_HEIGHT * 0.5;
        this._debugBadge.setPosition(x, y, 999);
    }

    private bringDebugBadgeToTop(): void {
        if (!this._debugBadge || !this._debugBadge.parent) {
            return;
        }

        this._debugBadge.setSiblingIndex(this._debugBadge.parent.children.length - 1);
    }

    private logAndroidScreenDebug(reason: string, metrics: ScreenMetrics): void {
        const scene = director.getScene();
        const canvas = this.getCanvasNode();
        const uiRoot = this.findNodeByName('UIRoot');
        const mainCamera = this.findCameraByName(MAIN_CAMERA_NAME);
        const duplicateCounts = this.countAdapterComponents(scene);
        const signature = [
            reason,
            scene?.name ?? 'none',
            metrics.screenWidth,
            metrics.screenHeight,
            metrics.visibleWidth,
            metrics.visibleHeight,
            rectSignature(metrics.safeRect),
            nodeSignature(canvas),
            nodeSignature(uiRoot),
            cameraSignature(mainCamera),
            duplicateCounts.screenAdapters,
            duplicateCounts.cameraViewportLayouts,
        ].join('|');

        if (signature === this._lastAndroidDebugSignature) {
            return;
        }

        this._lastAndroidDebugSignature = signature;
        log(`[AndroidScreenDebug] reason: ${reason}`);
        log(`[AndroidScreenDebug] 当前激活场景名: ${scene?.name ?? 'none'}`);
        log(`[AndroidScreenDebug] screen size: ${formatNumber(metrics.screenWidth)} x ${formatNumber(metrics.screenHeight)}`);
        log(`[AndroidScreenDebug] visible size: ${formatNumber(metrics.visibleWidth)} x ${formatNumber(metrics.visibleHeight)}`);
        log(
            `[AndroidScreenDebug] safe area: x=${formatNumber(metrics.safeRect.x)} y=${formatNumber(metrics.safeRect.y)} w=${formatNumber(metrics.safeRect.width)} h=${formatNumber(metrics.safeRect.height)}`,
        );
        log(`[AndroidScreenDebug] canvas size: ${formatNodeSize(canvas)}`);
        log(`[AndroidScreenDebug] Canvas position/scale: ${formatNodeTransform(canvas)}`);
        log(`[AndroidScreenDebug] UIRoot position/scale/size: ${formatNodeTransform(uiRoot)} size=${formatNodeSize(uiRoot)}`);
        log(`[AndroidScreenDebug] Main Camera enabled/rect/clearColor/node position: ${formatCamera(mainCamera)}`);
        log(
            `[AndroidScreenDebug] adapters: ScreenAdapter=${duplicateCounts.screenAdapters} CameraViewportLayout=${duplicateCounts.cameraViewportLayouts}`,
        );
    }

    private auditPotentialBlockingPanels(metrics: ScreenMetrics): void {
        const scene = director.getScene();
        if (!scene || !metrics.visibleValid) {
            return;
        }

        const entries: string[] = [];
        this.walkNodes(scene, (node) => {
            if (!node.activeInHierarchy || !isNodeScaleValid(node)) {
                return;
            }

            const transform = node.getComponent(UITransform);
            if (!transform || !isPositiveFinite(transform.contentSize.width) || !isPositiveFinite(transform.contentSize.height)) {
                return;
            }

            const hasBlockingVisual = node.getComponent(Sprite) !== null || node.getComponent(Graphics) !== null || node.getComponent(Mask) !== null;
            const isLarge = transform.contentSize.width >= metrics.visibleWidth * 0.95 && transform.contentSize.height >= metrics.visibleHeight * 0.95;
            if (hasBlockingVisual && isLarge) {
                entries.push(`${node.name}(${formatNumber(transform.contentSize.width)}x${formatNumber(transform.contentSize.height)})`);
            }
        });

        const signature = entries.join('|') || 'none';
        if (signature === this._lastPanelAuditSignature) {
            return;
        }

        this._lastPanelAuditSignature = signature;
        log(`[AndroidScreenDebug] active large visual UI nodes: ${entries.length > 0 ? entries.join(', ') : 'none'}`);
    }

    private getCanvasNode(): Node | null {
        if (this.node.name === 'Canvas') {
            return this.node;
        }

        return this.findNodeByName('Canvas');
    }

    private findNodeByName(name: string): Node | null {
        const scene = director.getScene();
        if (!scene) {
            return null;
        }

        let result: Node | null = null;
        this.walkNodes(scene, (node) => {
            if (!result && node.name === name) {
                result = node;
            }
        });
        return result;
    }

    private findCameraByName(name: string): Camera | null {
        const scene = director.getScene();
        if (!scene) {
            return null;
        }

        return scene.getComponentsInChildren(Camera).find((camera) => camera.node.name === name) ?? null;
    }

    private countAdapterComponents(scene: Node | null): { screenAdapters: number; cameraViewportLayouts: number } {
        if (!scene) {
            return { screenAdapters: 0, cameraViewportLayouts: 0 };
        }

        let screenAdapters = 0;
        let cameraViewportLayouts = 0;
        this.walkNodes(scene, (node) => {
            screenAdapters += node.getComponents(ScreenAdapter).length;
            if (node.getComponent('CameraViewportLayout') !== null) {
                cameraViewportLayouts += 1;
            }
        });

        return { screenAdapters, cameraViewportLayouts };
    }

    private walkNodes(root: Node, visit: (node: Node) => void): void {
        visit(root);

        root.children.forEach((child) => {
            this.walkNodes(child, visit);
        });
    }
}

function readSafeAreaRect(visibleWidth: number, visibleHeight: number): Rect {
    const fallbackRect = new Rect(0, 0, visibleWidth, visibleHeight);
    let safeRect: Rect | null = null;

    try {
        safeRect = sys.getSafeAreaRect(false) ?? null;
    } catch (_error) {
        safeRect = null;
    }

    if (!safeRect || !isUsableRect(safeRect)) {
        return fallbackRect;
    }

    const x = clamp(safeRect.x, 0, visibleWidth);
    const y = clamp(safeRect.y, 0, visibleHeight);
    const right = clamp(safeRect.x + safeRect.width, x, visibleWidth);
    const top = clamp(safeRect.y + safeRect.height, y, visibleHeight);
    const width = right - x;
    const height = top - y;

    if (!isPositiveFinite(width) || !isPositiveFinite(height)) {
        return fallbackRect;
    }

    return new Rect(x, y, width, height);
}

function rectToInsets(rect: Rect, visibleWidth: number, visibleHeight: number): DesignSafeInsets {
    return {
        left: Math.max(0, rect.x),
        right: Math.max(0, visibleWidth - rect.x - rect.width),
        top: Math.max(0, visibleHeight - rect.y - rect.height),
        bottom: Math.max(0, rect.y),
    };
}

function readScreenSize(): { width: number; height: number } {
    const screenWindowSize = (screen as unknown as { windowSize?: { width?: number; height?: number } }).windowSize;
    const frameSize = view.getFrameSize();
    const width = readPositiveNumber(screenWindowSize?.width, readPositiveNumber(frameSize.width, 0));
    const height = readPositiveNumber(screenWindowSize?.height, readPositiveNumber(frameSize.height, 0));
    return { width, height };
}

function isUsableRect(rect: Rect): boolean {
    return isFiniteNumber(rect.x) && isFiniteNumber(rect.y) && isPositiveFinite(rect.width) && isPositiveFinite(rect.height);
}

function isNodeScaleValid(node: Node): boolean {
    return isPositiveFinite(node.scale.x) && isPositiveFinite(node.scale.y) && isPositiveFinite(node.scale.z);
}

function isPositiveFinite(value: number): boolean {
    return Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: number): boolean {
    return Number.isFinite(value);
}

function readPositiveNumber(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && isPositiveFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}

function nodeSignature(node: Node | null): string {
    if (!node) {
        return 'none';
    }

    const transform = node.getComponent(UITransform);
    const size = transform?.contentSize;
    return `${node.name}:${vec3Signature(node.position)}:${vec3Signature(node.scale)}:${size ? `${formatNumber(size.width)},${formatNumber(size.height)}` : 'no-size'}`;
}

function cameraSignature(camera: Camera | null): string {
    if (!camera) {
        return 'none';
    }

    const rect = camera.rect;
    return `${camera.node.name}:${camera.enabled}:${rectSignature(rect)}:${camera.clearFlags}:${colorSignature(camera.clearColor)}:${vec3Signature(camera.node.position)}`;
}

function rectSignature(rect: Rect): string {
    return `${formatNumber(rect.x)},${formatNumber(rect.y)},${formatNumber(rect.width)},${formatNumber(rect.height)}`;
}

function vec3Signature(vec: Vec3): string {
    return `${formatNumber(vec.x)},${formatNumber(vec.y)},${formatNumber(vec.z)}`;
}

function colorSignature(color: Color): string {
    return `${color.r},${color.g},${color.b},${color.a}`;
}

function formatNodeSize(node: Node | null): string {
    const transform = node?.getComponent(UITransform);
    if (!node || !transform) {
        return 'none';
    }

    return `${formatNumber(transform.contentSize.width)} x ${formatNumber(transform.contentSize.height)}`;
}

function formatNodeTransform(node: Node | null): string {
    if (!node) {
        return 'none';
    }

    return `pos=(${vec3Signature(node.position)}) scale=(${vec3Signature(node.scale)}) active=${node.activeInHierarchy}`;
}

function formatCamera(camera: Camera | null): string {
    if (!camera) {
        return 'none';
    }

    const rect = camera.rect;
    return `enabled=${camera.enabled} rect=(${rectSignature(rect)}) clearColor=(${colorSignature(camera.clearColor)}) nodePos=(${vec3Signature(camera.node.position)})`;
}

function formatNumber(value: number): string {
    return Number.isFinite(value) ? value.toFixed(3).replace(/\.?0+$/, '') : 'NaN';
}
