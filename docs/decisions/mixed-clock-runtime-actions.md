# Mixed Clock + Runtime Action Architecture

## Decision

BC5R Engine 使用：

```text
混合时钟 + Entity / Behavior + RuntimeActionScheduler
```

不引入第二套 `GameplayActor` 领域模型，也不使用 Promise / `setTimeout` 表达持续 gameplay。

## Responsibilities

```text
Entity
  持久/运行时 gameplay 身份与状态
  actor-local inventory / mount / locomotion state 也属于对应 Entity

Behavior
  canEnter / canLeave / onTouch / onEnter / onLeave / onTick 等事件响应

RuntimeAction
  跨多个 WorldTick 持续存在的 gameplay 过程

WorldClock
  固定步长 gameplay 时间推进；只定义 clock sampling，不拥有角色速度

PresentationClock
  RAF 驱动的表现时间
```

RuntimeAction 与 Behavior 都只能通过 World Query + Command 读写 gameplay。Presentation 可以读取 World，但不能回写 gameplay。

`GlobalState` 只保存真正的 world-level 状态。某只 Bobby 的背包、载具关系、飞行状态等不能放进 GlobalState；它们必须跟随对应 Entity snapshot。

## Timing ownership

Clock 与 locomotion cadence 是两个概念：

```ts
runtime.timing = {
  worldHz: 16,
  presentationHz: 60,
};
```

`worldHz` / `presentationHz` 只控制两个 clock 如何采样。Bobby 普通移动一格需要多久属于 Bobby locomotion policy，由 `entities/player/BobbyLocomotion.ts` 定义；Ice / Speed / Leaf / Flight 等持续机制的 cadence 由各自 Entity / RuntimeAction 定义。

原版 Bobby 默认普通移动 cadence：

```ts
ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs = 350;
```

Presentation 默认可以采用同样的持续时间来保持视觉同步，但 presentation override 不能反向改变 gameplay cadence。

所有 gameplay 持续时间使用毫秒语义，不把 `4 ticks`、`16 ticks` 之类采样数量散落到业务代码。这样未来调整 WorldClock 频率不会自动改变真实动作时长。

## RuntimeAction policy

Action 可以声明：

```ts
blocksInput?: boolean;
focus?: {
  entityId: EntityId;
};
```

声明 `focus` 的 Action 必然阻止 controlled input。`inputBlocked` 是 active actions 的派生事实，不手工维护全局 BlockingCounter。Camera focus 是 gameplay policy；Camera tween 仍由 PresentationClock 负责。

自动移动不能再通过 `GlobalState.forced` 驱动某个默认 Bobby。Ice / Leaf / Fireball 等机制应由 RuntimeAction 明确持有 owner / target Entity，并产生对应 actor/entity 的 movement intent。

RuntimeAction 不得用 `commands.move()` 实现规则意义上的移动。需要经过 passage / collision / onLeave / onEnter 的移动必须产生 semantic `WorldIntent`，再交回 World resolver。低层 `move` command 只用于 resolver 已经批准后的 transaction commit。

例如 Ice：

```text
Ice.onEnter
  -> delayed-move RuntimeAction(owner = Bobby)
  -> forced MoveIntent(mechanism = ice)
  -> World.step
  -> canLeave / collision / canEnter / onLeave / onEnter
  -> EntityMotion
```

这样撞墙会自然终止，滑入下一块 Ice 会由新的 `onEnter` 建立下一段 Action，且多 Bobby 时 Action 只驱动自己的 owner。

## WorldTick phase barriers

一个 WorldTick 使用稳定的 phase barrier：

```text
RuntimeAction update
  -> commit Action commands
  -> resolve + commit Action semantic intents
  -> Behavior onTick
  -> commit Behavior commands
  -> terminal evaluation / events
```

后一个 phase 必须读取前一个 phase 已 commit 的 World。RuntimeAction 产生的 semantic movement 因此会在同一 tick 内完整经过 World resolver；随后执行的 `Behavior.onTick` 看到的是移动后的坐标和状态，而不是 tick 开始时的旧 snapshot。

Action scheduler 内部仍按稳定 action id 顺序更新。多个 Action 可以在同一 phase 产生 intents，但不能通过 Promise、callback 或 presentation completion 隐式改变 phase 顺序。

## WorldStep / multi-actor

外部控制统一转换成 `WorldIntentGroup`。一个 group 可以包含多只 actor 的 intent，并在一个 `MovementTransaction` 中解析和 commit。

因此：

- Engine 不存在唯一 Bobby 的 movement primitive；
- Arrow / WASD 等 input channel 可以绑定不同 actor；
- push / carry 等复合移动属于同一 transaction；
- UI 可以保留 primary Bobby 的便利视图，但 gameplay 真实状态以 EntityStore 为准。

## Snapshot / Undo

World snapshot 保存 gameplay：

```text
EntityStore
GlobalState
RuntimeActionScheduler state
```

不保存：

```text
Visual tween
Camera tween
PresentationFrame
```

Undo 边界属于玩家发起的 semantic intent group，而不是 `forced: boolean`。后续由一个玩家输入触发的 Ice / Leaf 等连续 gameplay sequence 不应额外制造用户 Undo 点。Undo 恢复 gameplay 后丢弃当前 Presentation transition。

## Hard rules

1. Animation complete callback 不得推进 World。
2. RuntimeAction 不得直接修改 EntityStore；普通 mutation 走 CommandQueue，需要规则解析的 movement 必须走 semantic WorldIntent。
3. WorldClock pause 时任何普通 movement API 都不得绕过时钟推进 gameplay。
4. PresentationClock 可以在 gameplay pause 时继续运行。
5. Pure cosmetic animation 不进入 World state。
6. 跨时间且影响规则的过程必须成为可检查、可快照的 gameplay state，而不是隐藏 timer。
7. Actor-local state 不得通过 GlobalState 模拟；多 actor 时同一物品或载具能力不能串到另一只 actor。
8. Entity-specific cadence 不属于 `time/`；clock sampling 与 gameplay policy 必须分离。
9. WorldTick phase 之间必须 commit；后续 phase 不得继续读取前一 phase 的旧世界。
