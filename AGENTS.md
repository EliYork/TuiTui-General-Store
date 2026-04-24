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
