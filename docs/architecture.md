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

Semantic type -> Engine semantic definitions
                    |
                    +-> Tile Definition Registry
                    |     +-> presentation / traits / behaviors / source
                    |
                    +-> Object Layout Definition
                          +-> footprint / cursor / authoring variants

Multi-cell Object anchor -> Object Layout -> Runtime occupancy
```

## DAT Codec

原版 DAT 是外部二进制协议，不是项目内部规则语言。`tools/src/dat-codec.mjs` 与 `tools/src/level-format.mjs` 构成格式边界：读取 DAT 时立刻把 terrain/object byte 转成语义类型；导出 DAT 时才重新编码为原版 byte。

Dragon、Sandman、Dream Machine、Beaver 有一个重要的原版数据特征：DAT Object table **只保存主 Object（anchor）**，没有显式保存 `dragon-body / dragon-tail / sandman-body / ...`。485 个唯一官方关卡的实际数据中，Dragon anchor 101 个、Sandman 7 个、Dream Machine 1 个、Beaver 83 个，而这些内部 body/tail record 为 0。

bc5r 保留这个自然的数据模型：generated semantic level、EditorLevel、JSON 与分享 DAT payload 都保存 anchor，不人为把内部组成格持久化进去。

URL 分享是一个有意保留的窄 DAT 边界：`editor/src/share.ts` 为了缩短链接，把语义地图编码成 **bc5r metadata envelope + 原版 DAT level record**，再进行 `deflate-raw + base64url`。名称、作者和描述放在 envelope 中；地图主体保持原 DAT 的紧凑 anchor 编码。

## Engine

`engine/` 是唯一游戏规则实现，负责 World、移动、机关、动态实体、Camera、Renderer、Input 和 Audio 抽象。Editor 不复制任何碰撞或机关逻辑。

Engine 的 authoring/persistence 语义仍然是 `LevelData` 中的 semantic ID。运行时 `World` 使用按格对象网格，因此 `Game.loadLevel()` 在创建 World 前通过 `Object Layout` 把 multi-cell anchor 展开成 runtime occupancy。这个展开只是运行时投影，不会反写 LevelData source、EditorLevel 或分享 payload。

因此：

```text
Persisted / Authoring
Dragon = dragon-head anchor @ (x,y)

        ↓ objectLayoutFor()

Runtime occupancy
(x,y)     dragon-head
(x+1,y)   dragon-body
(x+2,y)   dragon-tail
```

`World` 只消费已经准备好的 occupancy；multi-cell 组合关系由 Engine 的 Object Layout Definition 统一声明，不在 World、Tools 或 Editor 里继续堆 Dragon/Sandman/Beaver 特判。

### Semantic Definition Layer

Terrain / Object 的语义事实都属于 Engine definition layer，但按职责分成两个声明面：

```text
Tile Definition Registry
├── id
├── presentation
├── traits
├── behaviors[]
└── source
    ├── original DAT hex id
    ├── confidence
    └── evidence

Object Layout Definition
├── footprint[]
├── cursor
└── authoringVariants[]
```

`Tile Definition Registry` 是 gameplay 语义来源；`Object Layout Definition` 是空间占用和 authoring 语义来源。二者都以 semantic Object ID 为键，都位于 Engine，调用方只能通过查询函数使用；Editor、World、Tools 不维护第二份 ID 表。

其中：

- `presentation`：供 Renderer / Editor / DEBUG 使用的显示信息，不参与机关规则；
- `traits`：可组合的分类事实，例如 `walkable / water / climbable / cloud-passable / dragon-fire-passable`；
- `behaviors`：真正的可组合规则模块；
- `source`：原版来源和逆向置信度，只用于 provenance/debug，不得作为规则输入；
- `footprint / cursor`：描述一个 persisted Object 在地图空间的完整占用和 Editor 鼠标基准；
- `authoringVariants`：描述 Editor 可以通过 `Q / E` 循环切换的等价编辑形态。

Behavior 是协议，不是继承基类。机关通过组合工厂生成 Behavior。`World` 负责移动事务、状态生命周期、Tick 和跨格算法，然后 dispatch Terrain/Object 的 passage、onEnter、onLeave 等 hook。

跨多个格子的算法，例如藤蔓生长、龙火路径、云和荷叶移动，仍由 World 调度；但 Tile 分类、方向、反射、覆盖、阻挡等语义必须来自 Engine semantic definition layer，而不是维护第二套 gameplay ID switch。

### Object Layout / Authoring Variant

`engine/src/mechanics/object-layouts.ts` 是 Object Layout Definition 的实现模块，保存两类**非 gameplay-state**语义：

1. multi-cell Object 的 footprint 与 Editor cursor anchor；
2. Editor 可循环的 authoring variant，例如 Windmill 四方向、Fence 形态、Cloud / Cloud Grid 颜色。

它不包含 Dragon 动画帧、冰融化、木板碎裂等 runtime animation/state transition。后者仍由 Engine gameplay 行为决定，不应被 Editor 变体操作误用。

### Camera / Input

Play 的 Camera 始终跟随 Bobby，但允许用户临时拖动画面查看周围：

- 左键拖动：保留原有 Play 平移；
- 中键拖动：Play / Edit 都使用的统一平移手势；
- 滚轮：Play / Edit 都用于地图缩放；
- Touch：Play 继续使用拖动和平移、双指缩放。

Play 中的手动 pan 只是临时 offset。用户拖开 Camera 后，**下一次真正发生的移动**会启动一次 ease-out recenter，把 offset 平滑收回到 0；被阻挡的移动不会触发归中。连续移动或 forced movement 不会反复重启同一个回中动画；用户如果在回中期间重新拖动，则新的 pan 会取消旧动画，下一次移动再重新开始归中。

## Debug Inspector

`World.inspect(x, y)` 返回当前格的 Terrain/Object/Dynamic 状态以及 Terrain/Object Definition introspection。正常游玩不显示这些规则诊断信息；DEBUG 模式可以显示 semantic id、原版 DAT provenance、traits、behaviors 和运行时状态。

Editor 同样复用 Engine definition 查询。对于 multi-cell Object，Editor 另外显示 owner anchor、当前指向的组成 part、footprint 与可用 authoring variants。

## Editor

`editor/` 负责 Semantic `EditorLevel` 的创建与修改。Terrain 与 Object 在存储上仍是两层，但作者界面不要求先切 Layer：素材栏把两类内容按地面、水域、障碍物、机关、目标、道具等用途统一分组。

编辑交互固定为：

```text
左键 / 拖动     -> 放置当前 Terrain / Object
右键 / 拖动     -> 删除鼠标指向的完整 Object
Del              -> 同右键
Q / E            -> 变换鼠标指向且支持 authoring variant 的 Object
滚轮             -> 地图缩放
中键 / 拖动      -> 地图平移
```

没有 Eyedropper，也没有独立 Eraser mode。Editor 的地图 viewport 与 Play 使用相同的滚轮缩放 / 中键平移心智模型；进入 Play Test 时会移除 Editor 自己的 Canvas transform，把 Canvas 交给 Game Camera，Stop 后再恢复 Editor viewport。

### Multi-cell Object owner

EditorLevel 只保存 anchor。Editor 通过 Object Layout 计算每个 anchor 实际占据的格，并提供统一 owner resolver：

```text
任意 occupied cell
      ↓
resolveObjectOwner(x,y)
      ↓
EditorObject anchor + footprint + selected part
```

所以鼠标放在 Dragon 尾巴上，Editor 仍然知道目标是整条 Dragon。右键 / `Del` 会整体删除；左键放置新 Object 与它任意一格相交时，会先删除完整旧 owner，再放置新对象。

所有即将被当前鼠标操作删除或替换的完整 Object 会泛蓝高亮。当前待放素材则保持半透明原色预览，这两种视觉状态互不混淆。

Dragon 的 Editor cursor 定义在身体格：用户点击身体位置，持久化 anchor 自动落在左侧 head 位置。其它 multi-cell Object 同样通过 layout cursor 定义，不在 Editor 中写 per-object 特判。

内部组成 ID（`dragon-body / dragon-tail / sandman-body / ...`）不进入正常 Palette，也不会写入 Editor JSON / DAT share。

### 持久化与分享

Editor 的持久化出口只有两种：

- JSON Import / Export：bc5r 自定义语义 `EditorLevel`，用于备份与继续编辑；
- 游玩链接：metadata + DAT level record 的紧凑传输格式。

没有单独的 “Edit Share” 格式。`/play#map=...` 和 `/edit#map=...` 读取同一个 payload，所以从分享游玩页点击“编辑地图”只是把同一份 hash 带进 Editor。

`toLevelData()` 保持 multi-cell anchor，不产生内部 body/tail；唯一展开点是 `Game.loadLevel()` 创建 Runtime World 之前。`fromLevelData()` 仍能兼容已经展开过的 occupancy 并折回 authoring anchor。Editor 与 Engine 始终共用同一份 Object Layout Definition，不维护第二套 footprint 表。

## Web

`web/` 是产品壳，同时调用 `@bobby/engine` 与 `@bobby/editor`：

- `/play/<official-id>`：官方关卡；
- `/edit/<official-id>`：复制官方关卡后编辑；
- `/play#map=...`：直接游玩分享地图；
- `/edit#map=...`：继续编辑同一份分享地图。

### 关卡筛选

Catalog 继续保持轻量的关卡目录合同；关卡内容筛选使用构建期生成的 `assets/generated/level-filters.json`。`tools/src/build-level-filters.mjs` 一次扫描 semantic generated levels，提取：

```text
difficulty      <- catalog 现有难度字段
carrotCount     <- 主目标胡萝卜数量
specialItems    <- 雪铲 / 割草机 / 汽油 / 魔豆 / 风筝 / 金胡萝卜 / Bonus Coin
scenes          <- 草地 / 水域 / 雪地 / 冰面 / 高草 / 商店
mechanics       <- 潮汐 / 加速带 / Carousel / 风 / 镜子 / 陷阱 / 彩色开关 / ...
```

浏览器进入 `/levels` 时只加载 catalog + 这一个紧凑索引，不逐关 fetch 485 个 LevelData。筛选规则是：**同一类别内 OR，不同类别之间 AND**；切换 Base / UP1…UP9 时保留筛选状态。场景与机关选项使用 semantic → atlas mapping 显示原版图标，而不是重新维护图标坐标表。有筛选条件时“随机一个关卡”只从当前发行包的匹配结果中选择。

Web 的普通运行时只消费语义状态。DEBUG Inspector 可以显示 Definition 中的原版 DAT provenance，但不得依赖该 byte 决定规则。

## Assets / Tools

`assets/original/` 保留不可变 JAR；`assets/extracted/`、`assets/generated/` 都是可重建结果。Tools 负责 JAR 提取、DAT codec、官方 Catalog 与关卡筛选索引，不进入浏览器 gameplay runtime。

官方 DAT decode **不再物化** multi-cell body/tail；generated level 保留原始 anchor 语义。运行时展开只发生在 Engine 的 level-load 边界。

## 依赖方向

允许：

```text
original/extracted DAT -> tools DAT codec -> semantic generated LevelData(anchor)
semantic generated LevelData -> build-level-filters -> level-filters.json
web -> engine
web -> editor
editor -> engine
editor share boundary -> DAT level-record transport encoding
Game.loadLevel -> Object Layout Definition -> Runtime World occupancy
editor authoring -> Object Layout Definition -> owner/preview/collision/variants
engine runtime -> Tile Definition Registry -> Traits / Behaviors
renderer/editor/web filter icons -> semantic art mapping -> original atlas
DEBUG -> Engine semantic definitions
```

禁止：

```text
engine gameplay -> DAT byte / raw magic number
tools import -> duplicated multi-cell footprint table
World -> per-object multi-cell synthesis switch
engine -> editor/web
editor authoring rules -> raw DAT byte
web gameplay -> raw DAT/JAR
editor 自己实现机关/碰撞
Renderer 用 DAT byte 推导 atlas 坐标
Editor 为 Dragon/Beaver/Sandman 单独写 owner 删除/预览逻辑
level browser -> 运行时逐关加载 485 个 LevelData 才能筛选
```
