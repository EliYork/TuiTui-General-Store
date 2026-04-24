# Cocos 参数说明

本文记录当前 Cocos Creator 3.8.8 项目中主要脚本参数的中文含义和调参注意事项。代码变量名保持英文，Inspector 面向中文维护。

## GameManager

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `coinSpawner` | 绑定场景中的投放器 | `SpawnRoot` 上的 `CoinSpawner` | 不适用 | 不适用 | 为空时主动投放和世界随机掉落都不能生成物体。 |
| `mapSelection` | 初始地图选择 | `Map01` | 不适用 | 不适用 | 影响首次运行时地图配置和初始掉落。 |
| `startCoins` | 开局资源 | scene 当前 `30` | 玩家可主动投放更久 | 更快进入资源不足 | 玩家主动投放会消耗资源，资源不足不会生成；脚本默认值为 300，但以 scene Inspector 为准。 |
| `maxCoins` | 被动资源回复上限 | `300` | 被动回复可存更多资源 | 更快到达回复上限 | 掉落奖励可以超过这个上限。 |
| `resourceRegenInterval` | 被动资源回复间隔 | `1` | 回复变慢 | 回复变快 | 单位是秒。 |
| `resourceRegenAmount` | 每次被动回复数量 | `1` | 回复更快 | 回复更慢 | 只影响被动回复。 |
| `spawnCostPerCoin` | 每次主动投放消耗 | `1` | 投放成本更高 | 投放成本更低 | ManualSpawnArea 和自动投放都走资源检查。 |
| `manualSpawnYOverrideEnabled` | 是否覆盖手动投放高度 | `true` | 不适用 | 不适用 | 开启时使用 `manualSpawnY`，关闭时使用投放点高度。 |
| `manualSpawnY` | 手动投放世界 Y | `1` | 生成更高、弹跳可能更明显 | 更贴近台面、可能穿插 | 只影响手动区域投放。 |
| `autoSpawnInterval` | 自动投放间隔 | `0.5` | 自动投放更慢 | 自动投放更快 | 资源不足时自动投放会停止。 |
| `autoSpawnX` | 自动投放世界 X | `0` | 落点向右 | 落点向左 | 0 表示居中。 |
| `autoSpawnZ` | 自动投放世界 Z | `-0.2` | 落点更靠前后方向的一侧 | 落点更靠另一侧 | 当前默认值为 `-0.2`，不要随意改成正值。 |
| `itemCatalog` | 物品配置表 | 苹果/香蕉/柠檬三项 | 增加可用物品 | 减少可用物品 | `itemId` 要和 Prefab 上的 `ItemPrefabConfig.itemId` 对应。 |
| `map01InitialMapItemCount` | 地图一初始随机物体数 | `2` | 开局物体更多 | 开局更清爽 | 是免费系统掉落，不消耗资源。 |
| `map02InitialMapItemCount` | 地图二初始随机物体数 | `3` | 开局物体更多 | 开局更清爽 | 是免费系统掉落，不消耗资源。 |
| `worldDropEnabled` | 是否启用世界随机掉落 | `true` | 不适用 | 不适用 | 世界随机掉落是免费系统掉落，不受资源检查限制。 |
| `worldDropInterval` | 世界随机掉落间隔 | `5` | 掉落更慢 | 掉落更快 | 单位是秒，太小会增加物理压力。 |
| `worldDropAmount` | 每批随机掉落数量 | `1` | 每批物体更多 | 每批物体更少 | 不消耗玩家资源。 |
| `scoreLabel` | 资源 HUD 标签 | `ScoreLabel` | 不适用 | 不适用 | 为空时资源信息不会显示。 |
| `dropCountLabel` | 当前投放/随机掉落 HUD | `DropCountLabel` | 不适用 | 不适用 | 为空时对应 HUD 不更新。 |
| `spawnCountLabel` | 收集/解锁 HUD | `SpawnCountLabel` | 不适用 | 不适用 | 为空时对应 HUD 不更新。 |
| `statusLabel` | 状态提示 HUD | `StatusLabel` | 不适用 | 不适用 | 为空时玩家看不到状态提示。 |
| `showColliderDebug` | 物理碰撞调试显示 | `false` | 显示碰撞线框 | 关闭调试显示 | 正式体验应保持关闭。 |

## ManualSpawnArea

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `gameManager` | 游戏管理器引用 | 场景 `GameManager` | 不适用 | 不适用 | 手动点击和长按投放都通过它生成。 |
| `worldCamera` | 触摸映射用世界相机 | Canvas 下的 UI/世界相机引用 | 不适用 | 不适用 | 绑定错会导致点击位置和投放位置不一致。 |
| `worldLeftX` | 手动投放最左世界 X | `-0.8`（scene 实测） | 左边界向右收窄 | 左边界向左扩展 | 和 `worldRightX` 一起决定横向范围。 |
| `worldRightX` | 手动投放最右世界 X | `0.8`（scene 实测） | 右边界向右扩展 | 右边界向左收窄 | 应大于 `worldLeftX`。 |
| `fixedDepthZ` | 手动投放固定世界 Z | `0.2`（scene 实测） | 落点前后方向改变 | 落点前后方向改变 | 决定水果落在前后哪个位置。 |
| `referencePlaneY` | 射线映射参考 Y | `0` | 映射平面更高 | 映射平面更低 | 会影响触摸到世界坐标的换算。 |
| `xBias` | 投放 X 偏移 | `0` | 整体向右 | 整体向左 | 用于微调手感。 |
| `xScale` | X 响应缩放 | `1` | 横向响应更大 | 横向响应更保守 | 围绕范围中心缩放。 |
| `optionalCurvePower` | 横向响应曲线 | `1` | 中心更细、边缘更明显 | 低于 1 时中心更敏感 | 1 表示线性映射。 |
| `holdEnabled` | 是否允许长按投放 | `true` | 不适用 | 不适用 | 关闭后只保留触摸开始投放。 |
| `spawnOnTouchStart` | 是否按下立即投放 | `true` | 不适用 | 不适用 | 关闭后只在长按间隔到达时投放。 |
| `holdInterval` | 长按连续投放间隔 | `0.05`（scene 实测） | 长按投放变慢 | 长按投放更快 | 当前 `0.05` 手感刚好，不建议随意改。 |
| `debugLog` | 手动投放调试日志 | `false` | 打印更多映射信息 | 关闭日志 | 正式体验应关闭。 |

## SpawnButtonHold / 自动投放按钮

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `gameManager` | 游戏管理器引用 | 场景 `GameManager` | 不适用 | 不适用 | 点击按钮时通过它切换自动投放。 |
| `stateLabel` | 按钮文字 Label | SpawnButton 子节点 Label | 不适用 | 不适用 | 为空时脚本会自动查找子节点 Label。 |
| `autoSpawnOnText` | 自动投放开启文案 | `自动投放：开` | 不适用 | 不适用 | 玩家可见 UI 文案。 |
| `autoSpawnOffText` | 自动投放关闭文案 | `自动投放：关` | 不适用 | 不适用 | Restart 或资源不足停止后会显示这个文案。 |

## ItemPrefabConfig

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `itemId` | 物品逻辑 ID | `apple` / `banana` / `lemon` | 不适用 | 不适用 | 保持英文，必须和 GameManager.itemCatalog 对应。 |
| `itemName` | 玩家可见显示名 | `苹果` / `香蕉` / `柠檬` | 不适用 | 不适用 | HUD、收集提示、解锁提示会显示它。 |
| `value` | 掉入结算区回复资源 | 苹果 `1`、香蕉 `5`、柠檬 `2` | 收集奖励更多 | 收集奖励更少 | DropZone 结算时按该值回复资源。 |
| `weight` | 世界随机掉落权重 | 苹果 `15`、香蕉 `2`、柠檬 `5` | 出现概率更高 | 出现概率更低 | `0` 表示不会进入随机掉落选择。 |

## CoinBehaviour

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `spawnAssistDuration` | 生成稳定辅助时长 | `0.18` | 生成更稳但更钝 | 更自然但可能乱滚 | 只影响刚生成后的短时间。 |
| `maxSpawnHorizontalSpeed` | 生成水平限速 | `0.16` | 滑动更快 | 更稳更慢 | 用于防止刚生成就飞走。 |
| `maxSpawnVerticalSpeed` | 生成垂直限速 | `0.22` | 更容易弹起 | 更贴近台面 | 太小会显得没动感。 |
| `maxSpawnSpinSpeed` | 生成自旋限速 | `1.2` | 旋转更明显 | 旋转更少 | 影响视觉活跃度。 |
| `maxSpawnTumbleSpeed` | 生成翻滚限速 | `0.35` | 翻滚更强 | 更不容易立起 | 太大可能卡边。 |
| `settleAssistDelay` | 贴平辅助延迟 | `0.12` | 更晚介入 | 更早介入 | 用于让物体更平稳落到台面。 |
| `sleepThreshold` | 物理睡眠阈值 | `0.02` | 更容易睡眠 | 更不容易睡眠 | 保持较低可避免物体卡边时过早静止。 |
| `despawnBelowY` | 低处越界销毁 Y | `-10` | 更晚清理低处物体 | 更早清理低处物体 | 越界清理只销毁物体，不加资源、不加分、不计掉落。 |
| `despawnBeyondDistance` | 远处越界销毁距离 | `30` | 更晚清理远处物体 | 更早清理远处物体 | 防止飞出地图后长期占用性能。 |

## DropZone

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `gameManager` | 游戏管理器引用 | 场景 `GameManager` | 不适用 | 不适用 | 物体进入结算区后通过它进行资源回复和解锁处理。 |

DropZone 会调用 `CoinBehaviour.tryMarkScored()` 防止同一个物体重复结算。正常结算会按 `ItemPrefabConfig.value` 回复资源。

## CoinSpawner

| 参数名 | 中文含义 | 推荐初始值 | 调大会怎样 | 调小会怎样 | 注意事项 |
| --- | --- | --- | --- | --- | --- |
| `spawnPoint` | 投放点引用 | `SpawnPoint` | 不适用 | 不适用 | 决定基础生成位置和朝向。 |
| `coinRoot` | 生成物父节点 | `CoinRoot` | 不适用 | 不适用 | 新生成物体会挂在这里，方便管理。 |
| `spawnSpreadX` | 随机 X 散布 | `0.18` | 左右更分散 | 更集中 | 只影响随机位置投放。 |
| `spawnSpreadZ` | 随机 Z 散布 | `0.08` | 前后更分散 | 更集中 | 只影响随机位置投放。 |
| `spawnHeightOffset` | 生成高度偏移 | `0` | 生成更高 | 生成更低 | 太低可能贴近台面，太高可能弹跳明显。 |
| `randomYawDegrees` | 随机水平旋转 | `180` | 外观变化更多 | 外观更统一 | 不应让物体竖起。 |
| `randomTiltXDegrees` | 随机 X 倾斜 | `4` | 更容易翻滚 | 更平稳 | 太大可能一生成就立起。 |
| `randomTiltZDegrees` | 随机 Z 倾斜 | `4` | 更容易翻滚 | 更平稳 | 太大可能卡边。 |
| `launchUpImpulse` | 向上冲量 | scene 当前 `0.025` | 更容易弹起 | 更贴近台面 | 当前 scene 覆盖了脚本默认值。 |
| `launchForwardImpulse` | 向前冲量 | scene 当前 `-0.08` | 推进更明显 | 推进更弱 | 负值表示向机器前方推进。 |
| `randomSideImpulse` | 随机侧向冲量 | scene 当前 `0.012` | 左右更不稳定 | 更稳定 | 太大可能飞出机器区域。 |
| `spinTorque` | 随机旋转力矩 | scene 当前 `0.015` | 旋转更强 | 旋转更弱 | 太大可能翻滚过强。 |

## 运行规则补充

- 玩家主动投放包括 ManualSpawnArea 点击/长按和自动投放，都会消耗资源；资源不足时不会生成物体。
- 世界随机掉落是免费系统掉落，不受资源检查限制。
- 越界清理只销毁飞出场景或掉到很低处的物体，不加资源、不加分、不计掉落。
