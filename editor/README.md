# Bobby Editor

Editor 是玩家功能，也是 Engine 的最短测试入口。它编辑的是 bc5r 自己的语义 `EditorLevel`；Play Test 每次都把一份 clone 转成语义 `LevelData` 交给同一个 Engine，Editor 不实现第二套机关/碰撞规则。

## 编辑交互

- Terrain 与 Object 在同一个素材栏中按地图作者的用途分组展示；
- 素材格支持 `− / +` 缩放，尺寸保存在浏览器本机；
- 左键 / 左键拖动：放置当前 Terrain 或 Object；
- 右键 / 右键拖动：删除鼠标指向的完整 Object，Terrain 不存在“擦空”状态；
- `Del` 等同右键，作用于鼠标当前指向的 Object；
- `Q` / `E` 循环切换支持 authoring variant 的 Object，例如 Windmill 方向、Fence 形态、Cloud / Cloud Grid 颜色；
- 鼠标滚轮：放大 / 缩小地图，并尽量保持鼠标当前指向的位置不漂移；
- 按住鼠标中键拖动：平移 Editor 地图视图；
- Play / Play Test 中左键拖动仍可平移，同时也支持中键拖动；滚轮统一用于缩放；
- Play 中如果手动拖开 Camera，Bobby 下一次真正移动时会平滑取消 pan offset 并重新居中跟随，不会瞬移；
- 鼠标悬停时半透明预览当前待放素材；所有即将被删除/替换的完整 Object 会泛蓝高亮；
- `Ctrl/Cmd + Z` 撤销，`Ctrl/Cmd + Y` 或 `Ctrl/Cmd + Shift + Z` 重做；
- 地图尺寸、校验信息、当前素材 Definition 与当前格 Terrain/Object inspect 都在右侧 Inspector；
- 顶栏只保留 Play、分享和操作帮助。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 是真正的 **multi-cell Object**，不是 Editor Stamp。

`EditorLevel` 只保存主 Object（anchor）。例如 Dragon 只保存：

```json
{ "type": "dragon-head", "x": 10, "y": 5 }
```

Object Layout 定义它占用的完整 footprint；Dragon 的鼠标落点定义在身体格，所以点击身体位置时，Editor 会自动把 anchor 放在左侧头部格。渲染、碰撞检测、覆盖判断和右键删除都通过同一个 owner/layout 解析。

因此鼠标放在 Dragon 尾巴上时，Editor 仍然能解析到同一个 Dragon owner：整条 Dragon 泛蓝，右键或 `Del` 会整体删除。左键放置另一个 Object 与它任意一格相交时，也会先整体删除旧 Dragon，再放置新 Object。

内部组成 ID（如 `dragon-body` / `dragon-tail` / `beaver-body`）不是正常 authoring 素材，也不会写入 Editor JSON 或分享 payload。

## 持久化与分享

- JSON Import / Export 使用 bc5r 的语义 `EditorLevel`，用于备份和继续编辑；multi-cell Object 只保存 anchor；
- 游玩链接使用一个很薄的 bc5r metadata envelope（名称 / 作者 / 描述）包住原版 DAT level record，再 `deflate-raw + base64url`；
- 原版 DAT 本身也只保存 Dragon / Sandman / Dream Machine / Beaver 的主 Object，因此分享链接天然保持最短的 anchor 编码，不需要反向识别完整 footprint；
- `/play#map=...` 与 `/edit#map=...` 读取同一份分享 payload，因此从分享游玩页点击“编辑地图”可以直接继续编辑；
- 旧版 `z.` / `j.` semantic JSON 分享链接仍可读取并规范化到当前 EditorLevel。

`EditorLevel`、语义 `LevelData`、generated JSON 和 DAT share 都保持 anchor。只有 `Game.loadLevel()` 在创建 Runtime `World` 前根据 Object Layout 临时展开 occupancy；`fromLevelData()` 仍能兼容已经展开过的 LevelData 并折回 anchor。

官方关卡进入 Editor 时只创建副本，原始 JAR / generated level 永远不会被 Editor 修改。

`examples/mechanics-smoke.json` 是一个故意摆放多种机关的测试地图，可直接 Import 后用于 Engine 开发。
