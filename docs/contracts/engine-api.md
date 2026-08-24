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

`Game.loadLevel()` 只接受纯 semantic `LevelMap`。对象实例参数放在 `LevelObject.properties` 中；Campaign、Bonus timer、release metadata、DAT provenance 不允许作为 load option 进入 Engine。

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
  // inspect event.type / objectType / action / text / x / y
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

`text` 缺失就是 `dialog(undefined)`，仍然代表“发生了一次对白交互”。Web 当前把它显示为 `...`，但这个展示策略不属于 Engine。

Sandman 只是当前第一个使用这个机制的对象：Definition 从 `LevelObject.properties.dialogue` 读取作者文本并产生通用 touch 结果；Engine Core 再翻译为 `WorldEvent`。因此 Engine API 不需要 `sandman-dialog` 之类的对象专用事件。

Adventure 可以订阅通用事件后解释自己的 Campaign 规则；Engine 本身不认识“Bonus Round”，也不知道对象实例属性是否经过 Adventure 增强。

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

## Definition-driven 对象属性

对象可编辑属性由 semantic Definition 描述，而不是由 Editor 建对象类型特判：

```text
Object Definition
└─ authoring.properties[]
   ├─ key
   ├─ kind: string | enum
   ├─ label
   └─ presentation constraints
```

Editor 使用这份 metadata 生成 Inspector；持久值存入 `LevelObject.properties`。当前只实现真实需要的 string 与 enum/channel，不扩张为脚本系统或通用配置语言。

公开 API 可以扩展，但扩展必须是通用 gameplay/runtime 能力。依赖方向始终保持外层系统消费 Engine，而不是 Engine 了解外层 Campaign、DAT 或地图生产者。
