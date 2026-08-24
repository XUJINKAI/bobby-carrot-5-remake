# 架构

## 总体结构

```text
Original JAR / DAT
        ⇅
    @bobby/dat  <------------------- tools/original JAR patcher
        ⇅                                      ▲
    @bobby/model::LevelMap                     │
      ▲          ▲          ▲                  │
      │          │          │                  │
   Engine      Editor   @bobby/adventure       │
      ▲          ▲          ▲                  │
      └----------- Web ------┘                 │
                                               │
Original archive metadata / generated Catalog ┘
```

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
2. 全开放 Explore / Editor / Shared Play；
3. 用同一张语义测试地图在 bc5r Engine 与原版 Java ME Engine 中做差分验证。

格式互操作、地图内 gameplay、原版 Campaign 必须彼此隔离。

## @bobby/model

`model/` 是最底层的稳定语义合同，只包含：
- `TerrainType` / `ObjectType`；
- `Terrain` / `ObjectId` 稳定语义常量；
- `LevelObject`；
- `LevelMap { width, height, terrain, objects }`。

`LevelMap` 表示“能被玩/编辑的一张地图”，不表示“某个官方发行记录”或“Campaign 节点”。它没有 release、chapter、difficulty、JAR path、record SHA、dynamicSlots、save progress 等字段。

## @bobby/dat

`dat/` 是原版格式唯一互操作边界，浏览器和 Node 都能使用，不依赖 `fs`：

```text
semantic Terrain/Object <-> original DAT byte
LevelMap <-> DAT level record
DAT package <-> metadata + level records
```

`dat/src/mapping.ts` 是唯一 raw DAT ID table。Debug 需要显示原版 hex ID 时调用 `datSourceForTerrain/Object()`；Engine Definition 自己不保存 DAT byte。

`dynamic_slots` 属于原版 record 的序列化字段，由 `deriveDatDynamicSlots(LevelMap)` 派生。`verify` 对全部 530 条官方 source record 检查派生值与原值一致。

### DAT package 精确 patch

`replaceDatLevelRecord()` 只替换一个 one-based level record：metadata 与其它 record 原字节复制。这个能力既用于测试，也用于 Original JAR Validation Tool。

## Engine

`engine/` 是唯一地图内游戏规则实现：World、移动事务、机关、动态实体、Camera、Renderer、Input、Audio 抽象、semantic Definition 与 Object Layout。

Game 的关卡输入只有纯 `LevelMap`：

```text
LevelMap(anchor objects)
       ↓ Game.loadLevel
Object Layout expansion
       ↓
Runtime World occupancy
```

Engine 不知道 Catalog、release、chapter、difficulty、HTTP、JAR、DAT mapping 或 Adventure Bonus。

### 通用运行时事件接口

Engine 不为 Campaign 规则增加专用事件。`Game.onWorldEvent()` 暴露一条通用 WorldEvent 流，例如：

```text
collect-bonus-coin
complete
death
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

Engine 还提供 `killPlayer(reason)` 这种通用运行时能力。它不知道“为什么外部规则要让 Bobby 死亡”。

禁止新增 `lock-opened`、`bonus-timeout`、`bonusTimeMs` 等 Adventure 专用 Engine API。

### Semantic Definition Layer

```text
Tile Definition Registry
├─ id
├─ presentation
├─ traits
├─ behaviors[]
└─ authoring
   └─ palette

Object Layout Definition
├─ footprint[]
├─ cursor
└─ authoringVariants[]
```

`authoring.palette=false` 描述 consumed carrot、动画中间帧等 runtime-only Object 不应进入 Editor 素材栏。Editor 不维护第二份 ID 黑名单。

## @bobby/adventure

`adventure/` 描述“原版 Bobby Carrot 5 如何把地图组织成一场完整冒险”，只依赖 `@bobby/model`。

它负责：
- 连续 1～40 章 Campaign identity；
- 每章 `1,2,3,bonus-1,4,5,6,bonus-2,7,8,9,10` 顺序；
- 5 个特殊场景的语义身份；
- Adventure Save contract；
- 全局经济 / 永久升级 / 一次性奖励位置；
- Adventure session plan；
- 原版 Bonus timed challenge runtime。

它不知道：Base/UP、DAT byte、pack file、record SHA、JAR、HTTP、DOM、localStorage。

### Bonus 60 秒规则

60 秒不是 Engine 规则，也不是 LevelMap 属性。

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

因此 Explore、Editor Play Test 和 Shared Play 即使地图中有锁，也不会自动获得原版 Bonus 倒计时。

Adventure runtime 通过结构化 port 使用 `onWorldEvent()` + `killPlayer()`，所以仍不需要 import `@bobby/engine`。

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

`00.dat` 的五张地图不是 Tutorial，而是 Beaver Shop / Cloud 9 / Dream Machine / Dreamland Reward / Campaign Intro。

每章 1～3 星难度直接读取原版 DAT chapter metadata `packType`。关卡级难度筛选仍使用现有历史/估算数据，两者不是一回事。

## Editor

Editor 持久化 `EditorLevel extends LevelMap`：
- schemaVersion / name / author / description；
- semantic terrain / objects；
- multi-cell 仍只保存 anchor。

持久化出口只有：
1. JSON Import / Export；
2. 分享链接：`bc5r metadata envelope + original DAT level record -> deflate-raw + base64url`。

Editor Play Test 把 Draft 转成纯 `LevelMap` 后调用正式 Engine。它不创建 Adventure runtime，因此没有 Campaign、全局经济或 Bonus 60 秒规则。

## Web

Web 是浏览器产品壳：怀旧 Home、Explore、Adventure UI、Editor route、Settings、localStorage/file adapters。

### Explore

- 40 章全部开放；
- 平铺浏览；
- 筛选、随机、DEBUG、自由缩放；
- 不受 Adventure Save 限制。

### Adventure

Web 提供竖屏容器、章节/关卡列表、存档文件导入导出等浏览器表现层；Campaign 规则本身来自 `@bobby/adventure`。

Adventure 在桌面也限制为原版式 portrait viewport，并设置 Camera 最小 zoom，避免显示完整谜题地图。

正式 URL：

```text
/levels
/play/1-1
/adventure
/adventure/chapters
/adventure/chapter/1
/adventure/play/1-1
/settings
/edit/1-1
/play#map=...
/edit#map=...
```

服务器负责 app-route fallback；缺失静态资源必须真正返回 404。

## Adventure Save

Save 是版本化纯 JSON；`@bobby/adventure` 负责 parse/normalize/serialize，Web 只负责 localStorage 与文件导入导出。

持久奖励用稳定 ID：

```text
Campaign level ID + semantic Object type + x/y
```

已经领取的奖励在进入 Adventure session 前从 LevelMap clone 中移除；原始官方 LevelMap 不修改。

## Original JAR Validation

验证闭环：

```text
Editor semantic map
      ├──> bc5r Engine
      └──> @bobby/dat encode
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

目标 public ID 只用于通过 Catalog provenance 找回原始 JAR / DAT / slot。

## Tools / Assets

`assets/original/` 不可变；`assets/extracted/`、`assets/generated/` 可重建。Tools 负责 JAR 解包、source provenance、Catalog、章节星级、筛选索引和原版验证 JAR。

## 依赖规则

允许：

```text
model <- dat
model <- engine
model <- adventure
model + engine + dat <- editor
model + dat + engine + adventure + editor <- web
tools -> dat + original assets + generated metadata
```

Adventure runtime 与 Engine 只通过结构化 event/death port 对接，不形成 package dependency。

禁止：

```text
engine -> adventure / DAT byte / @bobby/dat / Catalog / HTTP
adventure -> engine / DAT / JAR / archive release fields / DOM / localStorage
model -> DAT/JAR/gameplay/Campaign
editor -> duplicated DAT mapping
World -> per-object multi-cell synthesis switch
web filter -> MutationObserver patch another page
```
