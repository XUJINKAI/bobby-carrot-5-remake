# 地图编辑器

Editor 是 Bobby Carrot 5 Web 的玩家功能，也是 Engine 的首选交互式调试入口；它不是第二套 gameplay 实现。

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

核心内容就是 `@bobby/model::LevelMap { width, height, terrain, objects }`，再附加 name/author/description。DAT record length、SHA-256、发行包、chapter、difficulty、dynamic_slots 等官方档案字段不进入 Editor Draft。

Terrain/Object 永远使用 semantic ID；Editor 不读取或保存 raw DAT byte。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 等多格对象在 JSON 中只保存一个 anchor。footprint、cursor、authoring variant 都复用 Engine Object Layout：

- 鼠标指向 Dragon 尾部仍 resolve 到整条 Dragon owner；
- 右键 / Del 删除完整 owner；
- 放置新对象时，与 footprint 相交的旧 owner 整体替换；
- Q/E 或滚轮切换 Engine 定义的 authoring variant；
- runtime occupancy 只在 `Game.loadLevel()` 边界展开，不写回 Draft。

Editor Palette 的可见性由 Engine Definition 的 `authoring.palette` 决定，不维护私有 Object ID 黑名单。

## Play Test

Editor 永远不把 Draft 本体交给 Runtime。点击 Play：

```text
EditorLevel
  -> normalize / clone
  -> LevelMap
  -> 正式 Game.loadLevel()
```

Play Test 使用与 Web 游玩相同的 Engine。Stop 直接销毁临时 Game/Input，因此游戏中的移动、机关状态、收集物等不会污染编辑结果。

官方 Bonus Round 的 60 秒属于 Web session metadata，不属于地图语义；Editor Play Test 不根据地图内容猜 Bonus 模式。

## 编辑交互

- 左键 / 拖动：放置当前 Terrain / Object；
- 右键 / Del：删除鼠标指向的完整 Object；
- Q / E：旋转、翻转或切换支持 authoring variant 的 Object；
- 滚轮：指向可变 Object 时切换 variant，否则缩放地图；
- 中键拖动：平移；
- Ctrl/Cmd+Z、Y：Undo / Redo；
- 泛蓝高亮：表示本次操作将删除或替换的完整 owner。

没有 Eyedropper，也没有独立 Eraser mode。

## URL 分享

分享数据放在 URL Fragment：

```text
/play#map=...
/edit#map=...
```

两种路由使用同一个 payload，保留 name/author/description；从游玩链接进入后仍可直接打开同一地图的 Editor。

唯一分享编码：

```text
BC5R magic/version
+ UTF-8 metadata envelope
+ @bobby/dat 编码的 original DAT level record
-> 如果更小则 deflate-raw
-> base64url
```

前缀只有：

```text
d.   compressed
r.   raw
```

分享不是第二套 DAT codec；`editor/share.ts` 只调用 `@bobby/dat`。项目不继续兼容早期 `j.` / `z.` JSON 分享格式。

## 与原版验证的关系

Editor JSON 是长期编辑/备份格式；分享链接是短期传输格式；原版 JAR patch 是验证工具。三者最终都围绕同一张 semantic `LevelMap`：

```text
Editor Draft -> Play Test -> bc5r Engine
            \-> @bobby/dat -> patched JAR -> original Java ME Engine
```

这样可以用同一张最小测试地图对比 Dragon、藤蔓、云、荷叶、开关等逆向机制，而不让原版格式细节渗入 Engine 或 Editor authoring 模型。
