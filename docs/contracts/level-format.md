# 关卡与原版 DAT 格式契约

## 纯语义 LevelMap

`@bobby/model` 的核心关卡合同是：

```ts
interface LevelObject {
  type: ObjectType;
  x: number;
  y: number;
  properties?: Record<string, string>;
}

interface LevelMap {
  width: number;
  height: number;
  terrain: TerrainType[][];
  objects: LevelObject[];
  rules?: {
    maxMoves?: number;
  };
}
```

`properties` 是对象实例参数。它不表达地图来源，也不能存 DAT byte、source、release、Campaign 或 Editor 专用状态。

例如带作者对白的 Sandman：

```json
{
  "type": "sandman",
  "x": 8,
  "y": 12,
  "properties": {
    "dialogue": "作者写的话"
  }
}
```

Engine、Editor 与 Adventure 都围绕同一个 `LevelMap` 合同工作。Engine 不区分官方地图、Adventure 增强地图或 Editor 地图。自定义 Engine 机制与地图规则见 [`../extensions.md`](../extensions.md)。

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

raw byte 映射唯一存在于 `dat/src/mapping.ts`。

`@bobby/dat` 提供：

```text
decode/encodeDatTerrain
decode/encodeDatObject
decode/encodeDatLevelRecord
deriveDatDynamicSlots
split/joinDatPackage
replaceDatLevelRecord
```

官方 DAT 必须满足：

```text
original record
 -> decode LevelMap
 -> encode
 == original record byte-for-byte
```

DAT 本身没有 `LevelObject.properties`。把纯语义地图编码回原版 DAT 时，实例扩展参数不属于原版二进制格式，不能伪装成原版字段。

## DAT 的使用边界

`@bobby/dat` 只用于：

- 官方地图解码与生成；
- 原版格式研究；
- tools；
- Original JAR patch / validation；
- DAT round-trip 与相关测试。

Web 与 Editor 不依赖 `@bobby/dat`。用户地图不提供 DAT 导入、DAT 导出或 DAT-backed URL share。

## OfficialLevelData / Catalog identity

构建出的官方 JSON 可以附加档案字段：source、record hash、difficulty、public/canonical ID 等。它们用于 Catalog、逆向证据与内容浏览；不是 Engine 的必需字段。

正式 Campaign public ID 是连续章节身份：

```text
1-1
1-bonus-1
...
40-10
```

Base/UP、DAT package 和 source record 只属于 archive provenance。40×12 个正式 map 之外还有 5 个共享 Special Scene；它们同样包含可转换为 `LevelMap` 的地图内容，但不是正式关卡节点。

章节 1～3 星难度来自 DAT metadata `packType`，仍属于 Catalog/Adventure metadata，不进入 `LevelMap`。

## Multi-cell Object

DAT Object table 和所有 authoring/persistence 模型只保存 anchor。Dragon、Sandman、Dream Machine、Beaver 的 body/tail 由 Engine Object Layout 在 runtime load 时展开。

展开时必须复制 anchor 的 `properties`，因此例如 Sandman body 被触碰时仍能得到 anchor 上的 `dialogue`。折回 authoring anchor 时同样必须保留这些属性。

## Editor JSON

Editor JSON 是 Bobby Carrot 5 Remake 自定义长期编辑格式，`schemaVersion=2`，额外允许 `name / author / description`。它保持 semantic ID、anchor object 与 `LevelObject.properties`，不保存 raw DAT 或 Adventure state。

当前用户地图只有两个文件动作：

```text
JSON Import
JSON Export
```

JSON round-trip 必须保留已定义对象实例参数。

当前没有 URL share 产品协议。未来如果重新加入分享功能，应单独定义新格式；不能以复用原版 DAT 为理由重新建立 Web/Editor → `@bobby/dat` 依赖。

## Adventure 地图增强

Adventure 可以在基础地图进入 Engine 前覆盖对象实例参数：

```text
base LevelMap
  ↓
Adventure augmentation
  ↓
Engine LevelMap
```

增强操作返回新的 `LevelMap`，不修改原始基础地图。Engine 只看到增强后的通用实例属性，不知道它们来自 Adventure。

## Original JAR patch

`npm run original:patch` 把 Editor JSON 的 `LevelMap` 通过 tools / `@bobby/dat` 编码成一个 DAT level record，替换指定 Campaign public ID 对应的原版槽位，然后写出独立验证 JAR。原始 JAR 永不修改。

这里的 DAT 编码属于验证工具链，不会让 Editor 产品依赖 DAT。详见 `docs/workflows/validate-original.md`。
