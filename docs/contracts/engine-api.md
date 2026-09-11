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
  runtime: {
    bobbyLocomotion: { moveMs: 350 },
    initialActorIntents: [
      {
        type: "set-actor-lock-key",
        actor: "all",
        kind: "reusable",
        enabled: true,
      },
    ],
    input: {
      keyboard: true,
      pointer: true,
      undo: true,
      screenJoystick: { enabled: true },
    },
    hud: {
      timer: true,
      steps: true,
      objective: true,
      items: true,
      coins: () => save.economy.bonusCoins,
    },
    dialog: {
      characterIntervalMs: 28,
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

const { game, input, dialog } = runtime;
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
game.dispatch({
  type: "set-actor-locomotion",
  actorId,
  moveDurationMs: 266,
});
game.dispatch({
  type: "set-actor-lock-key",
  actorId,
  kind: "single-use",
  enabled: true,
});

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

game.timedChallengeRemainingMs;
game.timedChallengePhase;
game.presentationBlocksInput;

game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

`setHeldDirection()` 只更新 continuous input state；真正 movement 在后续 `WorldTick` 采样执行。`move()` 是显式一次性语义动作，但同样必须遵守 WorldClock pause 与 gameplay `inputBlocked`，不能作为旁路推进暂停中的 World。

`move()` 会把一次性语义动作排入下一个 World Tick，与键盘、Pointer、摇杆和 Replay
输入共用 `GameplaySession` 的输入阶段。提交动作时尚未产生 `MoveResult`；执行结果通过
Game 状态、事件和 Replay Tick 结果观察。

`dispatch()` 只接受 Engine 定义的封闭 `GameplayEffectIntent` union。
`set-actor-locomotion` 只影响随后创建的 WorldMotion；`set-actor-lock-key` 只表达地图内
Lock 能力。宿主持久化产品结果后，可以按稳定地图身份提交 Entity 替换：

```ts
game.dispatch({
  type: "commit-entity-replacement",
  target: { type: "shop-super-key", x: 21, y: 6 },
  replacementType: "shop-empty",
});
```

目标必须由 `type + x + y` 唯一命中。成功动作销毁目标、在相同 anchor 与 stackOrder
生成替代 Entity。Adventure Restart 重新读取最新 Save，并在载入前把持久结果投影到
LevelMap。商品、价格、货币和永久存档均由外层产品决定。`GameplayState.actors` 只投影
位置、朝向、地图内背包与实际移动时长，不暴露 Entity runtime state。

阻塞对话选择产生的宿主派生效果使用 `game.dispatchInteractionEffect(intent)`。该入口允许
Replay playback 在消费 `choices` 后重走同一交互流程；派生效果本身不写入 Replay，避免
把选项决定和业务结果重复记录。

## GameplaySession 与 Replay

`GameplaySession` 是不依赖 DOM、Canvas 和 Renderer 的单局 gameplay 运行边界。它使用
同一套正式配置创建 World，并支持真实时间推进、显式 Tick 推进和暂停单步。浏览器
`Game` 与无头 `ReplayRunner` 共用该实现。

Replay 必须从 tick 0 开始，不持久化 Entity runtime state 或中途 WorldSnapshot。完整
格式、确定性边界与校验规则见 [`replay.md`](replay.md)。

浏览器 `Game` 提供与无头 Runner 共用输入调度的表现层回放入口：

```ts
game.startReplayRecording({
  id: "original/1-1",
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
`jumpReplayToEnd()` 仍从 tick 0 快速执行，只在终点渲染当前状态；沿途 WorldEvent 按顺序
发布给观察者。带阻塞对话 `choices` 的 Replay 需要宿主逐轮处理，因此只能按时间线播放。

`skipIdleTime` 用于压缩稳定状态下超过一秒的无输入区间，并在下一次输入前保留短暂的
表现间隔。压缩期间仍逐个执行 World Tick；新的 WorldMotion、阻塞输入的 RuntimeAction
或 WorldEvent 会中断当前批次，因此地图内计时与自动机关保持同一条 gameplay 时间线。
该选项默认关闭，不进入 Replay 文件格式。

录制调用方提供当前地图的路径 ID 与 URL；Engine 在停止时写入 `finalState` 和空白
`note`。`meta` 不参与播放调度，用户可以直接编辑 `note`。Web 复跑只提示
`finalState.status` 是否一致；仓库 fixture 验证完整 `finalState`。

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
  bobbyLocomotion: {
    moveMs: 350,
  },
  initialActorIntents: [],
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
    timer: true,
    steps: true,
    objective: true,
    items: true,
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

地图具有多个 player actor 时，Camera 对全部 actor 共同构图。共同构图只会临时降低实际 zoom，并可突破 `minZoom` 以保证所有 actor 同时可见；用户请求的 zoom 仍保留，回到单目标构图时恢复。Gameplay HUD 左上角投影计时器与步数，右上角第一行投影共享目标，后续两行依次投影 primary 与 secondary actor 的独立道具；宿主金币与 primary 道具共用一行。`timer / steps / objective / items` 可以分别关闭，省略的项目默认开启；`coins` 只有宿主提供数值源时才显示。

`input.zoom` 控制键盘 Zoom，并作为 `pinchZoom / wheelZoom` 的缺省值。宿主可以分别配置后两者，例如 Embed 可以启用 Pinch 而关闭滚轮 Zoom。双指手势在 `pan` 启用时同时根据中心位移平移 Camera。

Engine 启用 Screen Joystick 或 Gameplay HUD 后负责它们的完整生命周期。宿主不复制基础 Gameplay 控件，只负责产品层 UI。

### Gameplay 表现配置

Gameplay HUD 接受布尔开关或分项配置：

```ts
runtime: {
  hud: {
    enabled: true,
    root: gameOverlay,
    timer: true,
    steps: true,
    objective: true,
    items: true,
    coins: () => adventureSave.economy.bonusCoins,
  },
}
```

`hud: false` 不创建 HUD，`hud: true` 使用全部默认项。`root` 可以指定 HUD 挂载容器；
`timer`、`steps`、`objective` 和 `items` 分别控制计时器、步数、剩余目标与地图内道具。
计时器通常正向显示 `GameplayState.elapsedMs`；地图配置 Timed Challenge 时，挑战倒计时
优先占用同一个左上角计时位置。`coins` 接收非负整数或返回非负整数的函数，由宿主提供
全局经济状态；配置后始终显示数值，包括 `0`。函数形式会在 HUD 收到 Engine tick 或
change 时重新读取，适合可变的存档状态。

道具和金币位于同一行，但由 `items` 与 `coins` 独立配置。道具按魔豆、汽油、雪铲、
风筝排列；数量为 `1` 时只显示图标，数量大于 `1` 时同时显示计数。金币使用
`ts-16-9` 图标并始终显示计数；数字位于缩小后的金币图标之前。

倒计时数值可以通过 `game.timedChallengeRemainingMs` 或
`game.state.timedChallengeRemainingMs` 读取；`game.timedChallengePhase` 与
`game.state.timedChallengePhase` 为 `"waiting"` 时显示冻结的完整时长，为
`"running"` 时由 WorldClock 递减，没有配置时两者均为 `null`。正向计时读取
`game.state.elapsedMs`。

Timed Challenge 由地图中的 Lock 配置：

```ts
{
  type: "lock",
  x: 4,
  y: 7,
  deathCountdownSeconds: 60,
}
```

HUD 从关卡开局起使用向上取整的 `MM:SS` 显示完整倒计时；成功打开 Lock 后由
WorldClock 推进剩余时间。
`b6.png` 进入/通关过渡属于 Bobby 的内置表现，宿主通过 `ImageManager` 提供
`bobby-transition` 语义资源。两条过渡使用独立时长，并共用 presentation easing：

```ts
runtime: {
  tuning: {
    motion: {
      easing: "linear",
    },
    levelTransition: {
      enterMs: 310,
      exitMs: 279,
    },
  },
}
```

`enterMs` 覆盖载入或重开时 Bobby 出现的倒播过程，`exitMs` 覆盖胜利时 Bobby
消失的正播过程。默认值依据原版 `a.class` 的 animation advance 顺序分别换算。
进入阶段 `game.presentationBlocksInput` 为 `true`，WorldClock 与 Replay tick 暂停，
期间收到的 gameplay 移动输入会被丢弃；完成后该值恢复为 `false`。
Carrot 的 `consumed-carrot` 是内置 World runtime state，地图只声明普通 `carrot`，
收集后由 Engine 转换并使用 semantic atlas mapping 选择 `ts-13-10`。

终局选曲属于宿主产品流程。宿主在 Game 状态进入 `won / dead` 时分别调用
`audio.playMusic("cleared")` 或 `audio.playMusic("death")`；角色动画和 Result Overlay
的先后关系不进入音频 API。

浏览器可能在首次用户交互前暂停 `AudioContext`。`AudioRuntime.isMusicInteractionRequired()` 提供当前阻塞状态，`onMusicInteractionRequiredChange()` 提供状态订阅；宿主据此呈现交互提示，并在用户输入时调用 `resume()`。该状态只描述浏览器音频能力，不进入 Game gameplay state。

## InputController

`InputController` 把浏览器输入翻译成固定 `WorldTick` 上的语义输入。浏览器事件只维护 held / queued state：

```ts
const state = input.update(time); // WorldTick
```

Game 尝试 movement 后把 `moved / blocked / busy` 回填给 repeat 状态机。Pointer pan / pinch / wheel zoom 是 presentation 操作，可以即时调用 Game façade，不等待 WorldTick。

默认控制绑定从 Bobby 的 Map 字段派生。`controller` 使用数字通道，省略时为 `0`；只有 primary 通道时方向键与 WASD 都映射到它，同时存在通道 `0` 与 `1` 时方向键与 WASD 分别映射到二者。每个目标的 `mirrorX / mirrorY` 在 channel 输入变成 semantic move intent 时组合应用。一个输入采样生成的多 actor intent 使用同一 movement transaction；目的格冲突会原子地拒绝所有争用者。Replay 保存 channel 及原始输入方向，不保存浏览器输入源或临时 entity ID。

## Events

Renderer 按图片图层的实际屏幕像素范围跳过视口外绘制，包含 sprite 帧尺寸、锚点、偏移、旋转和移动插值。自定义 Canvas 图层的绘制范围由回调决定，保持执行。该优化只减少绘制提交；World 更新与场景构建仍处理完整地图，屏幕外机关继续运行。

高层 Game 生命周期事件：

```ts
game.on("change", ...);
game.on("tick", ...);
game.on("move", ...);
game.on("blocked", ...);
game.on("level-loaded", ...);
game.on("debug-change", ...);
game.on("death", ...);
game.on("level-complete", ...);
```

`tick` 在每个已消费的 WorldTick 后触发，适合读取 `elapsedMs` 与
`timedChallengeRemainingMs`；进入过渡期间 WorldClock 暂停，因此不会产生该事件。
常规状态变化继续通过 `change` 订阅，换关或重载通过 `level-loaded` 订阅。

细粒度地图事实通过 `WorldEvent` 暴露。事件只描述语义事实，不泄漏 EntityStore、CommandQueue、Behavior 或 RuntimeAction 实例。

地图内表现订阅完整事件流：

```ts
game.onWorldEvent((event) => {});
```

复杂产品交互使用请求口：

```ts
game.onInteractionRequest((request) => {
  // 外层根据自己的状态显示对白，并按需 game.dispatch(intent)。
});
```

可对话角色触发 `object-interaction`；地图存在非空 `dialogue` 时，Engine 紧接着发出
`dialog` 并由 `GameplayDialog` 展示。外层动态对白可以调用 runtime 返回的
`dialog.show(text)`，该展示调用不改变 World，也不进入 Replay。

宿主需要选项交互时，可以等待通用展示层返回选择结果：

```ts
const result = await dialog.present({
  message: "要购买这个道具吗？",
  options: [
    { id: "purchase", label: "购买" },
    { id: "cancel", label: "算了" },
  ],
});
```

`dialog.present()` 接收一个或多个选项；两项时自然按左右排列，更多选项会按
可用宽度自动换行。Engine 在逐字展示完成后显示选项，默认选择 `primary` 项，否则选择
第一项。玩家使用左右方向键循环选择、回车确认，也可以直接点击；回车在逐字展示期间
先立即补全当前文本。`GameplayDialog` 在等待选择时暂停同一 runtime 的 World 与 gameplay
输入，结束时恢复原状态；暂停期间不产生 World Tick，地图计时也不推进。所有选项使用
同级基础样式，当前选项通过高亮边框、背景与阴影
标识；`primary` 只用于声明默认选择位置。

结果为 `{ type: "selected", optionId }` 或 `{ type: "dismissed" }`。
`GameplayDialog` 不接收业务回调，也不读写存档、货币或商品状态；宿主只等待通用选项
ID，并在取得结果后执行产品业务。`characterIntervalMs` 控制逐字间隔，默认 `28ms`，设为
`0` 可立即显示全文。同一个 Tick 连续调用多次 `present()` 时，Replay 依次记录一基选项
序号；`show()` 始终是无选项、非阻塞的提示，不记录选择。
