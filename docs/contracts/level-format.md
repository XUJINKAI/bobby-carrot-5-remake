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
  [field: string]: JsonPrimitive | readonly string[] | undefined;
}
```

地图中不存在 `TerrainType`、`ObjectType`、`playerStart`、`original:*` 或 `custom:*` 这样的运行时分类。地面、水、Start、Bobby、Dragon、Portal、Push Goal 都是普通 Entity。

`original/` 与 `custom/` 只允许作为源码目录组织方式，便于维护和对照原版；两者必须通过同一个 `EntityRegistry`、同一个 Definition 合同和同一套 World / Editor 流程注册和使用。Registry 不知道 Definition 来自哪个源码目录。

### Entity 字段与 Runtime State

每种 Entity 可以通过 `EntityMapDefinition` 声明顶层字段。字段通常是 primitive；
`string-or-string-list` 专用于可保持单句形式、也可扩展成多轮内容的字面文本。字段合同包含类型、格式、枚举值、范围、默认值和是否必填；地图 parser、Editor Inspector 与生成物校验共用该合同。`color` 格式支持 `#rgb`、`#rrggbb` 和 Model 颜色别名表中的常用名称。

读取边界采用宽进严出的前向兼容策略：地图整体结构、坐标与规则仍必须成立；未知 `type` 会作为 opaque Entity 保留。已知 `type` 的未知字段、缺失必填字段或字段值错误形成实例合同 warning，该实例在 Engine/Editor 中降级为无行为 X 占位符，同类型的其它合法实例不受影响。字符串数组会在声明了 `string-or-string-list` 的字段中原样保留；其它复合实例字段会保存为 JSON 文本，并通过 `__invalidJsonFields` 标出来源字段。

`LevelEntity` 只声明 `type / x / y / stackOrder` 公共字段。`direction`、`variant`、`pressed` 等类型专属字段只由对应的 `EntityMapDefinition` 声明。

`stackOrder` 是实例在重叠空间中的顺序，不由 Entity type 提供默认常量。同一多格 Entity 的
全部 Presence 共用该值。Level Entity 省略时表示第 `0` 层；Runtime spawn 省略时，Engine
才按完整 footprint 放到当前重叠范围的顶层，空栈从 `0` 开始。Editor 新建顺序从 `0`
向上递增，并在手动重排时写入连续整数。相同值表示同一接触平面。

地图字段只描述开局语义。Loader 将这些字段投影为 Engine runtime state，Behavior 后续只修改 runtime Entity；motion progress、animation clock、runtime Entity id、Presence、RenderNode 与道具库存都不进入 LevelMap。

Snowman、Sandman、Beaver、Dream Machine 与商店陈列物可以保存字面对白。Snowman 是 Surface 图块，只有声明了 `dialogue` 的实例会显示对白。单页使用非空字符串；多页使用非空字符串数组，每个数组元素是一页对白，元素内的换行原样保留：

```json
{
  "type": "sandman",
  "x": 5,
  "y": 4,
  "dialogue": [
    "前面的冰面很滑。\n小心脚下。",
    "准备好以后再往前走。"
  ]
}
```

`dialogue` 随地图 JSON、分享文本与 Embed 一同传播。Entity 被碰触时 Engine 从第一项开始，
在同一个对话框中依次展示数组；关闭最后一页后，同一 Bobby 与 Entity 组合有 500ms 的
重复打开冷却。该行为由 Engine 内部处理，不产生宿主 `object-interaction`，也没有进入
Snapshot 的对白游标。Editor 为每页对白提供独立的可增删多行文本框。需要条件、分支或
业务状态的对白必须省略 `dialogue`，由宿主通过通用交互请求和公共对话 Controller 实现。

Lock 与关卡内钥匙组成可直接用于普通地图的组合机关：

```json
[
  { "type": "lock-key", "x": 2, "y": 3 },
  {
    "type": "lock",
    "x": 8,
    "y": 3,
    "requireKey": true,
    "deathCountdownSeconds": 0
  }
]
```

`lock-key` 默认可拾取，并按数量进入触碰它的 Bobby 背包；`requireKey: true` 的 Lock
成功开启时消耗一把。`requireKey` 缺省为 `false`。`deathCountdownSeconds` 接受
`0..3600` 的整数，`0` 表示不创建 Timed Challenge。`lock-key.collectible: false` 用于把
同一视觉作为阻挡且可交互的陈列物，适合由外层商品交互控制。

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

Bobby 可以通过实例字段声明输入通道和两个可组合的镜像轴：

```json
[
  { "type": "bobby", "x": 2, "y": 3, "controller": 0 },
  {
    "type": "bobby",
    "x": 7,
    "y": 3,
    "controller": 0,
    "mirrorX": true,
    "mirrorY": false
  }
]
```

`controller` 使用从 `0` 开始的数字通道，缺省为 `0`。地图只有通道 `0` 时，方向键和 WASD 都控制该通道中的全部 Bobby；地图同时具有通道 `0` 与 `1` 时，方向键控制通道 `0`，WASD 控制通道 `1`。Pointer、Screen Joystick 与 external 输入控制 primary 通道。`mirrorX` 交换左右，`mirrorY` 交换上下，两者可以同时启用。

`start` 也是普通 surface Entity，只表达该地面的玩法与视觉，不承担出生语义，也没有特殊 `start` Trait。Bobby 是否出生在 Start 上，只由两个 Entity 的坐标是否相同决定：

```json
[
  { "type": "start", "x": 2, "y": 3 },
  { "type": "bobby", "x": 2, "y": 3 }
]
```

Original Adapter 读取 DAT 时，在 Start terrain 的坐标生成 `start` surface，并把 Bobby Entity 的初始坐标设为同一位置。转换完成后 Start 与 Bobby 互不绑定；移动 Bobby 不会改变 Start，移动或替换 Start 也不会定义新的出生点。

DAT 的 terrain/object 二层结构在正向转换时按每格实际 Cell Stack 写入连续的
`stackOrder: 0..n`。跨格 Entity 的全部 Presence 沿用其 anchor Entity 的该值，因此
后续行优先读取到的相邻地面不会反向覆盖 Dragon 等对象的 body/tail。

一张可游玩地图至少有一个具有 player 身份的 Entity；具体判断来自 Entity Definition / Trait，而不是硬编码 type 名称。多个 Bobby 不能占据同一格；Editor 在同格放置 Bobby 时会替换已有 Bobby，同一 tick 的移动组中若多个 actor 请求同一目的格，这些移动会一起被拒绝。

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

Sandman、Beaver 与 Dream Machine 以 Body 作为 canonical anchor，并只在该格建立
Presence；Head/Body 在 atlas 中先作为一个连续的双格源矩形组合，再以 Body 底边为锚点
整体缩放绘制。原版 DAT 只保存 Head 定位单元，坐标平移由 Original Adapter 边界负责。

地图永远不保存展开后的 footprint Presence。

### Entity identity

LevelMap v1 不持久化 runtime Entity id 或 UUID。Editor 可以使用文档内临时 identity 管理 selection/undo，World Loader 使用确定性 allocator 生成 runtime Entity id。

如果 Entity 之间需要关联，优先使用语义属性，例如 Portal `channel`，而不是提前引入持久化 UUID。

## Rules

地图使用具体 Goal ID 声明胜利条件，`all / any` 递归组合叶子：

```ts
type GoalType = "carrot" | "egg" | "exit" | "push-goal" | "golden-carrot";
type WinCondition =
  | { type: "all"; conditions: WinCondition[] }
  | { type: "any"; conditions: WinCondition[] }
  | { type: GoalType };
```

当前五种 Goal 均只保存 `type`。每种 Goal 的对象选择和完成语义由 Engine 定义；
Model 严格校验条件形状。确需实例参数时，应由对应 Goal 增加参数字段与校验。

胡萝卜、Egg 和 Exit 地图可分别表达为：

```json
{ "type": "all", "conditions": [{ "type": "carrot" }, { "type": "exit" }] }
```

```json
{ "type": "all", "conditions": [{ "type": "egg" }, { "type": "exit" }] }
```

```json
{ "type": "exit" }
```

推箱子地图使用 `{ "type": "push-goal" }`。Golden Carrot 与 Exit 的可选关系使用：

```json
{ "type": "any", "conditions": [{ "type": "golden-carrot" }, { "type": "exit" }] }
```

`carrot` 计算当前 `state.consumed !== true` 的 Carrot 数量，零个即达标；
`egg` 按 Egg Entity ID 读取当前
`state.filled`，并要求地图至少存在一个 Egg；`push-goal` 按目标格去重，要求每格
被具有 `pushable` 能力的对象占据。`exit` 要求每个玩家各自满足 Exit 的到达条件；
`golden-carrot` 读取 World 已提交的 Golden Carrot 成功收集记录，记录随 Snapshot 恢复。

Engine 返回同结构的目标结果树。叶子包含 `completed` 和可选 `remaining`，
HUD 与 Editor 使用 Engine 的结果和可用性定义。关卡最终完成时机仍由 World
运动与生命周期开关裁决。

## MapDocument

网站运行时地图位于：

```text
/assets/maps/<collection>/<map-id>.json
```

`MapDocument` 在 Entity Map gameplay 数据之外携带单图产品 metadata：

```ts
interface MapDocument extends LevelMap {
  meta: {
    game?: "https://github.com/XUJINKAI/bobby-carrot-5-remake";
    name?: string;
    author?: string;
    note?: string;
  };
}
```

`meta` 中的字段全部可省略，字符串输入允许为空。`MapDocument` 规范输出省略空字符串的 `name / author / note`，并默认在 `meta.game` 写入与存档相同的产品标识；输入不要求携带该字段，地图识别也不依赖它。`MapDocument` 不持久化资源 ID 和导航关系。collection 与 map ID 来自 `/assets/maps/<collection>/<map-id>.json` 路径；列表、分组和前后关导航由 collection `index.json` 决定。地图内音乐使用 `LevelMap.music`；地图名称、作者与注记统一位于 `MapDocument.meta`，由 Web 等产品层消费，不进入 Engine 的 `LevelMap`。

> `LevelMap.music` 的字段归属已经确定，运行时由哪一层解析选曲仍待决策，参见
> [背景音乐选曲职责 ADR](../decisions/background-music-selection-ownership.md)。本节字段合同暂予保留。

`@bobby/model` 的 `parseMapDocument()` 是持久化文档入口，`parseLevelMap()` 校验后只返回 gameplay 字段，`serializeMapDocument()` 输出统一字段顺序、补充 `meta.game`，并省略空字符串 metadata 字段与 `stackOrder: 0` 等默认表示。地图结构错误、越界坐标和非法规则会被拒绝；Entity type 或实例字段合同问题由可定位 warning、primitive 规范化与惰性占位行为承接。

## Editor JSON

地图进入 Editor 时统一经过一次 `serializeMapDocument()` 往返规范化，后续编辑、导出与分享均以该表示为基础。首页导入、`/import/v1` 与 Embed 的识别流程不执行这次 Editor 规范化。Editor 保存同一套 `schemaVersion: 1` Entity Map，并可编辑 `meta.name / author / note`；不维护 Terrain/Object persistence model，也不解析历史 schema。

Exchange payload 编码不是地图 schemaVersion。

## Collection 与 Campaign metadata

Explore collection metadata 位于：

```text
assets/maps/<collection>/index.json
```

它只负责浏览 UI：collection 名称、说明、filter 定义、chapter 分组和 map 列表。Explore Play 读取当前 collection 的该文件，以解析上一关、下一关与地图类型；地图内容仍从独立 MapDocument 加载。

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
tmp/assets/bc5/extracted
  ↓ decode
tmp/assets/bc5/decoded        原始 terrain/object 语义
  ↓ adapt
Entity Map v1
  ↓
Engine / Editor / Web
```

反向 patch：

```text
Entity Map v1
  ↓ Original Adapter
tmp/original-patch/encoded/<release>/levels/<pack>-<slot>.json
  ↓ DAT encoder
DAT level record
  ↓ patch
patched JAR
```

`encoded/` 中间地图与 `tmp/assets/bc5/decoded/` 的单关 JSON 使用同一合同，保留
`terrainEncoding / source / recordLength / recordSha256 / dynamicSlots` 以及
`width / height / terrain / objects`。Patch 流程从落盘后的中间地图重新读取
`width / height / terrain / objects`，再生成目标 DAT record。

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
tmp/assets/bc5/extracted
  ↓ decode
tmp/assets/bc5/decoded         release / packFile / levelIndex
  ↓ adapt
tmp/assets/bc5/adapted         产品语义 map id 与 MapDocument
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

Model 提供薄的声明式 `LevelPatch` 与 `applyLevelPatches()`。地图生产者先得到最终
`LevelMap`，再把它交给 Engine：

```ts
const sessionLevel = applyLevelPatches(baseLevel, patches);
const session = await createGameSession({ level: sessionLevel });
```

`createGameSession()` 与 `Game.loadLevel()` 都不接收补丁。通用操作只有 `add / remove /
set-fields / replace-type`，selector 至少声明 `type / x / y` 中的一项；`add` 坐标必须在
地图内。补丁在 clone 上执行，不修改调用方持有的基础地图。

Adventure 可以在基础 LevelMap 进入 Engine 前生成 session Entity Map：

```text
base LevelMap
  ↓ Adventure augmentation
session LevelMap
  ↓
Engine
```

增强不修改基础地图。Engine 不知道 Adventure。

Adventure 的声明式配置统一位于 `adventure/src/augment/`。每项内容返回：

```ts
interface AdventureAugmentation {
  levelPatches: readonly LevelPatch[];
  levelPatchesFunction?(save: AdventureSave): readonly LevelPatch[];
  interaction?(context: AdventureInteractionContext): void | Promise<void>;
}
```

加载前补丁支持四种操作：

```ts
type LevelPatch =
  | { operation: "add"; entity: LevelEntity }
  | { operation: "remove"; selector: { type?: string; x?: number; y?: number } }
  | {
      operation: "set-fields";
      selector: { type?: string; x?: number; y?: number };
      fields: Record<string, JsonPrimitive | readonly string[]>;
    }
  | {
      operation: "replace-type";
      selector: { type?: string; x?: number; y?: number };
      type: string;
    };
```

固定或多页对白直接通过 `levelPatches` 写入 Entity 的 `dialogue`。
`levelPatchesFunction(save)` 把永久购买状态投影成 Session 地图，例如将已售出的商品格
替换成 `shop-empty`。
`interaction(context)` 是该地图唯一的 Campaign 交互入口，接收通用请求和当前 Save，
并可调用宿主提供的 `showDialogue / presentDialogue / commitSave /
replaceInteractedEntity`。Adventure 不接收 Engine runtime object，
也不直接操作 DOM 或 localStorage；Web 只实现这些窄端口。
