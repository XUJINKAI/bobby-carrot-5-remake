# Original 内容机制

这里描述 Bobby Carrot 5 原版内容在 BC5R 中应呈现的行为与表现。它属于 `system` 文档的一部分，但 **Original 不是一套特殊 Engine**：这些内容仍应使用通用 Entity、Behavior、Visual、Audio 等机制实现。

## 文档

- `player.md`：Bobby 的方向、移动、待机、死亡和载具表现。
- `mechanics.md`：关卡目标、地形、机关、开关、收集物与环境机制。
- `actors.md`：Dragon、Sandman、Dream Machine、Beaver 等多格角色型对象。
- `audio.md`：原版曲目及其使用场景。
- `assets.md`：`ts.png`、`ta.png`、`b*.png` 等资源的帧布局与关键帧映射。

## 约定

帧坐标统一写成 `asset(row,column)`，从 1 开始；与代码中的 `cell(column,row)` 顺序相反。

- `-->`：按显式列出的顺序播放。
- `==>`：按连续编号顺序播放。
- 具体动画速度、偏移等调试参数不以本文档为配置源，应集中放在对应 Entity 文件顶部，方便调整。
- 机制文档描述“发生什么”，资产文档描述“画哪一帧”；不要在两处重复维护帧坐标。
