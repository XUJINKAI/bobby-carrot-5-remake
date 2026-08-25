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

屏幕摇杆、方向按钮等视觉控件属于宿主 UI。它们通过 `input.setHeldDirection(up/down/left/right/null)` 进入与键盘相同的移动路径，因此不复制 Gameplay Controller。

Editor Authoring 状态的放置、删除、旋转、编辑历史等操作属于 Editor 输入；Editor Play Test 则复用通用 `InputController`。

Tap-to-pathfind 暂缓，因为自动寻路必须先理解木板、陷阱、开关等具有副作用的格子，不能让寻路算法替玩家解谜。
