# 输入

输入层只负责把物理按键/手势翻译成 Engine Action，**不得判断某一格能不能走**；合法性必须由 Engine/Mechanics 决定。

当前映射：

```text
WASD / 方向键 -> 移动一格
R              -> 重开
Z / U          -> Undo
+ / -          -> Zoom
F2             -> Debug Grid
Swipe          -> 移动一格
Pinch / 滚轮   -> Zoom
```

Tap-to-pathfind 暂缓，因为自动寻路必须先理解木板、陷阱、开关等具有副作用的格子，不能让寻路算法替玩家解谜。
