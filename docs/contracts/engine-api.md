# Engine API 契约

Engine 的公开边界分成两个明确入口：

```text
@bobby/engine             gameplay runtime
@bobby/engine/authoring   Editor / tooling authoring API
```

`@bobby/engine` 是稳定的产品运行时合同。Web、Adventure、Embed 等宿主只能通过这个入口控制一张地图的 gameplay，不得读取 `World`、`Renderer`、`Camera`、`EntityStore`、`SpatialIndex`、Registry、RuntimeActionScheduler 或其他实现对象。

`@bobby/engine/authoring` 是显式 opt-in 的编辑/工具入口。Editor 可以复用 Entity Definition、footprint、Presence、SpatialIndex 与 Visual authoring 能力，但这些类型不会因此成为 gameplay runtime API。

核心目标始终是：**给 Engine 一份纯语义 `LevelMap` 和少量运行配置，就能够独立运行这张地图。** Campaign、路由、collection、DAT provenance、存档与产品导航都属于 Engine 外层。

> `LevelMap.music` 的选曲归属存在尚待解决的合同冲突，参见
> [背景音乐选曲职责 ADR](../decisions/background-music-selection-ownership.md)。本合同的现有表述暂予保留。

## Gameplay runtime

推荐由高层 factory 创建 session：

```ts
const runtime = await createGameplayRuntime({
  canvas,
  level,
  assets,
  audio,
  profile,
  runtime: {
    input: {
      keyboard: true,
      pointer: true,
      undo: true,
      screenJoystick: { enabled: true },
    },
    hud: {
      objective: true,
      inventory: true,
    },
    timing: {
      worldHz: 16,
      presentationHz: 60,
    },
  },
});

const { game, input } = runtime;
```

宿主销毁 session 时只需要 `runtime.destroy()`。也可以直接创建 `Game`，但公开能力仍与同一 façade 保持一致。

## 混合时钟

Engine 明确区分 gameplay 与 presentation 两套时间。

World 内部进一步区分整数网格事实与连续运动事实；两者都由 WorldClock 推进，Presentation 只消费有序语义 delta。完整约束见 [`world-runtime.md`](world-runtime.md)。

### WorldClock

`WorldClock` 是 gameplay 的固定步长时钟：

```ts
interface WorldTick {
  tick: number;
  stepMs: number;
}
```

默认 `worldHz = 16`，即 `stepMs = 62.5ms`。它只驱动：

- Input gameplay sampling；
- World / Behavior；
- WorldMotion / MovementRuntime；
- RuntimeActionScheduler；
- forced movement 与其他 gameplay rule。

### PresentationClock

`PresentationClock` 由 `requestAnimationFrame` 提供真实时间并按独立采样频率产生：

```ts
interface PresentationFrame {
  frame: number;
  nowMs: number;
  deltaMs: number;
}
```

默认 `presentationHz = 60`。它只驱动：

- VisualRuntime tween；
- Camera interpolation；
- sprite / ambient animation；
- 其他纯表现状态。

WorldClock pause 不会暂停 PresentationClock。动画完成也不得反向触发 gameplay mutation。

统一配置入口为：

```ts
runtime: {
  timing: {
    worldHz: 16,
    presentationHz: 60,
  },
}
```

任何 gameplay 或 animation duration 都应以毫秒表达。改变 `worldHz` 或 `presentationHz` 只改变采样粒度，不应让一个 `250ms` 的动作凭空变快或变慢。

未来 modern / retro 若需要不同帧感，应优先改变 `presentationHz`（例如 modern 60、retro 16），而不是改变 World gameplay 规则。

## Entity / Behavior / MovementPlan / WorldMotion / RuntimeAction

持续跨多个 WorldTick 的 gameplay 过程使用 RuntimeAction，而不是 Promise、wall-clock timer 或第二套 Actor 模型：

```text
Entity          这个东西是什么 / 当前 gameplay state
Behavior        事件发生时如何响应
MovementPlan    一次移动的通行、参与者与 lifecycle 裁决输入
WorldMotion     具有连续位置与 marker 的空间 gameplay 过程
RuntimeAction   一个正在持续进行的 gameplay 过程
```

Behavior 通过纯查询 `MovementPolicy` 描述特殊通行、携带关系与 marker；World 将 policies 规范化为一个 `MovementPlan`，负责通用边界、reservation、busy 状态与原子提交。World 不识别具体 Entity 机制或私有 state 字段。

RuntimeAction 按 action id 稳定顺序在 WorldClock 上推进，通过同一 CommandQueue 修改 World。Action 可以声明：

```ts
{
  blocksInput?: boolean;
  focus?: { entityId: EntityId };
}
```

`inputBlocked` 从当前 active actions 派生，不依靠手工 `counter++ / counter--` 配平。`focus` 只是 gameplay policy；Camera 如何平滑跟随仍属于 Presentation。

RuntimeAction 产生 semantic intent 后，由 World 回传带 action identity 的权威 `MoveResult`。Blocked、边界与 destination conflict 在 `onIntentResult` 处理；取消时 `onCancel` 按明确 reason 清理 owner-local gameplay state。

RuntimeAction、WorldMotion、ActorLifecycle 与 WorldOutcome 都是 gameplay state，因此进入 World snapshot。Presentation tween / Camera transition 不进入 snapshot。

## Undo / Redo

Game 在启用历史记录且开始新的玩家语义操作时，于 move 前保存 gameplay snapshot。`runtime.history.mode: "disabled"` 时跳过历史快照；`historyBoundary: false` 的续接步骤沿用已有待提交快照。Snapshot 包含 Entity / GlobalState / RuntimeAction gameplay state，但不包含视觉插值。

Undo 后：

```text
restore gameplay snapshot
        ↓
丢弃当前 Visual transition
        ↓
从恢复后的 Grid Truth 重新 render
```

强制移动链不会额外创建用户 Undo 点。因此例如踩龙尾触发阻塞火球后，Undo 的目标是踩龙尾之前的玩家状态，而不是“火球飞到一半”的 Presentation 状态。

## Game façade

`Game` 对外暴露语义动作与只读 gameplay state：

```ts
game.move("left");
game.setHeldDirection("up");
game.setHeldDirection(null);

game.undo();
game.redo();
game.restart();
game.killActor(actorId);
game.reviveActor(actorId);

game.setZoom(1.25);
game.setZoomLimits(0.8, 2.75);
game.zoomBy(1.1);
game.panByScreen(dx, dy);

game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

`setHeldDirection()` 只更新 continuous input state；真正 movement 在后续 `WorldTick` 采样执行。`move()` 是显式一次性语义动作，但同样必须遵守 WorldClock pause 与 gameplay `inputBlocked`，不能作为旁路推进暂停中的 World。

常用只读状态：

```ts
game.hasLevel;
game.state;
game.zoom;
game.sourceTileSize;
game.isAnimating;
game.canUndo;
game.canRedo;
game.debug;
game.lastMove;
game.lastWorldEvents;
```

以下写法属于架构违规：

```ts
// 禁止：World / Scheduler 是实现细节
game.world.state;
game.world.actions;

// 禁止：Renderer / Camera 是实现细节
game.renderer.camera.zoom;
```

对应能力必须使用稳定 façade 或 DebugRuntime。

## Runtime Config

基础运行配置覆盖输入、Gameplay HUD、timing 与 presentation tuning：

```ts
runtime: {
  input: {
    keyboard: true,
    pointer: true,
    movement: true,
    undo: true,
    redo: true,
    restart: true,
    pan: true,
    zoom: true,
    debug: true,
    screenJoystick: {
      enabled: true,
      opacity: 0.45,
      deadZone: 0.2,
    },
  },
  hud: {
    objective: true,
    inventory: true,
  },
  timing: {
    worldHz: 16,
    presentationHz: 60,
  },
  tuning: {},
}
```

Engine 启用 Screen Joystick 或 Gameplay HUD 后负责它们的完整生命周期。宿主不复制基础 Gameplay 控件，只负责产品层 UI。

浏览器可能在首次用户交互前暂停 `AudioContext`。`AudioRuntime.isMusicInteractionRequired()` 提供当前阻塞状态，`onMusicInteractionRequiredChange()` 提供状态订阅；宿主据此呈现交互提示，并在用户输入时调用 `resume()`。该状态只描述浏览器音频能力，不进入 Game gameplay state。

## InputController

`InputController` 把浏览器输入翻译成固定 `WorldTick` 上的语义输入。浏览器事件只维护 held / queued state：

```ts
const state = input.update(time); // WorldTick
```

Game 尝试 movement 后把 `moved / blocked / busy` 回填给 repeat 状态机。Pointer pan / pinch / wheel zoom 是 presentation 操作，可以即时调用 Game façade，不等待 WorldTick。

## Events

Renderer 按图片图层的实际屏幕像素范围跳过视口外绘制，包含 sprite 帧尺寸、锚点、偏移、旋转和移动插值。自定义 Canvas 图层的绘制范围由回调决定，保持执行。该优化只减少绘制提交；World 更新与场景构建仍处理完整地图，屏幕外机关继续运行。

高层 Game 生命周期事件：

```ts
game.on("change", ...);
game.on("move", ...);
game.on("blocked", ...);
game.on("level-loaded", ...);
game.on("debug-change", ...);
game.on("death", ...);
game.on("level-complete", ...);
```

细粒度地图事实通过 `WorldEvent` 暴露。事件只描述语义事实，不泄漏 EntityStore、CommandQueue、Behavior 或 RuntimeAction 实例。
