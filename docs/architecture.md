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

原版 DAT 是外部二进制协议，不是项目内部关卡格式。`tools/src/dat-codec.mjs` 与 `tools/src/level-format.mjs` 构成格式边界：读取 DAT 时立刻把原版 terrain/object byte 转成语义类型；导出 DAT 时才重新编码为原版 byte。

`Engine / Editor / Web / generated JSON / Runtime` 不使用原版 byte 作为规则判断条件。Definition 中允许保存原版 DAT Hex ID 作为 source/provenance，供 DEBUG 和逆向校验显示，但 gameplay 逻辑只能依据语义 Definition、Trait 和 Behavior。

## Engine

`engine/` 是唯一游戏规则实现，负责 World、移动、机关、动态实体、Camera、Renderer、Input 和 Audio 抽象。Editor 不复制任何碰撞或机关逻辑。

Engine 只接收 Semantic `LevelData`。例如地形是 `ground-c / tide-left / speed-switch-raised`，对象是 `carrot / leaf / mower`。尚未逆出具体名称的原版格子也先由 codec 分类成稳定语义 variant，而不是让 byte 泄漏进 Engine。

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

## Editor

`editor/` 只负责“Semantic JSON Level 的创建与修改”：Terrain/Object 两层、基础绘制工具、Undo/Redo、Resize、JSON Import/Export 和 URL Share。

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

Stop 后 Runtime World 被丢弃，Editor Draft 原样保留。官方关卡也只以副本进入 Editor。Editor 不读写 raw DAT；如果未来 UI 需要 DAT Import/Export，也必须调用 codec，而不是在 Editor 内复制编码规则。

## Web

`web/` 是产品壳，同时调用 `@bobby/engine` 与 `@bobby/editor`：

- `/play/<official-id>`：官方关卡；
- `/edit/<official-id>`：复制官方关卡后编辑；
- `/play#map=...`：直接游玩分享地图；
- `/edit#map=...`：继续编辑分享地图。

Web 的普通运行时只消费语义状态。DEBUG Inspector 可以显示 Definition 中的原版 DAT provenance，但不得依赖该 byte 决定规则。

## Assets / Tools

`assets/original/` 保留不可变 JAR；`assets/extracted/`、`assets/generated/` 都是可重建结果。Tools 负责 JAR 提取、DAT codec 和官方 Catalog，不进入浏览器运行时。

## 依赖方向

允许：

```text
original/extracted DAT -> tools DAT codec -> semantic generated LevelData
web -> engine
web -> editor
editor -> engine
engine -> semantic LevelData
engine runtime -> Definition Registry -> Traits / Behaviors
renderer/editor -> semantic art mapping -> original atlas
DEBUG -> Definition source/provenance
```

禁止：

```text
engine gameplay -> DAT byte / raw magic number
engine -> editor/web
editor -> raw DAT/JAR
web gameplay -> raw DAT/JAR
editor 自己实现机关/碰撞
Renderer 用 DAT byte 推导 atlas 坐标
World 为新 Tile 继续堆大段 ID switch/if，而绕过 Definition / Behavior
```