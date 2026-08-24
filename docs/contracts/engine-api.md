# Engine API 契约

Web UI、Adventure adapter 与 Editor 必须把 `@bobby/engine` 当作地图内游戏逻辑边界，不允许绕过 API 修改 `World` 内部状态来实现机关。

主要接口：

```ts
const game = new Game({ canvas, assets, audio, debug });
await game.loadLevel(levelData);

game.move("left");
game.undo();
game.restart();
game.killPlayer("external rule failed");
game.setZoom(1.25);
game.setZoomLimits(0.8, 2.75);
game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

`Game.loadLevel()` 只接受纯 semantic `LevelMap`。Campaign、Bonus timer、release metadata 不允许作为 load option 进入 Engine。

输入适配器同样只消费 Engine API：

```ts
const input = new InputController(game);
input.destroy();
```

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

这些事件用于常见 UI 生命周期。

## 通用 WorldEvent 流

地图对象、收集物、机关等细粒度运行时事实统一通过：

```ts
const unsubscribe = game.onWorldEvent((event) => {
  // inspect event.type / objectType / action / x / y
});
```

例如成功打开一个锁，不新增 `lock-opened` Game event，而是：

```ts
{
  type: "object-interaction",
  objectType: ObjectId.LOCK,
  action: "open",
  x,
  y
}
```

Adventure 可以订阅通用事件后解释自己的 Campaign 规则；Engine 本身不认识“Bonus Round”。

原版 Bonus 60 秒规则的边界是：

```text
Engine: object-interaction(LOCK/open)
  ↓
Adventure: start 60s countdown
  ↓
Engine: complete/death event -> Adventure clears countdown
  ↓
Adventure timeout -> game.killPlayer(reason)
```

因此禁止为 Adventure 增加 `bonusTimeMs`、`lock-opened`、`bonus-timeout` 等 Engine 专用接口。

公开 API 可以扩展，但扩展必须是通用 gameplay/runtime 能力，依赖方向始终保持外层系统消费 Engine，而不是 Engine 了解外层 Campaign。
