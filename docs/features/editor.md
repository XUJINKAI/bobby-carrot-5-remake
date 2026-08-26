# 地图编辑器

Editor 是 Bobby Carrot 5 Remake 的玩家功能，也是 Engine 的交互式调试入口。Play Test 使用正式 Engine gameplay 实现。

## 模块结构

```text
editor/src
├── level/       EditorLevel、规范化、校验与 JSON 序列化
├── document/    EditorDocument、History 与编辑命令
├── authoring/   owner/layout、放置、Palette Catalog 与 Inspector Model
└── canvas/      Renderer、Input、Viewport 与坐标转换
```

`@bobby/editor` 不创建页面 DOM，也不访问 File、Blob、URL、Dialog、Router、`localStorage` 或 `sessionStorage`。这些产品能力由 Web 页面持有。

## Editor JSON

导入/导出使用当前语义 schema v1：

```json
{
  "schemaVersion": 1,
  "name": "My Level",
  "author": "optional",
  "description": "optional",
  "width": 20,
  "height": 16,
  "terrain": [["ground-c"]],
  "objects": [{ "type": "carrot", "x": 4, "y": 8 }]
}
```

当前开发阶段只接受 v1。地图核心仍是 `@bobby/model::LevelMap`；Editor metadata 不进入 Engine。

Runtime collection 的 `MapDocument` 使用 `meta` 包装产品 metadata。Web 从 `MapDocument` 打开 Editor 时，只把其中 `LevelMap` gameplay 内容交给 Editor，并以 `meta.name` 生成副本名称。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 等多格对象在 JSON 中只保存 anchor。footprint、cursor、authoring variant 共用 Engine Object Layout：

- 鼠标指向 body/tail 仍 resolve 到完整 owner；
- 右键 / Del 删除完整 owner；
- 放置新对象时，与 footprint 相交的旧 owner 整体替换；
- Q/E 或滚轮切换支持的 authoring variant；
- runtime occupancy 只在 Engine level-load 边界展开。

## Play Test

```text
EditorLevel
  -> normalize / clone
  -> LevelMap
  -> Game.loadLevel()
```

Runtime 不反写 Draft。Stop 销毁临时 Game/Input 后恢复 Editor viewport。

## 编辑交互

- 左键 / 拖动：放置当前 Terrain / Object；
- 右键 / Del：删除鼠标指向的完整 Object；
- Q / E：旋转、翻转或切换支持 authoring variant 的 Object；
- 滚轮：指向可变 Object 时切换 variant，否则缩放地图；
- 中键拖动：平移；
- 两指手势：缩放 Editor viewport；
- Ctrl/Cmd+Z、Y：Undo / Redo；
- 泛蓝高亮：表示本次操作将删除或替换的完整 owner。

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
