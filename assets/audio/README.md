# 音频素材预留目录

这里是轻量小游戏运行层的音频预留目录。Cocos 工程正式音效请优先放到：

`cocos/coin-pusher-cocos/assets/audio/`

Cocos 里的绑定方式是手动创建 `GameRoot/AudioManager`，挂 `AudioService`，再把音频拖到 Inspector 槽位。当前推荐槽位：

- `coinDropClip`：`coin-drop.mp3`
- `itemDropClip`：`item-drop.mp3`
- `buttonClickClip`：`button-click.mp3`
- `unlockClip`：`unlock.mp3`
- `errorClip`：`error.mp3`
