# 地图编辑器

Editor 是 Bobby Carrot 5 Remake 的玩家功能，也是 Engine 的首选交互式调试入口。Play Test 统一使用正式 Engine gameplay 实现。

## 地图格式

导入/导出 JSON 使用长期稳定的语义 authoring 格式：

```json
{
  "schemaVersion": 2,
  "name": "My Level",
  "author": "optional",
  "description": "optional",
  "width": 20,
  "height": 16,
  "terrain": [["ground-c"]],
  "objects": [{"type": "carrot", "x": 4, "y": 8}]
}
```

核心内容是 `@bobby/model::LevelMap { width, height, terrain, objects }`，再附加 name/author/description。DAT record length、SHA-256、发行包、chapter、difficulty、dynamic_slots、Adventure progress 等信息由各自的 provenance/Campaign 层持有。

Terrain/Object 始终使用 semantic ID；raw DAT byte 的互操作统一由 `@bobby/dat` 负责。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 等多格对象在 JSON 中只保存一个 anchor。footprint、cursor、authoring variant 都复用 Engine Object Layout：

- 鼠标指向 Dragon 尾部仍 resolve 到整条 Dragon owner；
- 右键 / Del 删除完整 owner；
- 放置新对象时，与 footprint 相交的旧 owner 整体替换；
- Q/E 或滚轮切换 Engine 定义的 authoring variant；
- runtime occupancy 在 `Game.loadLevel()` 边界展开，Draft 始终保持 anchor 表示。

Editor Palette 的可见性由 Engine Definition 的 `authoring.palette` 决定。

## Play Test

点击 Play 时，Editor 从 Draft 构造独立的运行时地图：

```text
EditorLevel
  -> normalize / clone
  -> LevelMap
  -> 正式 Game.loadLevel()
```

Play Test 使用与 Web 游玩相同的 Engine。Stop 直接销毁临时 Game/Input，因此游戏中的移动、机关状态、收集物等与编辑 Draft 相互隔离。

原版 Adventure 的 Campaign、全局经济和 Bonus 60 秒由 `@bobby/adventure` runtime 负责。Editor Play Test 使用纯 Engine session，自定义地图中的 `ObjectId.LOCK` 只产生通用世界事件。

## 编辑交互

- 左键 / 拖动：放置当前 Terrain / Object；
- 右键 / Del：删除鼠标指向的完整 Object；
- Q / E：旋转、翻转或切换支持 authoring variant 的 Object；
- 滚轮：指向可变 Object 时切换 variant，否则缩放地图；
- 中键拖动：平移；
- Ctrl/Cmd+Z、Y：Undo / Redo；
- 泛蓝高亮：表示本次操作将删除或替换的完整 owner。

## URL 分享

分享数据放在 URL Fragment：

```text
/play#map=...
/edit#map=...
```

两种路由使用同一个 payload，保留 name/author/description；从游玩链接进入后可以直接打开同一地图的 Editor。

分享编码：

```text
BC5R magic/version
+ UTF-8 metadata envelope
+ @bobby/dat 编码的 original DAT level record
-> 如果更小则 deflate-raw
-> base64url
```

前缀：

```text
d.   compressed
r.   raw
```

`editor/share.ts` 通过 `@bobby/dat` 完成 DAT 编解码，分享层只负责 metadata envelope、压缩和 URL 表示。

## 与原版验证的关系

Editor JSON 是长期编辑/备份格式；分享链接是传输格式；原版 JAR patch 是验证工具。三者围绕同一张 semantic `LevelMap`：

```text
Editor Draft -> Play Test -> bc5r Engine
            \-> @bobby/dat -> patched JAR -> original Java ME Engine
```

同一张最小测试地图可以用于对比 Dragon、藤蔓、云、荷叶、开关等逆向机制；Engine / Editor authoring 模型保持纯 semantic，原版格式和 Adventure Campaign 由边界层负责。
