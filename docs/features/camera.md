# Camera（视野）

世界逻辑只使用格子坐标，不允许出现 32px/48px 之类的渲染尺寸假设。

Renderer 使用 UP9 高清版 48px 源素材，再乘以 Camera Zoom。Viewport 来自 Canvas 的实际 CSS 尺寸，因此桌面和手机都能自然获得比原版 320×240 更大的视野。

当前行为：

- Camera 跟随 Bobby 的**视觉插值坐标**；普通格子移动沿用 Entity movement tween，Portal、Debug Teleport 等非连续位置变化使用独立的 Camera 过渡；
- 鼠标中键拖动和双指中心位移可以 Pan；地图边缘最多移动到视口中心，地图始终有一部分保留在对应半屏；
- Pinch 围绕两指中心缩放，双指缩放和平移可以同时发生；
- 滚轮围绕指针位置缩放，按钮与键盘围绕 Canvas 中心缩放；
- `runtime.camera` 统一配置初始 Zoom、范围和非连续跟随过渡时长；
- 用户 Pan 后，下一次 gameplay movement 触发 Camera 平滑回中。

Camera 的中心、Pan、Zoom 与跟随过渡都属于 Presentation，不修改 World 坐标，也不进入 gameplay snapshot。

Explore、Custom 和 Editor Play Test 可以使用自由视野能力。Adventure 在桌面与移动端都使用 portrait puzzle viewport，并设置适合原版信息边界的最小 Zoom。模式只配置 Camera 能力和限制，不复制 Camera 实现。
