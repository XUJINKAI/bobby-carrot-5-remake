# Original Adapter

Original Adapter 位于 `tools/original/`，负责在原版 DAT 的地图表示与Bobby Carrot 5 Remake 的语义 Entity Map 之间转换。它是原版格式互操作边界，不属于 Engine、Editor 或 Web 的运行时依赖。

## 对应关系的唯一归属

原版到 Engine 不是一张跨层大表，而是两个方向明确的合同边界：

1. `tools/original/dat/mapping.mjs` 是 DAT byte、`ts.png` 坐标、decoded
   细分语义和 decoded 审阅标签之间的唯一映射。decoded 标签固定为
   `ts-<row>-<column>:<semantic>`。
2. `tools/original/entity-correspondence.mjs` 是需要改名的双向
   variant/direction 对应关系的唯一数据表，正反 Adapter 共用。
3. `tools/original/entity-adapter.mjs` 是 decoded 原版语义展开为 canonical
   `LevelMap` Entity 的唯一正向边界。
4. `tools/original/entity-reverse-adapter.mjs` 只服务 JAR patch，并由 DAT
   byte-for-byte round-trip 测试约束为正向边界的逆变换。

`model/src/map/entity/ts-visuals.json` 按 Surface 家族与独立 visual 分组维护
`ts.png` 全部 256 格的名称；`model/src/map/entity/surface.ts` 从该表生成产品语义
Surface 映射。Engine Definition 维护 canonical Entity 的行为，并通过命名表查找
Visual。它们不读取 DAT byte，也不建立第二份 DAT 对应表。

新增或修正原版对应关系时，先修改 `dat/mapping.mjs` 的原版事实，再修改唯一
Adapter 边界，并补充正向转换与 DAT round-trip 测试。`npm run verify` 会重新生成
全部 decoded 地图并校验其 atlas-first 标签。

## 原版记录结构

一条 DAT level record 包含固定尺寸的两部分地图数据：

- `terrain`：按行优先顺序存储的网格；每个坐标恰好一个 terrain byte。
- `objects`：每项为 `type`、`x`、`y` 的紧凑对象表。

对 `original/decoded` 的检查表明，对象表中每个坐标最多出现一项 object。
这是原版数据的事实，而非限制，测试表明一格坐标可以容纳多个 object。

语义 Entity Map 可以在同一坐标保存 surface、content 与 cover 等多个 Entity。
Adapter 因而必须将原版的单层编码展开为完整的语义堆叠；反向转换则只接受能够无歧义编码回一层 terrain 与至多一项 object 的地图。

## terrain 的语义展开

大多数原版 terrain 按 decoded 标签的语义部分转换为对应 Entity。编码把多种含义合并到一个
terrain byte 时，Adapter 按下列规则展开：

- `snow` 展开为带明确 atlas variant 的 `grass` 与 `snow`。
- `high-grass` 展开为割草后应留下的 ground，以及 `high-grass` cover。
- `high-grass-objective` 使用相同 ground 和 cover，并按下节规则补出隐藏主目标。
- 含方向、开关状态、颜色方块状态或变体的 terrain byte，转换为一个 canonical
  Entity 及其 Definition 声明的顶层字段。

这些展开结果使 Engine 只处理语义 Entity，不依赖 DAT byte 或原版的 terrain /
object 分层方式。

## `high-grass-objective` 的隐藏目标

`high-grass-objective` 是 terrain 层的特殊编码，表示高草格具有隐藏主目标语义。
原版 object 表不能在同一个坐标再表达第二个对象，因此 Adapter 在读取整张地图后
materialize 该格缺失的内容 Entity：

1. 如果该格有显式的非空 object，转换该 object，不额外生成隐藏目标。
2. 如果该格没有显式 object，且地图任意位置有显式 `carrot`，生成 `carrot`。
3. 如果该格没有显式 object，且地图没有显式 `carrot`，生成 `egg-nest`。

因此，隐藏目标的类型由该地图的目标模式决定，并非只由单个
`high-grass-objective` terrain byte 决定。转换后的同格顺序为：ground、隐藏目标
（如需要）、high grass cover；显式 object 在 terrain 展开后加入 Entity Map。

## 反向编码约束

`reverseEntityMap()` 为原版 JAR patch 使用。它从每格 Entity 中选择一个可编码的
terrain；`snow`、`high-grass` 与 `high-grass-objective` 是覆盖 terrain，优先作为
该格的 terrain byte。不能同时选择多个可编码覆盖 terrain。

每个可编码 content Entity 生成一项 DAT object。由于原版数据结构只能在一个坐标
表达一项 object，待 patch 的 Entity Map 必须保持这一限制；无法表示的同格 content
组合应在编码时被拒绝，而不是任意丢弃其中一项。

## 验证

- `tools/original/dat-tests/entity-adapter.test.mjs` 覆盖隐藏目标 materialize、
  terrain 展开及特殊对象的 canonical 转换。
- `npm run verify` 对官方 source record 执行 DAT 解码、Adapter 和 round-trip
  检查。
- 行为仍需以原版 Java ME runtime 确认为准时，使用
  [`validate-original.md`](../../workflows/validate-original.md) 的 patch 流程。
