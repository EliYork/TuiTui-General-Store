# Project Working Notes

## Cocos Scene And Prefab Editing

当任务涉及 Cocos Creator 场景或 Prefab 修改时，优先直接编辑序列化的 `.scene` 和 `.prefab` 文件，而不是只给手动编辑器步骤。

但必须遵守最小改动原则：

- 优先最小改动。
- 能新增独立节点解决的，不要重构已有节点。
- 能新增脚本处理的，不要大改已有核心脚本。
- 不要重建整个 `Canvas`。
- 不要无故更改已有节点 UUID。
- 不要破坏已有按钮事件、脚本引用、Prefab 引用。
- 本轮任务无关的美术、数值、物理参数、UI 布局不要顺手调整。
- 如果没有项目文件访问权限，或无法安全确认序列化字段含义，则改为提供精确手动步骤和 Codex 提示词。

当请求数据明确时，可以直接完成以下操作：

- 添加、删除、移动节点。
- 添加或修改 `UITransform`、`Button`、`Label`、`Sprite`、`Widget`、自定义脚本组件。
- 设置节点 `Position`、`Rotation`、`Scale`、`Layer`、`Content Size`、`Anchor`。
- 设置序列化的自定义脚本参数。
- 绑定场景引用，例如 `GameManager`、`Label`、`Button`、`SpawnRoot`、`Prefab`。
- 恢复缺失的按钮事件和组件引用。
- 修改 Prefab 的 `Rigidbody`、`Collider` 和自定义 `ItemPrefabConfig` 参数。

如果涉及以下情况，不要硬改 `.scene` / `.prefab`，先说明风险并请求确认：

- 不确定某个 `__type__`、`__id__`、`_objFlags`、`_lpos`、`_euler`、`_contentSize` 等字段含义。
- 需要批量重建 `Canvas`、`Camera`、`PhysicsSystem`、Project Settings、Layer/Tag 配置。
- 需要移动大量节点，且无法确认父子层级是否会影响现有引用。
- 需要修改 Cocos 内置资源、材质、Mesh、FBX 导入资源的 `.meta`。
- 需要删除看似无用但可能被场景或 Prefab 引用的资源。
- 需要新增自定义脚本组件，但无法从对应 `.ts.meta` 中确认 uuid 和 Cocos 序列化所需的 `__type__` 写法。

每次场景或 Prefab 修改后，必须报告：

- 修改了哪些 `.scene` 或 `.prefab` 文件。
- 添加、修改、删除或移动了哪些节点。
- 添加或修改了哪些组件。
- 绑定了哪些引用。
- 哪些参数需要在 Cocos Creator 编辑器里检查。

修改后尽量运行静态 sanity check：

- 文件仍然是合法 JSON。
- 序列化 `__id__` 引用指向存在的对象。
- 新增 `_id` 没有重复。
- 自定义脚本 `__type__` 与对应脚本 `.meta` 信息一致，不要凭空猜测。

每次修改完成后，必须提供简短验收清单：

- 在 Cocos Creator 里打开哪个场景。
- 需要检查哪些节点是否存在。
- 需要确认哪些引用。
- 运行后应该点击什么按钮。
- 预期看到什么结果。
- 如果失败，优先查看哪些 Console 报错。

## Cocos 参数与 UI 中文化规范

本项目面向中文使用者和中文维护者。以后新增或修改 Cocos 脚本、场景、Prefab、UI 时，必须遵守以下规则：

1. TypeScript 变量名、方法名、类名保持英文，不要使用中文变量名，保证代码可维护、可搜索、兼容工具链。

2. 新增 UI 文案默认使用中文。
   - 按钮文案要短，例如：`开始经营`、`返回菜单`、`继续游戏`。
   - 提示文案尽量可爱但清楚，避免过长。
   - 临时功能可以标注：`敬请期待`、`测试中`。
   - 不要把 `coin`、`item`、`fruit`、`resource` 等英文直接显示给玩家，玩家可见文案统一用中文。

3. 所有暴露到 Cocos Inspector 的可调参数，必须尽量添加中文 `tooltip`。
   - 如果 Cocos Creator 当前版本支持 `displayName`，可以同时添加简洁中文显示名。
   - tooltip 要说明这个参数控制什么、调大会怎样、调小会怎样、有什么注意事项。
   - 不要只写“参数”“速度”“开关”这类无意义描述。

3. 节点名必须尽量使用中文，TypeScript 代码里保持英文命名。

示例：

```ts
@property({
  tooltip: '长按连续投放的间隔，数值越小投放越快。当前 0.05 手感较好，不建议随意改大。'
})
holdInterval = 0.05;