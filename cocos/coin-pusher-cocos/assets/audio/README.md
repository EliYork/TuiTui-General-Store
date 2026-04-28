# Cocos 音频资源

这里存放 Cocos Creator 工程运行时使用的音效文件。资源导入后，需要在场景里的 `GameRoot/AudioManager` 节点上绑定到 `AudioService`。

## 绑定位置

1. 打开 `assets/scenes/Prototype01.scene`。
2. 找到 `GameRoot/AudioManager`。
3. 检查 `AudioService` 组件。
4. 将本目录里的音频资源拖到对应属性上。
5. 确认 `GameManager.audioService` 引用仍指向这个 `AudioService`。

## 推荐资源表

| Inspector 属性 | 推荐文件名 | 用途 | 建议时长 |
| --- | --- | --- | ---: |
| `coinDropClip` | `coin-drop.mp3` | 投放、落币、轻触碰反馈 | 0.10-0.25 秒 |
| `itemDropClip` | `item-drop.mp3` | 水果掉落或获得反馈 | 0.15-0.35 秒 |
| `buttonClickClip` | `button-click.mp3` | UI 按钮点击 | 0.05-0.20 秒 |
| `unlockClip` | `unlock.mp3` | 图鉴解锁、发现新物品 | 0.25-0.60 秒 |
| `errorClip` | `error.mp3` | 资金不足、不可操作提示 | 0.10-0.25 秒 |

当前目录里如果只有部分音效，未绑定的属性可以先留空；`AudioService` 会跳过空 Clip，不应影响玩法运行。

## 制作建议

- 使用短促、清晰、偏可爱的音色，避免过长混响。
- 移动端推荐 `.mp3`，采样率 44.1kHz 或 48kHz。
- 峰值音量建议留出约 3dB 到 6dB 余量，避免多个音效叠加时破音。
- 新增音效后不要手写 `.meta`，让 Cocos Creator 自动导入生成。
