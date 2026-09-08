# Original 内容机制

这里描述 Bobby Carrot 5 原版内容在 BC5R 中应呈现的行为与表现。

original只是为了区分哪些素材来自原版，并非一套特殊的 Engine 机制。

original中的定义也并非原版定义，而是 BC5R Engine 中新的行为模式的定义。（文档中同时会指出如何兼容原版，以供 adapter 参考）

## 文档

- `player.md`：Bobby 的方向、移动、待机、死亡和载具表现。
- `mechanics.md`：关卡目标、地形、机关、开关、收集物与环境机制。
- `actors.md`：Dragon、Sandman、Dream Machine、Beaver 等多格角色型对象。
- `audio.md`：原版曲目及其使用场景。
- `surface.md`：`ts.png`、`ta.png` 的可执行语义目录与职责边界。

## 约定

独立 sprite sheet 的帧坐标写成 `asset(row,column)`，从 1 开始；与代码中的
`cell(column,row)` 顺序相反。Tile Visual 使用 `surface.md` 约定的结构化 selector。

- `-->`：按显式列出的顺序播放。
- `==>`：按连续编号顺序播放。
- 具体动画速度、偏移等调试参数不以本文档为配置源，应集中放在对应 Entity 文件顶部，方便调整。
- 机制文档描述“发生什么”；Tile Visual 的具体单元只登记在可执行目录中。
