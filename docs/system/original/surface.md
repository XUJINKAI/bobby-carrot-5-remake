# Original Tile Visual 目录

原版 `ts.png` 与 `ta.png` 的可执行语义目录位于
`model/src/map/entity/original-tile-visuals.json`。该文件完整覆盖 `ts.png` 的 256 个
单元，并保存由 Engine、Editor 与 Original Adapter 共用的类型、selector、部件、
阶段和动画帧序列。

## Editor 分类

顶层 `surface` 与 `palette` 是 Editor 的二分面板分类：

- `surface` 中的条目作为单格地貌编辑；视觉拼图仍由多个单格 Entity 组成。
- `palette` 中的条目作为可放置 Entity；multi-cell Entity 只保存 anchor，部件由
  Engine footprint 展开。

Editor 可以维护面板内的主题、排列与 Auto 选图策略，但 Entity 是否属于 Surface
或 Palette、可用 selector 及其 atlas 单元均从目录读取。

## 条目结构

每个条目以 `type` 为 `LevelEntity.type`，并且必须使用一种基础形状：

- `base`：单一静态单元；
- `coordinateVariants`：仅以 `ts-<row>-<column>` 区分的 Surface 形态；
- `variants`：由 `fields` 唯一选择的语义形态；
- `parts`：由 footprint `role` 选择的多格部件。

条目还可附加：

- `phases`：同一 Entity 的运行时或表现阶段；
- `animations`：有序帧序列，可指向 `ts` 或 `ta` atlas；variant 也可拥有自己的动画。

Engine 使用 `type + fields + role + phase` 查询静态单元，使用
`type + fields + role + animation id` 查询动画。动画触发、节拍、随机门控和 gameplay
状态属于 Engine。

## 特殊 terrain 记录

少量原版 DAT 记录把 Palette 图块写在 terrain 层。Adapter 将这类记录保存为
`original-tile`，其 `variant` 仍由目录中的 `ts.png` 坐标产生。该类型只用于无损表达
原版记录，不进入 Editor 的 Surface 或 Palette 面板。

目录加载时会验证 schema、selector 唯一性、atlas 边界、动画 selector，以及
`ts.png` 和 `ta.png` 每个单元恰好登记一次。Model 还会验证目录中的 `type` 与
`fields` 符合对应的 `LevelEntity` 合同。
