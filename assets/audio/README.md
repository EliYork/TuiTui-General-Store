# 音效源文件目录

这个目录用于暂存和管理项目音效源文件。当前 Cocos Creator 工程实际读取的音频资源在：

```text
cocos/coin-pusher-cocos/assets/audio/
```

推荐流程：

1. 先把未压缩或待处理的源文件放在这里。
2. 裁剪、降噪、压缩并统一命名。
3. 将最终使用的 `.mp3` 或 `.wav` 复制到 Cocos 工程的 `assets/audio/`。
4. 回到 Cocos Creator，等待资源导入完成，再在 `AudioManager` 的 `AudioService` 上绑定对应 Clip。

建议命名：

| 用途 | 文件名 |
| --- | --- |
| 投放/硬币落下 | `coin-drop.mp3` |
| 物品掉落/获得 | `item-drop.mp3` |
| 按钮点击 | `button-click.mp3` |
| 解锁/发现 | `unlock.mp3` |
| 错误/资金不足 | `error.mp3` |

音效应尽量短、干净、音量接近。移动端资源建议优先使用体积较小的 `.mp3`。
