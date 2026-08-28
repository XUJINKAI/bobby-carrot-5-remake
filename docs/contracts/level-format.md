# 关卡与原版 DAT 格式契约

## Canonical Map v1

BC5R 仍处于开发阶段，地图 schema 固定为 `schemaVersion: 1`。不维护旧 `terrain[][] + objects[] + playerStart` 格式兼容层，也不提供 schema migration。

Engine、Editor、Explore、Adventure 与自制地图统一使用同一套 Entity Map：

```ts
interface LevelMap {
  schemaVersion: 1;
  width: number;
  height: number;
  entities: LevelEntity[];
  rules?: LevelRules;
}

interface LevelEntity {
  type: EntityType;
  x: number;
  y: number;
  direction?: Direction;
  properties?: Record<string, JsonValue>;
  traits?: string[];
  state?: Record<string, JsonValue>;
}
```

地图中不存在 `TerrainType`、`ObjectType`、`playerStart`、`original:*` 或 `custom:*` 这样的运行时分类。地面、水、Start、Bobby、Dragon、Portal、Push Goal 都是普通 Entity。

`original/` 与 `custom/` 只允许作为源码目录组织方式，便于维护和对照原版；两者必须通过同一个 `EntityRegistry`、同一个 Definition 合同和同一套 World / Editor 流程注册和使用。Registry 不知道 Definition 来自哪个源码目录。

### Entity State

`properties` 描述 Entity 的实例配置，通常在 gameplay 中保持不变；`state` 描述地图开始时 Entity 所处的可变状态，并直接成为运行时 Entity state 的初值。

例如同一种 Switch 不再使用 `switch-raised` / `switch-pressed` 两种 type：

```json
{
  "type": "speed-switch",
  "x": 7,
  "y": 2,
  "state": {
    "pressed": false
  }
}
```

Behavior 可以把 `pressed` 改为 `true`，Visual Runtime 根据 state 选择对应视觉。纯状态或视觉阶段不应成为持久化 Entity type。

首轮 canonical 合并规则如下；后续可以精调字段名，但不恢复拆分 type：

| 旧表示 | canonical Entity | 实例状态 / 参数 |
| --- | --- | --- |
| `color-yellow-block-raised/lowered` | `color-yellow-block` | `state.raised: boolean` |
| `color-pink-block-raised/lowered` | `color-pink-block` | `state.raised: boolean` |
| `tide-up/down/left/right` | `tide` | `direction` |
| `tide-switch-raised/pressed` | `tide-switch` | `state.pressed: boolean` |
| `speed-switch-raised/pressed` | `speed-switch` | `state.pressed: boolean` |
| `carousel-switch-raised/pressed` | `carousel-switch` | `state.pressed: boolean` |
| `wind-switch-{0..3}-on/off` | `wind-switch` | `properties.channel`, `state.active: boolean` |
| `trap-active/inactive` | `trap` | `state.active: boolean` |
| `mirror-1/2/3/4` | `mirror` | `state.variant` |
| `speed-up/down/left/right` | `speed` | `direction` |
| `carousel-1/2/3/4/vertical/horizontal` | `carousel` | `state.variant` |
| `color-yellow-switch-raised/pressed` | `color-yellow-switch` | `state.pressed: boolean` |
| `color-pink-switch-raised/pressed` | `color-pink-switch` | `state.pressed: boolean` |
| `dragon-head/body/tail/anim-*` | `dragon` | footprint role + visual/runtime state |
| `ice-block/ice-melt-*` | `ice-block` | melt stage in `state` |

地图中的 `state` 只描述开局状态；运行过程中的 motion progress、animation clock、runtime Entity id、Presence、RenderNode 等都不进入 LevelMap。

### Bobby 与 Start

Bobby 是普通 Entity，地图不使用 `playerStart`：

```json
{
  "type": "bobby",
  "x": 2,
  "y": 3,
  "direction": "down"
}
```

`start` 也是普通 surface Entity，只表达该地面的玩法与视觉，不承担出生语义，也没有特殊 `start` Trait。Bobby 是否出生在 Start 上，只由两个 Entity 的坐标是否相同决定：

```json
[
  { "type": "start", "x": 2, "y": 3 },
  { "type": "bobby", "x": 2, "y": 3, "direction": "down" }
]
```

Original Adapter 读取 DAT 时，在 Start terrain 的坐标生成 `start` surface，并把 Bobby Entity 的初始坐标设为同一位置。转换完成后 Start 与 Bobby 互不绑定；移动 Bobby 不会改变 Start，移动或替换 Start 也不会定义新的出生点。

一张可游玩地图必须恰好有一个具有 player 身份的 Entity；具体判断来自 Entity Definition / Trait，而不是硬编码 type 名称。

### 同格 Entity 与 Cell Stack

多个 Entity 可以拥有相同的 `(x, y)`。地图不持久化 stack band、occupancy 或 Presence；这些由 Entity Definition 推导。

例如同一格可同时包含 Ground、Bonus Coin 和 Tall Grass：

```json
[
  { "type": "ground-c", "x": 4, "y": 3 },
  { "type": "bonus-coin", "x": 4, "y": 3 },
  { "type": "high-grass", "x": 4, "y": 3 }
]
```

Loader 根据 Definition 生成 Presence 与 Cell Stack，例如 `surface -> content -> cover`。Editor 也使用同一套 Preview World / SpatialIndex 来 inspect 该格，而不是维护 Terrain/Object 两套 authoring 逻辑。

### Multi-cell Entity

多格对象在地图中仍只保存一个 Entity anchor：

```json
{
  "type": "dragon",
  "x": 5,
  "y": 4,
  "direction": "right"
}
```

Dragon Definition 的 footprint 生成 head/body/tail Presence。`head`、`body`、`tail` 是 Presence role，不是独立 Entity type。点击任一 footprint cell 时，Editor inspect 必须能解析到同一个 Dragon Entity 以及光标所在 role。

地图永远不保存展开后的 footprint Presence。

### Entity identity

LevelMap v1 不持久化 runtime Entity id 或 UUID。Editor 可以使用文档内临时 identity 管理 selection/undo，World Loader 使用确定性 allocator 生成 runtime Entity id。

如果 Entity 之间需要关联，优先使用语义属性，例如 Portal `channel`，而不是提前引入持久化 UUID。

## Rules

规则只依赖 Entity / Presence 的语义 selector，不出现 Terrain/Object 分类：

```ts
type WinCondition =
  | { type: "all"; conditions: WinCondition[] }
  | { type: "any"; conditions: WinCondition[] }
  | { type: "collect-all"; target: string }
  | { type: "fill-all"; target: string; filler: string }
  | { type: "reach"; target: string };
```

`target` 与 `filler` 都是 semantic selector：可以直接匹配 Entity type，也可以匹配 Presence Trait。这样稳定的具体目标可以直接写 Entity type，抽象机制则可以继续通过 Trait 组合。

原版三类完成条件分别表达为：

```json
{ "type": "collect-all", "target": "carrot" }
```

```json
{ "type": "fill-all", "target": "egg-nest", "filler": "egg" }
```

```json
{ "type": "reach", "target": "exit" }
```

Sokoban 可以使用 Trait selector：

```json
{
  "type": "fill-all",
  "target": "push-goal",
  "filler": "pushable"
}
```

`all` / `any` 可以递归组合任意条件。例如自定义地图可以同时要求收集胡萝卜、填满彩蛋、完成推箱子并到达出口：

```json
{
  "type": "all",
  "conditions": [
    { "type": "collect-all", "target": "carrot" },
    { "type": "fill-all", "target": "egg-nest", "filler": "egg" },
    { "type": "fill-all", "target": "push-goal", "filler": "pushable" },
    { "type": "reach", "target": "exit" }
  ]
}
```

Engine 对同一份规则树同时计算完成状态与可量化叶子的 `remaining` progress；HUD 等展示层只能消费这个结果，不复制胜利条件查询逻辑。

## MapDocument

网站运行时地图位于：

```text
/assets/maps/<collection>/<map-id>.json
```

`MapDocument` 在 Entity Map gameplay 数据之外携带单图产品 metadata：

```ts
interface MapDocument extends LevelMap {
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

`meta.next` 是同一 collection 中的下一张地图 ID。`/explore/play/<collection>/<id>` 只请求当前地图文件即可完成标题、游玩和下一张导航，不读取 collection `index.json`。

## Editor JSON

Editor 导入、导出与分享直接保存同一套 `schemaVersion: 1` Entity Map，并可附加 authoring metadata，例如 name / author / description。Editor 不维护 Terrain/Object persistence model，也不解析历史 schema。

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

## Original Adapter 边界

原版 JAR / DAT 的 Terrain/Object 二层结构只允许存在于 Original tooling 边界：

```text
JAR / DAT
  ↓ extract
original/extracted
  ↓ decode
original/decoded        原始 terrain/object 语义
  ↓ adapt
Entity Map v1
  ↓
Engine / Editor / Web
```

反向 patch：

```text
Entity Map v1
  ↓ Original Adapter
DAT terrain + object anchors
  ↓ encode
patched JAR
```

Original Adapter 负责所有历史表示转换，例如：

- DAT Start terrain -> `start` surface Entity，并在同一坐标生成 Bobby Entity；
- Dragon object anchor -> `dragon` Entity；
- `dragon` Entity -> DAT Dragon anchor；
- 原版 pressed/raised 或 animation-specific id -> 单一 Entity type + `state`；
- Entity surface/content/cover -> 对应 DAT terrain/object 表达。

Engine、Editor 与通用 Model 不得因为 DAT 限制重新引入 Terrain/Object 分类。

## Original source 与产品 ID

Original 工具链继续保留 archive/source identity：

```text
JAR / DAT
  ↓ extract
original/extracted
  ↓ decode
original/decoded         release / packFile / levelIndex
  ↓ adapt
original/adapted         产品语义 map id 与 MapDocument
```

第一次转换到产品语义时直接得到 `1-1`、`1-2`、`1-bonus-1` 等产品 map id。Base/UP、DAT package 与 source record slot 只属于 archive provenance。

## 原始 DAT package

原版外部协议保持不变：

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

raw byte 映射只存在于 Original tooling。官方 DAT round-trip 要求仍由 adapter/encoder 保证；通用 Entity Map 不为 DAT 私有字段或限制预留兼容结构。

## Adventure 地图增强

Adventure 可以在基础 LevelMap 进入 Engine 前生成 session Entity Map：

```text
base LevelMap
  ↓ Adventure augmentation
session LevelMap
  ↓
Engine
```

增强不修改基础地图。Engine 不知道 Adventure。
