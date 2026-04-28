import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ModeConfig')
export class ModeConfig extends Component {
    @property({
        displayName: '模式 ID',
        tooltip: '模式唯一标识，例如 business / collection。模式配置表会用这个 ID 查找当前启用的模式参数。'
    })
    public modeId = 'business';

    @property({
        displayName: '模式显示名',
        tooltip: '模式的中文显示名，仅用于编辑器辨认和调试提示，不参与逻辑判断。'
    })
    public modeDisplayName = '经营模式';

    @property({
        displayName: '允许手动投放',
        tooltip: '是否允许玩家通过点击或长按进行手动投放。关闭后玩家输入不会生成物品。'
    })
    public allowManualSpawn = true;

    @property({
        displayName: '使用经营订购单',
        tooltip: '手动投放时是否使用经营模式订购单牌组的张数作为权重抽取物品。经营模式应开启。'
    })
    public useBusinessOrderDeck = true;

    @property({
        displayName: '使用旧当前投放物',
        tooltip: '手动投放时是否使用旧的当前投放物/图鉴模式投放逻辑。图鉴模式可开启，经营模式应关闭。'
    })
    public useLegacyCurrentItem = false;

    @property({
        displayName: '投放消耗旧资源',
        tooltip: '手动投放是否消耗旧资源。经营模式第一版建议关闭，避免被旧图鉴资源系统卡住；图鉴模式可开启以保持旧行为。'
    })
    public consumeResourceOnManualSpawn = false;

    @property({
        displayName: '启用随机掉落',
        tooltip: '是否启用旧的定时随机掉落逻辑。关闭后不会按世界掉落间隔自动生成水果。'
    })
    public enableRandomDrop = false;

    @property({
        displayName: '启用自动投放',
        tooltip: '是否启用旧的自动投放逻辑。关闭后自动投放按钮和自动投放计时都不会驱动生成。'
    })
    public enableAutoSpawn = false;

    @property({
        displayName: '需要开始按钮',
        tooltip: '是否需要点击开始/经营/测试按钮后才允许投放。经营模式第一版关闭，进入场景即可投放。'
    })
    public requireStartButton = false;

    @property({
        displayName: '初始资源',
        tooltip: '进入该模式时的初始资源数量。经营模式第一版可用于测试，后续可改为从存档读取。'
    })
    public initialResource = 300;

    @property({
        displayName: '当天进货次数',
        tooltip: '经营模式当天可主动进货/投放的初始次数。每次玩家成功主动投放后减少 1，降到 0 后不能继续进货/投放。',
    })
    public dailyStockLimit = 300;

    @property({
        displayName: '资源回复上限',
        tooltip: '资源自然回复的上限。当前资源达到该值后不再继续自动回复。'
    })
    public resourceRecoverLimit = 300;

    @property({
        displayName: '资源回复间隔',
        tooltip: '资源自然回复间隔，单位秒。数值越小回复越频繁，数值越大回复越慢。'
    })
    public resourceRecoverInterval = 5;

    @property({
        displayName: '每次回复资源',
        tooltip: '每次自然回复增加的资源数量。数值越大资源恢复越快。'
    })
    public resourceRecoverAmount = 1;

    @property({
        displayName: '手动投放消耗',
        tooltip: '玩家每次主动投放消耗的资源数量。若当前模式关闭“投放消耗旧资源”，该值不会生效。'
    })
    public manualSpawnCost = 1;

    @property({
        displayName: '覆盖手动投放 Y',
        tooltip: '是否覆盖手动投放时生成位置的 Y 坐标。开启后使用下方“手动投放 Y”，关闭后使用投放器自身位置。'
    })
    public overrideManualSpawnY = true;

    @property({
        displayName: '手动投放 Y',
        tooltip: '手动投放时使用的 Y 坐标，仅在开启“覆盖手动投放 Y”时生效。数值越大生成位置越高。'
    })
    public manualSpawnY = 1;

    @property({
        displayName: '长按投放间隔',
        tooltip: '玩家长按手动投放区域时，连续投放之间的间隔，单位秒。数值越小投放越快；建议不要低于 0.02，避免生成过密。'
    })
    public manualSpawnHoldInterval = 0.05;

    @property({
        displayName: '自动投放间隔',
        tooltip: '自动投放间隔，单位秒。仅在当前模式开启“启用自动投放”时生效。数值越小投放越频繁。'
    })
    public autoSpawnInterval = 0.5;

    @property({
        displayName: '自动投放 X',
        tooltip: '自动投放时使用的 X 坐标。0 表示从中间投放，负数偏左，正数偏右。'
    })
    public autoSpawnX = 0;

    @property({
        displayName: '自动投放 Z',
        tooltip: '自动投放时使用的 Z 坐标，决定自动投放落点的前后位置。仅在启用自动投放时生效。'
    })
    public autoSpawnZ = -0.2;

    @property({
        displayName: '随机掉落间隔',
        tooltip: '旧随机掉落间隔，单位秒。仅在当前模式开启“启用随机掉落”时生效。'
    })
    public randomDropInterval = 5;

    @property({
        displayName: '每批随机掉落数量',
        tooltip: '旧随机掉落每次触发生成的物品数量。仅在当前模式开启“启用随机掉落”时生效。'
    })
    public randomDropAmount = 1;
}
