# 机关实现模式

本项目使用轻量、数据驱动的 Definition Registry 与固定 gameplay lifecycle：

```text
semantic terrain/object ID
        ↓ O(1) Registry lookup
Terrain/Object Definition
        ↓ synchronous hook
World transaction
        ↓
WorldEvent
```

随着逆向深入，一个机制可以拥有进入、离开、动作、Tick 更新等行为，但 semantic ID 必须始终可追溯，方便和 JAR 字节码、Debug Inspector 对照。

移动事务的顺序固定为：

```text
resolve destination
→ movement interaction
→ passage
→ commit
→ leave / enter hooks
→ goals
→ active rules
→ WorldEvent notification
```

局部机制通过目标格 Definition 直接派发。全图规则在 Level load 时生成当前地图的 active rule 列表，成功移动后只遍历该列表。

具体 Terrain/Object Definition 按内容来源组织：

```text
original/terrain/index.ts        原版 Terrain Definition 注册入口
original/object/index.ts         原版 Object Definition 注册入口
custom/terrain/               扩展 Terrain Definition
custom/object/                扩展 Object Definition 与对应 hook
mechanics/definitions.ts      稳定查询 façade
```

通用能力位于 `mechanics/`。例如 pushable movement transaction 位于 `mechanics/movement/`，Portal Definition 使用 `mechanics/interactions/relocation.ts` 提供的通用重定位能力。

避免这种结构：

```text
RedSwitchTile extends ColoredSwitchTile extends SwitchTile extends Tile ...
```

项目不需要完整 ECS 框架，只借用“数据与行为解耦、规则可组合”的思想。
