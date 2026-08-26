# Engine API 契约

Web、Adventure 与 Editor 必须把 `@bobby/engine` 当作地图内 gameplay 边界。核心目标是：**给 Engine 一个纯语义 `LevelMap` 和少量运行配置，就应当能够独立把这张地图完整地玩起来。**

## Runtime Config

基础运行配置覆盖渲染、通用输入、Gameplay HUD 和 Screen Joystick：

```ts
const game = new Game({
  canvas,
  assets,
  audio,
  runtime: {
    input: {
      keyboard: true,
      pointer: true,
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
  },
});
await game.loadLevel(levelData);
```

字段名与默认值属于公开 Engine contract，落地时应由稳定类型导出。配置一旦启用 Screen Joystick 或 Gameplay HUD，Engine 负责完整渲染、更新和销毁；调用方只提供容器、资源和能力选择。

## Game

```ts
const game = new Game({ canvas, assets, audio, debug, profile });
await game.loadLevel(levelData);

game.move("left");
game.setHeldDirection("up");
game.undo();
game.redo();
game.restart();
game.setZoom(1.25);
game.setZoomLimits(0.8, 2.75);
game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

`Game.loadLevel()` 只接受 semantic `LevelMap`。地图内机关实例能力放在经过 Definition 白名单约束的 `LevelObject.traits`，实例参数放在 `LevelObject.properties`；Campaign、release metadata、DAT provenance、HTTP 或路由信息都不进入 Engine load options。

一次地图 session 的标准生命周期是：

```text
创建 Game
  ↓
loadLevel(LevelMap)
  ↓
初始化 World / Runtime Object / Camera / Renderer
  ↓
创建并配置 InputController / ScreenJoystick / Gameplay HUD
  ↓
订阅 Game event / WorldEvent
  ↓
运行、Restart 或销毁 session
```

宿主可以提供 Canvas、资源、AudioBackend、Debug 初始值和通用 runtime profile。运行配置只描述单张地图独立运行所需的能力，不携带页面路由、章节或存档来源。

判断一条规则是否属于 Engine 的优先标准是：脱离 Campaign，单独加载这张 `LevelMap` 时规则是否仍应成立。移动、碰撞、机关、地图内计时、死亡与完成条件属于 Engine；章节解锁、存档、跨关经济和 Result 导航属于外层产品。

## InputController

`InputController` 是 Engine 提供的通用 gameplay 输入适配器。它把浏览器输入翻译成 Game 的语义动作，并允许调用方逐项开关能力：

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

可配置能力：

- `movement`
- `undo`
- `redo`
- `restart`
- `pan`
- `zoom`
- `debug`

Engine `ScreenJoystick` 使用半透明圆形底座和可拖动球头。它负责渲染、dead zone、主轴方向、方向迟滞、pointer capture 和松手回中，并把四方向结果统一送入：

```ts
input.setHeldDirection("left");
input.setHeldDirection(null);
```

进入与键盘相同的移动路径。`Game` 本身只接收 held direction；键盘事件、摇杆 PointerEvent 和视觉状态都封装在 Engine 输入层。

`InputController.setHeldDirection()` 保留为外部控制器接入点。它可以服务无障碍设备或宿主自定义控件，但基础移动端体验不依赖宿主实现。

## 高层 Game 事件

```ts
game.on("change", ...);
game.on("move", ...);
game.on("blocked", ...);
game.on("level-loaded", ...);
game.on("debug-change", ...);
game.on("death", ...);
game.on("level-complete", ...);
```

这些事件用于常见 UI 生命周期。Result 的按钮、下一关、返回章节等动作属于外层产品。

## Gameplay 展示状态

Engine 暴露并渲染基础 HUD 所需的地图内状态，包括目标、背包、移动步数、死亡/完成状态与 `timedChallengeRemainingMs`。Gameplay HUD 与 Canvas、Camera、Screen Joystick 共同构成可独立运行的 Engine Gameplay Layer。

所有已获得道具使用固定的右上角 HUD anchor。Golden Key、加速鞋、临时钥匙、汽油、雪铲、风筝、魔豆、Golden Carrot 和 Bonus Coin 从右向左排列，空间不足时向下换行。该布局由 Engine HUD 统一实现，各宿主不能为不同模式重新排列。

目标、背包和地图内 Timer 的状态与基础渲染属于 Engine；统计用时、模式名称、关卡导航和完成后的按钮属于产品层。Web 可以叠加产品统计 HUD，但不能复制或接管基础 Gameplay HUD。Web UI 规范见 [`../features/ui.md`](../features/ui.md)。

## 通用 WorldEvent 流

地图对象、收集物、机关等细粒度运行时事实统一通过：

```ts
const unsubscribe = game.onWorldEvent((event) => {
  // inspect event.type / objectType / action / text / x / y
});
```

例如成功打开一个锁：

```ts
{
  type: "object-interaction",
  objectType: ObjectId.LOCK,
  action: "open",
  x,
  y
}
```

对象请求展示对白时使用通用 `dialog` 事件：

```ts
{
  type: "dialog",
  text?: string,
  objectType,
  x,
  y
}
```

`text` 缺失仍代表一次对白交互。Web 当前可以把它显示为 `...`，但展示策略不属于地图规则。

## 地图内限时挑战

限时挑战由对象实例参数进入 Engine。例如 Lock：

```json
{
  "type": "lock",
  "x": 4,
  "y": 2,
  "properties": {
    "timedChallengeMs": "60000"
  }
}
```

运行关系：

```text
LevelMap.properties.timedChallengeMs
        ↓
成功打开 Lock
        ↓
Engine TimedChallenge
        ├─ 取得 Golden Carrot -> 结束
        ├─ complete / death -> 结束
        └─ timeout -> Engine death
```

`game.timedChallengeRemainingMs` 暴露当前剩余时间供 HUD 展示。Undo 会连同 World Snapshot 恢复计时状态，Restart / 新关卡加载会重置计时状态。

Original Adapter 把原版 Bonus 事实转换为普通 `LevelMap` 实例参数；Engine 不认识“Bonus Round”、章节或 Campaign。

## Definition-driven 对象属性

对象可编辑属性由 semantic Definition 描述：

```text
Object Definition
└─ authoring.properties[]
   ├─ key
   ├─ kind
   ├─ label
   └─ presentation constraints
```

Editor 使用这份 metadata 生成 Inspector；持久值存入 `LevelObject.properties`。当前只实现真实需要的简单属性，不扩张为脚本系统或通用配置语言。

公开 API 可以扩展，但扩展必须是通用 gameplay/runtime 能力。依赖方向始终保持外层系统消费 Engine，而不是 Engine 了解外层 Campaign、DAT 或地图生产者。
