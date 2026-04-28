import { _decorator, Camera, Component, Rect, warn } from 'cc';

const { ccclass, property } = _decorator;

const MIN_LEFT_PANEL_RATIO = 0;
const MAX_LEFT_PANEL_RATIO = 0.95;

@ccclass('CameraViewportLayout')
export class CameraViewportLayout extends Component {
    @property({
        type: Camera,
        displayName: '目标相机',
        tooltip: '需要被裁切渲染区域的 3D 相机。为空时会自动使用当前节点上的 Camera 组件，推荐直接挂在 Main Camera 节点上。',
    })
    public targetCamera: Camera | null = null;

    @property({
        displayName: '左侧面板比例',
        tooltip: '左侧经营信息栏占屏幕宽度的比例。0.35 表示左侧占 35%，右侧 3D 主场景占 65%；调大会让左侧更宽、右侧更窄。',
    })
    public leftPanelRatio = 0.35;

    protected onLoad(): void {
        this.applyViewport();
    }

    protected onEnable(): void {
        this.applyViewport();
    }

    private applyViewport(): void {
        const camera = this.targetCamera ?? this.getComponent(Camera);
        if (!camera) {
            warn('[CameraViewportLayout] targetCamera is not assigned and no Camera was found on this node.');
            return;
        }

        const leftRatio = clamp(this.leftPanelRatio, MIN_LEFT_PANEL_RATIO, MAX_LEFT_PANEL_RATIO);
        camera.rect = new Rect(leftRatio, 0, 1 - leftRatio, 1);
    }
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}
