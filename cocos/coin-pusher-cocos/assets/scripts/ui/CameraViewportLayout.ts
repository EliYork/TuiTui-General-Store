import { _decorator, Camera, Component, Rect, warn } from 'cc';

const { ccclass, property } = _decorator;

const MIN_LEFT_PANEL_RATIO = 0;
const MAX_LEFT_PANEL_RATIO = 0.95;

@ccclass('CameraViewportLayout')
export class CameraViewportLayout extends Component {
    @property({
        type: Camera,
        displayName: '目标相机',
        tooltip: '需要渲染到右侧游戏区域的 3D 相机。为空时会自动使用当前节点上的 Camera 组件。',
    })
    public targetCamera: Camera | null = null;

    @property({
        displayName: '左侧面板比例',
        tooltip: '左侧 HUD 占屏幕宽度的比例。3D 相机会从这个比例之后开始渲染；背景清屏相机负责先清理完整屏幕。',
    })
    public leftPanelRatio = 0.35;

    protected onLoad(): void {
        this.applyViewport();
    }

    protected onEnable(): void {
        this.applyViewport();
    }

    public applyViewport(): void {
        const camera = this.targetCamera ?? this.getComponent(Camera);
        if (!camera) {
            warn('[CameraViewportLayout] targetCamera is not assigned and no Camera was found on this node.');
            return;
        }

        const leftRatio = clamp(this.leftPanelRatio, MIN_LEFT_PANEL_RATIO, MAX_LEFT_PANEL_RATIO);
        camera.rect = new Rect(leftRatio, 0, 1 - leftRatio, 1);

        if (camera.clearFlags === Camera.ClearFlag.DONT_CLEAR) {
            camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        }
    }
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}
