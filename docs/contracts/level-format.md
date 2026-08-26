# 关卡与原版 DAT 格式契约

## 三层地图合同

Bobby Carrot 5 Remake 把可游玩地图分为三个明确层次：

```text
Editor JSON / Runtime MapDocument
              ↓ strip metadata
          LevelMap
              ↓
            Engine
```

### LevelMap

`@bobby/model` 只定义纯 gameplay semantics：

```ts
interface LevelMap {
  width: number;
  height: number;
  terrain: TerrainType[][];
  objects: LevelObject[];
  rules?: LevelRules;
}
```

Engine 只消费 `LevelMap`。`schemaVersion`、名称、作者、collection、chapter、next、来源、DAT 信息都不是 Engine 字段。

### MapDocument

网站运行时地图位于：

```text
/assets/maps/<collection>/<map-id>.json
```

合同为：

```ts
interface MapDocument extends LevelMap {
  schemaVersion: 1;
  meta: {
    id: string;
    name: string;
    description?: string;
    author?: string;
    next?: string;
    music?: string;
  };
}
```

`meta` 属于单张地图独立打开时需要的产品信息。Web loader 读取 `MapDocument`，把 gameplay 字段转换成 `LevelMap` 后再交给 Engine。

`meta.next` 是同一 collection 中的下一张地图 ID。它使 `/explore/play/<collection>/<id>` 可以只请求当前地图文件完成标题、游玩和下一张导航，不依赖 collection `index.json`。

### Editor JSON

Editor 导入、导出和分享使用 `schemaVersion: 1`。Editor JSON 保存 authoring metadata 与同一套语义 gameplay 数据：

```json
{
  "schemaVersion": 1,
  "name": "My Level",
  "author": "optional",
  "description": "optional",
  "width": 20,
  "height": 16,
  "terrain": [["ground-c"]],
  "objects": []
}
```

当前开发阶段只接受 schema v1，不维护历史 schema 兼容解析。

`BC5R1` 是 JSON 的传输编码版本，不是地图 schemaVersion。

## Collection 与 Campaign metadata

Explore collection metadata 位于：

```text
assets/maps/<collection>/index.json
```

它只负责浏览 UI：collection 名称、说明、filter 定义、chapter 分组和 map 列表。直接 Play 不读取该文件。

Adventure Campaign topology 位于：

```text
assets/adventure/index.json
```

它定义章节、Campaign node 顺序与节点引用的 map。Adventure 顺序与地图本身分离。

## Original source 与产品 ID

Original 工具链边界：

```text
JAR / DAT
  ↓ extract
original/extracted       原始文件
  ↓ decode
original/decoded         release / packFile / levelIndex
  ↓ adapt
original/adapted         产品语义 ID 与 MapDocument
```

`extract` 与 `decoded` 忠实保留 archive/source identity。第一次转换到产品语义时直接得到：

```text
1-1
1-2
1-3
1-bonus-1
...
40-10
```

普通 chapter DAT 中 source levelIndex 1～10 是普通地图，11/12 是两个 Bonus。玩家顺序为：

```text
1, 2, 3, bonus-1, 4, 5, 6, bonus-2, 7, 8, 9, 10
```

Explore 与 Adventure 都使用这套玩家顺序。

Base/UP、DAT package 与 source record slot 只属于 archive provenance。

## 原始 DAT package

原版外部协议：

```text
u16 metadata_record_length  big-endian
metadata_record[...]        archive/campaign metadata

repeat until EOF:
  u16 level_record_length   big-endian
  u8 width
  u8 height
  u8 terrain[height][width]
  u8 dynamic_slots
  u16 object_count          big-endian
  repeat object_count:
    u8 object_id
    u8 x
    u8 y
```

raw byte ↔ semantic 映射只存在于 Original DAT tooling。官方 DAT 必须满足：

```text
original record
 -> decode LevelMap
 -> encode
 == original record byte-for-byte
```

DAT 本身没有 `LevelObject.properties`。语义扩展参数不能伪装成原版二进制字段。

## Multi-cell Object

DAT Object table 和 authoring/persistence 模型只保存 anchor。Dragon、Sandman、Dream Machine、Beaver 的 body/tail 由 Engine Object Layout 在 runtime load 时展开。

展开与折回都必须保留 anchor 的 `traits` 与 `properties`。

## Adventure 地图增强

Adventure 可以在基础 `LevelMap` 进入 Engine 前生成 session instance：

```text
base LevelMap
  ↓ Adventure augmentation
session LevelMap
  ↓
Engine
```

增强不修改基础地图。Engine 不知道 Adventure。

## Original JAR patch

`npm run original:patch` 接受 schema v1 语义地图，按 Campaign ID 从 adapted provenance 找到原版 release / DAT package / source slot，只替换目标 DAT level record，并写出独立验证 JAR。原始 JAR 永不修改。
