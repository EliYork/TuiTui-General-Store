import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ModeBaseConfig')
export class ModeBaseConfig extends Component {
    @property({
        displayName: '模式 ID',
        tooltip: '模式唯一标识，例如 business 或 collection。菜单和模式配置表会用它匹配当前玩法。',
    })
    public modeId = 'business';

    @property({
        displayName: '模式显示名',
        tooltip: '玩家可见的模式名称，例如“经营模式”。只影响 UI 文案，不影响逻辑匹配。',
    })
    public displayName = '经营模式';

    @property({
        displayName: '需要开始按钮',
        tooltip: '开启后进入该模式时需要先点开始按钮；关闭后进入场景即可操作。',
    })
    public requiresStartButton = false;

    @property({
        displayName: '使用经营进货单',
        tooltip: '开启后手动投放会优先使用经营模式的进货单权重。关闭后使用旧当前投放物逻辑。',
    })
    public useBusinessOrders = true;

    @property({
        displayName: '使用旧当前投放物',
        tooltip: '开启后使用 GameManager 的旧当前投放物逻辑。经营模式通常关闭，图鉴模式通常开启。',
    })
    public useLegacyCurrentSpawnItem = false;

    @property({
        displayName: '投放消耗旧资源',
        tooltip: '开启后每次手动投放会消耗旧资源数量；经营模式通常关闭，图鉴模式通常开启。',
    })
    public spendLegacyResourceOnSpawn = false;

    public getModeId(): string {
        return normalizeText(this.modeId, 'business');
    }

    public getDisplayName(): string {
        return normalizeText(this.displayName, this.getModeId());
    }
}

function normalizeText(value: string | undefined, fallback: string): string {
    const trimmed = (value || '').trim();
    return trimmed.length > 0 ? trimmed : fallback;
}
