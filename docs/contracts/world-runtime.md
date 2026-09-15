# World Runtime 契约

本文定义 Engine 内部的 gameplay 时间、空间与终局语义。World 负责通用运行协议和最终裁决；Entity 组合 Fact、Mechanism 与专属 Behavior 的合同见[Engine 机制合同](engine-mechanisms.md)。

## 三层事实

| 层 | 权威状态 | 时钟 | 可以影响 gameplay |
| --- | --- | --- | --- |
| 网格事实 | Entity anchor、SpatialIndex、entity/global state、actor lifecycle、world outcome | WorldClock | 是 |
| 运动事实 | WorldMotion、progress、marker、interruption | WorldClock | 是 |
| 动画表现 | offset、sprite、effect、sound、camera | PresentationClock | 否 |

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

SpatialIndex 在加载、增删、移动、状态或方向重建与恢复时同步维护 Type、Entity Fact 和 Presence Fact 投影。对象查询合并两种 Fact 并按 Entity ID 去重、排序；格子裁决读取对应 Presence 的当前 Fact。World 只解释其协议规定的 kernel Fact，通行、Push 与奖励等 gameplay Fact 由 Mechanism 消费。

Behavior tick 通过 TickIndex 查询显式 Behavior 或 Entity-bound Mechanism 提供了 `onTick` 的候选 Entity，再按首个 Presence 解析实际 hook。候选在 tick phase 开始时按 ID 排序取样；统一 commit 后生成的 Entity 从下一次 tick phase 开始参与。Definition、Behavior 或 Mechanism 注册表变化时重新解析候选类型；镜头位置不参与候选判断。

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
- Mower 等对象特例可用 `contacts` 为标准 passage 提供完整 source / target Presence 栈；
- primary 是否随方向更新；
- 本次 movement 的 lifecycle 与 markers；
- 与 primary 同一事务移动的 companions，例如载具或乘客。

同一 plan 的参与者拥有共同 reservation identity，因此可以有意共享目的格；不同 plan 仍会发生 destination conflict。World 只实现这套通用规则，不识别 Flight、Fireball、Leaf、Cloud、Mower 或 Entity 私有 relation 字段。

特殊规则的职责边界为：Entity 决定 policy，World 校验边界、busy 状态与 reservation，并提交 Grid Fact 和 WorldMotion。Behavior 不能借助 policy 直接修改 EntityStore 或推进时间。

Cloud / Leaf 的对象规则在格边界规划下一格：静态阻挡按 Plank、Ice Block、Crumbly Rock、Fence 的对象身份判断；风或水流改向受阻时尝试原方向，停在潮流或瀑布上的 Leaf 继续等待下一次规划。World 对每个提案执行统一的边界、运动状态和目的格预留检查。Fireball 的地形域、对象阻挡、Mirror 入射和 Ice Block 融化同样由 Entity 领域完成。

## Marker

Marker 是持续 gameplay 过程中的一次性语义阈值，不是 sprite frame、脚步声帧或某个 Entity 的固有属性。

标准移动默认使用以下 marker；MovementPolicy 可以为单次 movement 提供另一组可序列化定义：

| progress | marker | 语义 |
| --- | --- | --- |
| 0.5 | `departed` | 结算来源格 `onLeave` |
| 0.5 | `interaction` | 结算目标格 `onEnter` 与成功交互记录 |
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

`WorldOutcome` 是关卡终局的唯一状态；终局原因、关联 actor 与发生时间都从该 Store
读取。`GlobalState` 只保存步数、经过时间、交互序号等真实可变的 world-level 值，
空间计数由当前 Spatial 事实即时投影。

Motion 终态使用有序 delta 表达：down 保留 interrupted pose 供死亡表现读取；revive 发出 `motion-cleared` 后回到权威 grid anchor；destroy 依次产生 interrupt、clear、entity destroy。Presentation 只消费这段事实序列。

## Debug Timeline

Debug 不新增“运动事实”独立 tab。现有 Timeline 是跨时钟观察轴：它同时记录 WorldDelta sequence、WorldTick、worldTimeMs 和 PresentationFrame。Actor 面板分别显示整数 anchor、连续 WorldPose、WorldMotion、ActorLifecycle 与 Presentation runtime。

这种布局能直接检查完整因果链，而不会把“网格事实”和“运动事实”误认为两套互不相关的 timeline。
