# Original Adapter

Original Adapter 位于 `tools/original/`，负责在原版 DAT 地图表示与 Bobby Carrot 5
Remake 的 canonical `LevelMap` 之间转换。它是原版格式互操作边界，不属于 Engine、
Editor 或 Web 的运行时依赖。

## 数据路径

```text
DAT byte
  ↓ tools/original/dat/mapping.mjs
ts-<row>-<column>:<name>
  ↓ model/src/map/entity/original-tile-visuals.json
type / fields / role / phase
  ↓ tools/original/entity-adapter.mjs
canonical LevelMap
  ↓ tools/original/entity-reverse-adapter.mjs
decoded terrain / objects
  ↓ tools/original/dat/record.mjs
DAT level record
```

`mapping.mjs` 按行优先规则换算 DAT byte 与 `ts.png` 坐标。decoded 标签中的坐标是
无损身份，名称由 Original Tile Visual 目录生成并在编码时校验。DAT byte 只存在于
`@bobby/dat` 边界。

`original-tile-visuals.json` 按 Editor 的 `surface/palette` 分类维护 `ts.png` 全部
256 格及 `ta.png` 动画序列。该分类只决定 Editor 面板，不表示 DAT 的
`terrain/objects` 记录层。

## 特例规则的代码入口

原版 `terrain/objects` 与 canonical Entity 之间的特例以代码和就地注释为规范性说明：

- `tools/original/entity-adapter.mjs`：正向转换，包括整图推断、terrain 堆叠展开、
  object phase/part 合并和 multi-cell anchor 换算。
- `tools/original/entity-reverse-adapter.mjs`：JAR Patch 反向转换，包括每格 terrain
  选择、cover 优先级、base Visual 选择、object 写回和不可表达地图的拒绝条件。

修改特例时直接修改对应文件并补充相邻测试。人类审阅入口与检查重点见
[`human-focus.md`](../human-focus.md)。

## 原版记录结构

一条 DAT level record 包含两部分地图数据：

- `terrain`：按行优先顺序存储的网格，每个坐标恰好一个 terrain byte。
- `objects`：每项为 `type`、`x`、`y` 的紧凑对象表。

canonical `LevelMap` 可以在同一坐标保存多个 Entity。正向 Adapter 把原版压缩表示
展开为语义堆叠；反向 Adapter 只接受能够明确写回一层 terrain 与 objects 表的地图。

## 验证

- `tools/original/dat-tests/entity-adapter.test.mjs` 为两个 Adapter 的特例提供可执行示例。
- `npm run verify` 对全部官方 source record 执行 DAT 解码、Adapter、Patch round-trip
  与 atlas 标签检查。
- 需要确认原版 Java ME runtime 行为时，使用
  [`validate-original.md`](../workflows/validate-original.md) 的 JAR Patch 流程。
