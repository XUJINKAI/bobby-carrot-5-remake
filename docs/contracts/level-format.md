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
  stackOrder?: number;
  [field: string]: JsonPrimitive | undefined;
}
```

地图中不存在 `TerrainType`、`ObjectType`、`playerStart`、`original:*` 或 `custom:*` 这样的运行时分类。地面、水、Start、Bobby、Dragon、Portal、Push Goal 都是普通 Entity。

`original/` 与 `custom/` 只允许作为源码目录组织方式，便于维护和对照原版；两者必须通过同一个 `EntityRegistry`、同一个 Definition 合同和同一套 World / Editor 流程注册和使用。Registry 不知道 Definition 来自哪个源码目录。

### Entity 字段与 Runtime State

每种 Entity 可以通过 `EntityMapDefinition` 声明顶层 primitive 字段。字段合同包含类型、枚举值、范围、默认值和是否必填；地图 parser、Editor Inspector 与生成物校验共用该合同。

`LevelEntity` 只声明 `type / x / y / stackOrder` 公共字段。`direction`、`variant`、`pressed` 等类型专属字段只由对应的 `EntityMapDefinition` 声明。

地图字段只描述开局语义。Loader 将这些字段投影为 Engine runtime state，Behavior 后续只修改 runtime Entity；motion progress、animation clock、runtime Entity id、Presence、RenderNode 与道具库存都不进入 LevelMap。

例如同一种 Switch 不再使用 `switch-raised` / `switch-pressed` 两种 type：

```json
{
  "type": "speed-switch",
  "x": 7,
  "y": 2,
  "pressed": false
}
```

Behavior 可以在 runtime state 中把 `pressed` 改为 `true`，Visual Runtime 根据 runtime state 选择对应视觉。纯状态或视觉阶段不应成为持久化 Entity type。

首轮 canonical 合并规则如下；后续可以精调字段名，但不恢复拆分 type：

| 旧表示 | canonical Entity | 实例状态 / 参数 |
| --- | --- | --- |
| `color-yellow/pink-block-raised/lowered` | `color-block` | `color` + `raised` |
| `tide-up/down/left/right` | `tide` | `direction` |
| `tide-switch-raised/pressed` | `tide-switch` | `pressed` |
| `speed-switch-raised/pressed` | `speed-switch` | `pressed` |
| `carousel-switch-raised/pressed` | `carousel-switch` | `pressed` |
| `wind-switch-{0..3}-on/off` | `wind-switch` | `direction` + `active` |
| `trap-active/inactive` | `trap` | `active` |
| `mirror-1/2/3/4` | `mirror` | `variant` |
| `speed-up/down/left/right` | `speed` | `direction` |
| `carousel-1/2/3/4/vertical/horizontal` | `carousel` | `variant: right-top/left-top/left-bottom/right-bottom/vertical/horizontal` |
| `color-yellow/pink-switch-raised/pressed` | `color-switch` | `color` + `state` |
| `dragon-head/body/tail/anim-*` | `dragon` | footprint role + visual/runtime state |
| `ice-block/ice-melt-*` | `ice-block` | melt stage 只存在于 runtime state |

原版地图偶尔会把 Palette 图块放在 terrain 层；这类记录使用
`type: "original-tile"` 与 `variant: "ts-<row>-<column>"`。普通 Surface 与 Object
使用稳定语义 type。atlas 坐标、selector 与动画帧以
`model/src/map/entity/original-tile-visuals.json` 为唯一来源；
`tools/original/dat/` 可以从 DAT byte 的行优先位置推导 atlas 坐标。

同一语义 type 的 atlas variant 可以具有不同地图内语义。Model 负责提供 type、
variant 与 atlas 坐标的稳定对应关系；Engine 在加载关卡时为具体实例解析 Trait，
Entity Definition 只登记该 type 所有 variant 共有的 Trait。

Editor Surface 始终按单格持久化。月亮、圣诞树、雪人等视觉拼图由多个同类型、不同 `variant` 的单格 Entity 组成；它们不使用 footprint。Dragon 等 Palette Object 仍按下文的 multi-cell anchor 合同持久化。

### Bobby 与 Start

Bobby 是普通 Entity，地图不使用 `playerStart`：

```json
{
  "type": "bobby",
  "x": 2,
  "y": 3
}
```

`start` 也是普通 surface Entity，只表达该地面的玩法与视觉，不承担出生语义，也没有特殊 `start` Trait。Bobby 是否出生在 Start 上，只由两个 Entity 的坐标是否相同决定：

```json
[
  { "type": "start", "x": 2, "y": 3 },
  { "type": "bobby", "x": 2, "y": 3 }
]
```

Original Adapter 读取 DAT 时，在 Start terrain 的坐标生成 `start` surface，并把 Bobby Entity 的初始坐标设为同一位置。转换完成后 Start 与 Bobby 互不绑定；移动 Bobby 不会改变 Start，移动或替换 Start 也不会定义新的出生点。

一张可游玩地图必须恰好有一个具有 player 身份的 Entity；具体判断来自 Entity Definition / Trait，而不是硬编码 type 名称。

### 同格 Entity 与 Cell Stack

多个 Entity 可以拥有相同的 `(x, y)`。地图不持久化 stack band、occupancy 或 Presence；这些由 Entity Definition 推导。

例如同一格可同时包含 Ground、Bonus Coin 和 Tall Grass：

```json
[
  { "type": "grass", "x": 4, "y": 3, "variant": "ts-10-1" },
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

地图中的鸟巢实体使用 `egg`。填充状态由 Engine 在运行时管理；规则中的
`egg-nest` 与 `egg` 分别匹配鸟巢位置和已填充状态的 Runtime Trait selector。

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
    name: string;
    author?: string;
  };
}
```

`MapDocument` 不持久化资源 ID 和导航关系。collection 与 map ID 来自 `/assets/maps/<collection>/<map-id>.json` 路径；列表、分组和下一张导航由 collection `index.json` 决定。地图内音乐使用 `LevelMap.music`，地图注记使用顶层 `LevelMap.note`。

`@bobby/model` 的 `parseMapDocument()` 是持久化文档的严格入口，`parseLevelMap()` 校验后只返回 gameplay 字段。Editor JSON、BC5R1/Embed、Explore 加载和 `npm run verify` 共用这两个入口；未知 Entity、未知字段、错误字段值、越界坐标和非法规则都会被拒绝。

## Editor JSON

Editor 导入、导出与分享直接保存同一套 `schemaVersion: 1` Entity Map，并可编辑 name、author 与顶层 note。Editor 不维护 Terrain/Object persistence model，也不解析历史 schema。

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
- 原版 pressed/raised 或 animation-specific id -> 单一 Entity type + 顶层开局字段；
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
