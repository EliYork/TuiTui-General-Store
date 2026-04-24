# Project Working Notes

## Cocos Scene And Prefab Editing

When a task involves Cocos Creator scene or prefab work, prefer editing the serialized
`.scene` and `.prefab` files directly instead of only giving manual editor steps.

Default to directly completing these operations when the requested data is clear:

- Add, delete, or move nodes.
- Add `UITransform`, `Button`, `Label`, `Sprite`, `Widget`, or custom script components.
- Set node `Position`, `Rotation`, `Scale`, `Layer`, `Content Size`, and `Anchor`.
- Set serialized custom script component parameters.
- Bind scene references such as `GameManager`, `Label`, `Button`, `SpawnRoot`, and `Prefab`.
- Restore missing button events and component references.
- Modify prefab `Rigidbody`, `Collider`, and custom `ItemPrefabConfig` parameters.

Constraints:

- Do not rebuild the entire `Canvas`.
- Do not change existing node UUIDs unless it is required.
- Do not break existing button events, script references, or prefab references.
- If the meaning of a Cocos serialized field is uncertain, stop and ask for manual confirmation before editing it.

After each scene or prefab edit, report:

- Which `.scene` or `.prefab` files were changed.
- Which nodes were added, modified, deleted, or moved.
- Which components were added or modified.
- Which references were bound.
- Which parameters should be checked in the Cocos editor.

After editing, run a static sanity check when practical:

- The file remains valid JSON.
- Serialized `__id__` references point to existing entries.
- New `_id` values are not duplicated.
- Custom script `__type__` values match the corresponding script `.meta` UUID-derived type.

## Cocos 参数与 UI 中文化规范

本项目面向中文使用者和中文维护者。以后新增或修改 Cocos 脚本、场景、Prefab、UI 时，必须遵守以下规则：

1. TypeScript 变量名、方法名、类名保持英文，不要使用中文变量名，保证代码可维护、可搜索、兼容工具链。

2. 所有暴露到 Cocos Inspector 的可调参数，必须尽量添加中文 `tooltip`。
   - 如果 Cocos Creator 当前版本支持 `displayName`，可以同时添加简洁中文显示名。
   - tooltip 要说明这个参数控制什么、调大会怎样、调小会怎样、有什么注意事项。
   - 不要只写“参数”“速度”“开关”这类无意义描述。

3. 新增 `@property` 时默认写法示例：

```ts
@property({
  tooltip: '长按连续投放的间隔，数值越小投放越快。当前 0.05 手感较好，不建议随意改大。'
})
holdInterval = 0.05;
```
