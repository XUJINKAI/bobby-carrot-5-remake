# 资产目录契约

```text
assets/
├── maps/
│   ├── index.json
│   ├── original/
│   │   ├── index.json
│   │   ├── 1-1.json
│   │   └── ...
│   └── <collection>/
│       ├── index.json
│       └── <map-id>.json
├── adventure/
│   └── index.json
├── i18n/
├── art/
└── audio/
```

`assets/` 是网站 `/assets/` 的静态资源源树。`build` 将其原样复制到 `dist/assets/`。

## `maps/index.json`

只负责 collection discovery 与 tab 顺序：

```json
{
  "schemaVersion": 1,
  "collections": [
    { "id": "original", "name": "原版关卡", "description": "...", "order": 0 }
  ]
}
```

## `maps/<collection>/index.json`

所有 collection 使用同一合同：

```json
{
  "schemaVersion": 1,
  "id": "original",
  "name": "原版关卡",
  "description": "...",
  "cardSize": "small",
  "filters": [],
  "chapters": [],
  "maps": []
}
```

它只服务 Explore 的浏览、分组、搜索、筛选、随机选择和列表展示。

`cardSize` 控制该 collection 的地图卡片密度，可取 `small / medium / big`。它属于 collection 的展示数据，因此 chapter 只负责分组，不决定地图卡片尺寸。

`maps` 是 collection 的完整有序地图列表；`chapter` 是 map 的可选分组属性。`maps[].name` 直接来自对应 MapDocument 的 `meta.name`，Explore 原样显示该名称。数组顺序就是 Explore 顺序，不另存重复的 `order` 字段。

filter option 的 Gameplay 图标使用统一 Entity preview descriptor，不区分 Original/Custom，也不区分 Terrain/Object：

```json
{ "type": "entity", "entity": { "type": "carrot" } }
{ "type": "entity", "entity": { "type": "tide", "direction": "right" } }
{ "type": "entity", "entity": { "type": "mirror", "variant": "right-bottom" } }
```

`entity` 使用与 `LevelEntity` 相同的 `type` 与类型专属顶层字段，但作为预览描述不包含坐标。Explore 应通过 Engine VisualDefinition/preview 能力绘制它，而不是按 ID 自己维护一套 atlas 或 CSS 映射。

纯 UI 图标仍可使用：

```json
{ "type": "image", "src": "assets/..." }
{ "type": "text", "value": "B" }
```

Collection JSON 不保存 atlas 坐标。

## `maps/<collection>/<map-id>.json`

这是独立可打开的 `MapDocument`。URL：

```text
/explore/play/<collection>/<map-id>
```

直接映射到：

```text
/assets/maps/<collection>/<map-id>.json
```

Play route 直接加载当前 MapDocument；同 collection 的列表与下一张导航来自 collection index。

MapDocument 的 gameplay 部分统一是 Entity Map v1。Bobby 是 Entity；Start 如果存在也是普通 surface Entity，不承担出生语义。具体规则见 `docs/contracts/level-format.md`。

## `adventure/index.json`

Adventure index 只定义 Campaign topology：章节、章节内 level 顺序、Special Scene，以及每个 node 引用的 map。

```json
{
  "schemaVersion": 1,
  "chapters": [
    {
      "id": "1",
      "levels": [
        { "id": "1-1", "map": "original/1-1" }
      ]
    }
  ]
}
```

Adventure 不拥有地图内容；它引用 `assets/maps/` 下的 MapDocument。

## Custom map 构建源

`custom-maps/` 是 generic custom collection 的构建输入。人工维护的地图可以直接提交语义 JSON；外部批量关卡集也可以先保留其原始文本，再由专用工具生成这个统一输入格式。

生成型 custom map 目录必须加入 `.gitignore`，每次 `assets prepare` 都从唯一源重新生成，不能手工修改生成文件。

LOMA Pushbox 使用：

```text
tools/custom/LOMA.txt
  ↓ tools/custom/loma-pushbox.mjs
custom-maps/loma-pushbox/<chapter>/*.json  # ignored / generated
  ↓ tools/custom/prepare.mjs
assets/maps/loma-pushbox/index.json
assets/maps/loma-pushbox/<map-id>.json
```

`LOMA.txt` 是受 Git 管理的第三方源数据；授权与作者信息见根目录 `THIRD_PARTY_ASSETS.md`。

LOMA 原始 `Title` 的 `LOMA01-*` ～ `LOMA10-*` 对应该 collection 的 10 个 source pattern，因此生成器把地图分别写入 `01` ～ `10` chapter 目录。`tools/custom/prepare.mjs` 从路径得到 collection `maps[].chapter`；chapter 不是 Engine `LevelMap` 字段，也不是 Editor JSON 的持久化字段。

Novoban 使用同一生成边界，但源文件没有自然 chapter，因此保持平铺 collection：

```text
tools/custom/NOVOBAN.txt
  ↓ tools/custom/novoban-pushbox.mjs
custom-maps/novoban-pushbox/*.json   # ignored / generated
  ↓ tools/custom/prepare.mjs
assets/maps/novoban-pushbox/index.json
assets/maps/novoban-pushbox/<map-id>.json
```

Novoban 的 50 张地图按源文件顺序生成 `01` ～ `50`；原注释标题成为地图展示名，作者统一保留为 François Marques。版权与来源边界见根目录 `THIRD_PARTY_ASSETS.md`。

LOMA 与 Novoban 的 XSB 字符转换由 `tools/custom/sokoban-xsb.mjs` 统一负责。墙和地图外部空白使用隐式 Void；普通地板生成带 `ts-10-1` variant 的 `grass`，目标生成 `push-goal`，箱子生成 `pushable-rock`，玩家生成 Bobby Entity。标准 `+` 因此自然表示同格 `push-goal surface + Bobby content`，不需要 `playerStart` 或 Start surface。

`custom-maps/collections.json` 可用可选 `chapters` 为已存在的 chapter 目录补充 `name` 与 `description`。chapter 身份和成员关系来自 `custom-maps/<collection>/<chapter>/`；只允许这一层 chapter 目录，根目录地图则没有 chapter。Explore 只读取统一生成的 collection index，不知道该 collection 的数据来源。

## 生成规则

`npm run assets` 清理未被 Git 跟踪的生成物，并从 `original/` 与 `custom-maps/` 重建 runtime assets。

Original 生产过程可以保留 archive provenance；runtime 地图与 collection 合同统一使用产品语义 ID。
