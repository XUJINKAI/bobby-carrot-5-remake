# 地图编辑器

Editor 是 Bobby Carrot 5 Remake 的玩家功能，也是 Engine 的交互式调试入口。Play Test 使用正式 Engine gameplay 实现。

## 模块结构

```text
editor/src
├── level/       EditorMap、规范化、校验与 JSON 序列化
├── document/    EditorDocument、History 与编辑命令
├── authoring/   放置、Surface、Palette、Selection 与 Inspector Model
└── canvas/      Renderer、Input、Viewport 与坐标转换
```

`@bobby/editor` 不创建页面 DOM，也不访问 File、Blob、URL、Dialog、Router、`localStorage` 或 `sessionStorage`。这些产品能力由 Web 页面持有。

从 Explore 通过 `/edit#map=<collection>/<id>` 打开地图时，Web 在成功读取地图后消费该 fragment，并将地址恢复为 `/edit`。后续刷新从 Editor autosave 恢复当前草稿，不会再次用来源地图覆盖。

## Editor JSON

导入/导出使用当前语义 schema v1，地图 gameplay 内容继续使用统一 Entity 列表：

```json
{
  "schemaVersion": 1,
  "meta": {
    "name": "My Level",
    "author": "optional"
  },
  "note": "optional",
  "width": 20,
  "height": 16,
  "entities": [
    { "type": "grass", "x": 0, "y": 0, "variant": "ts-10-1" },
    { "type": "carrot", "x": 4, "y": 8 }
  ]
}
```

当前开发阶段只接受 v1。地图核心仍是 `@bobby/model::LevelMap`；Editor authoring policy 不进入 Engine。
地图文件弹窗默认生成压缩分享 URL，用户仍可通过“压缩”开关查看和编辑 Plain JSON。

## Surface 与 Palette

Surface 与 Palette 是两套并列的 authoring UX，不要求与 Engine Entity taxonomy 一一对应。

Surface 表示“这一格的地貌是什么”。每格最多保留一个 base Surface；`fence` 是可叠在 base 上的 overlay Surface。`snow-fence` 属于 base，会像其它基础地貌一样替换原 base。Surface 可以影响 gameplay；是否影响解法不是 Surface / Palette 的划分标准。Editor 内部仍用这些语义类型描述基础环境：

```text
ground
solid
water
ice
sky
waterfall
```

`blocking` 保留为 Engine trait / 行为语义，不作为 Surface Type 名称。

用户在 Surface 面板中不直接操作 Type × Theme 矩阵，而是选择具体 Terrain，例如草地、雪地、沙地、石头、墙、水、瀑布、篱笆、带雪篱笆、天空等。每个 Terrain 指定一个主要 visual 作为入口，并通过显式 `rows` 定义其 variant 排列。Terrain 本身也可按 group / row 组织，和 Palette 一样由 Editor 精确控制布局。

### Theme

Theme 是视觉批量转换入口，不是 Level 全局属性，也不会限制地图只能使用一种风格。当前入口：

```text
混合 / 森林 / 雪地 / 沙地 / 太空
```

Theme 卡使用多个代表 visual 拼成预览，强调视觉识别。点击具体 Theme 时，Editor 自动识别已知的同类 Terrain，并只在相同 Surface slot / SurfaceType / theme family 内换皮，例如草地 ↔ 雪地 ↔ 沙地 ↔ 云层。Water、Ice、Waterfall 等没有对应主题映射的 gameplay terrain 保持不变。地图包含多个主题时显示为“混合”。

### 空间工具

Palette 和 Surface 使用一致的基础工具语义：

- `1 Select`：单击单选，拖动建立矩形多选；选择本身不绘制或删除内容；
- `2 Brush`：在 Canvas 上绘制当前 Palette Entity 或 Surface Terrain；若按下位置位于当前矩形 Selection 内，则一次性填充整个 Selection；
- `4 Delete / Smart Fill`：Palette 中逐格删除视觉栈顶的非 Surface Entity；Surface 中按当前 Terrain 对四方向连通区域进行 flood fill，匹配 Terrain 而忽略具体 visual variant。

Surface 基础地貌通过 Brush 画成另一种 Terrain 来替换。Palette 的 Delete 工具用于逐格删除，Selection + Delete/Backspace 用于删除当前单格或矩形选区的目标层。

`Ctrl+A` 选择整张地图。`Tab` 在编辑状态直接切换 Palette / Surface，并打开对应左侧面板；文本输入和 Play Test 不拦截这些编辑快捷键。

### Pattern 与 Variant

Variant 分配支持：

- Auto：按地图坐标和 seed 稳定分配 variant；同一 seed 不会因刷新而改变；
- Exact：强制使用一个具体 variant，用于手工修边和原版精确复刻；
- Alternating：两个 variant 按 `(x + y) % 2` 交替，主要用于接缝、atlas mapping 等 Debug。

Variant 在 Catalog 中直接以二维 `rows` 定义，Surface 面板按原布局展示，不自行重排。
Variant 单元在同一 row 内紧贴，相邻 row 也紧贴，只用明显的分隔线表达 row 边界，
使整体更接近 atlas 预览。Alternating 模式左键选择 A、右键选择 B。

Inspector 编辑 Surface 时复用同一份二维 `rows`，直接显示 atlas visual 网格并高亮当前单元；选择结果写回 canonical type + `variant`。Surface 的 `variant` 不显示为文本下拉框。

地图右键切换当前 authoring 面板的选择工具，并建立当前格的单格选区。

Waterfall 属于 Surface。Auto 绘制连续竖向瀑布时，根据本次目标区域自动选择 Start / Middle / End visual variant。

Palette 只负责独立放置的 Actor、Item、Mechanism 等对象。Palette 放置不会删除已有 Surface；Surface 区域操作也不会删除叠在其上的 Palette Entity。

Palette 显式条目与自动补充项必须同时具有 Model `EntityMapDefinition` 和 Engine Definition，
并读取 Engine Definition 的 `authoring.palette`。Engine 私有临时实体不属于 Map Definition，
不会进入 Editor；`palette: false` 用于把通过 Surface 等其它入口编辑的 canonical Entity
排除出 Object Palette。

Palette 布局由 `EditorPaletteDefinition` 表驱动：`groups[].rows` 的二维顺序就是面板顺序；
单个条目的 `fields` 是实际放置 preset，`direction` 与其它类型专属字段一样写在 `fields` 中，
`label / preview` 只控制展示；默认一个条目
只生成一个 tile，显式设置 `expand: "variants"` 时才按对应 `EditorEntityDefinition.variants`
的顺序展开。需要精确调整部分形态的顺序或外观时，应在 `rows` 中写多个独立条目。

`remainders` 按声明顺序接收尚未被显式 `rows` 消费的可创建 Entity。`types` 限定候选集合，
`rows` 决定集中到一行或按 type 分行，`expand` 决定是否展开 variants；省略 `types` 的末级
remainder 可用于收纳其它可创建 Entity。Builtin Palette 的 Original Tile 与未分组区域都通过
这张表声明，不由 Palette resolver 写死名称或布局。

草下目标通过在同格放置 `high-grass` 与 `carrot` 或 `egg` 创建。云朵停靠格使用带 `color` 的 `cloud-parking`，放置时保留同格基础地形。

### 堆叠规则

Editor 使用显式 `stackSlot` 管理 Palette 与 Surface 的创作语义。它与 Engine 的视觉 `stackOrder` 分离：`stackSlot` 决定放置时替换谁，`stackOrder` 决定最终绘制和 Inspector 展示顺序。

| slot | 内容 |
| --- | --- |
| `surface-base` | 基础地貌，包括 `snow-fence` |
| `surface-overlay` | `fence` |
| `floor-feature` | 出口、停靠格、目标格、机关地板、开关、Portal 与商店格 |
| `content` | 胡萝卜、Egg、Gas、Bean、道具与奖励 |
| `support` | Mower、Cloud、Plank 与 Leaf |
| `occupant` | Bobby、可推动物、角色、Lock 与多格 Object |
| `cover` | High Grass、Snow 与 Ice Block |

在任一目标格命中同 slot 素材时，新素材替换完整 owner；多格 Object 会在整个 footprint 上原子处理替换。推荐的跨 slot 组合为：base 可承载 overlay、floor feature、content、support、occupant 或 cover；floor feature 可配 content、support 或 occupant；content 可配 cover；support 可配 occupant。其它组合仍可放置，Canvas 使用琥珀色 hover 框，Inspector 同时显示“非推荐堆叠”提示，便于检查导入地图和特殊设计。

Canvas 会统计每格去重后的 Palette Presence。达到两层时，在格子右上角显示实际层数角标；Surface 不计入该数字，多格素材在每个覆盖格中各计一层。

## Inspector

Inspector 汇总当前工具和它正在作用的对象：

- Select 单格显示该格完整 Entity stack，并允许编辑字段、切换 variant、调整顺序或删除指定层；
- Select 矩形选区按 Entity type 分组，Palette Entity 位于 Surface Entity 之前并以分隔线区分，
  提供批量字段、variant 与删除操作；
- Palette Brush 显示当前素材及其全部 `EditorEntityDefinition.variants`，选择 variant 会同步更新
  后续放置 preset；Canvas hover 显示正式放置规则计算出的结果堆叠，并标记非推荐的跨 slot 组合；
- Palette Delete 根据鼠标悬浮格显示完整 Entity stack，并明确标记点击时实际删除的非 Surface 层；
- Surface Brush / Smart Fill 显示当前 Terrain、Pattern 与预览单元。

删除目标与实际删除操作共用 `resolveDeletionTarget()`，Inspector 不另算一套视觉栈规则。
Inspector 始终显示选区中的完整 Entity 集合；单格按实际 `stackOrder` 从顶层向下排列。
多格对象显示 footprint、anchor 与当前命中的 Presence role。
Model 字段合同标记为 `color` 的字符串由 Inspector 显示为调色板与文本输入，可直接写十六进制颜色或常用颜色别名。
Bobby 的 `controller / mirrorX / mirrorY` 直接来自 Model 字段合同，因此在单格选择与 Palette Brush Inspector 中使用普通数字 enum / boolean 控件编辑。
Palette 素材提示显示 canonical type、Trait、Behavior 与支持的 Map fields；Surface 素材提示
显示实际持久化的 canonical type，具体 Variant 另外显示 visual ID 与在 Terrain 中的位置。
Delete 与 Palette Brush Inspector 订阅离散 Canvas cell hover；Palette Brush 的当前素材字段与
variant 数据保持稳定，hover 只更新紧凑的放置结果堆叠预览。

规则检测器按 Entity 与 Trait 判断当前可用的关卡完成条件。某项能力首次出现时，Editor 默认启用对应规则；能力持续存在期间，Inspector 中的手动关闭状态保持有效。导入另一张地图时重新开始检测。

`EditorEntityDefinition.defaultFields`、`EditorEntityVariant.fields`、`EditorPlacementPreset.fields`
与 `EditorPalettePreview.fields` 共用同一套类型专属字段形状。Egg 在 Editor 中固定使用 filled
visual 帮助识别，地图仍放置一个没有可切换 variant 的 canonical `egg` Entity。

## Multi-cell Object

Dragon、Sandman、Dream Machine、Beaver 等多格 Palette Object 在 JSON 中只保存 anchor。footprint 与 authoring variant 通过 Engine Object Layout 和 Editor policy 解析。Surface atlas 单元始终是单格 Entity，视觉拼图使用相同 semantic type 的不同 `ts-*` variant：

- 鼠标指向 body/tail 仍 resolve 到完整 owner；
- Del 删除完整 owner；
- Q/E 切换支持的 authoring variant；
- runtime occupancy 只在 Engine level-load 边界展开。

## Play Test

```text
EditorMap
  -> normalize / clone
  -> LevelMap
  -> Game.loadLevel()
```

Runtime 不反写 Draft。Stop 销毁临时 Game/Input 后恢复 Editor viewport。
Play Test 保留 Editor TopBar，BottomBar 切换为 Replay 录制与屏幕摇杆。Replay 面板复用
Explore 的正式录制、播放和导出控制，但不提供与当前 Draft 无关的内置过法入口。

## 编辑交互

地图内容与 hover、选区、放置预览使用独立画布。文档更新时重建地图预览；交互更新复用该空间视图，放置预览只实例化待放置对象，并查询叠加替换结果后的邻格。平移与缩放通过共同父层的 CSS transform 更新视口。

- Bottom Bar 的 Palette / Surface 在两种 authoring UX 之间即时切换；
- Tab：Palette / Surface 快速切换；
- Select：单选或矩形多选，不直接绘制；
- Brush：单格/连续绘制；点入已有 Selection 时整块填充；
- Surface：额外提供 Smart Fill；
- 右键：切换选择工具并选择当前格；
- Ctrl+A：全选地图；
- Palette：Q/E 切换可变 Entity；
- 滚轮：缩放地图；
- 中键拖动：平移；
- 两指手势：缩放 Editor viewport；
- Ctrl+Z、Y：Undo / Redo。

## Data Exchange

用户地图长期内容是 schema v1 语义 JSON。公共 Data Exchange 可以搬运同一内容：

```text
Plain JSON
BC5R1 compressed text
Share URL fragment
任意扩展名的文本文件
```

`BC5R1` 是 transport 版本，与 JSON `schemaVersion` 独立。
未知 Entity 及字段合同不匹配的 Entity 会保留在草稿中，并以无功能 X 占位符显示；Inspector 校验区给出 warning，地图其它部分仍可编辑和 Play Test。

## 原版验证

Editor JSON 与原版 JAR patch 围绕同一套 semantic `LevelMap`：

```text
Editor Draft -> Play Test -> Bobby Carrot 5 Remake Engine
            \-> Original DAT tooling -> patched JAR -> original Java ME Engine
```

原版 source provenance 与 Campaign topology 都由边界层持有，不进入 Editor Draft。
