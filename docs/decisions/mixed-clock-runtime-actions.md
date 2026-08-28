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

Behavior
  canEnter / canLeave / onTouch / onEnter / onLeave / onTick 等事件响应

RuntimeAction
  跨多个 WorldTick 持续存在的 gameplay 过程

WorldClock
  固定步长 gameplay 时间

PresentationClock
  RAF 驱动的表现时间
```

RuntimeAction 与 Behavior 都只能通过 World Query + Command 读写 gameplay。Presentation 可以读取 World，但不能回写 gameplay。

## Timing

统一入口：

```ts
runtime.timing = {
  worldHz: 16,
  presentationHz: 60,
};
```

`worldHz` 与 `presentationHz` 相互独立。Theme 可以改变 presentation sampling，但不能通过改变 WorldClock 改变游戏规则。

持续时间使用毫秒语义，不把 `4 ticks`、`16 ticks` 之类采样数量散落到业务代码。这样未来调整频率不会自动改变真实动作时长。

## RuntimeAction policy

Action 可以声明：

```ts
blocksInput?: boolean;
cameraTarget?: EntityId;
```

`inputBlocked` 是 active actions 的派生事实，不手工维护全局 BlockingCounter。Camera target 是 gameplay policy；Camera tween 仍由 PresentationClock 负责。

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

Undo 点由玩家语义 move 创建；forced movement / blocking sequence 不创建额外用户 Undo 点。Undo 恢复 gameplay 后丢弃当前 Presentation transition。

## Hard rules

1. Animation complete callback 不得推进 World。
2. RuntimeAction 不得直接修改 EntityStore，必须走 CommandQueue。
3. WorldClock pause 时任何普通 movement API 都不得绕过时钟推进 gameplay。
4. PresentationClock 可以在 gameplay pause 时继续运行。
5. Pure cosmetic animation 不进入 World state。
6. 跨时间且影响规则的过程必须成为可检查、可快照的 gameplay state，而不是隐藏 timer。
