# Entity Fact 与通行规则整理计划

状态：待实施。本文是对当前 Engine 的改造方案；原版事实以 [UP9 通行与碰撞规则](../reference/original-passage.md) 为准，当前运行合同仍以 [Engine 机制合同](../contracts/engine-mechanisms.md) 为准。

## 目标

- 移除 `EntityDefinition.layer` 及其 Presence、Debug、公开类型投影。
- Fact 描述对象或部位当前可共享的语义；Entity 组合这些事实、通用 Mechanism 和专属规则，恢复原版碰撞条件。
- 原版的具体对象名单、方向表、操作时机由所属 Entity 规则管理；World 保持时间、空间、裁决、事务与快照职责。
- `LevelMap` 继续持久化语义 Entity。视觉 `layers`、`renderPass`、`stackOrder`、footprint `role`、Editor `stackSlot` 各自保留现有职责。

## 当前问题与影响面

| 当前实现 | 需要解决的问题 |
| --- | --- |
| Plank、覆盖物用 `presence.layer === "surface" && walkable` 判断 Mower 支撑 | 同一通行结果同时依赖 layer 和 Fact；原版还要求先执行 terrain 特判 |
| Bean 用 `bean-growth-space` 加 `layer === "surface"` 过滤同格对象 | 原版条件是特定 terrain 域与 object grid 空，不等于所有现代 Presence 都必须为空 |
| Cloud / Leaf 的 `movingSupportOccupiedAt` 拒绝多数域外 Presence | 原版静态阻挡是有限名单，需要与动态实体碰撞分开 |
| Fireball 以任一 Presence 的 `walkable / water / cloud-space` 确定 terrain 通行 | Plank、豆茎等提供的步行能力可能被当成火球传播所需的地形条件 |
| `water-overlay` 只处理水面与 `terrain-overlay` 的组合 | 原版 Plank / Bean 的覆盖发生在全部 terrain 特判之后，范围大于水面 |
| `egg-nest / filled-egg` 同时出现在 Engine、Editor、HUD、Original 目标生成和地图合同 | 属于跨模块选择器变更，需要明确迁移；不能只修改注册表 |
| `ride-carried` 只由 Mower 声明、Bobby 的 mount relation 分支消费 | 现有关系与专属 Behavior 已能表达，不必为唯一对象维护公共标签 |
| `surface-facts.ts` 将 atlas 坐标线性化后判断区间 | 原版范围证据与运行语义混合；后续按语义 type / fields / role / phase 定义，坐标换算留在 Original DAT 边界 |

检查入口：`engine/src/entities/original/{plank,bean-field,moving-entities,fireball,surface-facts}.ts`、`engine/src/entities/behaviorLibrary.ts`、`engine/src/entities/player/bobby.ts`、`engine/src/mechanism/entity/WaterOverlayBehavior.ts`。

## 抽象准则

一个 Fact 应能独立解释“对象当前是什么或具备什么能力”，并说明生产方、消费方及状态变化。不把“某个指定对象能通过这里”的最终结论存为通用事实。

采用三种表达：

1. **共享事实**：如 `water`、`sky`、`walkable`、`blocking`、`climbable`、`filled`。状态变化由所属 Entity 投影；多格对象按当前 Presence 读取。
2. **对象私有状态与关系**：如 Mower 驾驶关系、Mirror 方向、Cloud 颜色、Leaf 启动状态。由所属规则读取，仍经 World mutation 提交。
3. **明确的语义特例表**：如 Cloud / Leaf 的有限静态阻挡名单、Bean 可生长地形集合、Fireball 对 Dragon head/body 的阻挡。表使用 semantic type、实例字段、role 和 gameplay state，放在 `entities/original/` 的对应领域模块。

是否提升为通用 Mechanism，取决于它能否只消费 Fact 与通用协议，以及是否已有不同对象的复用证据。原版多个名单恰好交叉，不足以证明存在共同材质或物理定律。

### 建议的 Fact 处置

以下是实施起点；新增 ID 在完成组合真值表后定稿。

| 当前 Fact | 建议 | 语义和消费方式 |
| --- | --- | --- |
| `cloud-space` | 改为 `sky` | 表示天空域；Cloud 和 Fireball 各自决定如何经过，风向条件留在规则中 |
| `bean-growth-space` | 从通用注册表移除 | Bean 规则查询明确的语义地形集合，并独立判断会占据其生长位置的对象；原版区间包含树桩、雪等，不命名为空地、空气或可种植土壤 |
| `egg-nest` | 建议改为 `fill-target` | 表示参与填充目标的部位，与具体 Egg 身份独立 |
| `filled-egg` | 建议改为 `filled` | 表示该部位当前已填充，由 state 派生；原版目标生成使用 `fill-target / filled`，指定某种对象时仍可用 Type selector |
| `ride-carried` | 移除 | Bobby / Mower 的明确关系生成 companion 提案；通用 World 只处理参与者与移动事务 |
| `terrain-overlay` | 用支撑语义与通行组合替代 | `walkable` 表示可落脚能力；哪些地形拒绝可被额外支撑满足、哪些独立障碍仍阻挡，由 passage 提案组合表达 |
| `walkable / blocking` | 保留并明确作用域 | 供标准步行通行消费；Fireball、Cloud、Leaf 不直接照搬步行的最终结果 |
| `water` | 保留 | 水域语义；Tide / Waterfall 方向规则由对应对象执行 |
| `climbable` | 保留 | 部位可攀爬，人物呈现可读取同一事实；不自动赋予跨越底层地形的能力 |
| `moving-platform` | 保留并核对定义 | 可承载 Actor 的移动支撑；具体是否停止、能否登上、如何启动由对象行为判断 |
| `player / pushable / collectible / reach-all-players` | 审计后保留各自必要语义 | 分别服务 Actor 生命周期、推、收集选择器和多人目标；Fact 的成立不安装 Behavior |
| `meltable` | 按消费方清理 | 当前 Fireball 按 Ice Block Type 处理，尚无消费此 Fact 的通用融化规则；优先删除闲置声明 |
| `hidden-objective` | 连同消费点审计 | 当前收集行为查询它，但未找到生产方；由真实的遮蔽/揭露规则决定是否保留共享事实，不能只改名 |

`fill-target / filled` 的通用性用一个不同于 Egg 的最小目标对象验证，包括空与已填充状态、同格匹配、多部位与恢复。`sky` 的共享性以 Cloud 和 Fireball 的不同消费规则验证。

## 通行组合的设计重点

### 支撑条件与独立障碍

需要分别表达“是否具备落脚条件”和“是否被其它对象拒绝”。例如水上有木板时普通 Bobby 可落脚；在现代多实体地图中，再叠加一个独立阻挡对象，不能因木板存在就放行该障碍。

原版 Plank / Bean 可覆盖 terrain 特判的拒绝，而底层 terrain 已允许时 Mower 可以经过它们。实施时先为下列输入建立真值表，再确定最小 passage 协议：

- 固定地面提供的支撑与木板、豆茎、平台提供的附加支撑。
- 地形自身的方向、高草、色块等进入条件。
- 当前 Actor 是否接受某种支撑，Mower 是否已满足固定地面的通行条件。
- 同格其它 Presence 的独立进入条件。

若现有 `canEnter` 布尔提案不足，以通用的支撑需求/贡献与拒绝范围扩展 passage 协议。World 只汇总规范化提案；不得让 World 根据 Plank、Mower、DAT 层或图集范围分类。也不以 `surface / object / cover` 三个互斥 Fact 重建同一层枚举。

### 地形域与现代叠放

Fireball 的传播域独立于步行支撑。Bean 生长域也不是 `!walkable`：地图缺少地面、对象提供临时支撑、同格有动态载体等情况都需要单独定义。

原版 terrain 与 object 各只有一个值；现代地图可有多个 Presence。先列出 Original Adapter 实际产生的语义组合，包括 Snow、高草与隐藏目标的展开，再为额外叠放建立确定性规则。共享的地面/支撑事实只有在具备独立含义和真实消费方时才进入注册表；保留在 Bean 或 Fireball 内的语义范围表无需为了减少表数量强行升格。

Cloud / Leaf 共用一份所属领域的静态碰撞表，方向与停车分别处理；动态实体之间的碰撞交给已有 WorldMotion 与移动事务协议。原版同向放行、3px / 6px 子步差异与现代预留合同需要列为独立的 Fidelity 对照项，不能通过增加 Fact 偷换运动协议。

## 实施阶段与提交边界

1. **事实与基线。** 已有 `original-passage.md` 保存原版表。实现开始时记录当前分支 HEAD、检查工作区，建立原版表 → 语义 Entity 输入 → 预期结果 → 现有测试的矩阵。标出明确产品差异与尚未实现的原版条件。
2. **Fact 与 passage 合同。** 完成上述真值表，确定最小 Fact 集和支撑提案结构，补充通用目标样例及独立障碍叠放回归。落实 `fill-target / filled` 的跨模块迁移方案，更新对应合同。
3. **支撑通行与 layer 移除。** 迁移 Plank、Mower、Beanstalk 和水面组合，删除 Definition、Presence、Inspector、Debug、preview、公开导出及测试中的语义 `layer`。保留视觉与 Editor 结构各自职责。
4. **特殊传播与生长。** 迁移 Bean 地形集合和占用规则、Cloud / Leaf 静态阻挡表和方向条件、Fireball 域与特判；同步清理 `surface-facts.ts` 的坐标序号判定。原版语义重建文件补上事实文档已指出的遗漏，复杂规则用链接引用事实表。
5. **语义词汇与跨模块收尾。** 完成目标选择器、HUD、Editor、Original 目标生成、测试与示例的同步；清理 `ride-carried`、闲置 Fact 和失效查询；将可机械验证的约束加入正式 verify。

阶段 2～5 按实际依赖可合并为更小数量的完整提交，每次提交必须可独立验证和回滚。实现阶段在提交前运行完整 `npm run verify`；含本机 Chromium 的验证直接在沙箱外执行。

## 回归与验收

- 按事实文档第 10 节覆盖范围边界、阶段变化、Actor 状态与方向组合；已有的产品 Fidelity 差异单独说明。
- 验证相同 `walkable` 不会使 Fireball 获得木板支撑带来的传播能力；水上支撑允许步行时，独立对象障碍仍有效。
- 验证 Mower 在允许 terrain 上经过木板/豆茎，在拒绝 terrain 上失败；Bean Base 与 Tip / Middle 不同。
- 验证 Bean 查询真实语义地形和占用对象，动态 Cloud / Leaf 的存在不会被当成原版 object grid 非空。
- 验证 Cloud / Leaf 对静态阻挡名单外对象的处理、水流回退、同色 Parking，以及世界移动预留和携带关系。
- 验证 `fill-target / filled` 的动态投影、Editor 自动规则、HUD 统计、Original 生成和地图导入。
- 状态修改、spawn、destroy、运动、Undo、Restart、Snapshot restore、Replay 后，Fact 查询与运行结果一致。
- 最小测试地图在 Editor Play Test 使用正式 Engine，Runtime 保持 Draft 原样；原版证据不足时再 patch 只读原始 JAR 的副本。
- 门禁按真实类型/字段使用点检查 layer 与已移除 Fact，防止误报视觉 `layers`、局部绘图变量和 Editor 分类。

## 兼容性与范围

`EntityDefinition.layer`、`EntityLayer` 和 Debug 对应字段的删除属于 Engine 对外类型变化。地图 JSON 本身没有该字段，不为它增加兼容运行路径。

`egg-nest / filled-egg` 已出现在 `LevelMap.rules.win` 示例与 Editor/Original 默认输出，属于已存在的数据合同。后续实现必须列出到新选择器的明确转换，检查仓库维护地图、用户 Draft、分享地图和内含地图的 Replay 的影响。优先在明确的数据迁移边界转换历史表达；运行中的 Fact 注册表只维护目标词汇。格式是否需要版本迁移由实际存储合同决定，不能仅靠注册旧 Fact 别名掩盖变化。

本计划的 Engine 改造尚未执行。本轮事实文档提交只增加研究结果与导航，不改变地图、运行状态或公共 API。
