# Bobby Editor

Editor 是玩家功能，也是 Engine 的最短测试入口。它编辑的是 bc5r 自己的语义 `EditorLevel`；Play Test 每次都把一份 clone 转成 `LevelData` 交给同一个 Engine，Editor 不实现第二套机关/碰撞规则。

## 编辑交互

- Terrain 与 Object 在同一个素材栏中按地图作者的用途分组展示；
- 素材格支持 `− / +` 缩放，尺寸保存在浏览器本机；
- 左键 / 左键拖动：放置当前 Terrain、Object 或 Editor Stamp；
- 右键 / 右键拖动：只删除 Object，Terrain 不存在“擦空”状态；
- 鼠标悬停时在地图上半透明预览当前素材，右键擦除时显示擦除反馈；
- `Ctrl/Cmd + Z` 撤销，`Ctrl/Cmd + Y` 或 `Ctrl/Cmd + Shift + Z` 重做；
- 地图尺寸、校验信息、当前素材 Definition 与当前格 Terrain/Object inspect 都在右侧 Inspector；
- 顶栏只保留 Play、分享和操作帮助。

Dragon、Sandman、Dream Machine、Beaver 等多格素材只是 **Editor Stamp**：一次点击会批量写入多个普通 Object Tile，之后地图中不存在 anchor / parent / composite 关系。覆盖或逐格擦除后形成的残缺组合会原样交给 Engine，不会被运行时自动补全。

## 持久化与分享

- JSON Import / Export 使用 bc5r 的语义 `EditorLevel`，用于备份和继续编辑；
- 游玩链接使用一个很薄的 bc5r metadata envelope（名称 / 作者 / 描述）包住原版 DAT level record，再 `deflate-raw + base64url`；
- `/play#map=...` 与 `/edit#map=...` 读取同一份分享 payload，因此从分享游玩页点击“编辑地图”可以直接继续编辑；
- 旧版 `z.` / `j.` semantic JSON 分享链接仍可读取。

官方关卡进入 Editor 时只创建副本，原始 JAR / generated level 永远不会被 Editor 修改。

`examples/mechanics-smoke.json` 是一个故意摆放多种机关的测试地图，可直接 Import 后用于 Engine 开发。
