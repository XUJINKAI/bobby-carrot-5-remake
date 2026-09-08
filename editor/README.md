# Bobby Carrot 5 Remake Editor Core

`@bobby/editor` 提供与页面框架无关的语义编辑能力。Web/Vue 持有页面、文件、浏览器存储、Dialog 与 Play Test session；Editor Core 持有 `EditorLevel`、文档命令、History、authoring、编辑画布和 viewport。

## 编辑交互

- Terrain 与 Object 在同一个素材栏中按地图作者的用途分组展示；
- 素材格支持 `− / +` 缩放，尺寸保存在浏览器本机；
- 左键 / 左键拖动：放置当前 Terrain 或 Object；
- 右键 / 右键拖动：删除鼠标指向的完整 Object，Terrain 不存在“擦空”状态；
- `Del` 等同右键，作用于鼠标当前指向的 Object；
- `Q` / `E` 循环切换支持 authoring variant 的 Object，例如 Windmill 方向、Fence 形态、Cloud / Cloud Grid 颜色；
- 鼠标滚轮：放大 / 缩小地图，并尽量保持鼠标当前指向的位置不漂移；
- 按住鼠标中键拖动：平移 Editor 地图视图；
- 两指手势缩放 Editor viewport；
- 鼠标悬停时半透明预览当前待放素材；所有即将被删除/替换的完整 Object 会泛蓝高亮；
- `Ctrl/Cmd + Z` 撤销，`Ctrl/Cmd + Y` 或 `Ctrl/Cmd + Shift + Z` 重做；
- 地图尺寸、校验信息、当前素材 Definition 与当前格 Terrain/Object inspect 都在右侧 Inspector；
- 一次连续拖动画笔作为一个 History transaction，只产生一次 Undo；
- 保存后 Undo 回保存 checkpoint 时，文档恢复为未修改状态。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 是真正的 **multi-cell Object**，不是 Editor Stamp。

`EditorLevel` 只保存主 Object（anchor）。例如 Dragon 只保存：

```json
{ "type": "dragon-head", "x": 10, "y": 5 }
```

Object Layout 定义它占用的完整 footprint；Dragon 的鼠标落点定义在身体格，所以点击身体位置时，Editor 会自动把 anchor 放在左侧头部格。渲染、碰撞检测、覆盖判断和右键删除都通过同一个 owner/layout 解析。

因此鼠标放在 Dragon 尾巴上时，Editor 仍然能解析到同一个 Dragon owner：整条 Dragon 泛蓝，右键或 `Del` 会整体删除。左键放置另一个 Object 与它任意一格相交时，也会先整体删除旧 Dragon，再放置新 Object。

内部组成 ID（如 `dragon-body` / `dragon-tail` / `beaver-body`）不是正常 authoring 素材，也不会写入 Editor JSON。

## 持久化与 Play Test

- JSON Import / Export 使用 bc5r 的语义 `EditorLevel`，用于备份和继续编辑；multi-cell Object 只保存 anchor；
- Web 把 Editor snapshot clone 为 `LevelMap`，通过统一 `createGameSession()` 创建正式 Engine Play Test；
- Stop 销毁临时 Engine session，Editor Draft 与 viewport 保持原状。

官方关卡进入 Editor 时只创建副本，原始 JAR / generated level 永远不会被 Editor 修改。

`../tools/pipeline/mechanics-smoke.json` 是一个故意摆放多种机关的测试地图，可直接 Import 后用于 Engine 开发，并由浏览器冒烟脚本验证导入链路。
