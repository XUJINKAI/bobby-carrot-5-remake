# Original Tile Visual 目录边界

`model/src/map/entity/original-tile-visuals.json` 是原版 tile atlas 语义映射的单一可信源。
目录使用 `schemaVersion: 1`，完整覆盖 `ts.png` 与 `ta.png`，并由 Model 在加载时严格
校验。

该目录不是 Entity 身份或字段合同的定义源。canonical type 与允许持久化的字段由
Model `EntityMapDefinition` 声明；目录中的 `type / fields` 必须引用并通过该合同校验。
`role / phase / animations` 只描述视觉 selector，不生成新的 Entity type。Bobby、Portal、
Push Goal 等没有原版 tile atlas 单元的 Entity 也由同一套 Model Definition 管理。

目录中的 `type` 对应 `LevelEntity.type`。静态单元通过 `base`、
`coordinateVariants`、`variants` 或 `parts` 表达；运行时表现通过 `phases` 与
`animations` 表达。调用方使用结构化 selector 查询，不建立平级 visual ID 表。

职责分配如下：

- Model 解析目录、验证 selector，并生成 Surface 与 `LevelEntity` 合同关联。
- Engine 读取静态单元与动画序列，持有触发、时序、门控和 runtime state。
- Editor 读取 `surface/palette` 分类、可放置类型与 variant，另外维护 UI 排列与
  Surface Auto 策略。
- `tools/original/dat/` 从 byte 计算 atlas 坐标，并通过目录取得名称和 canonical selector；
  DAT byte 与 archive identity 留在格式边界。
- 文档说明结构、行为与边界，具体坐标和帧序列直接引用可执行目录。

Bobby 的 `b0.png`～`b3.png` 是角色 sprite sheet。角色方向、移动帧和状态机由 Bobby
Visual 代码管理，不进入 tile atlas 目录。
