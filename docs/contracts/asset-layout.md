# 资产目录契约

```text
assets/
├── maps/
│   ├── index.json
│   ├── original/
│   │   ├── index.json
│   │   ├── 1-1.json
│   │   └── ...
│   └── <collection>/
│       ├── index.json
│       └── <map-id>.json
├── adventure/
│   └── index.json
├── replays/
│   └── <fixture-name>.json
├── i18n/
├── art/
└── audio/
```

`assets/` 是网站 `/assets/` 的静态资源源树。`build` 将其原样复制到 `dist/assets/`。

`replays/` 保存人工录制并由 Git 托管的 Engine 回归 fixture。Web 使用
`<collection>/<map-id>.json` 作为每张地图的默认内置过法；验证工具递归扫描全部 JSON，
并通过 Replay `meta.url` 关联 MapDocument，因此其它测试文件可以按 take 或测试目的命名。
具体格式和验证规则见 `docs/contracts/replay.md`。

## `maps/index.json`

只负责 collection discovery 与 tab 顺序：

```json
{
  "schemaVersion": 2,
  "collections": [
    { "id": "original" }
  ]
}
```

该索引由总资产流水线在所有 Collection 均生成后统一写入。每个 discovery 项只包含
`id`；数组顺序就是 Explore Tab 与 Settings 存档 Tab 的顺序。

## `maps/<collection>/index.json`

所有 collection 使用同一合同：

```json
{
  "schemaVersion": 2,
  "cardSize": "small",
  "filters": [],
  "chapters": [],
  "maps": []
}
```

它只服务 Explore 的浏览、分组、搜索、筛选、随机选择和列表展示。

Collection 展示文案位于 `i18n/src/locales/collections/<locale>.ts`，按以下 key 组织：

```text
collections.<id>.name
collections.<id>.tag          可选
collections.<id>.description
```

`name` 与 `description` 是每个可见 Collection 的必需文案；`tag` 是 Explore Tab 的简短玩法
标签。Tab 按 `name / tag` 显示，省略 `tag` 时名称在同一 Tab 高度内垂直居中。Collection
页面 Header 使用 `name / description`，静态与运行时 SEO 也读取同一份双语文案。

`cardSize` 控制该 collection 的地图卡片密度，可取 `small / medium / big`。它属于 collection 的展示数据，因此 chapter 只负责分组，不决定地图卡片尺寸。

`maps` 是 collection 的完整有序地图列表；`chapter` 是 map 的可选分组属性。collection 同时包含根目录地图与 chapter 目录时，根目录地图排在最前并按无章节网格展示，随后按 chapter 与 map ID 顺序展示章节地图。`maps[].name` 直接来自对应 MapDocument 的 `meta.name`，Explore 原样显示该名称。chapter 的 `name` 也是必需的展示文案，Explore 只显示该字段；自定义 collection 未提供章节名称时，生成器使用目录 `id` 作为 `name`。数组顺序就是 Explore 顺序，不另存重复的 `order` 字段。

Original collection 在 40 个正式章节后追加 ID 为 `special-scenes` 的普通 chapter
分组，5 张地图通过 `chapter: "special-scenes"` 进入该分组。该分组只表达 Explore
的尾部布局，不进入 Adventure 的 Campaign chapter 编号。前 40 章在 Original Explore
index 中把编号与原版标题组合为展示名称，例如 `1 · FAIRY MAGIC`；Adventure index
继续保存独立的 `id: "1"` 与 `name: "FAIRY MAGIC"`。

Original Bonus 地图显式保存 `music: "shop"`，Lock 打开后的 `bonus` 覆盖由 Engine
根据地图状态选择；普通关卡省略 `music`，由播放页面在 `ingame0..2` 中随机选择。
5 个 Special Scene 按原版固定保存地图音乐：Beaver Shop 与 Dream Machine 使用
`shop`，Cloud 9、Dreamland Reward 与 Campaign Intro 使用 `sandman`。
Robo 2 的 25 张地图显式保存 `music: "robo2/menu"`；默认随机池继续只包含 Original
的 `ingame0..2`。

filter option 的 Gameplay 图标使用统一 Entity preview descriptor，不区分 Original/Custom，也不区分 Terrain/Object。每个 option 通过 `icons` 数组按顺序提供一个或多个图标：

每个 filter 使用 `selection: "single" | "multiple"` 声明选择方式。多个已选
option 以及不同 filter 之间都按“且”匹配；`single` 只约束该 filter 同时最多保留
一个 option。Original 的目标与目标数使用 `single`，场景及道具与机关使用 `multiple`。

```json
{
  "id": "mower",
  "name": "汽油 / 割草机 / 易碎岩石 / 高草",
  "icons": [
    { "type": "entity", "entity": { "type": "gas" } },
    { "type": "entity", "entity": { "type": "mower" } },
    { "type": "entity", "entity": { "type": "crumbly-rock" } },
    { "type": "entity", "entity": { "type": "high-grass" } }
  ]
}
```

每个 `entity` 使用与 `LevelEntity` 相同的 `type` 与类型专属顶层字段，但作为预览描述不包含坐标。Explore 应通过 Engine VisualDefinition/preview 能力绘制它，而不是按 ID 自己维护一套 atlas 或 CSS 映射。

`icons` 中的纯 UI 图标可使用：

```json
{ "type": "image", "src": "assets/..." }
{ "type": "text", "value": "B" }
```

Collection JSON 不保存 atlas 坐标。

## `maps/<collection>/<map-id>.json`

这是独立可打开的 `MapDocument`。URL：

```text
/explore/play/<collection>/<map-id>
```

直接映射到：

```text
/assets/maps/<collection>/<map-id>.json
```

Play route 直接加载当前 MapDocument；同 collection 的列表与下一张导航来自 collection index。

MapDocument 的 gameplay 部分统一是 Entity Map v1。Bobby 是 Entity；Start 如果存在也是普通 surface Entity，不承担出生语义。具体规则见 `docs/contracts/level-format.md`。

## `adventure/index.json`

Adventure index 只定义 Campaign topology：章节、章节内 level 顺序、Special Scene，以及每个 node 引用的 map。

```json
{
  "schemaVersion": 1,
  "chapters": [
    {
      "id": "1",
      "levels": [
        { "id": "1-1", "map": "original/1-1" }
      ]
    }
  ]
}
```

Adventure 不拥有地图内容；它引用 `assets/maps/` 下的 MapDocument。

## Asset Producer 与构建源

`tools/assets/collections.json` 是 Collection 顺序、可见性与 Producer 的单一结构
manifest。BC5、Robo 2、LOMA 与 Novoban 分别由 `tools/assets/bc5/`、`robo2/`、
`loma/` 与 `novoban/` 生产；directory Producer 读取 `custom-maps/` 中人工维护的语义地图。
`custom-maps/` 不保存批量来源生成物。

```text
tools/assets/
├── collection/          # manifest、directory source 与统一 Publisher
├── bc5/                 # BC5 Producer
├── robo2/               # JAR、格式、转换、美术覆盖与 Producer
├── pushbox/             # LOMA 与 Novoban 共享的 XSB 和地形转换
├── loma/                # LOMA.txt、专属 parser 与 Producer
├── novoban/             # NOVOBAN.txt、专属 parser 与 Producer
└── orchestrator/        # 任务缓存、原子发布与开发 watcher
```

资产来源和转换代码按领域归入 `tools/assets/`。`tools/assets/pushbox/` 只持有两个
Pushbox Producer 的共享规则；来源文本、来源格式 parser 与 Producer 仍由各自目录持有。

统一任务图为每个任务声明输入、依赖和独占输出。缓存位于 `tmp/assets/cache/`，保存输入
摘要、依赖结果摘要与输出清单；输入变化只运行受影响任务及其下游。Collection Publisher
统一声明 `model/src` 输入并调用 Model parser 规范化 MapDocument，在临时目录完成全部写入
后替换对应的 `assets/maps/<collection>/`，最后按 manifest 汇总
`assets/maps/index.json`。

BC5 使用三阶段产物：

```text
original/official-hd/*.jar
  ↓ bc5.extract
tmp/assets/bc5/extracted/
  ↓ bc5.decode
tmp/assets/bc5/decoded/
  ↓ bc5.adapt
tmp/assets/bc5/adapted/
  ├─→ assets/maps/original/
  ├─→ assets/adventure/index.json
  └─→ assets/art/hd/
```

Robo 2 使用受 Git 管理的 J2ME 包和明确登记的美术覆盖文件：

```text
tools/assets/robo2/robo2.jar
  ↓ robo2.extract
tmp/assets/robo2/extracted/
  ├── META-INF/
  ├── data/0 ... data/24
  ├── data/*.png / *.mid
  └── *.class
  ↓ robo2.decode + encode round-trip
tmp/assets/robo2/decoded/
  ↓ robo2.adapt
tmp/assets/robo2/adapted/
  └─→ assets/maps/robo2/

tmp/assets/robo2/extracted/data/*.png
  + tools/assets/robo2/overrides/*.png
  └─→ assets/art/robo2/
```

`robo2.extract` 校验来源 JAR SHA-256 并完整、安全地展开所有 entry；解包器拒绝绝对路径
与 `..` 路径。`robo2.decode` 和美术 Publisher 只读取 extracted 阶段，不再次打开 JAR。
decoded 地图保留来源 entry、record SHA-256、theme 与 tile code。来源工具边界负责 JAR byte、
列优先格子、半字节 tile code、原始图片 entry 与覆盖文件；Engine 只消费语义地图与已注册
的图片资源 ID。

LOMA 与 Novoban 不增加没有格式意义的阶段目录：

```text
tools/assets/loma/LOMA.txt
  ↓ LOMA Producer + Pushbox converter
PreparedCollection
  ↓ Collection Publisher
assets/maps/loma-pushbox/

tools/assets/novoban/NOVOBAN.txt
  ↓ Novoban Producer + Pushbox converter
PreparedCollection
  ↓ Collection Publisher
assets/maps/novoban-pushbox/
```

`LOMA.txt` 是受 Git 管理的第三方源数据。原始 `Title` 的 `LOMA01-*` ～ `LOMA10-*`
成为 collection 的 10 个 source pattern chapter。Novoban 的 50 张地图按源文件顺序生成
`01` ～ `50`，原注释标题成为地图展示名，作者统一保留为 François Marques。版权与来源
边界见根目录 `THIRD_PARTY_ASSETS.md`。

LOMA 与 Novoban 的 XSB 字符转换由 `tools/assets/pushbox/xsb.mjs` 统一负责，主题地形转换
位于 `tools/assets/pushbox/terrain.mjs`。每张地图从
`PUSHBOX_TERRAIN_TABLE` 稳定选择一个主题，并按 `ground / boundary / obstacle` 类别与坐标
选择具体素材。矩形外框使用 `boundary`，内部墙与外部空白填充使用 `obstacle`；所有可行走
单元先生成第 `0` 层 `ground`，目标在第 `1` 层生成 `push-goal`，箱子与 Bobby 位于第 `2`
层。标准 `+` 因此表示同格 `ground + push-goal + Bobby`，不需要 `playerStart` 或 Start
surface。

`tools/assets/collections.json` 可用可选 `chapters` 为 directory Producer 已存在的 chapter
目录补充 `name` 与 `description`。只有目录而没有补充信息时，runtime chapter 只包含目录
提供的 `id`。`visible` 支持 `true`、`false` 和 `"dev"`：缺省或 `true` 进入所有 discovery
index，`false` 不进入 discovery index，`"dev"` 只进入 `npm run dev` 生成的 index。
可见性控制 collection discovery 和正式站点路由生成；地图与 collection 自身的 runtime
assets 仍统一生成。directory Producer 的 chapter 身份和成员关系来自
`custom-maps/<collection>/<chapter>/`；只允许这一层 chapter 目录，根目录地图没有 chapter。
Explore 只读取统一生成的 collection index，不知道该 collection 的数据来源。

## 生成规则

`npm run assets` 清理 `tmp/assets/` 与已登记的最终生成目录，再通过同一任务图完整重建。
`assets prepare` 复用逐任务缓存；`npm run dev` 复用同一任务图和 Vite watcher，把连续事件
按 Producer 合并并串行重建。watcher 直接从任务 `inputs` 推导监听范围和受影响任务。单任务
使用各自的原子发布边界；manifest 变化触发的完整重建先在隔离目录生成，全部成功后整体
提交 `assets/`。任务成功后刷新页面；失败时保留上一份完整输出。

Original 生产过程可以保留 archive provenance；runtime 地图与 collection 合同统一使用产品语义 ID。
