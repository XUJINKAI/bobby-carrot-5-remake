# Replay 合同

Replay 用于记录一张 `LevelMap` 从正式起点开始的玩家语义输入，并在浏览器或 Node
中通过同一套 `GameplaySession` 重新执行。Replay 的首要用途是生成可长期运行的
Engine 回归测试。

## 执行模型

一次 World Tick 使用固定顺序：

```text
推进已有 WorldMotion、RuntimeAction 与 onTick
        ↓
处理归属于当前 Tick 的玩家语义输入组
        ↓
结算 WorldEvent、ActorLifecycle 与 WorldOutcome
```

`GameplaySession` 持有 World、WorldClock、正式 gameplay 初始化、控制映射和历史记录。
浏览器 `Game` 使用真实时间驱动 Session；`ReplayRunner` 直接逐 Tick 驱动 Session，
不等待真实时间，也不创建 Canvas、Renderer 或 Presentation。

## 起点

Replay 必须从 tick 0 开始。运行结果只由以下内容重建：

```text
LevelMap
+ World Hz
+ Bobby gameplay 运动参数
+ 初始 Profile / Economy
+ 逐 Tick 玩家语义输入
```

Replay 不保存 `WorldSnapshot`、Entity runtime state、WorldMotion、RuntimeAction 或中途
恢复点。跳转和重新接管通过从 tick 0 快速执行到目标 Tick 实现。现有 Undo / Redo
快照仍是单局游戏的内部能力，不属于 Replay 格式。

使用不可序列化 `initializeEntityState` 回调的 Session 不能录制 Replay；对应入口需要先
提供可序列化、可从起点重建的正式运行配置。

## 输入

Replay 记录控制映射之后、World 判定之前的 `WorldIntentGroup`。因此它保留：

- 多 Actor 同时操作的分组；
- 输入的 Tick 与组内顺序；
- 被阻挡、处于 busy 状态或被 RuntimeAction 消费的输入尝试。

键盘、Pointer 和摇杆原始事件不进入 Replay。机关产生的 forced intent 由 World 在重放
时重新计算。

## 时间与速率

`worldHz` 是 Replay 运行条件，决定固定 `stepMs`。World 速度只决定真实时间内消费
多少 Tick，不进入 Replay；1×、8×与无头运行必须产生相同 gameplay 结果。

Presentation Hz、Presentation 速度、Camera、Renderer 和音频均不进入 Replay。

## 校验

Replay 使用规范化 LevelMap 指纹检查地图兼容性，并保存最终终局、移动计数与 canonical
World state 指纹。Runner 每次从起点运行到 `endTick` 后验证这些结果。

状态指纹是变更检测手段，不代表原版事实。涉及原版机制的预期仍须依据
`docs/reference/` 或原版验证流程确认。
