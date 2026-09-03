# 地图编辑器

Editor 是 Bobby Carrot 5 Remake 的玩家功能，也是 Engine 的交互式调试入口。Play Test 使用正式 Engine gameplay 实现。

## 模块结构

```text
editor/src
├── level/       EditorMap、规范化、校验与 JSON 序列化
├── document/    EditorDocument、History 与编辑命令
├── authoring/   放置、Surface、Palette、Selection 与 Inspector Model
└── canvas/      Renderer、Input、Viewport 与坐标转换
```

`@bobby/editor` 不创建页面 DOM，也不访问 File、Blob、URL、Dialog、Router、`localStorage` 或 `sessionStorage`。这些产品能力由 Web 页面持有。

## Editor JSON

导入/导出使用当前语义 schema v1，地图 gameplay 内容继续使用统一 Entity 列表：

```json
{
  "schemaVersion": 1,
  "name": "My Level",
  "author": "optional",
  "description": "optional",
  "width": 20,
  "height": 16,
  "entities": [
    { "type": "ground-c", "x": 0, "y": 0 },
    { "type": "carrot", "x": 4, "y": 8 }
  ]
}
```

当前开发阶段只接受 v1。地图核心仍是 `@bobby/model::LevelMap`；Editor authoring policy 不进入 Engine。

Runtime collection 的 `MapDocument` 使用 `meta` 包装产品 metadata。Web 从 `MapDocument` 打开 Editor 时，只把其中 `LevelMap` gameplay 内容交给 Editor，并以 `meta.name` 生成副本名称。

## Surface 与 Palette

Surface 与 Palette 是两套并列的 authoring UX，不要求与 Engine Entity taxonomy 一一对应。

Surface 表示“这一格的基础地貌是什么”，每格最多保留一个 Surface。Surface 可以影响 gameplay；是否影响解法不是 Surface / Palette 的划分标准。当前 Surface Type 使用：

```text
ground
solid
water
ice
sky
waterfall
```

`blocking` 保留为 Engine trait / 行为语义，不作为 Surface Type 名称。

Theme 是局部视觉族，不是整张地图的全局主题。Forest、Snow、Desert、Space 可以在同一地图中混用；Water、Ice、Waterfall 等没有主题差异时使用 Shared。

Surface 编辑支持四种空间操作：

- Brush：连续按格涂抹，一次拖动形成一次 Undo；
- Rect：拖出矩形后整块应用当前 Surface brush；
- Fill：四方向 flood fill，匹配相邻 Surface 的 Type + Theme，忽略具体 visual variant；
- Selection：先框选矩形，再把当前 Surface brush 批量应用到选区。

Variant 分配支持：

- Auto：按地图坐标和 seed 稳定分配 variant；同一 seed 不会因刷新而改变；
- Exact：强制使用一个具体 variant，用于手工修边和原版精确复刻；
- Alternate：两个 variant 按 `(x + y) % 2` 交替，主要用于接缝、atlas mapping 等 Debug。

Surface 面板右键地图直接取样当前 Surface，读取 Type、Theme 和 Exact variant。Palette 右键仍走 Entity 选择/菜单语义。

Waterfall 属于 Surface。Auto 绘制连续竖向瀑布时，根据本次目标区域自动选择 Start / Middle / End visual variant。

Palette 只负责独立放置的 Actor、Item、Mechanism 等对象。Palette 放置不会删除已有 Surface；Surface 区域操作也不会删除叠在其上的 Palette Entity。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 等多格对象在 JSON 中只保存 anchor。footprint 与 authoring variant 通过 Engine Object Layout 和 Editor policy 解析：

- 鼠标指向 body/tail 仍 resolve 到完整 owner；
- Del 删除完整 owner；
- Q/E 或滚轮切换支持的 authoring variant；
- runtime occupancy 只在 Engine level-load 边界展开。

## Play Test

```text
EditorMap
  -> normalize / clone
  -> LevelMap
  -> Game.loadLevel()
```

Runtime 不反写 Draft。Stop 销毁临时 Game/Input 后恢复 Editor viewport。

## 编辑交互

- Bottom Bar 的 Palette / Surface 在两种 authoring UX 之间即时切换；
- Surface：Brush / Rect / Fill / Selection；右键取样；
- Palette：Select / Place / Erase；Q/E 或滚轮切换可变 Entity；
- 滚轮在没有 Entity variant 操作时缩放地图；
- 中键拖动：平移；
- 两指手势：缩放 Editor viewport；
- Ctrl/Cmd+Z、Y：Undo / Redo。

## Data Exchange

用户地图长期内容是 schema v1 语义 JSON。公共 Data Exchange 可以搬运同一内容：

```text
Plain JSON
BC5R1 compressed text
Share URL fragment
.json / .bc5r text file
```

`BC5R1` 是 transport 版本，与 JSON `schemaVersion` 独立。

## 原版验证

Editor JSON 与原版 JAR patch 围绕同一套 semantic `LevelMap`：

```text
Editor Draft -> Play Test -> bc5r Engine
            \-> Original DAT tooling -> patched JAR -> original Java ME Engine
```

原版 source provenance 与 Campaign topology 都由边界层持有，不进入 Editor Draft。
