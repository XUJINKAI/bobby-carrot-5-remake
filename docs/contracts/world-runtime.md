# World Runtime 契约

本文定义 Engine 内部的 gameplay 时间、空间与终局语义。目标是让原版机关在现代 Trait / Behavior Engine 中得到等价功能与表现，不复刻原版双层 tile 运行时的历史妥协。

## 三层事实

| 层 | 权威状态 | 时钟 | 可以影响 gameplay |
| --- | --- | --- | --- |
| 网格事实 | Entity anchor、SpatialIndex、entity/global state、actor lifecycle、world outcome | WorldClock | 是 |
| 运动事实 | WorldMotion、progress、marker、interruption | WorldClock | 是 |
| 动画表现 | offset、sprite、effect、sound、camera | PresentationClock | 否 |

一次移动提交时，Entity anchor 可以立即变成目标整数格；同时 WorldMotion 保留 `from → to` 和连续 progress。因而 Bobby 在中点死亡时：

- 网格 anchor 仍是目标格；
- WorldMotion 在 `progress = 0.5` 进入 interrupted；
- WorldPose 是半格位置；
- Presentation 从 interruption delta 得知先播放半段移动，再停在半格播放死亡。

半格不是把网格坐标改成浮点数，也不是 Presentation 私自推测出来的坐标。它是 World 持有的连续空间事实。

## WorldDelta

每次 `World.step()` / `World.update()` 返回有序 `WorldDelta[]`。`sequence` 是跨 WorldTick 的权威因果顺序；`worldTick` 与 `worldTimeMs` 表示事实发生在哪个 gameplay 时间点。

Delta 包括：

- Entity / global mutation；
- RuntimeAction start / cancel；
- WorldMotion start / progress / marker / complete / interrupt；
- ActorLifecycle 与 WorldOutcome transition；
- 对外语义 WorldEvent。

Presentation、Debug、Audio 可以分别消费同一序列。消费者不得通过动画完成回调反向推进 World。

## Marker

Marker 是持续 gameplay 过程中的一次性语义阈值，不是 sprite frame、脚步声帧或某个 Entity 的固有属性。

当前移动 marker 为：

| progress | marker | 语义 |
| --- | --- | --- |
| 0.5 | `departed` | 结算来源格 `onLeave` |
| 0.5 | `interaction` | 结算目标格 `onEnter` 与 reach selector |
| 1.0 | `arrived` | 运动过程完成到达阶段 |

同一进度的 marker 按声明顺序执行。MovementRuntime 保存下一个 marker 索引，所以一个 WorldTick 跨过多个阈值时仍按序各执行一次；snapshot / restore 后也不会重复触发。

Marker 名称描述 gameplay 意义。纯表现 cue 由 Presentation 根据 delta 派生，不进入 World marker 列表。

## Mutation、Motion、RuntimeAction 与 Timeline

- CommandQueue / WorldCommitter：原子、即时的世界 mutation。
- WorldMotion / MovementRuntime：连续空间事实，是 WorldClock 驱动的移动专用 runtime。
- RuntimeAction：更一般的跨 WorldTick gameplay 过程，可以产生 mutation 或 semantic intent。
- Timeline：调度“何时启动”，不是第三套 clock，也不拥有过程本身。

Entity / Behavior 只能查询 World 并请求 command、intent 或 action；它们不推进时间，也不直接修改 World storage。

判断一个原版 task 应落在哪层，关键不是原版类名，而是现代 Engine 中后续 gameplay 是否依赖过程进度：

- Plank 若放下后立即可通行：即时 World mutation + Presentation 动画。
- Bean growth 在成长完成前不可攀爬：WorldClock 上的持续 gameplay action，并在语义 marker 改变 climbable 事实。
- Fireball / Cloud 等移动实体若中途位置参与碰撞：WorldMotion 或其他 WorldClock 连续过程。

## ActorLifecycle 与 WorldOutcome

Actor 独立处于 `active | downed | eliminated`；World 独立处于 `playing | won | lost`。

- 一个 actor downed 时，只取消其 owner-scoped action、其中断 motion、阻塞其输入。
- 仍有 active player 时，World 继续推进，其他 actor 和 world systems 不停止。
- 所有 player 都无法行动时，World 才进入 lost。
- `reviveActor()` 只提供 Engine 能力，把 playing World 中的 downed actor 恢复为 active；具体距离、消耗、动画和机关不属于本次基础设施。
- World 已进入终态后不会通过 revive 重新打开。

为兼容现有外层状态，`GlobalState.dead/completed/deathReason` 由 WorldOutcome 同步；它们不再是 actor 死亡的源事实。

## Debug Timeline

Debug 不新增“运动事实”独立 tab。现有 Timeline 是跨时钟观察轴：它同时记录 WorldDelta sequence、WorldTick、worldTimeMs 和 PresentationFrame。Actor 面板分别显示整数 anchor、连续 WorldPose、WorldMotion、ActorLifecycle 与 Presentation runtime。

这种布局能直接检查完整因果链，而不会把“网格事实”和“运动事实”误认为两套互不相关的 timeline。
