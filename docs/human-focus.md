# 人类审阅重点

自动验证可以检查格式、覆盖率、往返一致性和依赖边界；类型名称是否准确、多个原版
表示是否应合并、空间 anchor 是否合理，以及转换后是否保留玩法语义，需要人类判断。

## 首要审阅文件

| 文件 | 人类需要确认的内容 |
| --- | --- |
| [`model/src/map/entity/original-tile-visuals.json`](../model/src/map/entity/original-tile-visuals.json) | `ts.png` 单元与 `type / fields / role / phase` 的语义是否准确；`ta.png` 帧是否属于正确动画；`surface/palette` 是否适合 Editor 操作。 |
| [`tools/original/entity-adapter.mjs`](../tools/original/entity-adapter.mjs) | 原版 `terrain/objects` 转为 canonical Entity 时的整图推断、堆叠展开、阶段合并与 anchor 换算是否正确。文件中的代码与就地注释是正向特例的规范性说明。 |
| [`tools/original/entity-reverse-adapter.mjs`](../tools/original/entity-reverse-adapter.mjs) | canonical Entity 写回原版 DAT 时的 terrain 选择、cover 优先级、静态 Visual 选择、object/anchor 写回与拒绝条件是否正确。文件中的代码与就地注释是 Patch 特例的规范性说明。 |

审阅 Original Adapter 改动时，应连贯阅读这三个文件：目录定义原版视觉表达，正向
Adapter 定义进入 `LevelMap` 的语义，反向 Adapter 定义 Patch 能表达的范围。

## 语义合同文件

以下文件决定上述转换结果能否成为稳定的地图内容：

- [`model/src/map/entity/ids.ts`](../model/src/map/entity/ids.ts)：稳定的
  `LevelEntity.type` 词汇。
- [`model/src/map/entity/catalog.ts`](../model/src/map/entity/catalog.ts)：类型专属字段、
  默认值与必填约束。
- [`model/src/map/entity/contract.ts`](../model/src/map/entity/contract.ts)：
  `EntityMapDefinition` 字段合同。
- [`model/src/map/rules.ts`](../model/src/map/rules.ts)：地图完成条件等声明式规则。
- [`docs/contracts/level-format.md`](contracts/level-format.md)：canonical Map v1 的跨模块合同。

修改类型或字段时，需要确认 Visual selector、Adapter 输出、Engine Definition 与
Editor Inspector 使用的是同一份语义；类型检查只负责验证结构合同。

## Engine 玩法文件

原版机关的地图内行为位于
[`engine/src/entities/original/`](../engine/src/entities/original/)。审阅某个机关时，重点
查看该类型的 Entity module、Behavior、Visual selector 与 footprint；确认代码消费的
字段和 `original-tile-visuals.json`、Model Definition、Adapter 输出一致。

原版事实与推断依据位于 [`docs/reference/`](reference/)。当代码行为依赖尚未确认的
观察时，应检查文档是否明确标注确认程度，并使用
[`workflows/validate-original.md`](workflows/validate-original.md) 的 JAR Patch 流程复核。

## DAT 格式与自动验证

- [`tools/original/dat/mapping.mjs`](../tools/original/dat/mapping.mjs)：DAT byte 与 TS
  坐标的行优先换算、decoded 标签校验和 objects 图块区边界。
- [`tools/original/dat/record.mjs`](../tools/original/dat/record.mjs)：level record 的字节布局
  与 `dynamic_slots` 派生。
- [`tools/original/dat-tests/entity-adapter.test.mjs`](../tools/original/dat-tests/entity-adapter.test.mjs)：
  两个 Adapter 特例的可执行审阅样例。
- [`tools/pipeline/verify.mjs`](../tools/pipeline/verify.mjs)：仓库强制门禁的编排入口。

`assets/extracted/`、`assets/generated/`、`dist/` 与 `tmp/` 是生成结果。人类审阅应回到
上述源文件判断含义，并用 `npm run verify` 确认生成链路一致。
