import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CollectionModeConfig')
export class CollectionModeConfig extends Component {
    @property({
        displayName: '图鉴模式 ID',
        tooltip: '图鉴模式标识。当前仅作为图鉴模式参数入口，主流程仍通过 ModeConfig 兼容层读取。',
    })
    public modeId = 'collection';

    @property({
        displayName: '图鉴模式显示名',
        tooltip: '图鉴模式在 UI 或日志中的显示名称。',
    })
    public displayName = '图鉴模式';
}
