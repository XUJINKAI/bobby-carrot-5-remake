# Engine Debug Runtime

Engine 必须能够调试自身。Debug 不属于 Web、Adventure、Editor 或 Embed 页面层；这些宿主只负责启用 Engine，不能复制一套 World / Entity 调试 UI。

## 入口

启用了 Engine Input 的运行时按 `~` / Backquote 调用：

```ts
game.toggleDebug();
```

`GameOptions.debug: true` 可以让 Debug Runtime 初始即打开。Debug Sidebar 首次打开时才挂载，不给普通 `debug=false` runtime 增加 DOM 前置条件。

Debug 打开后 Engine 同时启用 Canvas debug grid、Cell selection 高亮、Engine Debug Sidebar，以及独立的 World / Presentation 时间控制。关闭 Debug 时如果任一时钟仍处于调试暂停状态，会自动恢复运行，避免留下不可见的 pause。

## Runtime

Runtime 区只显示 Engine 级运行事实，不混入某个具体主角 Entity 的属性：

```text
World     16Hz (62.5ms), 1234 ticks
Present   60Hz (16.67ms), 5678 frames
Actions   2 active · input blocked
Camera    #28
Motion    active
```

其中：

- World 合并展示频率、固定 step 与 tick count；
- Present 合并展示采样频率、step 与 frame count；
- Actions 展示活跃 RuntimeAction 数量及其派生的 input blocking；
- Camera 展示当前 gameplay camera target；
- Motion 只表示 VisualRuntime 是否仍有活动过渡。

`Player`、`Facing` 等属于具体 Entity，应通过 Selection / Entity Inspector 查看；`playing / won / dead` 也不作为时钟运行事实重复塞进 Runtime 区。

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

## 时间控制

Debug Sidebar 保留四个常驻 DOM 控件：

```text
[ ⏸/▶ World ] [ ⏸/▶ Present ] [ ◀ 1 Frame ] [ 1 Frame ▶ ]
```

### World

World 按钮只控制 gameplay WorldClock。暂停期间：

- `InputController` 临时禁用并清空 held / queued movement；
- `World.update()` / Behavior / RuntimeAction 不推进；
- `Game.move()` 不得作为旁路直接修改 World；
- PresentationClock 可以继续运行，因此 Camera、已开始的 tween、环境动画仍可继续表现；
- AudioRuntime 独立运行。

Resume 或关闭 Debug 时恢复 Pause 前的 Input enabled 状态，不擅自打开原本由宿主禁用的输入。

### Present

Present 按钮只控制 PresentationClock。暂停期间 RAF 仍存在，但不会推进视觉时间，因此 VisualRuntime、Camera tween 与基于 PresentationFrame 的环境动画保持在当前表现帧。

`◀ 1 Frame` / `1 Frame ▶` 只在 Present 暂停时工作。PresentationClock 可以产生正或负一个 frame step；VisualRuntime 与 Camera 会保留最近一次过渡参数，因此刚刚完成的 tween 也可以退回过渡内部逐帧检查。

Presentation 倒帧只改变表现时间，**不会回滚 World、Behavior 或 RuntimeAction 的 gameplay state**。调试一个 Action 的视觉过程时，推荐同时暂停 World 与 Present，再用前后逐帧查看；如果未来需要倒退 Action 自身的 gameplay phase，应使用独立的 World snapshot / rewind 调试能力，而不是污染 PresentationClock。

## Engine Lab

`custom-maps/engine-lab/` 继续负责保存最小可复现 gameplay 场景；Debug Sidebar 不取代测试地图或 Editor。

```text
Editor              构造场景
Engine Lab map      保存可复现场景
Engine Debug        观察内部运行事实
Automated tests     锁定确定性规则
```

修复某类 Entity 时，优先使用最小 Engine Lab 地图复现，再通过 Debug Sidebar 观察 World / Present / Action / Behavior / Visual / Presence，最后补对应自动测试。
