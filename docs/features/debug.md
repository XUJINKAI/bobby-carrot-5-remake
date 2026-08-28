# Engine Debug Runtime

Engine 必须能够调试自身。Debug 不属于 Web、Adventure、Editor 或 Embed 页面层；这些宿主只负责启用 Engine，不能复制一套 World / Entity 调试 UI。

## 入口

启用了 Engine Input 的运行时按 `~` / Backquote 调用：

```ts
game.toggleDebug();
```

`GameOptions.debug: true` 可以让 Debug Runtime 初始即打开。

Debug 打开后 Engine 同时启用：

- Canvas debug grid；
- Cell selection 高亮；
- Engine Debug Sidebar；
- EngineClock Pause / Step / Resume 控制。

关闭 Debug 时 EngineClock 自动恢复运行，避免留下不可见的暂停世界。

## Debug Sidebar

Sidebar 只读取 Engine 内部诊断事实，不把这些对象加入 gameplay public façade。

### Runtime

显示：

- 已执行 Tick 数；
- 固定 `stepMs`；
- running / paused；
- playing / won / dead；
- moves；
- Bobby cell / facing；
- forced movement；
- Visual motion 是否仍在执行。

### Selection

Debug 打开后点击 Canvas Cell 进行选择。拖动仍保持原有 gameplay / pan 语义，只有短距离 tap 会改变 Debug selection。

Selection 显示 Cell Stack，并允许在同格多个 Presence 中切换具体 Entity。Renderer 对当前 Cell 绘制独立高亮。

### Entity

选中 Entity 后显示：

- id / type / anchor / direction；
- Definition traits / stack / occupancy / footprint；
- instance traits；
- properties / state；
- resolve 后的 Behavior IDs；
- Entity 的全部 Presence；
- Visual ID；
- VisualRuntime 瞬态状态，例如 offset / moving / progress；
- 当前 RenderScene 中 resolve 后的 visual layers。

这些数据只供 DebugRuntime 内部消费；不得为了页面显示 Debug 信息而公开 `World`、`EntityStore`、`SpatialIndex`、`BehaviorRegistry` 或 `VisualRuntime` 实例。

## EngineClock controls

Debug Sidebar 提供：

```text
[ Pause ] [ +1 Tick ] [ +4 Ticks ] [ Resume ]
```

Clock control 是 `EngineClock` 自身能力：

```ts
clock.pause();
clock.step(1, update);
clock.step(4, update);
clock.resume();
```

暂停期间浏览器 RAF 仍可运行，但 `advance()` 不产生世界 Tick，也不累积暂停时间。`step()` 只允许在暂停状态执行，并继续走正常的：

```text
Input -> World -> Visual -> Render
```

因此单步调试与普通 gameplay 不存在第二套更新逻辑。音乐属于独立 AudioRuntime，不随世界时钟暂停。

## Engine Lab

`custom-maps/engine-lab/` 继续负责保存最小可复现 gameplay 场景；Debug Sidebar 不取代测试地图或 Editor。

职责分别是：

```text
Editor              构造场景
Engine Lab map      保存可复现场景
Engine Debug        观察内部运行事实
Automated tests     锁定确定性规则
```

修复某类 Entity 时，优先使用最小 Engine Lab 地图复现，再通过 Debug Sidebar 观察 Tick / Behavior / Visual / Presence，最后补对应自动测试。
