# 推推杂货店

一个以推币机为核心、逐步扩展经营模式的游戏项目。仓库里目前保留了两套实现：

- `cocos/coin-pusher-cocos/`：当前主要开发工程，使用 Cocos Creator 3.8.8。
- `src/`：早期微信小游戏 TypeScript 原型，保留作为逻辑和实现参考。

后续新增功能默认优先落在 Cocos Creator 工程里。除非明确说明要维护旧原型，不建议把新玩法同时写进 `src/`。

## 当前玩法

当前 Cocos 工程已经包含这些核心模块：

- 推币机基础循环：投放、推动、掉落、收集。
- 经营模式：每日目标、日结算、资金、订购单牌组。
- 水果物品：苹果、香蕉、柠檬等物品配置与掉落。
- 左侧 HUD、结算面板、图鉴入口、音效服务。
- 商店 MVP：每日结算后进入独立商店场景，购买订购单权重。

商店第一版出售的是订购单权重，不是收集任务：

| 商品 | 价格 | 效果 |
| --- | ---: | --- |
| 苹果订单 | ￥3 | 苹果订购单权重 +1 |
| 香蕉订单 | ￥5 | 香蕉订购单权重 +1 |
| 柠檬订单 | ￥10 | 柠檬订购单权重 +1 |

## 目录结构

```text
.
├─ cocos/coin-pusher-cocos/       Cocos Creator 3.8.8 主工程
│  ├─ assets/scenes/              Cocos 场景，例如 MainMenu、Prototype01、ShopScene
│  ├─ assets/scripts/core/        GameManager、音频等核心胶水逻辑
│  ├─ assets/scripts/gameplay/    推币机、投放、掉落、物品组件
│  ├─ assets/scripts/modes/       经营模式控制器
│  ├─ assets/scripts/shop/        商店配置、管理器、界面
│  ├─ assets/scripts/ui/          HUD、按钮、结算面板等 UI 脚本
│  └─ assets/audio/               Cocos 使用的音效资源
├─ src/                           早期微信小游戏 TypeScript 原型
├─ docs/                          设计文档、技术计划、参数说明
├─ assets/audio/                  音效源文件暂存目录
├─ game.js / game.json            微信小游戏入口文件
└─ package.json                   旧原型 TypeScript 构建脚本
```

## Cocos Creator 开发

推荐用 Cocos Creator 3.8.8 打开：

```text
cocos/coin-pusher-cocos/
```

常用场景：

- `assets/scenes/MainMenu.scene`：主菜单。
- `assets/scenes/Prototype01.scene`：当前推币机和经营模式主场景。
- `assets/scenes/ShopScene.scene`：每日结算后进入的全屏商店场景。

验收经营模式时，通常从 `Prototype01.scene` 开始运行。达成本日目标后进入日结算，再进入商店，关闭商店后返回下一天。

## 旧 TypeScript 原型

旧原型仍可用 npm 构建：

```bash
npm install
npm run build
```

构建输出在 `dist/`。开发旧原型时可使用：

```bash
npm run watch
```

这套原型主要用于参考早期 2D/2.5D 推币逻辑；当前 Cocos 工程不会自动从 `src/` 同步代码。

## 文档

- [游戏设计](docs/game-design.md)
- [技术计划](docs/tech-plan.md)
- [任务看板](docs/task-board.md)
- [Cocos 参数说明](docs/cocos-parameters.md)
- [音频资源说明](docs/audio-assets.md)

## 维护约定

- 新玩法优先新增独立脚本，避免把所有逻辑塞进 `GameManager`。
- 场景和 Prefab 修改遵循最小改动原则，不重建 `Canvas`，不无故改已有 UUID。
- 玩家可见 UI 默认使用中文；TypeScript 类名、变量名和方法名保持英文。
- 调整数值时优先集中到配置结构或 Inspector 参数，不把价格、权重、文案散落在多个脚本里。
- 修改 Cocos 场景后，至少确认 JSON 合法、`__id__` 引用有效、自定义脚本组件类型与 `.meta` 匹配。
