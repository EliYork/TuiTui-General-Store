# 推推杂货店

一个以推币机为核心、逐步扩展经营模式的游戏项目。使用 **Cocos Creator 3.8.8** 开发。

## 当前玩法

项目已包含以下核心模块：

### 基础推币机循环
- 投放、推动、掉落、收集。
- 手动投放（点击/长按区域）。
- 随机物品掉落与配置化投放（可通过模式配置控制开关和间隔）。
- 资源系统：包含投放消耗、下一天资源回复等基础循环，具体参数可通过配置调整。

### 经营模式
- 每日目标与日结算。
- 资金、订购单牌组、进货次数限制。
- 达标后进入商店采购，返回后开启下一天。

### 物品系统
- 苹果、香蕉、柠檬等水果物品。
- 物品解锁机制：收集达到指定数量后解锁投放。
- 图鉴面板：展示物品收集状态、已发现/未发现标记。

### 商店
- 每日结算后进入独立商店场景。
- 购买订购单权重（苹果订购单、香蕉订购单、柠檬订购单）。

### UI 系统
- 左侧 HUD：显示资源、模式信息、天数、掉落状态。
- 本日结算面板：显示达标情况、分数、目标。
- 屏幕适配器：处理不同分辨率下的显示。
- 反馈按钮、场景导航等辅助 UI。

### 调试功能
- 内置调试面板（运行时可调用）。
- 支持添加分数、资金、进货次数、重新开局等调试操作。

## 地图系统（待确认）

代码中有地图选择机制（地图一、地图二）及相关配置参数，包括初始掉落数和风险提示值。该系统目前可能处于预留/配置阶段，具体玩法效果需在编辑器中实际验证。

## 目录结构

```text
.
├─ assets/
│  ├─ scenes/              Cocos 场景
│  │  ├─ MainMenu.scene         主菜单
│  │  ├─ Prototype01.scene      推币机和经营模式主场景
│  │  └─ ShopScene.scene        每日结算后的商店场景
│  ├─ scripts/
│  │  ├─ core/              核心逻辑
│  │  │  ├─ GameManager.ts       游戏管理器（主控制器）
│  │  │  └─ AudioService.ts      音频服务
│  │  ├─ gameplay/          推币机玩法
│  │  │  ├─ CoinBehaviour.ts     物品行为
│  │  │  ├─ CoinSpawner.ts       投放器
│  │  │  ├─ DropZone.ts          掉落区域
│  │  │  ├─ ItemPrefabConfig.ts  物品 Prefab 配置
│  │  │  └─ PusherController.ts  推币控制器
│  │  ├─ modes/             模式控制
│  │  │  └─ business/
│  │  │     └─ BusinessModeController.ts  经营模式控制器
│  │  ├─ business/          经营模式配置
│  │  │  └─ BusinessModeConfig.ts  经营模式参数（每日目标、物品计分、收益规则）
│  │  ├─ config/            模式配置
│  │  │  ├─ ModeConfig.ts
│  │  │  ├─ ModeConfigTable.ts
│  │  │  ├─ CollectionModeConfig.ts
│  │  │  ├─ ModeBaseConfig.ts
│  │  │  └─ SpawnConfig.ts
│  │  ├─ shop/              商店系统
│  │  │  ├─ ShopConfig.ts
│  │  │  ├─ ShopManager.ts
│  │  │  ├─ ShopPanel.ts
│  │  │  └─ ShopTypes.ts
│  │  └─ ui/                UI 脚本
│  │     ├─ DayResultPanel.ts        本日结算面板
│  │     ├─ EncyclopediaPanel.ts     图鉴面板
│  │     ├─ EncyclopediaItemCard.ts  图鉴物品卡片
│  │     ├─ CameraViewportLayout.ts  相机视口布局
│  │     ├─ ScreenAdapter.ts         屏幕适配器
│  │     ├─ FeedbackButton.ts        反馈按钮
│  │     ├─ SceneNavButton.ts        场景导航按钮
│  │     ├─ ManualSpawnArea.ts       手动投放区域
│  │     ├─ SpawnButtonHold.ts       长按投放按钮
│  │     └─ StaticImageSprite.ts     静态图片精灵
│  ├─ prefabs/              预制体
│  │  ├─ Coin.prefab              金币
│  │  ├─ items/                   物品
│  │  │  ├─ all/
│  │  │  │  ├─ apple.prefab       苹果
│  │  │  │  ├─ banana.prefab      香蕉
│  │  │  │  └─ lemon.prefab       柠檬
│  │  │  ├─ _template/            物品模板
│  │  │  └─ maps/                 地图相关
│  │  └─ ui/
│  │     └─ ItemCard.prefab       物品卡牌
│  ├─ audio/                音频资源
│  ├─ textures/             纹理资源
│  ├─ art_source/           美术源文件
│  │  ├─ food/              食物素材
│  │  └─ icons/             图标素材
│  ├─ materials/            材质
│  ├─ models/               模型
│  └─ physics-materials/    物理材质
├─ package.json             项目配置
└─ tsconfig.json            TypeScript 配置
```

## Cocos Creator 开发

使用 **Cocos Creator 3.8.8** 打开项目根目录。

### 常用场景

- `assets/scenes/MainMenu.scene`：主菜单。
- `assets/scenes/Prototype01.scene`：推币机和经营模式主场景。
- `assets/scenes/ShopScene.scene`：每日结算后的商店场景。

### 验收流程

从 `Prototype01.scene` 开始运行。  
1. 达成本日目标 → 进入日结算面板。  
2. 结算通过 → 进入商店采购。  
3. 关闭商店 → 返回下一天。

## 商店商品

| 商品 | 价格 | 效果 |
| --- | ---: | --- |
| 苹果订单 | ￥3 | 苹果订购单权重 +1 |
| 香蕉订单 | ￥5 | 香蕉订购单权重 +1 |
| 柠檬订单 | ￥10 | 柠檬订购单权重 +1 |

## 构建

Android 构建可通过 Cocos Creator 菜单 **项目 → 构建发布** 生成。项目根目录下的 `build/` 文件夹为本地构建输出目录，通常不需要手动编辑。

## 维护约定

- 新玩法优先新增独立脚本，避免把所有逻辑塞进 `GameManager`。
- 场景和 Prefab 修改遵循最小改动原则，不重建 `Canvas`，不无故改已有 UUID。
- 玩家可见 UI 默认使用中文；TypeScript 类名、变量名和方法名保持英文。
- 调整数值时优先集中到配置结构或 Inspector 参数，不把价格、权重、文案散落在多个脚本里。
- 修改 Cocos 场景后，至少确认 JSON 合法、`__id__` 引用有效、自定义脚本组件类型与 `.meta` 匹配。
