# 机关实现模式

本项目不为每个 Tile 建深层继承树，而使用轻量、数据驱动的规则组织：

```text
原始 terrain/object ID
        |
        v
规则/通行/状态转换
        |
        v
World Action / World Event
```

随着逆向深入，一个机制可以拥有进入、离开、动作、Tick 更新等行为，但原始 ID 必须始终可追溯，方便和 JAR 字节码、Debug Inspector 对照。

避免这种结构：

```text
RedSwitchTile extends ColoredSwitchTile extends SwitchTile extends Tile ...
```

项目不需要完整 ECS 框架，只借用“数据与行为解耦、规则可组合”的思想。
