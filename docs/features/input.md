# 输入

`InputController` 是 `@bobby/engine` 提供的通用 gameplay 输入适配器。它只负责把键盘、指针、滚轮、Pinch 或外部方向控件翻译成 Game Action，**不得判断某一格能不能走**；合法性必须由 Engine Mechanics 决定。

当前通用映射：

```text
WASD / 方向键 -> held direction
R              -> Restart
Z / U          -> Undo
+ / -          -> Zoom
~              -> Debug
鼠标/单指拖动 -> Pan
Pinch / 滚轮   -> Zoom
```

调用方可以按场景逐项开关：

```text
movement
undo
restart
pan
zoom
debug
```

例如 Adventure 可以关闭 Undo / Debug，Explore 可以开启；这种差异通过能力配置表达，`InputController` 不认识 Adventure、Explore 或 Editor 页面。

`ScreenJoystick` 属于 Engine Gameplay Input。它使用半透明圆形底座和可拖动球头，由 Engine 把拖动向量按 dead zone、主轴方向和方向迟滞转换为 `up/down/left/right/null`，再进入与键盘相同的 held-direction 路径。

```text
拖动球头 (dx, dy)
        │
        ├─ dead zone ─────────────> null
        │
        └─ 主轴 + 方向迟滞 ───────> up / down / left / right
                                            │
                                            ▼
                              InputController.setHeldDirection()
```

`pointerup`、`pointercancel`、失去 pointer capture 或窗口失焦时，Engine 让球头回中并清空 held direction。全局 Dialog 或 Result 决策层取得交互焦点时，宿主暂停 Engine Input，Engine 执行相同清理。

调用方通过 Runtime Config 开关 Screen Joystick，并可以配置透明度、dead zone 和安全区域。`InputController.setHeldDirection()` 仍允许外部无障碍控制器或宿主自定义输入接入。

Screen Control 的布局、默认开关和响应式行为见 [`ui.md`](ui.md)。

Editor Authoring 状态的放置、删除、旋转、编辑历史等操作属于 Editor 输入；Editor Play Test 则复用通用 `InputController`。

Tap-to-pathfind 暂缓，因为自动寻路必须先理解木板、陷阱、开关等具有副作用的格子，不能让寻路算法替玩家解谜。
