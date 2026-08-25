# Camera（视野）

世界逻辑只使用格子坐标，不允许出现 32px/48px 之类的渲染尺寸假设。

Renderer 使用 UP9 高清版 48px 源素材，再乘以 Camera Zoom。Viewport 来自 Canvas 的实际 CSS 尺寸，因此桌面和手机都能自然获得比原版 320×240 更大的视野。

当前行为：

- Camera 跟随 Bobby 的**视觉插值坐标**，不会跟着逻辑坐标瞬移；
- 小地图自动居中；
- 大地图限制在世界边界；
- 滚轮、按钮、Pinch 均可缩放；
- Zoom 当前范围约 0.35×–2.5×。

以后增加 Overview/Pan 仍只能属于 Camera 层，不能修改 World 坐标。

Explore、Custom 和 Editor Play Test 可以使用自由视野能力。Adventure 在桌面与移动端都使用 portrait puzzle viewport，并设置适合原版信息边界的最小 Zoom。模式只配置 Camera 能力和限制，不复制 Camera 实现。
