# Engine API 契约

Engine 的公开边界分成两个明确入口：

```text
@bobby/engine             gameplay runtime
@bobby/engine/authoring   Editor / tooling authoring API
```

`@bobby/engine` 是稳定的产品运行时合同。Web、Adventure、Embed 等宿主只能通过这个入口控制一张地图的 gameplay，不得读取 `World`、`Renderer`、`Camera`、`EntityStore`、`SpatialIndex`、Registry、RuntimeActionScheduler 或其他实现对象。

`@bobby/engine/authoring` 是显式 opt-in 的编辑/工具入口。Editor 可以复用 Entity Definition、footprint、Presence、SpatialIndex 与 Visual authoring 能力，但这些类型不会因此成为 gameplay runtime API。

Engine 加载地图时为未知 Entity type 和字段合同不匹配的已知 Entity 实例创建惰性占位定义。占位实例保留格子与堆叠位置、显示 X、不携带 Trait 或 Behavior，并通过 level warning 报告原因；其它可识别 Entity 继续正常运行。

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
    camera: {
      zoom: 1,
      minZoom: 0.25,
      maxZoom: 4,
      followDurationMs: 320,
      panBounds: "viewport",
    },
    timing: {
      worldHz: 60,
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

默认 `worldHz = 60`，即 `stepMs ≈ 16.67ms`。它只驱动：

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
    worldHz: 60,
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

Behavior 的 `CommandQueue.relocate()` 用于 Portal 等中点位置切换：它清除 Entity 当前的 `WorldMotion` 并写入新的整数 anchor。切换后的连续移动必须继续产生 semantic intent，以复用正式通行与碰撞裁决。

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
game.setZoomAt(1.25, clientX, clientY);
game.setZoomLimits(0.8, 4);
game.zoomBy(1.1);
game.panByScreen(dx, dy);

game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

`setHeldDirection()` 只更新 continuous input state；真正 movement 在后续 `WorldTick` 采样执行。`move()` 是显式一次性语义动作，但同样必须遵守 WorldClock pause 与 gameplay `inputBlocked`，不能作为旁路推进暂停中的 World。

`move()` 会把一次性语义动作排入下一个 World Tick，与键盘、Pointer、摇杆和 Replay
输入共用 `GameplaySession` 的输入阶段。提交动作时尚未产生 `MoveResult`；执行结果通过
Game 状态、事件和 Replay Tick 结果观察。

## GameplaySession 与 Replay

`GameplaySession` 是不依赖 DOM、Canvas 和 Renderer 的单局 gameplay 运行边界。它使用
同一套正式配置创建 World，并支持真实时间推进、显式 Tick 推进和暂停单步。浏览器
`Game` 与无头 `ReplayRunner` 共用该实现。

Replay 必须从 tick 0 开始，不持久化 Entity runtime state 或中途 WorldSnapshot。完整
格式、确定性边界与校验规则见 [`replay.md`](replay.md)。

浏览器 `Game` 提供与无头 Runner 共用输入调度的表现层回放入口：

```ts
game.startReplayRecording({
  name: "1-1",
  url: window.location.href,
});
const replay = game.stopReplayRecording();
game.setTimeScale(4);
game.startReplayPlayback(replay, { skipIdleTime: true });
game.pauseReplayPlayback();
game.resumeReplayPlayback();
game.stopReplayPlayback();
game.jumpReplayToEnd(replay);
game.replayPlaying;
game.replayPaused;
```

`setTimeScale()` 接受任意有限正数，同时调整 World 与 Presentation 相对真实时间的推进
倍率，并作用于普通游戏、录制和播放。Replay 开始与停止不修改倍率。暂停保留当前位置，
停止退出 Replay 控制并恢复宿主进入播放前的暂停状态。
`jumpReplayToEnd()` 仍从 tick 0 快速执行，只在终点渲染当前状态。

`skipIdleTime` 用于压缩稳定状态下超过一秒的无输入区间，并在下一次输入前保留短暂的
表现间隔。压缩期间仍逐个执行 World Tick；新的 WorldMotion、阻塞输入的 RuntimeAction
或 WorldEvent 会中断当前批次，因此地图内计时与自动机关保持同一条 gameplay 时间线。
该选项默认关闭，不进入 Replay 文件格式。

录制调用方提供当前地图的显示名称与 URL；Engine 在停止时补充终局状态和空白 `note`。
这些 `meta` 字段不参与播放调度，用户可以直接编辑 `note`。

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

基础运行配置覆盖输入、Gameplay HUD、Camera、timing 与 presentation tuning：

```ts
runtime: {
  input: {
    keyboard: true,
    pointer: true,
    movement: true,
    undo: true,
    redo: true,
    pan: true,
    zoom: true,
    pinchZoom: true,
    wheelZoom: true,
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
  camera: {
    zoom: 1,
    minZoom: 0.25,
    maxZoom: 4,
    followDurationMs: 320,
    panBounds: "viewport",
  },
  timing: {
    worldHz: 60,
    presentationHz: 60,
  },
  tuning: {},
}
```

`camera.zoom / minZoom / maxZoom / followDurationMs / panBounds` 在 `Game` 构造期间应用，第一次加载与渲染关卡时已经生效。`followDurationMs` 控制 Portal、Debug Teleport 等非连续目标跳转的镜头过渡时长。宿主可以为不同产品体验提供不同初值和范围；运行中的手势与产品操作继续使用 `Game` façade 调整 Camera。

`setZoom()` 围绕 Canvas 中心缩放；`setZoomAt()` 接收 Canvas 的浏览器 client 坐标，并保持该屏幕点下的世界位置不动。Camera 首次加载地图时使用视口边界构图：大于视口的地图贴住窗口边缘，小地图居中。`panBounds: "viewport"` 在后续 Pan 中继续维持该边界；`panBounds: "map-edge"` 允许用户操作后把地图四条边移动到视口中心，同时避免把整张地图拖离视口。

地图具有多个 player actor 时，Camera 对全部 actor 共同构图。共同构图只会临时降低实际 zoom，并可突破 `minZoom` 以保证所有 actor 同时可见；用户请求的 zoom 仍保留，回到单目标构图时恢复。Gameplay HUD 第一行投影共享目标，后续两行依次投影 primary 与 secondary actor 的独立背包。

`input.zoom` 控制键盘 Zoom，并作为 `pinchZoom / wheelZoom` 的缺省值。宿主可以分别配置后两者，例如 Embed 可以启用 Pinch 而关闭滚轮 Zoom。双指手势在 `pan` 启用时同时根据中心位移平移 Camera。

Engine 启用 Screen Joystick 或 Gameplay HUD 后负责它们的完整生命周期。宿主不复制基础 Gameplay 控件，只负责产品层 UI。

浏览器可能在首次用户交互前暂停 `AudioContext`。`AudioRuntime.isMusicInteractionRequired()` 提供当前阻塞状态，`onMusicInteractionRequiredChange()` 提供状态订阅；宿主据此呈现交互提示，并在用户输入时调用 `resume()`。该状态只描述浏览器音频能力，不进入 Game gameplay state。

## InputController

`InputController` 把浏览器输入翻译成固定 `WorldTick` 上的语义输入。浏览器事件只维护 held / queued state：

```ts
const state = input.update(time); // WorldTick
```

Game 尝试 movement 后把 `moved / blocked / busy` 回填给 repeat 状态机。Pointer pan / pinch / wheel zoom 是 presentation 操作，可以即时调用 Game façade，不等待 WorldTick。

默认控制绑定从 Bobby 的 Map 字段派生。`channel-1` 是 primary，`channel-2` 是 secondary；只有 primary 通道时方向键与 WASD 都映射到它，同时存在两个通道时方向键与 WASD 分别映射到二者。每个目标的 `mirrorX / mirrorY` 在输入源变成 semantic move intent 前组合应用。一个输入采样生成的多 actor intent 使用同一 movement transaction；目的格冲突会原子地拒绝所有争用者。

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
