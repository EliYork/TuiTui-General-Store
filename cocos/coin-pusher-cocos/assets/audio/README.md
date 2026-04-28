# 音频素材目录

正式音效放在本目录：`cocos/coin-pusher-cocos/assets/audio/`。

请在 Cocos 编辑器里手动创建节点并绑定，不要依赖外部脚本直接修改 `.scene`：

1. 在 `GameRoot` 下创建空节点 `AudioManager`。
2. 给 `AudioManager` 添加 `AudioService` 组件。
3. 把本目录里的 `.mp3` 或 `.wav` 音频拖到 `AudioService` 对应槽位。
4. 把 `AudioManager` 上的 `AudioService` 拖到 `GameManager.audioService`。

## 推荐槽位

| 槽位 | 推荐文件名 | 用途 | 建议时长 | 建议大小 |
| --- | --- | --- | ---: | ---: |
| `coinDropClip` | `coin-drop.mp3` | 主动投放成功 | 0.10-0.25 秒 | 40 KB 内 |
| `itemDropClip` | `item-drop.mp3` | 普通掉落/结算反馈 | 0.15-0.35 秒 | 50 KB 内 |
| `buttonClickClip` | `button-click.mp3` | 按钮点击/重新开始 | 0.05-0.20 秒 | 30 KB 内 |
| `unlockClip` | `unlock.mp3` | 解锁新物品 | 0.25-0.60 秒 | 80 KB 内 |
| `errorClip` | `error.mp3` | 失败或不可操作反馈 | 0.10-0.25 秒 | 40 KB 内 |

优先使用 `.mp3`，建议单声道、44.1kHz 或 48kHz。音量峰值不要贴满，建议保留 3dB 到 6dB 余量，避免刺耳。
