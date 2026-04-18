# 技术结构说明

## 技术结构

项目采用“轻量 TypeScript + 微信小游戏最小入口”的方式组织：

- `src/` 放 TypeScript 源码
- `dist/` 放编译后的 JavaScript
- 根目录保留微信小游戏要求的最小必要入口文件
- 不引入重型引擎，不预埋暂时用不到的商业化系统

## 模块职责说明

### core

- `Game.ts`：总装配入口
- `GameLoop.ts`：主循环驱动
- `GameState.ts`：运行时状态
- `EventBus.ts`：事件分发
- `render/CanvasSceneRenderer.ts`：场景绘制编排

### gameplay

- `CoinSpawner.ts`：投币生成逻辑
- `entities/Coin.ts`：硬币对象
- `entities/Pusher.ts`：推板对象
- `rewards/RewardSystem.ts`：奖励生成预留

### physics

- `PhysicsWorld.ts`：基础更新与碰撞接口预留

### ui

- `Button.ts`：按钮
- `Hud.ts`：HUD 与提示文字

### data

- `gameConfig.ts`：集中管理数值与布局参数

### services

- `SaveService.ts`：存档接口预留
- `AudioService.ts`：音效接口预留
- `CloudService.ts`：云同步接口预留

### utils

- `math.ts`：基础数学与命中判断工具

## 为什么这样拆分

### 1. 渲染与玩法分开

对象状态在 `gameplay` / `physics`，画面输出在 `render` / `ui`。后面替换表现层时，不需要重写玩法核心。

### 2. 配置集中管理

第一阶段就把数值和布局收进 `data/gameConfig.ts`，避免后续加功能时到处找魔法数字。

### 3. 入口保持轻量

`Game.ts` 只做装配，不把所有逻辑糊成一个大文件。这样第二阶段继续加碰撞、奖励、升级时，只需要在现有模块上扩展。

### 4. 服务能力先预留、后接入

存档、音效、云能力在第一阶段不强做实现，但接口位置已经固定，后续不用再推翻结构。

### 5. 更适合新手理解

每个模块职责都比较单一，阅读路径清晰，便于后续逐步迭代。
