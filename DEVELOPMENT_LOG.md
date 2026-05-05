# 开发记录

> 本文档记录《推推杂货店》的主要开发进展。小型文案调整、临时测试改动和未提交实验不一定记录。具体开发方向见 ROADMAP.md，当前项目说明见 README.md。
>
> **整理说明**：本次初始整理主要基于 `git log --oneline --all`、README.md、ROADMAP.md、AGENTS.md 和当前代码结构。由于未逐条展开每个 commit diff，阶段记录中的"涉及文件"以当前代码结构为参考，不代表该阶段仅修改了这些文件。

## 记录规则

- 中等以上功能、流程修复、关键配置变化、ROADMAP 中 P0/P1 目标完成时记录。
- 每条记录尽量包含：修改内容、涉及文件、验收结果、后续注意。
- 小型错别字、纯格式调整、未提交测试改动可以不记录。
- 如果内容来自当前代码状态而非明确提交历史，请标注"根据当前代码状态整理"。

---

## 初始整理：根据当前代码状态和 Git 提交历史

以下内容根据 Git 提交历史和当前代码状态整理，按开发阶段排列。具体日期以 Git 提交时间为准。

### 阶段一：3D 推币机原型

**提交记录**：`3d0f018` → `1fbc95d` → `77fc377` → `e2db41b` → `1ebe2c7` → `3fa4b35`

- 修改内容：
  - 建立 Cocos Creator 3.8.8 项目骨架。
  - 实现 3D 推币机基础物理：推板、硬币生成与推动、掉落检测。
  - 硬币优化与信息显示。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/gameplay/PusherController.ts`
  - `assets/scripts/gameplay/CoinBehaviour.ts`
  - `assets/scripts/gameplay/CoinSpawner.ts`
  - `assets/scripts/gameplay/DropZone.ts`
  - `assets/scenes/Prototype01.scene`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段二：水果物品引入与触屏投放

**提交记录**：`cfde0bd` → `400bc92` → `065b417` → `9a06bc8` → `7c3575b` → `cd9d12e` → `75f0db2`

- 修改内容：
  - 导入水果美术素材（苹果、香蕉、柠檬）。
  - 创建物品 Prefab 和 ItemPrefabConfig 组件。
  - 实现触屏点击投放和长按连续投放。
  - 修复投放资源检查和越界清理。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/gameplay/ItemPrefabConfig.ts`
  - `assets/scripts/ui/ManualSpawnArea.ts`
  - `assets/scripts/ui/SpawnButtonHold.ts`
  - `assets/prefabs/items/all/apple.prefab`
  - `assets/prefabs/items/all/banana.prefab`
  - `assets/prefabs/items/all/lemon.prefab`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段三：经营模式 MVP

**提交记录**：`77145d3`（基础闯关玩法）→ `b40f2df`（投放预览与切换）→ `f25028f`（左侧 UI 添加）→ `2006e55`（音效栏位添加）

- 修改内容：
  - 实现经营模式核心流程：每日目标、当日分数、资金、进货次数、日结算。
  - 订购单/进货单权重系统。
  - 下一天流程和资源回复。
  - 左侧 HUD 显示经营模式信息。
  - 投放预览和物品切换。
  - 音效服务集成。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/modes/business/BusinessModeController.ts`
  - `assets/scripts/business/BusinessModeConfig.ts`
  - `assets/scripts/config/ModeConfig.ts`
  - `assets/scripts/config/ModeConfigTable.ts`
  - `assets/scripts/ui/DayResultPanel.ts`
  - `assets/scripts/core/AudioService.ts`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段四：商店系统 MVP

**提交记录**：`89f6b57`（新增商店）

- 修改内容：
  - 创建独立 ShopScene 场景。
  - 实现 ShopManager、ShopPanel、ShopConfig、ShopTypes。
  - 进货单商品：苹果/香蕉/柠檬进货单，可重复购买，增加次日投放权重。
  - 经营加成商品：苹果热销、香蕉热卖、柠檬人气，永久拥有，满足条件后结算额外奖励。
  - 跨场景运行时状态保持（SHOP_RUNTIME_STATE）。
  - 购买后返回 Prototype01 场景，自动进入下一天。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/shop/ShopManager.ts`
  - `assets/scripts/shop/ShopPanel.ts`
  - `assets/scripts/shop/ShopConfig.ts`
  - `assets/scripts/shop/ShopTypes.ts`
  - `assets/scenes/ShopScene.scene`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段五：图鉴与 UI 完善

**提交记录**：`0ccaa5a`（图鉴扩展）→ `5f11d60`（补充 Cocos 参数中文说明并中文化 UI）→ `e30ccdf`（增加反馈按钮，增加 debug 按钮内容）

- 修改内容：
  - 实现图鉴面板（EncyclopediaPanel）和物品卡片（EncyclopediaItemCard）。
  - 展示物品收集状态、已发现/未发现标记。
  - 补充 Cocos Inspector 参数的中文 tooltip 和 displayName。
  - 增加反馈按钮和场景导航按钮。
  - 增加内置调试面板（分数、资金、进货次数、重新开局等）。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/ui/EncyclopediaPanel.ts`
  - `assets/scripts/ui/EncyclopediaItemCard.ts`
  - `assets/scripts/ui/FeedbackButton.ts`
  - `assets/scripts/ui/SceneNavButton.ts`
  - `assets/scripts/ui/CameraViewportLayout.ts`
  - `assets/prefabs/ui/ItemCard.prefab`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段六：屏幕适配与 Android 构建

**提交记录**：`289e1d9`（侧边闪屏修复）→ `2ee9b7f`（修复部分机型/分辨率下超出分辨率导致的花屏问题）

- 修改内容：
  - 实现 ScreenAdapter 处理不同分辨率下的显示。
  - 修复侧边闪屏和花屏问题。
  - Android 构建配置和测试。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/ui/ScreenAdapter.ts`
  - `assets/scripts/ui/CameraViewportLayout.ts`
  - `build/buildConfig_android.json`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段七：音效系统重构

**提交记录**：`67f875c`（改为运行时合成音效以避免二进制资源）→ `dddbf2b`（补齐 reward-spawn 音效映射）→ `2006e55`（音效栏位添加）

- 修改内容：
  - 重构音效系统，改为运行时合成音效以避免二进制资源依赖。
  - 补齐音效映射（coin-drop、item-drop、unlock、button-click、error）。
  - AudioService 单例模式。
- 涉及文件（根据当前代码结构整理）：
  - `assets/scripts/core/AudioService.ts`
  - `assets/audio/`
- 验收状态：根据当前代码状态整理，核心链路已接入，仍需结合 Cocos Editor 预览/实机进一步回归确认。

### 阶段八：项目文档整理

**提交记录**：`f95bbde`（Update README.md）→ `8b650d7`（删除遗留文件）→ `b891505`（Update .gitignore）

- 修改内容：
  - 更新 README.md 为当前项目介绍。
  - 整理 ROADMAP.md 为开发目标文档。
  - 更新 AGENTS.md，已包含 Cocos 场景/Prefab 修改规范和中文化规范。
  - 文档维护规范计划补充，待确认是否已写入。
  - 删除遗留文件，更新 .gitignore。
- 涉及文件：
  - `README.md`
  - `ROADMAP.md`
  - `AGENTS.md`
  - `.gitignore`
- 验收状态：文档已更新，结构清晰。

## 2026-05-05

### 修复商店场景 ShopConfig 绑定

- 修改内容：
  - 在 `ShopScene / Canvas / UIRoot / 商店场景根` 下新增节点"商店配置表"，添加 `ShopConfig` 组件。
  - 将"商店场景根"上的 `ShopManager.shopConfig` 正式绑定到该 `ShopConfig` 组件。
  - `ShopManager.businessModeController` 保持为 `null`，未添加 `BusinessModeController`。
  - 商品配置保持不变：苹果进货单 ￥3、香蕉进货单 ￥5、柠檬进货单 ￥10，经营加成沿用当前序列化配置。
  - 目的：避免 `ShopScene` 缺少 `ShopConfig` 时回退到脚本默认商品配置，让商店配置来源更明确。
  - 静态 sanity check 通过：`ShopScene.scene` 合法 JSON，新增 `__id__` 引用有效，无重复 `_id`，`ShopConfig` 的 `__type__` 与 `.meta` UUID 一致，父子层级和组件 `node` 引用一致。
- 涉及文件：
  - `assets/scenes/ShopScene.scene`
- 验收结果：
  - 在 Cocos Creator 中打开 `ShopScene.scene`，确认"商店配置表"节点存在且挂载 `ShopConfig` 组件。
  - 确认 `ShopManager` 的 `shopConfig` 属性已指向该组件。
  - 从主玩法进入商店，确认商品列表显示正确（3 个进货单 + 3 个经营加成），价格和说明文案与 `ShopConfig` 配置一致。
- 后续注意：
  - `BusinessModeController` 仍为 `null`，购买进货单后权重写入 `SHOP_RUNTIME_STATE`，返回 `Prototype01` 后由 `BusinessModeController` 读取，需确认跨场景权重同步无异常。

---

## 当前状态总结

根据当前代码状态整理：

- **已实现/已接入**：推币机基础循环、经营模式闭环、商店系统、物品系统、图鉴面板、屏幕适配、音效系统、调试工具。
- **待验证**：经营加成结算触发、跨场景权重同步（ShopScene 已绑定 ShopConfig，BusinessModeController 仍为 null）、Android 构建测试、地图系统差异效果。
- **短期重点**：流程稳定性（P0）、信息准确性（P0）、体验打磨（P1）。

---

## 后续追加模板

```markdown
## YYYY-MM-DD

### 标题

- 修改内容：
  - ...
- 涉及文件：
  - ...
- 验收结果：
  - ...
- 后续注意：
  - ...
```
