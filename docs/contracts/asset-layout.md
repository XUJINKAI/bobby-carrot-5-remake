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
  "filters": [],
  "chapters": [],
  "maps": []
}
```

它只服务 Explore 的浏览、分组、搜索、筛选、随机选择和列表展示。

`maps` 是 collection 的完整有序地图列表；`chapter` 是 map 的可选分组属性。数组顺序就是 Explore 顺序，不另存重复的 `order` 字段。

filter option 的图标使用语义引用：

```json
{ "type": "terrain", "id": "water-animated" }
{ "type": "object", "id": "carrot" }
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

Play route 不需要 collection index。地图的 `meta.next` 提供同 collection 下一张导航。

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

## 生成规则

`npm run assets` 清理未被 Git 跟踪的生成物，并从 `original/` 与 `custom-maps/` 重建 runtime assets。

Original 生产过程可以保留 archive provenance；runtime 地图与 collection 合同统一使用产品语义 ID。
