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

`InputController` 把浏览器输入翻译成 Game 的语义动作。它可以由 `createGameplayRuntime()` 自动管理，也可以显式创建。

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

外部控制器统一通过：

```ts
input.setHeldDirection("left");
input.setHeldDirection(null);
```

键盘、Screen Joystick、Pointer pan/pinch/wheel zoom 都只能调用 Game façade，Input 层不得访问 Renderer 或 Camera 实例。

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

## Visual boundary

Gameplay 与绘制之间的固定依赖链是：

```text
World
  ↓ readonly query + visual runtime state
VisualRuntime
  ↓ resolve Entity VisualDefinition
  ↓ camera / interpolation / sorting
RenderScene
  ↓
Renderer
  ↓
Canvas
```

职责约束：

- `World` 不知道 sprite、atlas、frame、camera；
- `VisualRuntime` 可以只读查询 World 空间信息，但不能修改 gameplay；
- `RenderScene` 是已经解析完成的绘制描述；
- `Renderer` 只绘制 `RenderScene`，不能读取 World、Registry 或 EntityDefinition；
- Camera 属于 VisualRuntime，不属于 World；
- motion progress、visual offset、animation progress 不进入 LevelMap 或 World snapshot。

因此 Renderer 的接口不能重新演变成：

```ts
renderer.render(world);
```

正确方向始终是：

```ts
renderer.render(scene, camera);
```

## Authoring boundary

Editor 明确从独立入口取得 authoring 能力：

```ts
import {
  createBuiltinEntityRegistry,
  WorldPreview,
  resolveFootprintCells,
  resolveEntityVisualPreview,
} from "@bobby/engine/authoring";
```

Gameplay 页面不得为了方便改从 `/authoring` 读取 World internals。

Editor 的目标是复用 Engine 的空间与视觉语义，而不是重新实现一套 Terrain/Object 逻辑：

```text
LevelMap Entity[]
      ↓
WorldPreview
      ↓
Presence / Cell Stack / Footprint
      ↓
Editor inspect / placement / preview
```

## EntityModule 与源码组织

一个 Entity 的静态 gameplay Definition、专属 Behavior 和 Visual 应当在源码中尽量同址。

复杂 Entity 使用一实体一文件：

```text
engine/src/entities/custom/
  portal.ts
  push-goal.ts

engine/src/entities/original/
  bobby.ts
  dragon.ts
  fence.ts
  speed-switch.ts
  trap.ts
  ice-block.ts
  ...
```

例如 `portal.ts` 自己拥有：

```text
Portal EntityModule
├─ EntityDefinition
├─ Portal Behavior
├─ VisualDefinition
└─ drawPortal()
```

不得重新形成：

```text
definitions.ts   // 所有实体 Definition
behaviors.ts     // 所有实体 Behavior
visuals.ts       // 所有实体 Visual
```

这种按技术层切碎 Entity 的结构。

只有真正跨多个 Entity 共用的机制才能进入共享基础设施，例如：

- `collectible` / `hazard` / `water` 等通用 Trait Behavior；
- atlas cell / Definition factory；
- footprint / registry / visual runtime 等 Engine 基础设施。

完全静态、没有独立 state / behavior / footprint / visual resolver 的 atlas Entity 可以进入 declarative static catalog，但 **Definition 与 Visual cell 必须在同一条声明中**，不能再次拆成两个注册表。

`original/` 与 `custom/` 只表示源码维护目录。两者产生完全相同的 `EntityModule`，进入同一份 registry：

```text
original EntityModule ─┐
                       ├─ builtinEntityModules
custom EntityModule ───┘
                       ↓
        EntityRegistry / VisualRegistry / BehaviorRegistry
```

Registry 不知道 Entity 来自 original 还是 custom。

## Dependency rule

最终依赖方向：

```text
Web / Adventure / Embed
          ↓
    @bobby/engine
          ↓
      Game façade
          ↓
  World + VisualRuntime
          ↓
       Renderer

Editor
  ↓
@bobby/engine/authoring
  ↓
Definition / Preview / Spatial / Visual authoring
```

公开 API 可以增加，但只能增加稳定、通用的 gameplay 或 authoring 能力。**不能因为某个调用方临时需要内部数据，就把 World/Renderer/Registry 实现对象重新导出到 gameplay root。**
