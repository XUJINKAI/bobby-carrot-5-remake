# World Runtime 契约

本文定义 Engine 内部的 gameplay 时间、空间与终局语义。目标是让原版机关在现代 Trait / Behavior Engine 中得到等价功能与表现，不复刻原版双层 tile 运行时的历史妥协。

## 三层事实

| 层 | 权威状态 | 时钟 | 可以影响 gameplay |
| --- | --- | --- | --- |
| 网格事实 | Entity anchor、SpatialIndex、entity/global state、actor lifecycle、world outcome | WorldClock | 是 |
| 运动事实 | WorldMotion、progress、marker、interruption | WorldClock | 是 |
| 动画表现 | offset、sprite、effect、sound、camera | PresentationClock | 否 |

玩家移动被阻挡时，网格位置、World gameplay 朝向与步数保持不变；Presentation 使用该次
输入的尝试方向覆盖 Bobby 的显示朝向，并直接显示对应方向的静止终止帧。这项反馈不进入
World snapshot，也不会让纯阻挡输入成为 Replay gameplay 命令。

玩家移动被阻挡时，网格位置、World gameplay 朝向与步数保持不变；Presentation 使用该次
输入的尝试方向覆盖 Bobby 的显示朝向，并直接显示对应方向的静止终止帧。这项反馈不进入
World snapshot，也不会让纯阻挡输入成为 Replay gameplay 命令。

一次移动提交时，Entity anchor 可以立即变成目标整数格；同时 WorldMotion 保留 `from → to` 和连续 progress。因而 Bobby 在中点死亡时：

- 网格 anchor 仍是目标格；
- WorldMotion 在 `progress = 0.5` 进入 interrupted；
- WorldPose 是半格位置；
- Presentation 从 interruption delta 得知先播放半段移动，再停在半格播放死亡。

半格不是把网格坐标改成浮点数，也不是 Presentation 私自推测出来的坐标。它是 World 持有的连续空间事实。

## WorldDelta

SpatialIndex 在加载、增删、移动、方向重建与恢复时同步维护 type / Trait 的 Entity 索引。Trait 合并 Definition、实例与全部 footprint Presence，并按 Entity identity 去重、排序。玩家与目标查询复用该索引；机关状态变化仍按既有 phase 顺序结算。

Behavior tick 通过 TickIndex 查询显式绑定或 Trait 绑定了 `onTick` 的候选 Entity，再按首个 Presence 解析实际 hook。候选在 tick phase 开始时按 identity 排序取样，统一 commit 后生成的 Entity 从下一次 tick phase 开始参与。注册表新增 Definition 或 Behavior 绑定时重新解析候选类型；镜头位置不参与候选判断。

每次 `World.step()` / `World.update()` 返回有序 `WorldDelta[]`。`sequence` 是跨 WorldTick 的权威因果顺序；`worldTick` 与 `worldTimeMs` 表示事实发生在哪个 gameplay 时间点。

Delta 包括：

- Entity / global mutation；
- RuntimeAction start / cancel；
- WorldMotion start / progress / marker / complete / interrupt；
- ActorLifecycle 与 WorldOutcome transition；
- 对外语义 WorldEvent。

Presentation、Debug、Audio 可以分别消费同一序列。消费者不得通过动画完成回调反向推进 World。

## MovementPolicy 与 MovementPlan

Entity Behavior 使用纯查询的 `planMovement()` 提出特殊移动规则，World 将所有 policy 合并并校验为单一 `MovementPlan`，然后统一裁决和原子提交。Policy 可以描述：

- 使用标准 passage，或由 Entity 已完成领域判定的 unrestricted passage；
- primary 是否随方向更新；
- 本次 movement 的 lifecycle 与 markers；
- 与 primary 同一事务移动的 companions，例如载具或乘客。

同一 plan 的参与者拥有共同 reservation identity，因此可以有意共享目的格；不同 plan 仍会发生 destination conflict。World 只实现这套通用规则，不识别 Flight、Fireball、Leaf、Cloud、Mower 或 Entity 私有 relation 字段。

特殊规则的职责边界为：Entity 决定 policy，World 校验边界、busy 状态与 reservation，并提交 Grid Fact 和 WorldMotion。Behavior 不能借助 policy 直接修改 EntityStore 或推进时间。

## Marker

Marker 是持续 gameplay 过程中的一次性语义阈值，不是 sprite frame、脚步声帧或某个 Entity 的固有属性。

标准移动默认使用以下 marker；MovementPolicy 可以为单次 movement 提供另一组可序列化定义：

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

RuntimeAction 请求移动后，World 返回带 `actionId` 的权威 `MoveResult`。Action 通过 `onIntentResult` 处理 blocked、边界和冲突，不比较前后坐标猜测结果。连续 action 的 deadline 在当前 WorldMotion 进行时继续累计；到达下一格时若 deadline 已满足，可以在同一 WorldTick 接续下一段 motion，避免插入 stationary tick。

Action cancellation 带明确 reason，并在删除 action 前执行 `onCancel` 清理 owner-local gameplay state。Cancel 只停止未来调度；已经提交的 WorldMotion 保持为 World 事实并正常完成，除非 actor lifecycle 或 entity destroy 明确中断它。

判断一个原版 task 应落在哪层，关键不是原版类名，而是现代 Engine 中后续 gameplay 是否依赖过程进度：

- Plank 若放下后立即可通行：即时 World mutation + Presentation 动画。
- Bean growth 在成长完成前不可攀爬：WorldClock 上的持续 gameplay action，并在语义 marker 改变 climbable 事实。
- Fireball / Cloud 等移动实体若中途位置参与碰撞：WorldMotion 或其他 WorldClock 连续过程。

## ActorLifecycle 与 WorldOutcome

Actor 独立处于 `active | downed | eliminated`；World 独立处于 `playing | won | lost`。

- 一个 actor downed 时，只取消其 owner-scoped action、其中断 motion、阻塞其输入。
- 仍有 active player 时，World 继续推进，其他 actor 和 world systems 不停止。
- 所有 player 都无法行动时，World 才进入 lost。
- `reviveActor()` 只提供 Engine 能力，把 playing World 中的 downed actor 恢复为 active，并清除死亡时保留的 interrupted motion；具体距离、消耗、动画和机关不属于本次基础设施。
- World 已进入终态后不会通过 revive 重新打开。

为兼容现有外层状态，`GlobalState.dead/completed/deathReason` 由 WorldOutcome 同步；它们不再是 actor 死亡的源事实。

Motion 终态使用有序 delta 表达：down 保留 interrupted pose 供死亡表现读取；revive 发出 `motion-cleared` 后回到权威 grid anchor；destroy 依次产生 interrupt、clear、entity destroy。Presentation 只消费这段事实序列。

## Debug Timeline

Debug 不新增“运动事实”独立 tab。现有 Timeline 是跨时钟观察轴：它同时记录 WorldDelta sequence、WorldTick、worldTimeMs 和 PresentationFrame。Actor 面板分别显示整数 anchor、连续 WorldPose、WorldMotion、ActorLifecycle 与 Presentation runtime。

这种布局能直接检查完整因果链，而不会把“网格事实”和“运动事实”误认为两套互不相关的 timeline。
