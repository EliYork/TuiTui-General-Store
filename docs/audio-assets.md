# 音频素材接入说明

当前项目不再通过外部修改 `.scene` 来创建音频节点。音频由 Cocos 编辑器里手动创建的 `AudioManager` 节点管理，并通过 `AudioService` 组件暴露音频槽。

## Cocos 编辑器接入步骤

1. 打开 `assets/scenes/Prototype01.scene`。
2. 在层级面板选中 `GameRoot`，右键创建空节点，命名为 `AudioManager`。
3. 在 `AudioManager` 上添加 `AudioService` 组件。
4. 把音频资源从 `assets/audio/` 拖到 `AudioService` 对应槽位。
5. 选中 `GameRoot/GameManager`，把 `AudioManager` 上的 `AudioService` 拖到 `GameManager.audioService`。

如果第 5 步忘记绑定，运行时也不会报错；`GameManager` 会尝试使用当前场景里已加载的 `AudioService`，仍找不到就静默跳过播放。

## 素材位置

- Cocos 工程音频目录：`cocos/coin-pusher-cocos/assets/audio/`
- 轻量小游戏运行层预留目录：`assets/audio/`

## 推荐格式

- 优先提交 `.mp3`。
- 建议单声道，44.1kHz 或 48kHz。
- 可以保留 `.wav` 作为本地编辑源，但提交到项目里建议转成 `.mp3`，避免包体过大。
- 音效前后静音各不超过 20ms，避免反馈延迟。

## 槽位、命名、时长和大小

| Inspector 槽位 | 推荐文件名 | 用途 | 建议时长 | 单文件建议上限 |
| --- | --- | --- | ---: | ---: |
| `coinDropClip` | `coin-drop.mp3` | 主动投放物体成功生成 | 0.10-0.25 秒 | 40 KB |
| `itemDropClip` | `item-drop.mp3` | 物体结算、随机掉落生成等普通反馈 | 0.15-0.35 秒 | 50 KB |
| `buttonClickClip` | `button-click.mp3` | 按钮点击、重新开始 | 0.05-0.20 秒 | 30 KB |
| `unlockClip` | `unlock.mp3` | 解锁新可投放物品 | 0.25-0.60 秒 | 80 KB |
| `errorClip` | `error.mp3` | 资源不足、未解锁、缺少配置等失败反馈 | 0.10-0.25 秒 | 40 KB |

## 已有素材

- `cocos/coin-pusher-cocos/assets/audio/coin-drop.mp3`
  - 当前大小：约 4 KB。
  - 用法：拖到 `AudioManager` 的 `AudioService.coinDropClip`。
