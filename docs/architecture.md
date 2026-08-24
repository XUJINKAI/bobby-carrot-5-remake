# 架构

## 总体结构

```text
Original JAR / DAT
        ⇅
    @bobby/dat  <------------------- tools / original JAR patcher / tests
        ⇅
    @bobby/model::LevelMap
      ▲          ▲          ▲
      │          │          │
   Engine      Editor   @bobby/adventure
      ▲          ▲          ▲
      └----------- Web ------┘
```

`@bobby/dat` 是原版格式互操作边界，不属于浏览器产品依赖链。Web、Editor、Engine 都不能依赖它。

运行时还有一条刻意保持很小的结构化接口：

```text
Engine Game
├─ onWorldEvent(listener)
└─ killPlayer(reason)
        ▲
        │ structural port（Adventure 不 import @bobby/engine）
        │
@bobby/adventure runtime
```

项目同时服务三个目标：

1. 原版 Adventure 体验重制；
2. 全开放 Explore 与 Editor；
3. 用同一张语义测试地图在 Bobby Carrot 5 Remake Engine 与原版 Java ME Engine 中做差分验证。

格式互操作、地图内 gameplay、原版 Campaign 必须彼此隔离。

## @bobby/model

`model/` 是最底层的稳定语义合同，只包含：

- `TerrainType` / `ObjectType`；
- `Terrain` / `ObjectId` 稳定语义常量；
- `LevelObject`；
- `LevelMap { width, height, terrain, objects }`。

对象实例可以携带可选参数：

```ts
interface LevelObject {
  type: ObjectType;
  x: number;
  y: number;
  properties?: Record<string, string>;
}
```

`properties` 只表达地图实例参数，不表达 DAT、Catalog、Adventure 或 Editor 来源。Engine 始终只接收一份 `LevelMap`。

`LevelMap` 表示“能被玩/编辑的一张地图”。官方发行记录和 Campaign 节点信息由外层 Catalog / Adventure 持有。

## @bobby/dat

`dat/` 是原版格式唯一互操作边界：

```text
semantic Terrain/Object <-> original DAT byte
LevelMap <-> DAT level record
DAT package <-> metadata + level records
```

`dat/src/mapping.ts` 是唯一 raw DAT ID table。原版 hex ID、record provenance 等信息只用于 tools、逆向研究、官方地图解码、原版 JAR patch 和相关测试，不进入 Web/Editor 产品功能。

`dynamic_slots` 属于原版 record 的序列化字段，由 `deriveDatDynamicSlots(LevelMap)` 派生。`verify` 对全部 530 条官方 source record 检查派生值与原值一致。

### DAT package 精确 patch

`replaceDatLevelRecord()` 只替换一个 one-based level record：metadata 与其它 record 原字节复制。这个能力用于测试和 Original JAR Validation Tool，不是用户地图的导入导出格式。

## Engine

`engine/` 是唯一地图内游戏规则实现：World、移动事务、机关、动态实体、Camera、Renderer、Input、Audio 抽象、semantic Definition 与 Object Layout。

Game 的关卡输入只有纯 `LevelMap`：

```text
LevelMap(anchor objects + optional properties)
       ↓ Game.loadLevel
Object Layout expansion
       ↓
Runtime World occupancy
```

多格对象展开时保留 anchor 的实例 `properties`，因此 Sandman body 等隐式 runtime cell 仍能访问同一份实例参数。

Catalog、release、chapter、difficulty、HTTP、JAR、DAT mapping 和 Adventure Bonus 由 Engine 外层系统负责。

### 通用运行时事件接口

Engine 使用通用 `WorldEvent` 表达地图内事实。`Game.onWorldEvent()` 暴露事件流，例如：

```text
collect-bonus-coin
complete
death
dialog { text? }
object-interaction {
  objectType,
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

触碰 Sandman 是普通 Definition-driven Object touch：

```text
LevelObject.properties.dialogue
        ↓
Object Definition touch behavior
        ↓
dialog(text | undefined)
        ↓
Web presentation
```

没有作者对白时仍产生 `dialog(undefined)`；Web 可以显示空对白框或 `...`。Engine 不恢复、猜测或内置原版对白。

Engine 还提供 `killPlayer(reason)` 这种通用运行时能力。外层规则通过这些通用接口与 Engine 协作。

Adventure 专用 Campaign 语义保持在 `@bobby/adventure`，Engine API 维持通用 gameplay/runtime 边界。

### Semantic Definition Layer

```text
Tile Definition Registry
├─ id
├─ presentation
├─ traits
├─ behaviors[]
└─ authoring
   ├─ palette
   └─ properties[]
      ├─ string
      └─ enum

Object Layout Definition
├─ footprint[]
├─ cursor
└─ authoringVariants[]
```

`authoring.palette=false` 描述 consumed carrot、动画中间帧等 runtime-only Object 的 authoring 可见性。`authoring.properties` 描述当前对象允许编辑的实例参数；Editor Inspector 直接消费这份 Definition metadata，不维护对象类型特判表。

当前只需要字符串和 enum/channel 两类属性描述。不要提前扩张为脚本系统、通用表单引擎或对白树。

## @bobby/adventure

`adventure/` 描述“原版 Bobby Carrot 5 如何把地图组织成一场完整冒险”，只依赖 `@bobby/model`。

它负责：

- 连续 1～40 章 Campaign identity；
- 每章 `1,2,3,bonus-1,4,5,6,bonus-2,7,8,9,10` 顺序；
- 5 个特殊场景的语义身份；
- Adventure Save contract；
- 全局经济 / 永久升级 / 一次性奖励位置；
- Adventure session plan；
- 原版 Bonus timed challenge runtime；
- 在基础 `LevelMap` 进入 Engine 前按需要增强对象实例参数。

地图准备顺序固定为：

```text
base / official LevelMap
        ↓
Adventure object-property augmentation
        ↓
persistent reward filtering
        ↓
Engine Game.loadLevel(LevelMap)
```

Adventure 可以覆盖 Sandman `dialogue` 或未来已定义的实例参数；Engine 不知道这些值来自 Adventure，也不区分官方地图、Editor 地图或其它生产者。

Base/UP、DAT byte、pack file、record SHA、JAR 等 archive provenance 属于 Catalog / DAT 工具链；HTTP、DOM、localStorage 属于 Web adapter。

### Bonus 60 秒规则

60 秒倒计时由 Adventure runtime 管理：

```text
Engine reports generic WorldEvent
        ↓
Adventure runtime sees:
object-interaction + ObjectId.LOCK + action=open
        ↓
Adventure starts 60s clock
        ↓
complete/death -> clear clock
        ↓
timeout -> engine.killPlayer(...)
```

Explore 与 Editor Play Test 使用纯 Engine session；Adventure session 通过结构化 port 使用 `onWorldEvent()` + `killPlayer()`，保持 package dependency 单向隔离。

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

每章 1～3 星难度直接读取原版 DAT chapter metadata `packType`。关卡级难度筛选使用现有历史/估算数据，两类数据分别维护。

## Editor

Editor 持久化 `EditorLevel extends LevelMap`：

- `schemaVersion / name / author / description`；
- semantic terrain / objects；
- `LevelObject.properties`；
- multi-cell 只保存 anchor。

用户地图的唯一长期交换格式是 JSON：

```text
JSON Import
     ↓
EditorLevel / LevelMap
     ↓
JSON Export
```

Editor 不导入、不导出 DAT，也不生成 DAT-backed URL share。未来如果重新设计分享格式，需要单独定义新的产品协议，不能把原版 DAT 重新带回 Web/Editor 依赖链。

Inspector 根据 Engine Definition 的 `authoring.properties` 生成属性编辑控件。当前 Sandman 的 `dialogue` 就通过这条通用路径编辑并由 JSON round-trip 保留。

Editor Play Test 把 Draft 转成纯 `LevelMap` 后调用正式 Engine。Campaign、全局经济和 Bonus 60 秒由 Adventure session 提供。

## Web

Web 是浏览器产品壳：怀旧 Home、Explore、Adventure UI、Editor route、Settings、localStorage/file adapters。

Web 不依赖 `@bobby/dat`，产品 `dist/` 也不发布 `dat/` browser module。

Web 的通用 Game Session 订阅 `dialog` WorldEvent 并负责显示对话框；它不判断事件来自 Sandman、Adventure 还是 Editor 地图。

### Explore

- 40 章全部开放；
- 平铺浏览；
- 筛选、随机、DEBUG、自由缩放；
- 使用独立的自由浏览进度；
- 可以把官方地图 clone 到 Editor，再以 JSON 继续编辑。

### Adventure

Web 提供竖屏容器、章节/关卡列表、存档文件导入导出等浏览器表现层；Campaign 规则来自 `@bobby/adventure`。

Adventure 在桌面也限制为原版式 portrait viewport，并设置 Camera 最小 zoom，保持谜题的信息边界。

正式 URL：

```text
/levels
/play/1-1
/adventure
/adventure/chapters
/adventure/chapter/1
/adventure/play/1-1
/settings
/edit
/edit/1-1
```

服务器负责 app-route fallback；静态资源路径按真实文件提供。

## Adventure Save

Save 是版本化纯 JSON；`@bobby/adventure` 负责 parse/normalize/serialize，Web 负责 localStorage 与文件导入导出。

持久奖励用稳定 ID：

```text
Campaign level ID + semantic Object type + x/y
```

已经领取的奖励在进入 Adventure session 前从 LevelMap clone 中移除；原始官方 LevelMap 保持不可变。

## Original JAR Validation

验证闭环：

```text
Editor semantic JSON map
      ├──> Bobby Carrot 5 Remake Engine
      └──> tools -> @bobby/dat encode
                    ↓
               patch one original DAT record
                    ↓
               original Java ME Engine
```

CLI：

```bash
npm run original:patch -- \
  --map editor/examples/mechanics-smoke.json \
  --target 40-10 \
  --out tmp/original-validation/mechanics.jar
```

目标 public ID 用于通过 Catalog provenance 找回原始 JAR / DAT / slot。

## Tools / Assets

`assets/original/` 是不可变原始输入；`assets/extracted/`、`assets/generated/` 是可重建产物。Tools 负责 JAR 解包、source provenance、Catalog、章节星级、筛选索引和原版验证 JAR。

DAT 只在这些工具/验证路径需要时编译；正常产品输出不复制 `dat/dist`。

## 依赖规则

允许：

```text
model <- dat
model <- engine
model <- adventure
model + engine <- editor
model + engine + adventure + editor <- web
tools -> dat + model + original assets + generated metadata
```

Adventure runtime 与 Engine 通过结构化 event/death port 对接，保持 package dependency 隔离。

禁止：

```text
engine -> adventure / DAT byte / @bobby/dat / Catalog / HTTP
adventure -> engine / DAT / JAR / archive release fields / DOM / localStorage
model -> DAT/JAR/gameplay/Campaign
editor -> @bobby/dat / DAT import-export / DAT-backed URL share
web -> @bobby/dat / DAT feature / DAT browser module
World -> per-object multi-cell synthesis switch
web filter -> MutationObserver patch another page
```
