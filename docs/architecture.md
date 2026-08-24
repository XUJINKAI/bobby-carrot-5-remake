# 架构

## 总体结构

```text
Original JAR / DAT
        ⇅
    @bobby/dat  <------------------- tools/original JAR patcher
        ⇅                                      ▲
    @bobby/model::LevelMap                     │
      ▲            ▲                           │
      │            │                           │
   Engine <----- Editor ------------------------┘
      ▲            ▲
      └----- Web ---┘
             ▲
             └------ @bobby/dat provenance (DEBUG only)

Official archive metadata / Catalog ---------> Web
```

项目同时服务两个目标：现代 Web 重制，以及用**同一张语义测试地图**在 bc5r Engine 与原版 Java ME Engine 中做差分验证。为了让这个验证可信，格式互操作与 gameplay 必须严格隔离。

## @bobby/model

`model/` 是最底层的稳定语义合同，只包含：
- `TerrainType` / `ObjectType`；
- `Terrain` / `ObjectId` 稳定语义常量；
- `LevelObject`；
- `LevelMap { width, height, terrain, objects }`。

`LevelMap` 表示“能被玩/编辑的一张地图”，不表示“某个官方发行记录”。它没有 release、chapter、difficulty、JAR path、record SHA、dynamicSlots 等字段。

## @bobby/dat

`dat/` 是原版格式唯一互操作边界，浏览器和 Node 都能使用，不依赖 `fs`：

```text
semantic Terrain/Object <-> original DAT byte
LevelMap <-> DAT level record
DAT package <-> metadata + level records
```

`dat/src/mapping.ts` 是唯一 raw DAT ID table。Debug 需要显示原版 hex ID 时调用 `datSourceForTerrain/Object()`；Engine Definition 自己不保存 DAT byte。

`dynamic_slots` 属于原版 record 的序列化字段，由 `deriveDatDynamicSlots(LevelMap)` 派生。`verify` 会对全部 530 条官方 source record 检查派生值与原值一致。

### DAT package 精确 patch

`replaceDatLevelRecord()` 只替换一个 one-based level record：metadata 与其它 record 原字节复制。这个能力既用于测试，也用于 Original JAR Validation Tool。

## Engine

`engine/` 是唯一游戏规则实现：World、移动事务、机关、动态实体、Camera、Renderer、Input、Audio 抽象、semantic Definition 与 Object Layout。

Game 的关卡输入是纯 `LevelMap`：

```text
LevelMap(anchor objects)
       ↓ Game.loadLevel
Object Layout expansion
       ↓
Runtime World occupancy
```

Engine 不知道 Catalog、release、chapter、difficulty、HTTP、JAR 或 DAT mapping。

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

Object Layout 保存 multi-cell footprint、cursor 与可编辑 variant；runtime animation/state transition 不属于这里。

## Official content / Catalog

官方档案数据属于内容层，不属于 Engine：

```text
OfficialLevelData extends LevelMap
+ source / sources
+ recordLength / recordSha256
+ dynamicSlots archive value
+ public/canonical ids
+ chapter/difficulty metadata
```

Web 的 `catalog.ts` 定义浏览所需类型与 HTTP JSON helper。进入 Game 时，结构上只消费它的 `LevelMap` 部分。

## Editor

Editor 持久化 `EditorLevel extends LevelMap`：
- schemaVersion / name / author / description；
- semantic terrain / objects；
- multi-cell 仍只保存 anchor。

持久化出口只有：
1. JSON Import / Export：长期编辑与备份格式；
2. 分享链接：`bc5r metadata envelope + original DAT level record -> deflate-raw + base64url`。

分享不是第二套 DAT codec；`editor/share.ts` 只能调用 `@bobby/dat`。`editor/inspector.ts` 也可以按 semantic ID 查询 DAT provenance，但这只用于 DEBUG 展示，不参与 authoring 或 gameplay。

Editor Play Test 把 Draft 转成纯 `LevelMap` 后调用正式 Engine。所有 owner resolve、footprint、Q/E variant 使用 Engine Object Layout。临时 Game/Input 生命周期由 `editor/playtest.ts` 管理，`Editor.ts` 只编排编辑状态与交互。

## Web

Web 是产品壳：Home、Level Browser、Play、Editor route、Settings。

Level Browser 的筛选索引仍由构建期生成，但筛选模块通过 `mountLevelFilters(catalog)` 显式挂载；禁止 MutationObserver 偷看 `.release-tabs` 是否出现。筛选模块只额外加载 `level-filters.json`，不重复 fetch catalog。

正式关卡和分享关卡都通过 Web-owned `game-session.ts` 创建/销毁 Game + Input；页面负责传入关卡内容、profile 和 session metadata。官方 Bonus Round 的 `bonusTimeMs` 在 `official-game.ts` 显式注入，shared/custom play 不推断 Bonus 模式。

正式 URL 是 SPA 路由：
```text
/levels
/settings
/play/<public-id>
/edit/<public-id>
/play#map=...
/edit#map=...
```

服务器负责 app-route fallback，构建不生成逐路由目录。缺失的静态资源必须返回 404，不能用 `index.html` 假装成功。

## Original JAR Validation

验证闭环：

```text
Editor minimal test map
          │
          ├──> bc5r Engine Play Test
          │
          └──> @bobby/dat encode
                 ↓
            patch one level record
                 ↓
            patch original JAR copy
                 ↓
          Java ME original Engine
                 ↓
             behavior compare
```

CLI：
```bash
npm run original:patch -- \
  --map editor/examples/mechanics-smoke.json \
  --target up9-4-12 \
  --out tmp/original-validation/mechanics.jar
```

目标 public ID 只用来选择“原版 JAR / DAT 包 / level slot”。自定义地图可以有不同尺寸和内容。

JAR patcher 的原则：
- 从 `assets/original/official-hd/` 读取，只写新的输出文件；
- 目标 `.dat` 内除替换 record 外其余 bytes 保持；
- JAR 未改 entry 的 local ZIP block 直接复制；
- 目标 DAT entry 重建 CRC/压缩尺寸；
- 移除因修改而失效的 `.SF/.RSA/.DSA/.EC` 签名 entry，保留 Manifest；
- 输出后重新读取 JAR → DAT → LevelMap，必须与输入语义地图严格相等。

## Tools / Assets

`assets/original/` 不可变；`assets/extracted/`、`assets/generated/` 可重建。Tools 负责 JAR 解包、官方 archive 构建、Catalog/难度/筛选索引和原版验证 JAR。

## 依赖规则

允许：
```text
model <- dat
model <- engine
model + engine + dat <- editor
model + dat + engine + editor <- web
tools -> dat + original assets
```

其中 Editor/Web 对 `dat` 的普通产品逻辑只能走 codec/provenance API；raw DAT table 仍唯一存在于 `dat/src/mapping.ts`。

禁止：
```text
engine -> DAT byte / @bobby/dat / Catalog / HTTP
model -> DAT/JAR/gameplay
editor -> duplicated DAT mapping
World -> per-object multi-cell synthesis switch
web filter -> MutationObserver patch another page
```
