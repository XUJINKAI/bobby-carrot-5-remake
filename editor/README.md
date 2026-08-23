# Bobby Editor

Editor 是玩家功能，也是 Engine 的最短测试入口。它只做一件事：**编辑 JSON Level，然后把一份 clone 交给同一个 Engine 游玩测试**。

不支持 DAT 编辑，也没有另一套机关/碰撞实现。

## 能力

- Terrain / Object 两层编辑；
- 画笔、擦除、吸管；
- Undo / Redo；
- 地图尺寸调整；
- JSON Import / Export；
- `Play / Stop` 原地调用 `@bobby/engine`；
- `#map=` URL 分享，可生成“直接游玩”或“继续编辑”链接。

官方关卡进入 Editor 时只创建副本，原始 JAR / generated level 永远不会被 Editor 修改。

`examples/mechanics-smoke.json` 是一个故意摆放多种机关的测试地图，可直接 Import 后用于 Engine 开发。
