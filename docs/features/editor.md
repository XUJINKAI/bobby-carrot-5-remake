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

Play Test 通过 Runtime Config 启用 Engine Gameplay HUD 和 Screen Joystick，与 Adventure、Explore 和 Custom Play 共用同一套基础呈现与移动输入。

原版 Adventure 的 Campaign 和全局经济由 `@bobby/adventure` 负责。Adventure 把 Bonus 60 秒编码为 Lock 的 `timedChallengeMs` 实例参数；Editor Play Test 中带相同参数的 Lock 由 Engine 执行同一套倒计时、超时死亡、Undo 和 Restart 规则。

## 编辑交互

- 左键 / 拖动：放置当前 Terrain / Object；
- 右键 / Del：删除鼠标指向的完整 Object；
- Q / E：旋转、翻转或切换支持 authoring variant 的 Object；
- 滚轮：指向可变 Object 时切换 variant，否则缩放地图；
- 中键拖动：平移；
- Ctrl/Cmd+Z、Y：Undo / Redo；
- 泛蓝高亮：表示本次操作将删除或替换的完整 owner。

## 文件与产品入口

用户地图的长期交换动作是：

```text
JSON Import
JSON Export
```

Home 的 Import Dialog 读取 JSON 后展示地图摘要，并提供“游玩”和“编辑”两个入口。Custom Play 可以用相同语义地图重新进入 Editor。

当前产品没有 URL share 协议。未来增加分享能力时，应为语义 JSON 单独定义版本化产品协议，并保留 `name / author / description` 与 `LevelObject.properties`。

Editor 工作区、Play Test 与 Custom Map 的页面结构见 [`ui.md`](ui.md)。

## 与原版验证的关系

Editor JSON 是长期编辑/备份格式，原版 JAR patch 是独立验证工具。两条路径围绕同一张 semantic `LevelMap`：

```text
Editor Draft -> Play Test -> bc5r Engine
            \-> @bobby/dat -> patched JAR -> original Java ME Engine
```

同一张最小测试地图可以用于对比 Dragon、藤蔓、云、荷叶、开关等逆向机制；Engine / Editor authoring 模型保持纯 semantic，原版格式和 Adventure Campaign 由边界层负责。
