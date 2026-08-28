# Engine API 契约

Engine 的公开边界分成两个明确入口：

```text
@bobby/engine             gameplay runtime
@bobby/engine/authoring   Editor / tooling authoring API
```

`@bobby/engine` 是稳定的产品运行时合同。Web、Adventure、Embed 等宿主只能通过这个入口控制一张地图的 gameplay，不得读取 `World`、`Renderer`、`Camera`、`EntityStore`、`SpatialIndex`、Registry 或其他实现对象。

`@bobby/engine/authoring` 是显式 opt-in 的编辑/工具入口。Editor 可以复用 Entity Definition、footprint、Presence、SpatialIndex 与 Visual authoring 能力，但这些类型不会因此成为 gameplay runtime API。

核心目标始终是：**给 Engine 一份纯语义 `LevelMap` 和少量运行配置，就能够独立运行这张地图。** Campaign、路由、collection、DAT provenance、存档与产品导航都属于 Engine 外层。

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
      timedChallenge: true,
    },
  },
});

const { game, input } = runtime;
```

宿主销毁 session 时只需要：

```ts
runtime.destroy();
```

也可以直接创建 `Game`，但公开能力仍与同一 façade 保持一致：

```ts
const game = new Game({ canvas, assets, audio, profile, runtime });
await game.loadLevel(level);
```

## EngineClock

Engine gameplay 使用固定世界时钟，默认 `16Hz`：

```ts
interface EngineTick {
  tick: number;
  stepMs: number; // 默认 62.5
}
```

浏览器 `requestAnimationFrame` 只是调度来源；Game 内部的 `EngineClock` 用 accumulator 把真实经过时间转换为固定 Tick。Input、World behavior 和 Visual motion 都消费同一个 `EngineTick`，显示器 60/120/144Hz 不会改变 gameplay 节奏。

正常使用 `Game` / `createGameplayRuntime()` 时宿主不需要自己推进时钟。`EngineClock`、`ENGINE_TICK_RATE`、`ENGINE_TICK_STEP_MS` 与 `EngineTick` 作为公开基础类型提供给显式输入适配、测试或 Embed 组合使用。

## Game façade

`Game` 对外暴露语义动作与只读 gameplay state：

```ts
game.move("left");
game.setHeldDirection("up");
game.setHeldDirection(null);

game.undo();
game.redo();
game.restart();

game.setZoom(1.25);
game.setZoomLimits(0.8, 2.75);
game.zoomBy(1.1);
game.panByScreen(dx, dy);

game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

`setHeldDirection()` 只更新 continuous input state；真正的 movement 在后续 `EngineTick` 采样执行。`move()` 是显式一次性语义动作，仍可由宿主直接调用。

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
// 禁止：World 是实现细节
game.world.state;
game.world.completed;

// 禁止：Renderer / Camera 是实现细节
game.renderer.camera.zoom;
game.renderer.camera.sourceTileSize;
```

对应能力必须使用 `game.state`、`game.zoom`、`game.sourceTileSize` 或语义方法。

## GameplayState

`game.state` 是宿主 UI 的稳定只读快照：

```ts
interface GameplayState {
  status: "playing" | "won" | "dead";
  deathReason: string | null;
  moves: number;

  player: { x: number; y: number };
  facing: Direction;

  inventory: Readonly<InventoryState>;
  profile: Readonly<ProfileCapabilities>;
  ridingMower: boolean;

  objective: {
    mode: ObjectiveMode;
    remaining: number;
    total: number;
  };

  forced: {
    kind: ForcedKind;
    direction: Direction;
  } | null;

  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  canUndo: boolean;
  canRedo: boolean;
  timedChallengeRemainingMs: number | null;
}
```

宿主页面可以据此展示产品 UI，但不能为了读取更多状态而取得 `World`。

## Runtime Config

基础运行配置覆盖输入、Gameplay HUD、Screen Joystick 与 presentation tuning：

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
    timedChallenge: true,
  },
  tuning: {},
}
```

Engine 启用 Screen Joystick 或 Gameplay HUD 后负责它们的完整生命周期。宿主不复制基础 Gameplay 控件，只负责产品层 UI。

`GameOptions.assets` 使用公开的 `VisualAssetSources`：

```ts
interface VisualAssetSources {
  atlasUrl: string;
  imageUrls?: Readonly<Record<string, string>>;
  sourceTileSize?: number;
}
```

资源 ID 如何映射到 Entity Visual 是 Engine 内部 EntityModule 的职责；宿主只提供资源地址。

## InputController

`InputController` 把浏览器输入翻译成固定世界 Tick 上的语义输入。它可以由 `createGameplayRuntime()` 自动管理，也可以显式创建。

```ts
const input = new InputController(game, {
  movement: true,
  undo: false,
  redo: false,
  restart: true,
  pan: true,
  zoom: true,
  debug: false,
});
```

浏览器事件只维护内部 held / queued state。Game 的统一世界时钟每 Tick 调用：

```ts
const state = input.update(time); // time: EngineTick
```

当前语义状态为：

```ts
interface InputState {
  move: Direction | null;
}
```

Game 尝试该 movement 后会把 `moved / blocked / busy` 结果回填给 Input repeat 状态机。普通 runtime 宿主不需要手动执行这套循环，因为 `Game` 已经持有并推进 EngineClock。

外部方向控制器统一通过：

```ts
input.setHeldDirection("left");
input.setHeldDirection(null);
```

键盘、Screen Joystick、Pointer 离散 movement 都走同一个 Tick 边界。Pointer pan/pinch/wheel zoom 仍是 presentation 操作，可以即时调用 Game façade。Input 层不得访问 Renderer 或 Camera 实例。

## Events

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

细粒度地图事实通过 `WorldEvent`：

```ts
const unsubscribe = game.onWorldEvent((event) => {
  // event.type / entityId / x / y / direction / action / text / data
});
```

事件只描述语义事实，不泄漏 EntityStore、CommandQueue 或 Behavior 实例。
