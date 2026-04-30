import { _decorator, Component, log, warn } from 'cc';
import { ModeConfig } from './ModeConfig';

const { ccclass, property } = _decorator;
const PENDING_MODE_ID_KEY = '__coinPusherPendingModeId';

type ModeGlobal = typeof globalThis & {
    [PENDING_MODE_ID_KEY]?: string;
};

export function setPendingModeId(modeId: string): void {
    const normalizedModeId = modeId.trim();
    if (!normalizedModeId) {
        return;
    }

    (globalThis as ModeGlobal)[PENDING_MODE_ID_KEY] = normalizedModeId;
}

function consumePendingModeId(): string {
    const modeGlobal = globalThis as ModeGlobal;
    const pendingModeId = (modeGlobal[PENDING_MODE_ID_KEY] ?? '').trim();
    delete modeGlobal[PENDING_MODE_ID_KEY];
    return pendingModeId;
}

@ccclass('ModeConfigTable')
export class ModeConfigTable extends Component {
    @property({
        displayName: '当前模式 ID',
        tooltip: '当前启用的模式 ID。Prototype01.scene 作为经营模式入口时应填写 business；切换为 collection 可尝试恢复图鉴/测试模式参数。'
    })
    public activeModeId = 'business';

    @property({
        type: [ModeConfig],
        displayName: '模式参数列表',
        tooltip: '场景内可用的模式参数组件列表。模式配置表会按当前模式 ID 从这里查找对应 ModeConfig。'
    })
    public configs: ModeConfig[] = [];

    protected onLoad(): void {
        const pendingModeId = consumePendingModeId();
        if (!pendingModeId) {
            return;
        }

        this.activeModeId = pendingModeId;
        log(`[ModeConfigTable] 使用主菜单请求模式：${pendingModeId}`);
    }

    public getActiveConfig(): ModeConfig | null {
        const normalizedModeId = this.activeModeId.trim();
        const matchingConfig = this.configs.find((config) => config && config.getModeId().trim() === normalizedModeId);

        if (matchingConfig) {
            return matchingConfig;
        }

        const fallbackConfig = this.configs.find((config) => !!config) ?? null;
        if (fallbackConfig) {
            warn(`[ModeConfigTable] 未找到模式参数：${normalizedModeId || '(empty)'}，已回退到 ${fallbackConfig.getModeId() || fallbackConfig.node.name}`);
            return fallbackConfig;
        }

        warn('[ModeConfigTable] 模式参数列表为空。');
        return null;
    }
}
