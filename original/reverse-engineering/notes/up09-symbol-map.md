# UP9 第一批符号映射

本表记录 `original/reverse-engineering/decompiled/up09/` 到 `semantic/` 的逐步命名结果。只把已有字节码/运行时文档能够支撑的结论写成确定名称。

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `Bobby.a` | `display` | 已确认 | 构造时调用 `Display.getDisplay(this)`，`startApp()` 用它设置当前 Displayable。 |
| `Bobby.b` | `runtime` | 已确认 | 构造为 `new a(this)`，同时作为 Displayable 和 Runnable 使用。 |
| `Bobby.c` | `runtimeThread` | 已确认 | `startApp()` 创建 `new Thread(this.b)` 并启动。 |
| `a.e` | `shutdownRequested` | 已确认 | `destroyApp()` 唯一直接写入 `this.b.e = true`；后续需在 `a.run()` 中继续确认退出检查位置。 |
| `a.aw` | `playerDirection` | 已确认 | `docs/reference/runtime-animation.md` 已由原版字节码确认 `0/1/2/3 = 左/右/上/下`。 |
| `a.bC` | `ambientPhase8` | 已确认 | 原版动态格 8 相循环计数器。 |
| `a.bD` | `ambientPhase6` | 已确认 | 原版动态格 6 相循环计数器。 |
| `a.bE` | `ambientPhase4` | 已确认 | 原版动态格 4 相循环计数器。 |
| `a.bF` | `ambientPhase3` | 已确认 | 原版动态格 3 相循环计数器。 |
| `a.cu` | 待定 | 未确认 | `byte[][]`；需要从 DAT 加载、碰撞与写入点继续追踪。 |
| `a.cv` | 待定 | 未确认 | `byte[][]`；需要从 DAT 加载、碰撞与写入点继续追踪。 |
| `a.dH` | 待定 | 未确认 | `byte[][]`；需要确认是否为关卡临时/显示/运行缓存。 |
| `a.dI` | 待定 | 未确认 | `byte[][]`；需要确认是否为关卡临时/显示/运行缓存。 |

## 下一批优先恢复

1. `a.run()`：主循环、约 62ms 节拍、退出条件。
2. DAT 载入方法：确认 terrain/object 两个二维 byte grid 的实际字段。
3. 玩家格坐标与像素坐标。
4. 输入方向到一次移动判定的调用链。
5. World mutation 集中写入点。

每恢复一批符号，都应同时补充：原始方法/字段、调用位置、状态意义、确认方式以及仍存在的歧义。
