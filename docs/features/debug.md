# Engine Debug Runtime

Engine 必须能够调试自身。Debug 不属于 Web、Adventure、Editor 或 Embed 页面层；宿主只负责启用 Engine，不能复制一套 World / Entity 调试 UI。

## 入口与所有权

启用了 Engine Input 的运行时按 `~` / Backquote 调用：

```ts
game.toggleDebug();
```

`GameOptions.debug: true` 可以让 Debug Runtime 初始即打开。Debug UI 由 `DebugRuntime` / `DebugSidebar` 管理，Web 不再维护 `debug-panel`、`ENGINE MESSAGE` 或独立的格子检查器。

关闭 Debug 时整个 Debug Dock 消失，gameplay viewport 恢复全宽；如果 World / Presentation 仍处于调试暂停状态，Engine 会恢复运行，避免留下不可见的 pause。

## Dock 布局

Debug 不覆盖在游戏画面上，而是占用 gameplay mount 右侧的真实布局空间：

```text
Canvas | Controls | Inspector | Tools
Canvas | Controls             | Tools
Canvas |            Inspector | Tools
Canvas |                      | Tools
```

最右侧 `Tools` 是固定的 44px 竖条，在 Debug 开启期间始终存在：

- `C`：切换 Controls；
- `D`：切换 Debug Info / Inspector。

Controls 与 Inspector 没有各自的 collapse 残条，也没有 `Close Engine Debug` 按钮。全局退出 Debug 仍由 `~` 完成。

Debug Dock 通过共享 gameplay right inset 把占用宽度从 Canvas viewport 中扣除。Renderer 因此基于剩余 Canvas 空间重新 measure；Gameplay HUD 与 Screen Joystick 使用同一个 inset，不会被 Debug 窗格覆盖。

Debug 不针对手机窄屏设计；这是桌面调试工具，不为固定 pane 宽度增加移动端折叠策略。

## Controls

Controls 是操作面板，不承载大段状态 JSON。

### Actor

当地图只有一个 `player` actor 时直接跟踪它；存在多个 actor 时可通过 Actor selector 切换当前调试对象。Inspector 中选中带 `player` trait 的 Entity 也会切换 tracked actor。

Debug D-pad 向当前 actor 注入普通 `external` held input，仍经过现有 InputController / HeldDirectionRepeater 路径，而不是另造一套 movement API。

### World

World 显示当前 tick 与 Hz，并提供：

```text
[ Pause / Resume ] [ Step ]
```

World Pause **只冻结 WorldClock**：

- 不禁用 InputController；
- 不清空 held / repeater 状态；
- `World.update()`、Behavior 与 RuntimeAction 不随时间自动推进；
- PresentationClock 可以独立继续运行；
- 可以先在 D-pad 选择 held direction，再用 `Step` 一 tick 一 tick 消费输入。

因此调试输入重试、阻挡、机关触发等行为时，可以观察“输入仍然 held，但 World 尚未消费”的精确状态。

Resume、切换 tracked actor、teleport 或关闭 Debug 时，会释放 Debug 自己注入的 external held input，避免把调试输入泄漏回正常 gameplay。

### Presentation

Presentation 显示当前 frame 与 Hz，并提供：

```text
[ Pause / Resume ]
[ -1 ] [ +1 ] [ Sprite ] [ Next ]
```

- `-1` / `+1`：推进一个 PresentationClock sample，用于看插值细节；
- `Sprite`：在当前 actor 正在运动/动画时，连续推进 Presentation，直到该 actor 实际 resolve 到不同 sprite frame；
- `Next`：连续推进到当前可见 motion 结束；
- 这些操作都不会改变 Presentation Hz。

Bobby 的行走 body sequence 为原版顺序 `4 → 5 → 6 → 7 → 8 → 1 → 2 → 3 → 4`（按人类 1-based frame 编号）。因此 60Hz 下单次 `+1` 不保证 sprite 一定变化；要逐张检查 walking sprite 应使用 `Sprite`。

推荐的 walking 调试流程：

1. Pause World；
2. Pause Presentation；
3. D-pad 选择方向；
4. World `Step` 一次创建 movement；
5. 反复点击 `Sprite` 查看实际 body frame；
6. 需要查看两张 sprite 之间的插值时使用 `+1`；
7. 使用 `Next` 快速跳到本次 visible motion 结束。

Presentation stepping 只改变表现时间，不回滚 World / Behavior / RuntimeAction gameplay state。

## Inspector

Inspector 有三个稳定 Tab：

```text
Actor | Timeline | Inspect
```

DOM skeleton 保持挂载，Presentation 60Hz 刷新只更新内容，不重建 `<details>`，因此用户展开的 JSON 不会在刷新时自动收起。

### Actor

Actor 展示当前 tracked actor 的运行态，包括：

- id / type / anchor / direction；
- 当前 InputController / HeldDirectionRepeater channels；
- Entity state；
- 与该 actor 相关的 active RuntimeActions；
- 当前 resolved sprite；
- VisualRuntime runtime state；
- 当前 RenderScene 中 resolve 后的 render items / layers。

这些信息是 readonly introspection；Entity/Behavior 不依赖 Debug 模块。

### Timeline

Timeline 保存最近 50 条 Debug runtime 事件，记录 sequence、World tick、Presentation frame 以及必要 detail。目前由 DebugRuntime 边界对连续 snapshot 做差异记录，包括：

- input；
- action；
- world；
- presentation；
- Debug teleport。

Timeline 用于定位因果顺序，不作为 gameplay history / undo 系统。

### Inspect

Debug 开启后单击 Canvas cell 进行选择。拖动仍保持 gameplay pan 语义，只有短距离 click/tap 会改变 selection。

Selection 显示 Cell Stack，并允许在同格多个 Presence 中选择具体 Entity。Renderer 对当前 Cell 绘制独立高亮。

选中 Entity 后可查看：

- id / type / direction；
- Definition traits / footprint；
- instance traits；
- 类型专属地图字段 / runtime state；
- resolve 后的 Behavior IDs；
- Entity 的全部 Presence；
- Visual ID；
- VisualRuntime 瞬态状态；
- 当前 resolve 后的 visual layers。

这些数据只供 DebugRuntime 内部消费；不得为了页面显示 Debug 信息而公开 `World`、`EntityStore`、`SpatialIndex`、`BehaviorRegistry`、`RuntimeActionScheduler` 或 `VisualRuntime` 实例。

## Debug Teleport

Debug 模式下双击 Canvas cell，会把**当前 tracked actor** hard-teleport 到目标 anchor。多 actor 地图因此先由 Actor selector / Inspect 决定被传送对象。

Teleport 是场景搭建工具，不模拟一次正常移动：

- 只检查 actor footprint 是否仍在地图范围内；
- 不检查普通 passability，因此允许放进占用格或墙内；
- 直接更新 EntityStore / SpatialIndex；
- 取消该 actor owned RuntimeActions；
- 清除该 actor 的 VisualRuntime motion；
- 不执行 enter / leave movement behavior；
- 不增加 move count；
- 不写入 gameplay undo history。

## Engine Lab

`custom-maps/engine-lab/` 与 mechanics smoke maps 继续负责保存最小可复现 gameplay 场景；它们不是旧 Debug UI 遗留，也不应被 Debug Sidebar 取代。

```text
Editor              构造场景
Engine Lab map      保存可复现场景
Engine Debug        观察内部运行事实
Automated tests     锁定确定性规则
```

修复某类 Entity 时，优先用最小 Engine Lab 地图复现，再通过 Actor / Timeline / Inspect 观察 World / Input / Action / Behavior / Visual / Presence，最后补对应自动测试。
