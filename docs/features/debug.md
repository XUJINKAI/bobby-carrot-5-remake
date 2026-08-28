# Engine Debug Runtime

Engine 必须能够调试自身。Debug 不属于 Web、Adventure、Editor 或 Embed 页面层；这些宿主只负责启用 Engine，不能复制一套 World / Entity 调试 UI。

## 入口

启用了 Engine Input 的运行时按 `~` / Backquote 调用：

```ts
game.toggleDebug();
```

`GameOptions.debug: true` 可以让 Debug Runtime 初始即打开。Debug Sidebar 首次打开时才挂载，不给普通 `debug=false` runtime 增加 DOM 前置条件。

Debug 打开后 Engine 同时启用：

- Canvas debug grid；
- Cell selection 高亮；
- Engine Debug Sidebar；
- WorldClock Pause / Step / Resume 控制。

关闭 Debug 时 WorldClock 自动恢复运行，避免留下不可见的 gameplay pause。

## Runtime

Sidebar 同时展示两套时间：

- World Tick / Hz / `stepMs`；
- WorldClock running / paused；
- Presentation frame / Hz；
- playing / won / dead；
- moves、Bobby cell / facing、forced movement；
- 活跃 RuntimeAction 数量；
- `inputBlocked` 与 `cameraTarget`；
- Visual motion 是否仍在执行。

这里刻意把 World 与 Presentation 并列展示：视觉仍在变化并不代表 gameplay 仍在推进。

## Selection / Entity

Debug 打开后点击 Canvas Cell 进行选择。拖动仍保持原有 gameplay / pan 语义，只有短距离 tap 会改变 Debug selection。

Selection 显示 Cell Stack，并允许在同格多个 Presence 中切换具体 Entity。Renderer 对当前 Cell 绘制独立高亮。

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

这些数据只供 DebugRuntime 内部消费；不得为了页面显示 Debug 信息而公开 `World`、`EntityStore`、`SpatialIndex`、`BehaviorRegistry`、`RuntimeActionScheduler` 或 `VisualRuntime` 实例。

## WorldClock controls

Debug Sidebar 使用一个状态切换按钮，加两个单步按钮：

```text
running: [ ⏸ Pause ]  [ +1 Tick ] [ +4 Ticks ]
paused:  [ ▶ Resume ] [ +1 Tick ] [ +4 Ticks ]
```

Pause / Resume 是同一个常驻 DOM 控件，只更新图标、文字和 accessibility label；Presentation render 不得销毁并重建该按钮。`+1 / +4` 只在 WorldClock 暂停时可用。

这些控件只控制 gameplay WorldClock：

```ts
worldClock.pause();
worldClock.step(1, updateWorld);
worldClock.step(4, updateWorld);
worldClock.resume();
```

暂停期间：

- `InputController` 临时禁用并清空 held / queued movement；
- `World.update()` / Behavior / RuntimeAction 不推进；
- `Game.move()` 也不得作为旁路直接修改 World；
- PresentationClock 仍由 RAF 运行；
- Camera、Bobby tween、环境动画、UI 表现可以继续完成；
- AudioRuntime 独立运行。

Resume 或关闭 Debug 时恢复 Pause 前的 Input enabled 状态，不擅自打开原本由宿主禁用的输入。

因此 Debug Pause 的正确判断标准是 **World Tick 是否停止增长**，而不是“画面是否完全静止”。

`step()` 只允许在 WorldClock 暂停状态执行，并走与普通 gameplay 相同的逻辑路径：

```text
RuntimeAction -> Behavior -> World commit
                          ↓
                 forced/input decision
```

Presentation 不属于 World step。以后如果需要逐帧调纯视觉动画，应增加独立的 Presentation freeze/step 工具，而不是让 WorldClock 再次承担动画职责。

## Engine Lab

`custom-maps/engine-lab/` 继续负责保存最小可复现 gameplay 场景；Debug Sidebar 不取代测试地图或 Editor。

```text
Editor              构造场景
Engine Lab map      保存可复现场景
Engine Debug        观察内部运行事实
Automated tests     锁定确定性规则
```

修复某类 Entity 时，优先使用最小 Engine Lab 地图复现，再通过 Debug Sidebar 观察 World Tick / Action / Behavior / Visual / Presence，最后补对应自动测试。
