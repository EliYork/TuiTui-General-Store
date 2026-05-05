import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SpawnConfig')
export class SpawnConfig extends Component {
    @property({
        displayName: '允许手动投放',
        tooltip: '关闭后玩家不能通过按钮或点击区域手动投放。',
    })
    public allowManualSpawn = true;

    @property({
        displayName: '初始投放资源',
        tooltip: '旧资源系统的初始数量。经营模式下也作为第 1 天默认可投放额度；之后每天使用“每日投放额度”。',
    })
    public initialSpawnResource = 300;

    @property({
        displayName: '每日投放额度',
        tooltip: '对应旧“当天进货次数”。经营模式中表示每天可主动投放的次数上限。',
    })
    public dailySpawnQuota = 300;

    @property({
        displayName: '手动投放消耗',
        tooltip: '开启“投放消耗旧资源”时，每次手动投放消耗的旧资源数量。',
    })
    public manualSpawnCost = 1;

    @property({
        displayName: '覆盖手动投放 Y',
        tooltip: '开启后手动投放会使用下方固定 Y 坐标；关闭后使用投放点自身高度。',
    })
    public overrideManualSpawnY = true;

    @property({
        displayName: '手动投放 Y',
        tooltip: '手动投放的世界 Y 坐标。通常保持 1 即可。',
    })
    public manualSpawnY = 1;

    @property({
        displayName: '长按投放间隔',
        tooltip: '长按连续投放的间隔，数值越小投放越快。建议不要低于 0.02。',
    })
    public holdSpawnInterval = 0.05;

    @property({
        displayName: '启用自动投放',
        tooltip: '开启后该模式允许自动投放按钮生效；关闭后会自动停止自动投放。',
    })
    public enableAutoSpawn = false;

    @property({
        displayName: '自动投放间隔',
        tooltip: '自动投放每次触发的间隔，单位秒。数值越小投放越快。',
    })
    public autoSpawnInterval = 0.5;

    @property({
        displayName: '自动投放 X',
        tooltip: '自动投放使用的世界 X 坐标。',
    })
    public autoSpawnX = 0;

    @property({
        displayName: '自动投放 Z',
        tooltip: '自动投放使用的世界 Z 坐标。',
    })
    public autoSpawnZ = -0.2;

    @property({
        displayName: '启用随机掉落',
        tooltip: '开启后会按间隔自动从世界掉落物品。经营模式通常关闭，图鉴模式通常开启。',
    })
    public enableRandomDrop = false;

    @property({
        displayName: '随机掉落间隔',
        tooltip: '随机掉落每批触发的间隔，单位秒。',
    })
    public randomDropInterval = 5;

    @property({
        displayName: '每批随机掉落数量',
        tooltip: '每次随机掉落生成多少个物品。0 表示不开启实际掉落。',
    })
    public randomDropBatchCount = 1;

    @property({
        displayName: '资源回复上限',
        tooltip: '旧资源系统自动回复的上限。',
    })
    public resourceRegenCap = 300;

    @property({
        displayName: '资源回复间隔',
        tooltip: '旧资源系统每次自动回复的间隔，单位秒。0 表示不回复。',
    })
    public resourceRegenInterval = 5;

    @property({
        displayName: '每次回复资源',
        tooltip: '旧资源系统每次自动回复增加的数量。',
    })
    public resourceRegenAmount = 1;
}
