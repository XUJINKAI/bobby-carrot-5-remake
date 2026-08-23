# 架构

```text
Original JAR / DAT
        |
        v
    DAT Codec
        |
        v
Semantic LevelData / JSON
        |
        +--------------+
        |              |
        v              v
      Engine <------- Editor
        ^              ^
        |              |
        +------ Web ----+

Semantic tile type -> Definition Registry -> Art Mapping -> Original Atlas
                         |
                         +-> Traits
                         +-> Composable Behaviors
                         +-> Source / DAT provenance
```

## DAT Codec

原版 DAT 是外部二进制协议，不是项目内部关卡格式。`tools/src/dat-codec.mjs` 与 `tools/src/level-format.mjs` 构成原版文件格式边界：读取 DAT 时立刻把原版 terrain/object byte 转成语义类型；导出 DAT 时才重新编码为原版 byte。

原版关卡还有一个重要的隐式规则：Dragon、Sandman、Dream Machine、Beaver 的 DAT Object table 只保存主 Object，身体/尾巴由原程序载入时补出。bc5r 不把这个规则留在 Engine。`tools/src/decode-levels.mjs` 在官方 DAT 导入边界把隐式组成格 **materialize** 成普通语义 Object；从这一刻开始，每一个组成 Tile 都只是 `LevelData.objects` 中真实存在的独立对象。

`Engine / Editor authoring / Web / generated JSON / Runtime` 不使用原版 byte 作为规则判断条件。Definition 中允许保存原版 DAT Hex ID 作为 source/provenance，供 DEBUG 和逆向校验显示，但 gameplay 逻辑只能依据语义 Definition、Trait 和 Behavior。

URL 分享是一个有意保留的窄例外：`editor/src/share.ts` 为了缩短链接，把语义地图编码成 **bc5r metadata envelope + DAT level record**，再进行 `deflate-raw + base64url`。这只是分享传输边界；Editor 的绘制、Inspector、校验、JSON Draft 和 Engine Runtime 都不依赖 DAT byte。

## Engine

`engine/` 是唯一游戏规则实现，负责 World、移动、机关、动态实体、Camera、Renderer、Input 和 Audio 抽象。Editor 不复制任何碰撞或机关逻辑。

Engine 只接收 Semantic `LevelData`。例如地形是 `ground-c / tide-left / speed-switch-raised`，对象是 `carrot / leaf / mower`。尚未逆出具体名称的原版格子也先由 codec 分类成稳定语义 variant，而不是让 byte 泄漏进 Engine。

Engine 不再根据 `dragon-head / sandman / beaver-base` 等主 Tile 自动生成其它 Object。`LevelData.objects` 写了什么，Runtime 初始对象网格就得到什么；因此自定义地图中被覆盖、逐格擦除或故意拼出的残缺大型对象会原样运行。

### Tile Definition Registry

Terrain 和 Object 保持两层独立语义，但每一种语义 ID 都通过 Definition Registry 描述：

```text
Definition
├── id
├── presentation
├── traits
├── behaviors[]
└── source
    ├── original DAT hex id
    ├── confidence
    └── evidence
```

其中：

- `presentation`：供 Renderer / Editor / DEBUG 使用的显示信息，不参与机关规则；
- `traits`：可组合的分类事实，例如 `walkable / water / climbable / cloud-passable / dragon-fire-passable`；
- `behaviors`：真正的可组合规则模块；
- `source`：原版来源和逆向置信度，只用于 provenance/debug，不得作为规则输入。

Behavior 是协议，不是继承基类。机关通过组合工厂生成的 Behavior：

```ts
behaviors: [
  directionalPassage({
    enter: ['left', 'down'],
    leave: ['right', 'up']
  }),
  rotateOnLeave(Terrain.CAROUSEL_4)
]
```

`World` 只负责移动事务、状态生命周期、Tick 和跨格算法，然后按顺序 dispatch Terrain/Object 的 passage、onEnter、onLeave 等 hook。具体 Tile 不应再通过 `World.ts` 中新增成片 `if (terrain === ...)` / `switch (object)` 来实现。

跨多个格子的算法，例如藤蔓生长循环、龙火路径遍历、云和荷叶的移动，仍由 World 调度；但它们查询的 Tile 分类、方向、反射、覆盖、阻挡等语义必须来自 Definition Registry，而不是维护第二套 ID Set/Map。

`terrainTraits.ts` 保留为兼容查询层，其结果委托给 Definition Registry；Registry 是 Tile 语义的单一事实来源。

Renderer 需要原版图集时，通过独立的 semantic → atlas mapping 获取素材位置；DAT code 与 atlas coordinate 是两个不同协议。

## Debug Inspector

`World.inspect(x, y)` 返回当前格的 Terrain/Object/Dynamic 状态以及 Terrain/Object Definition introspection。DEBUG UI 可以直接显示：

```text
semantic id
original DAT hex + confidence
presentation
traits
behaviors + config
runtime dynamic state
last Engine passage/message
```

正常游玩不显示 Engine passage/message；这些规则诊断信息只属于 DEBUG 模式。

Editor 直接复用 Definition introspection：选中左侧素材时显示该素材 Definition，鼠标所在地图格则同时显示 Terrain/Object Definition。这不是 Editor 自己维护的第二套说明数据。

## Editor

`editor/` 负责 Semantic `EditorLevel` 的创建与修改。Terrain 与 Object 在存储上仍是两层，但作者界面不要求先切 Layer：素材栏把两类内容按地面、水域、障碍物、机关、道具等用途统一分组。

编辑交互固定为：

```text
左键 / 拖动 -> 放置当前选择的 Terrain / Object / Stamp
右键 / 拖动 -> 删除当前格 Object；Terrain 不受影响
```

没有 Eyedropper，也没有独立 Eraser mode。鼠标悬停会在 Canvas 上半透明预览当前素材，右键擦除时显示擦除反馈。

Dragon、Sandman、Dream Machine、Beaver 在素材栏中是 **Editor-only Stamp**。Stamp 只是一次批量写入多个普通 Object Tile 的 authoring shortcut；完成写入后不保存 anchor、parent、footprint 或 composite relationship。之后每一格都可以独立覆盖和删除。

点击 **Play** 时：

```text
Editor Draft
    |
    | clone + normalize
    v
Semantic Engine LevelData
    |
    v
Runtime World
```

Stop 后 Runtime World 被丢弃，Editor Draft 原样保留。官方关卡也只以副本进入 Editor。

Editor 的持久化出口只有两种：

- JSON Import / Export：bc5r 自定义语义 `EditorLevel`，用于备份与继续编辑；
- 游玩链接：metadata + DAT level record 的紧凑传输格式。

没有单独的 “Edit Share” 格式。`/play#map=...` 和 `/edit#map=...` 读取同一个 payload，所以从分享游玩页点击“编辑地图”只是把同一份 hash 带进 Editor。

## Web

`web/` 是产品壳，同时调用 `@bobby/engine` 与 `@bobby/editor`：

- `/play/<official-id>`：官方关卡；
- `/edit/<official-id>`：复制官方关卡后编辑；
- `/play#map=...`：直接游玩分享地图；
- `/edit#map=...`：继续编辑同一份分享地图。

Web 的普通运行时只消费语义状态。DEBUG Inspector 可以显示 Definition 中的原版 DAT provenance，但不得依赖该 byte 决定规则。

## Assets / Tools

`assets/original/` 保留不可变 JAR；`assets/extracted/`、`assets/generated/` 都是可重建结果。Tools 负责 JAR 提取、DAT codec、官方多格 Object 的导入物化和 Catalog，不进入浏览器 gameplay runtime。

## 依赖方向

允许：

```text
original/extracted DAT -> tools DAT codec -> import materialization -> semantic generated LevelData
web -> engine
web -> editor
editor -> engine
editor share boundary -> DAT level-record transport encoding
engine -> semantic LevelData
engine runtime -> Definition Registry -> Traits / Behaviors
renderer/editor -> semantic art mapping -> original atlas
DEBUG -> Definition source/provenance
```

禁止：

```text
engine gameplay -> DAT byte / raw magic number
engine runtime -> implicit multi-tile Object synthesis
engine -> editor/web
editor authoring rules -> raw DAT byte
web gameplay -> raw DAT/JAR
editor 自己实现机关/碰撞
Renderer 用 DAT byte 推导 atlas 坐标
World 为新 Tile 继续堆大段 ID switch/if，而绕过 Definition / Behavior
```
