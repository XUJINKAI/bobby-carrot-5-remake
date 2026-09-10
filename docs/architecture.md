# 架构

## 总体结构

```text
Original JAR / DAT
        ⇅
 tools/original/dat <--------------- original JAR patcher / tests
        ⇅
    @bobby/model::LevelMap
      ▲          ▲          ▲
      │          │          │
   Engine      Editor   @bobby/adventure
      ▲          ▲          ▲
      └----------- Web ------┘
```

Original DAT tooling 是原版格式互操作边界，不属于浏览器产品依赖链。Web、Editor、Engine 都不能依赖它。

项目同时服务三个目标：

1. 原版 Adventure 体验重制；
2. 全开放 Explore 与 Editor；
3. 用同一张语义测试地图在 Bobby Carrot 5 Remake Engine 与原版 Java ME Engine 中做差分验证。

格式互操作、地图内 gameplay、原版 Campaign 必须彼此隔离。

## @bobby/model

`model/` 是最底层的稳定语义合同，包含 Entity Map、地图规则、collection JSON 合同和 parser。地图结构、坐标、规则与已知 Entity 的声明字段由稳定合同约束；未知 type 和已知 type 的实例字段问题可以跨过读取边界，由 Engine 降级为可见的惰性占位符。地图 Entity 使用稳定语义 type；类型专属字段由 `EntityMapDefinition` 声明：

```ts
interface LevelEntity {
  type: EntityType;
  x: number;
  y: number;
  stackOrder?: number;
  [field: string]: JsonPrimitive | undefined;
}
```

字段与 `LevelMap.rules` 承载声明式地图 gameplay semantics。Trait、runtime state 和具体执行逻辑只位于 Engine；地图字段不表达 DAT、Catalog、Adventure 或 Editor 来源。Engine 始终只接收一份 `LevelMap`。

`LevelMap` 表示“能被玩/编辑的一张地图”。官方发行记录和 Campaign 节点信息由外层 Catalog / Adventure 持有。

## Original DAT tooling

`tools/original/dat/` 是原版格式唯一互操作边界：

```text
semantic Terrain/Object <-> original DAT byte
LevelMap <-> DAT level record
DAT package <-> metadata + level records
```

`tools/original/dat/mapping.mjs` 是唯一 DAT byte 与 atlas 坐标换算边界。原版 hex ID、record provenance 等信息只用于 tools、逆向研究、官方地图解码、原版 JAR patch 和相关测试，不进入 Web/Editor 产品功能。

`dynamic_slots` 属于原版 record 的序列化字段，由 `deriveDatDynamicSlots(LevelMap)` 派生。`verify` 对全部 530 条官方 source record 检查派生值与原值一致。

### DAT package 精确 patch

`replaceDatLevelRecord()` 只替换一个 one-based level record：metadata 与其它 record 原字节复制。这个能力用于测试和 Original JAR Validation Tool，不是用户地图的导入导出格式。

## Engine

`engine/` 是唯一地图内游戏规则实现。核心目标是：**给 Engine 一个纯语义 `LevelMap` 和少量运行配置，就应当能够独立把这张地图完整地玩起来。**

> 背景音乐选曲是否包含在“完整地玩起来”中尚待统一，参见
> [背景音乐选曲职责 ADR](decisions/background-music-selection-ownership.md)。本节现有边界表述暂予保留。

Engine 负责：

- `Game` / `World`；
- 移动、碰撞、机关与动态实体；
- 地图内 Timer、死亡与完成条件；
- Camera / Renderer；
- 基础 Gameplay HUD 的状态与渲染；
- 可配置 Screen Joystick 的渲染与拖动输入；
- Audio 抽象；
- semantic Definition 与 Object Layout；
- 通用 `InputController`。

`GameplaySession` 位于浏览器 `Game` 与 `World` 之间，持有一局地图的固定 Tick、
正式 gameplay 初始化、语义输入提交和历史记录。浏览器 `Game` 负责实时驱动与表现；
无头 Replay Runner 直接驱动同一个 Session。Replay 执行合同见
[`contracts/replay.md`](contracts/replay.md)。

Game 的关卡输入只有纯 `LevelMap`：

```text
LevelMap(anchor entities + type-owned fields)
       ↓ Game.loadLevel
Entity Layout expansion
       ↓
Runtime World occupancy
```

多格 Entity 展开时保留同一个 runtime Entity identity，因此所有 footprint Presence 都读取同一份实例字段与 runtime state。

判断一条规则属于 Engine 还是 Adventure 时，优先问：**脱离 Campaign，单独加载这张 `LevelMap` 时规则是否仍然应该成立？** 如果成立，它就是地图内 gameplay rule，进入 Engine；只有章节、跨关存档、永久经济等 Campaign 语义进入 Adventure。

Catalog、release、chapter、difficulty、HTTP、JAR、DAT mapping 等产品/来源信息由 Engine 外层系统负责。

### Engine 内部职责

Engine 使用固定 gameplay 生命周期与 Definition Registry 协作：

```text
InputController
       ↓ semantic action
Game / World transaction
       ↓
Movement Pipeline
passage → interaction → commit → leave/enter → goals → active rules
       ↓
WorldEvent
       ↓
Renderer / Audio / Web
```

Gameplay hook 使用同步函数调用，执行顺序由 World transaction 明确控制。`WorldEvent` 描述已经发生的世界事实，供表现层和产品层消费。

源码职责按以下边界组织：

```text
actors/                 当前 Bobby Actor 的状态合同与初始化
mechanics/definition/   Definition Registry、注册端口与 inspection
mechanics/traits/       trait 查询
mechanics/movement/     passage、原子移动提交与 pushable
mechanics/goals/        地图目标初始化与评估
mechanics/rules/        当前地图 active rules
mechanics/interactions/ 通用对象交互能力
original/terrain/       原版 Terrain Definition 与 augmentation
original/object/        原版 Object Definition 与 augmentation
custom/                 扩展 Terrain/Object Definition
world/                  RuntimeState、事务顺序与世界状态推进
```

`mechanics/definitions.ts` 是稳定 façade：加载原版 Definition 后注册扩展 Definition，并保持现有 Engine/Editor 查询 API。地图加载时只为当前 `LevelMap` 创建 active rule 列表；移动完成后按注册顺序同步执行。

Engine 允许一张地图包含多个 Bobby Actor。每个 Bobby 的背包和生命周期归属于自身 Entity state；`GameplayState.actors[]` 提供完整状态，`primaryActorId / player / facing / inventory` 是 primary actor 的便利投影。任一 actor 死亡即结束关卡，移动事务负责多人目的格冲突与不可重叠约束。

### 输入边界

`InputController` 与 `ScreenJoystick` 是 Engine 提供的通用浏览器 gameplay 输入能力：

```text
Keyboard / Pointer / Wheel / Pinch       Engine ScreenJoystick
                  │                     render + drag vector
                  │                              │
                  └──────────────┬───────────────┘
                                 ▼
                         InputController
                                 │
                                 ▼
    move / held direction / undo / redo / restart / pan / zoom / debug
                                 │
                                 ▼
                                Game
```

能力通过配置逐项开关：`movement / undo / restart / pan / zoom / debug`。Controller 不认识 Adventure、Explore 或 Editor 页面。

Engine `ScreenJoystick` 负责半透明圆形底座和球头的渲染、pointer capture、dead zone、主轴方向、方向迟滞与回中，并将结果送入同一个 `InputController` held-direction 路径。调用方通过 Runtime Config 决定是否启用、透明度和安全区域。

Bobby 的 `controller` 字段把 actor 放入 `channel-1` 或 `channel-2`，`mirrorX / mirrorY` 组成该 actor 的方向变换。`GameplaySession` 将浏览器输入源映射到通道：单通道时方向键与 WASD 共同控制 primary 通道，双通道时二者分别控制 primary 与 secondary。

外部宿主控件仍可调用 `InputController.setHeldDirection()`，用于无障碍控制器或产品自定义输入；这是一条扩展入口，不承担基础 Screen Joystick 实现。Editor Authoring 输入属于 Editor；Editor Play Test 直接启用 Engine Gameplay Input。

### 通用运行时事件接口

Engine 使用通用 `WorldEvent` 表达地图内事实。`Game.onWorldEvent()` 暴露事件流，例如：

```text
collect-bonus-coin
collect-golden-carrot
complete
death
dialog { text? }
object-interaction {
  requestId,
  actorId,
  entityId,
  objectType,
  role,
  action,
  x,
  y
}
```

成功打开锁是一个普通 Object interaction：

```text
object-interaction
objectType = ObjectId.LOCK
action = "open"
```

触碰可对话角色的 Body 是普通 Definition-driven Object touch：

```text
LevelEntity.dialogue
        ↓
Object Definition touch behavior
        ├─ object-interaction
        └─ dialogue 非空时发出 dialog(text)
                         ↓
                  Engine presentation
```

固定对白是随 JSON 地图传播的字面字符串。复杂条件对白与购买由宿主监听 live
`onInteractionRequest()` 后处理；宿主只可显示产品对白或提交封闭 Gameplay Intent，
不能取得 BehaviorContext、WorldQuery 或 CommandQueue。Replay playback 保留普通
`WorldEvent`，但不会再次调用外部交互控制器。

Adventure 专用 Campaign 语义保持在 `@bobby/adventure`；Engine API 维持通用 gameplay/runtime 边界。

### 地图内 Timed Challenge

地图实例可以通过 Lock 的类型专属字段声明限时挑战：

```text
Lock.deathCountdownSeconds = 60
```

运行关系：

```text
成功打开带 deathCountdownSeconds 的 Lock
        ↓
Engine TimedChallenge
        ├─ Golden Carrot -> clear
        ├─ complete / death -> clear
        └─ timeout -> death
```

计时生命周期属于当前 `Game`。Undo 同时恢复 World Snapshot 与计时快照；Restart / loadLevel 重置计时。`game.timedChallengeRemainingMs` 供展示层读取。

这条规则不含 Adventure 语义，因此自定义 JSON、Explore 与 Editor Play Test 都可以直接使用。

### Semantic Definition Layer

```text
Tile Definition Registry
├─ id
├─ presentation
├─ gameplay traits
├─ behaviors[]
└─ authoring
   ├─ palette
   └─ map fields[]
      ├─ string
      └─ enum

Entity Layout Definition
├─ footprint[]
├─ cursor
└─ authoringVariants[]
```

Map Entity 在 Engine World、Editor 预览、校验和 footprint 查询中统一使用 canonical
type，并直接取得同名 Definition。`windmill` 的方向、`egg` 的填充状态等运行阶段由
Engine runtime state 表达；Engine 运行过程中生成的 Fireball、豆茎中间段等临时实体
使用 Engine 私有身份，不进入 Model API 或 LevelMap。

Editor Palette 只枚举具有 Model `EntityMapDefinition` 的 canonical type；Engine 私有临时实体
不会进入 Editor。`authoring.palette=false` 用于把应在 Surface 面板等其它入口编辑的 canonical
type 排除出 Object Palette。Model `EntityMapDefinition.fields` 描述可持久化字段；Editor
Inspector 结合该合同与 Engine authoring metadata，不维护类型特判表。

当前只需要简单实例属性。不要提前扩张为脚本系统、通用表单引擎或对白树。

## @bobby/adventure

`adventure/` 描述“原版 Bobby Carrot 5 如何把地图组织成一场完整冒险”，只依赖 `@bobby/model`。

它负责：

- 连续 1～40 章 Campaign identity；
- 每章 `1,2,3,bonus-1,4,5,6,bonus-2,7,8,9,10` 顺序；
- 5 个特殊场景的语义身份；
- Adventure Save contract；
- 全局经济 / 永久升级 / 一次性奖励位置；
- Adventure session plan；
- 条件对白、Bonus Beaver 单次钥匙和永久商品购买等 Campaign 交互 reducer；
- 在基础 `LevelMap` 进入 Engine 前按需要增强 Entity 实例字段。

地图准备顺序固定为：

```text
base / official LevelMap
        ↓
Adventure Entity field augmentation
        ↓
persistent reward filtering
        ↓
Engine Game.loadLevel(LevelMap)
```

Adventure 可以覆盖角色 `dialogue`、Lock `deathCountdownSeconds` 或未来已经由 semantic Definition 定义的实例字段；Engine 不知道这些值来自 Adventure，也不区分官方地图、Editor 地图或其它生产者。持久奖励由 Adventure Save 按 Campaign level ID、Object type 和地图坐标记录；Engine 只报告本局的收集事实。

Base/UP、DAT byte、pack file、record SHA、JAR 等 archive provenance 属于 Catalog / DAT 工具链；HTTP、DOM、localStorage 属于 Web adapter。

### 原版 Bonus 地图增强

Adventure 根据 Campaign node 判断 Bonus 关，并把原版 60 秒策略写入 session 地图的普通 Entity 字段：

```text
Bonus LevelMap
   ↓
Lock.deathCountdownSeconds = 60
   ↓
Engine
```

从这一刻开始，倒计时、成功取消、超时死亡、Undo / Restart 都完全由 Engine 执行。Adventure 不持有第二套 gameplay runtime。

## Official content / Catalog

原始档案身份与玩家 Campaign 身份分开：

```text
archive identity: base/up09 + packFile + source record
campaign identity: chapter 1..40 + level/bonus
public identity: 1-1 / 1-bonus-1 / ... / 40-10
```

10 个 JAR 共 530 条 source record，去重后是 485 个唯一 DAT map：

- 480 个正式 Campaign map；
- 5 个共享 Special Scene。

`00.dat` 的五张地图分别是 Beaver Shop / Cloud 9 / Dream Machine / Dreamland Reward / Campaign Intro。

## Explore content / Custom Map Catalog

Explore 使用 collection 组织所有自由游玩内容。`custom-maps/collections.json` 定义 collection 名称、顺序、说明与 discovery 可见性：

```text
custom-maps/<collection>/<map>.json
custom-maps/<collection>/<chapter>/<map>.json
        ↓ build
assets/maps/index.json
assets/maps/<collection>/index.json
assets/maps/<collection>/<map>.json
```

源码目录负责内容归类：collection 下的一级目录决定 chapter，根目录中的地图没有 chapter，chapter 目录内不允许继续嵌套目录。同一 collection 混合两类地图时，根目录地图先作为无章节内容进入 index，随后按 chapter 与 map ID 排列章节内容。manifest 负责 collection discovery，其可选 `chapters` 只补充已存在 chapter 的展示信息；`visible: "dev"` 只在 `npm run dev` 时进入 discovery index。每个 collection 的 `index.json` 独立承载展示、搜索和筛选 metadata；游玩和编辑入口直接加载同目录下的纯 `LevelMap`。

`tools/custom/prepare.mjs` 只生成 custom collection 资产并返回可见摘要；`tools/pipeline/assets.mjs` 在 Original 与 custom collection 全部就绪后统一生成 `assets/maps/index.json`。discovery index 只保存 `id` 与 `name`，collection description 只保存在各自的详细索引。

每章 1～3 星难度直接读取原版 DAT chapter metadata `packType`。

## Editor

Editor 持久化 `MapDocument extends LevelMap`：

- `schemaVersion`、`meta.name / author` 与顶层 `note`；
- semantic `entities[]`；
- `LevelEntity` 类型专属顶层字段；
- multi-cell 只保存 anchor。

用户地图的长期内容格式是 JSON，浏览器 Data Exchange 为它提供统一传输表示：

```text
TextBox / Clipboard / File / Share URL
     ↓ Data Exchange decode
unknown JSON
     ↓ Editor parser
EditorLevel / LevelMap
```

Editor 不导入、不导出 DAT，也不生成 DAT-backed URL share。`BC5R1` 只压缩 UTF-8 JSON，并与 Map schema 版本保持独立。完整合同见 [`features/data-exchange.md`](features/data-exchange.md)。

Inspector 根据 Model 字段合同与 Engine Definition 的 authoring metadata 生成属性编辑控件。角色 `dialogue`、Lock 的 `deathCountdownSeconds` 都通过这条通用路径编辑并由 JSON round-trip 保留。

Editor Play Test 把 Draft 转成纯 `LevelMap` 后调用正式 Engine；所有地图内 gameplay 规则与普通游玩使用同一实现。

## Web

Web 是浏览器产品壳：Home、Explore、Adventure UI、Editor route、Settings、Data Exchange、localStorage/file adapters 和 Result 流程。

Web 不依赖 Original DAT tooling，产品 `dist/` 也不发布 DAT browser module。

Web 的通用 Game Session 负责提供 `LevelMap + Runtime Config`、组合 Engine 生命周期并展示通用 `dialog` WorldEvent；它不实现基础 HUD、Screen Joystick 或地图规则。

Web 源码按产品职责组织：

```text
web/src
├── app/                 Vue 根应用、路由协调与页面生命周期合同
├── shell/               通用 TopBar、BottomBar、Identity、Action 与 ShellConfig
├── app/dialogs/         Settings、Help 等产品级 Dialog
├── app/settings/        全局设置状态与运行时应用
├── pages/<mode>/        页面组件、页面挂载器与页面私有交互
├── runtime/game/        Web 对 Engine session 生命周期的适配
├── services/            Audio、Catalog 与产品资产访问
├── storage/             浏览器持久化适配
├── app.ts               Web 入口
└── vue-env.d.ts         Vue SFC 类型声明
```

Web 用户偏好使用一条版本化 `bc5r:setting` JSON record。`locale`、`theme`、
`audio`、`controls` 和 `editor` 偏好由 `storage/settingsStorage.ts` 统一解析和
写入；Theme、I18n、Shell、Audio 与 Editor 页面只负责把设置应用到各自的
运行时能力。首次读取时，浏览器语言和指针类型参与默认值计算；写入时始终
保存完整的 schema v1 文档。

页面相关的 TypeScript 与 `.vue` 文件共置在对应 `pages/<mode>/` 中。Web 根目录不承载页面实现、运行时服务或模糊的通用工具模块。

Result 的“下一关 / 重玩 / 返回章节 / 编辑地图”等动作属于 Web，因为这些动作描述的是游戏结束后的产品流程。

### Product Shell 与 GameStage

Web 使用页面无关的 Generic Shell 组织 TopBar、Content 和 BottomBar。页面提交 `ShellConfig`；Music、Settings、Help 与 Dialog 由 App 层解释，Shell 不持有 mode 或业务语义。完整合同见 [`contracts/web-shell.md`](contracts/web-shell.md)。可游玩页面共享同一个 GameStage 组合：

```text
GameStage
├── Engine Gameplay Layer
│   ├── Renderer Canvas
│   ├── Gameplay HUD
│   └── Screen Joystick
├── Debug Inspector
└── Product Result Overlay
```

Engine 持有基础 Gameplay HUD 的语义、地图内状态、Timer 与渲染，也持有 Screen Joystick 的渲染和交互。Web 为 Engine 提供 GameStage 容器与 Runtime Config，并在其上组合产品 Overlay。统计用时、模式导航和 Result 动作属于 Web。具体信息架构与交互见 [`features/ui.md`](features/ui.md)。

Engine HUD 使用统一布局约束并锚定在 GameStage 右上角：第一行是全体共享的目标计数，第二行是 primary actor 的地图内道具；存在第二个 Bobby 时，第三行显示 secondary actor 的道具。各产品模式只配置 HUD 能力，不重新实现道具布局。

Welcome Demo、Adventure、Explore、Custom Play 和 Editor Play Test 都创建正式 Engine session。它们通过输入能力、Camera 限制、外层进度和 Result 动作表达差异，不维护各自的 gameplay 实现。

### Explore

- 40 章全部开放；
- 平铺浏览；
- 筛选、随机、DEBUG、自由缩放；
- 使用独立的自由浏览进度；
- 可以把官方地图 clone 到 Editor，再以 JSON 继续编辑。

### Adventure

Web 提供竖屏容器、章节/关卡列表、存档文件导入导出等浏览器表现层；Campaign 规则来自 `@bobby/adventure`，地图内规则来自 Engine。

Adventure 在桌面也限制为原版式 portrait viewport，并设置 Camera 最小 zoom，保持谜题的信息边界。多人地图的 Camera 会为所有 Bobby 共同构图；为保证两者始终可见，该构图可以临时低于产品配置的最小 zoom。

正式 URL：

```text
/explore
/explore/original
/explore/novoban-pushbox
/explore/loma-pushbox
/explore/engine-lab
/explore/play/original/1-1
/explore/play/novoban-pushbox/01
/explore/play/engine-lab/portal
/adventure
/adventure/chapters
/adventure/chapter/1
/adventure/play/1-1
/settings
/edit
/edit/original/1-1
/edit/novoban-pushbox/01
/edit/engine-lab/portal
```

`/explore` 直接显示 Original Tab。Explore gameplay 使用 `/explore/play/<collection>/<map-id>`，Editor clone 使用 `/edit/<collection>/<map-id>`；路径由 Web 的集中 route builder 生成。

服务器负责 app-route fallback；静态资源路径按真实文件提供。

## Adventure Save

Save 是版本化纯 JSON；`@bobby/adventure` 负责 parse/normalize/serialize，Web 负责 localStorage 与文件导入导出。

持久奖励用稳定 ID：

```text
Campaign level ID + semantic Object type + x/y
```

已经领取的奖励在进入 Adventure session 前从 LevelMap clone 中移除；原始官方 LevelMap 保持不可变。

购买请求来自 Engine 的 `object-interaction`。Adventure reducer 接收当前 Save、商品、
币种与价格，在一个纯函数结果中完成余额校验、扣款和永久道具授予；Web 负责展示结果并
持久化新 Save。Bonus Beaver 的单次钥匙在 reducer 决策后以 `grant-lock-key` intent
提交给 Engine，并在 Engine 发出带同一 `requestId` 的接受事件后提交 Save。

## Original JAR Validation

验证闭环：

```text
Editor semantic JSON map
      ├──> Bobby Carrot 5 Remake Engine
      └──> tools/original/dat encode
                    ↓
               patch one original DAT record
                    ↓
               original Java ME Engine
```

CLI：

```bash
node tools/cli.mjs original patch \
  --in custom-maps/original-patch \
  --out tmp/original-patch
```

输入目录的 JSON 文件名是目标 public ID；工具通过 Catalog provenance 找回原始 JAR / DAT / slot，并按 JAR 合并输出。

## Tools / Assets

`assets/original/` 是不可变原始输入；`assets/extracted/`、`assets/generated/` 是可重建产物。Tools 负责 JAR 解包、source provenance、Catalog、章节星级、筛选索引和原版验证 JAR。

DAT 只在这些工具/验证路径需要时编译；正常产品输出不复制 `dat/dist`。

## 依赖规则

允许：

```text
model <- tools/original/dat
model <- engine
model <- adventure
model + engine <- editor
model + engine + adventure + editor <- web
Original Adapter/Patch -> tools/original/dat + model + original assets + generated metadata
```

禁止：

```text
engine -> adventure / DAT byte / Original DAT tooling / Catalog / HTTP
adventure -> engine / DAT / JAR / archive release fields / DOM / localStorage
model -> DAT/JAR/gameplay/Campaign
editor -> Original DAT tooling / DAT import-export / DAT-backed URL share
web -> Original DAT tooling / DAT feature / DAT browser module
World -> per-object multi-cell synthesis switch
web filter -> MutationObserver patch another page
```
