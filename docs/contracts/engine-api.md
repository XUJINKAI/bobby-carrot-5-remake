# Engine API 契约

Web UI 必须把 `@bobby/engine` 当作游戏逻辑边界，不允许绕过 API 修改 `World` 内部状态来实现机关。

主要接口：

```ts
const game = new Game({ canvas, assets, audio, debug });
await game.loadLevel(levelData);

game.move("left");
game.undo();
game.restart();
game.setZoom(1.25);
game.toggleDebug();
game.inspectCanvasPoint(clientX, clientY);
```

输入适配器同样只消费 Engine API：

```ts
const input = new InputController(game);
input.destroy();
```

当前事件：

- `change`：可观察状态变化；
- `move`：开始一次有效移动；
- `blocked`：移动被阻挡；
- `level-loaded`：关卡加载完成；
- `debug-change`：调试开关变化；
- `death`：Bobby 死亡；
- `level-complete`：关卡完成；
- `world-event`：机关、收集、动态世界事件。

公开 API 可以扩展，但依赖方向必须始终保持 `Web -> Engine`。
