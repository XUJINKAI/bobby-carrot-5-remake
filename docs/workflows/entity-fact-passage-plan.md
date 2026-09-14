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

1. **共享事实**：如 `ground`、`water`、`sky`、`walkable`、`blocking`、`climbable`。状态变化由所属 Entity 投影；多格对象按当前 Presence 读取。
2. **对象私有状态与关系**：如 `egg.state.filled`、`color-block.state.raised`、Mower 驾驶关系、Mirror 方向、Cloud 颜色、Leaf 启动状态。由所属规则读取，仍经 World mutation 提交。
3. **明确的语义特例表**：如 Cloud / Leaf 的有限静态阻挡名单、Bean 可生长地形集合、Fireball 对 Dragon head/body 的阻挡。表使用 semantic type、实例字段、role 和 gameplay state，放在 `entities/original/` 的对应领域模块。

是否提升为通用 Mechanism，取决于它能否只消费 Fact 与通用协议，以及是否已有不同对象的复用证据。原版多个名单恰好交叉，不足以证明存在共同材质或物理定律。

### 建议的 Fact 处置

以下是计划采用的词汇与职责。`ground` 表示存在固定地面介质，不表示当前 Actor 必然能走；它与 `water / sky` 描述环境，`walkable` 描述步行支撑能力。三者与视觉层序、Editor 放置 slot 独立。

| 当前 Fact | 建议 | 语义和消费方式 |
| --- | --- | --- |
| `cloud-space` | 改为 `sky` | 表示天空域；Cloud 和 Fireball 各自决定如何经过，风向条件留在规则中 |
| `bean-growth-space` | 从通用注册表移除 | Bean 规则查询明确的语义地形集合，并独立判断会占据其生长位置的对象；原版区间包含树桩、雪等，不命名为空地、空气或可种植土壤 |
| `egg-nest` | 移除 | 用 `egg` Type 选择目标对象 |
| `filled-egg` | 移除 | Egg 自己读取 `state.filled`，分别回答通行与目标完成查询 |
| `ride-carried` | 移除 | Bobby / Mower 的明确关系生成 companion 提案；通用 World 只处理参与者与移动事务 |
| `terrain-overlay` | 用支撑语义与通行组合替代 | `walkable` 表示可落脚能力；哪些地形拒绝可被额外支撑满足、哪些独立障碍仍阻挡，由 passage 提案组合表达 |
| `walkable / blocking` | 保留并明确作用域 | 供标准步行通行消费；Fireball、Cloud、Leaf 不直接照搬步行的最终结果 |
| `water` | 保留 | 水域语义；Tide / Waterfall 方向规则由对应对象执行 |
| `climbable` | 保留 | 部位可攀爬，人物呈现可读取同一事实；不自动赋予跨越底层地形的能力 |
| `moving-platform` | 保留并核对定义 | 可承载 Actor 的移动支撑；具体是否停止、能否登上、如何启动由对象行为判断 |
| `player / pushable / collectible / reach-all-players` | 审计后保留各自必要语义 | 分别服务 Actor 生命周期、推、收集选择器和多人目标；Fact 的成立不安装 Behavior |
| `meltable` | 移除 | 当前 Fireball 按 Ice Block Type 处理，融化请求交给 Ice Block 的领域入口 |
| `hidden-objective` | 移除失效查询及声明 | Carrot / Egg 与 High Grass 的遮蔽关系由原版对象行为查询；这些行为同属 Entity 层 |
| 新增 `ground` | 固定地面介质 | 为固定支撑筛选与 Fireball 传播域提供依据；高草、Mirror、色块存在地面介质，其通行仍取决于自身状态和 Actor |

`sky` 的共享性以 Cloud 和 Fireball 的不同消费规则验证。Egg 的填充状态与 Color Block 的升起状态都由所属对象解释；跨系统共享的是查询协议和结果，不是私有字段的同名 Fact。

## Egg 的具体改造

### 状态、通行、目标分别在哪里

将 Egg 定义、填充行为、目标查询和视觉解析集中到 `engine/src/entities/original/egg.ts`，从 `static-catalog.ts` 按领域抽出。

| 职责 | 实施方式 |
| --- | --- |
| 持久化初值与 runtime state | 继续使用 `filled` 字段；运行中以 `egg.state.filled === true` 为唯一填充状态 |
| 填充时机 | 普通 Bobby 离开时经 World 命令设置同一 Egg 的 state，保留 Entity ID；Mower 不触发填充 |
| 通行 | 与 Color Block 相同，声明需检查的 `blocking` 能力，由 `canEnter` 读取自身 state 返回是否允许 |
| 视觉 | Egg Visual 直接读取 state 选择空 / 已填画面 |
| 目标完成 | Egg 提供只读 `isSatisfied` 查询，返回 `state.filled === true` |
| HUD | 使用 World 返回的目标 remaining，不自行扫描 Egg state |

同一 Egg state 改变后，通行、目标与视觉读取同一权威状态。Snapshot / Undo 直接恢复它；不增加单独保存的完成计数或填充投影。

### 目标协议

Model 增加一种对象目标聚合条件：

```json
{ "type": "satisfy-all", "target": "egg" }
```

`fill-all { target, filler }` 继续表达目标格被其它对象占据，例如 Push Goal 和箱子。`satisfy-all` 则按 Entity ID 聚合对象自身的完成结果。

Engine 在 Behavior 协议中增加只读查询：

```ts
interface ObjectiveContext {
  readonly entity: Readonly<EntityInstance>;
  readonly query: WorldQueryApi;
}

interface Behavior {
  isSatisfied?(context: ObjectiveContext): boolean;
}
```

Egg 的实现只有 `return entity.state.filled === true`。查询不接收 commands，不改变 state，不触发移动 hook。新增 `world/outcome/ObjectiveResolver.ts`，按有效 Behavior 组合调用该查询，结构参照 `ReachResolver`。

聚合合同明确为：

- target 使用现有带类型 Selector 解析路径，按 Entity ID 去重；多部位或多个 Egg 同格都按对象计算。
- 每个目标的有效 Behavior 组合最多包含一个 `isSatisfied` 实现，重复定义在注册校验时报错。
- `remaining` 为当前未满足目标数；目标数大于零且 remaining 为零时完成。
- 匹配对象缺少查询实现时，在可游玩性检查中报告不支持；runtime 视为未满足，不能默认完成。
- 聚合器读取当前已提交状态，整笔 mutation 提交完成后再计算；保持既有等待运动结束才完成关卡的规则。
- 查询结果按需计算，不进入 Fact Registry、Selector Index 或 Snapshot。

这使 World 只知道“查询目标、计数、聚合”，Egg 知道如何解释 filled。其它对象只有在实际需要成为自身状态目标时才实现该查询。

### 同步修改位置

- `model/src/map/rules.ts`、`parser.ts` 及对应 schema 生成：增加 `satisfy-all` 形状，Model 不读取 runtime state。
- `engine/src/world/WorldRuleEvaluator.ts`、`WorldTypes.ts`：增加聚合分支和公开目标状态；注入 ObjectiveResolver。
- Engine 的 `validateLevelPlayability`：复用同一目标查询能力检查。
- `editor/src/authoring/rules.ts`：以 Egg Type 检测目标，生成 `satisfy-all`。
- `tools/original/win-condition.mjs`：生成对应官方地图规则。
- `engine/src/ui/GameplayHudModel.ts`：从 Egg 的 `satisfy-all` 条件读取 remaining。
- 地图合同、默认规则、测试、分享/存档迁移调用点一起修改。

## 通行组合的设计重点

### 支撑条件与独立障碍

需要分别表达“是否具备落脚条件”和“是否被其它对象拒绝”。例如水上有木板时普通 Bobby 可落脚；在现代多实体地图中，再叠加一个独立阻挡对象，不能因木板存在就放行该障碍。

原版 Plank / Bean 可覆盖 terrain 特判的拒绝，而底层 terrain 已允许时 Mower 可以经过它们。实施时先为下列输入建立真值表，再确定最小 passage 协议：

- 固定地面提供的支撑与木板、豆茎、平台提供的附加支撑。
- 地形自身的方向、高草、色块等进入条件。
- 当前 Actor 是否接受某种支撑，Mower 是否已满足固定地面的通行条件。
- 同格其它 Presence 的独立进入条件。

采用下面的支撑查询；World 只汇总规范化提案，具体 Entity 生成它。World 不根据 Plank、Mower、DAT 层或图集范围分类。

### 支撑查询与确定性合并

新增无 commands 的 `resolveSupport` hook。它读取 Actor、方向和同格 Presence，返回本 Presence 是否提供支撑，以及需要排除的具体支撑候选引用：

```ts
interface SupportResolution {
  readonly available?: boolean;
  readonly excludes?: readonly PresenceRef[];
}
```

`PresenceRef` 使用实体 ID 与 footprint 部位的稳定身份，不使用 stackOrder 作为身份。默认候选来自 `walkable`；`available` 可根据 Actor 和对象状态覆盖默认值。任一所属 hook 明确返回 false 时，本 Presence 不提供支撑。全部候选生成后统一应用 excludes；排除只对本目标格候选有效，不会取消其它 Presence 的进入拒绝，也不改变事件投递。

| Entity | 支撑查询 | 进入/离开特判 |
| --- | --- | --- |
| 普通固定地面 | `ground + walkable` 提供候选 | 默认 |
| 水、天空 | `water / sky` 自身不提供步行候选 | 通过同格其它支撑决定落脚 |
| Plank、Bean Tip / Middle | 非驾驶 Bobby 提供自身候选；Mower 不从它们取得支撑 | terrain 已有有效支撑时，不额外阻挡 Mower |
| Bean Base | 不提供额外候选 | 可攀爬依赖已有支撑 |
| High Grass | 排除其它 `ground` 支撑候选；只向 Mower 提供自身支撑 | Mower 成功移动后割草；隐藏目标互动按覆盖关系执行 |
| Color Block | 排除其它 `ground` 支撑；降下时提供自身支撑 | raised 在 Color Block 规则中解释；附加 Plank 支撑仍可满足原版覆盖 |
| Mirror / Carousel | 排除其它 `ground` 支撑；按 Actor 与进入方向提供自身支撑 | Carousel 来源离开限制独立执行 |
| Snow | 排除其它 `ground` 支撑，自身不提供支撑 | 铲雪请求、原版覆盖下的副作用时机按事实表验证 |
| 普通独立障碍 | 不提供支撑 | 保持 `blocking / canEnter` 裁决 |

处理地形的 Entity 可以在拒绝自身支撑时允许独立进入检查继续；最终是否落脚由全部支撑提案确定。这样 Plank 的候选能满足地形拒绝，独立 Ice Block / Egg 等对象仍由自己的进入分支拒绝。

来源 `canLeave`、Push、`resolveEntry` 命令、目标 `canEnter` 和最后事务提交仍按明确阶段执行。把现有 `hasWalkable` 的早期布尔判断改为正式支撑求值；会清除障碍的 `clear-and-pass` 提案必须与移动在同一事务中校验，不能先删对象再重试。主 Actor 与 companion 占用校验复用相同的只读支撑/通行判断，避免 `canOccupy` 只看静态 blocking 而漏读 Egg、Color Block 的状态。

多实体自定义地图中的额外叠放以这些候选与独立拒绝共同裁决。停止对齐的移动载体优先搭乘属于 Bobby 的专属策略；使用通用 proposal / lifecycle 表达命中的目标范围，保持来源离开约束和 World 的预留裁决。

### 地形域与现代叠放

Fireball 的传播域独立于步行支撑。Bean 生长域也不是 `!walkable`：地图缺少地面、对象提供临时支撑、同格有动态载体等情况都需要单独定义。

原版 terrain 与 object 各只有一个值；现代地图可有多个 Presence。先列出 Original Adapter 实际产生的语义组合，包括 Snow、高草与隐藏目标的展开，再为额外叠放建立确定性规则。共享的地面/支撑事实只有在具备独立含义和真实消费方时才进入注册表；保留在 Bean 或 Fireball 内的语义范围表无需为了减少表数量强行升格。

Cloud / Leaf 共用一份所属领域的静态碰撞表，方向与停车分别处理；动态实体之间的碰撞交给已有 WorldMotion 与移动事务协议。原版同向放行、3px / 6px 子步差异与现代预留合同需要列为独立的 Fidelity 对照项，不能通过增加 Fact 偷换运动协议。

### 六类对象的落地文件与规则

| 模块 | 具体修改 |
| --- | --- |
| `original/terrain-semantics.ts` | 按 semantic type 和必要实例字段产出 ground / water / sky / walkable；混合 variant 明确逐项声明；移除坐标线性化范围判断 |
| `original/plank.ts`、Beanstalk 定义 | 组合支撑查询、Mower 条件、climbable 与自身离开行为 |
| `original/mower.ts`、`player/bobby.ts` | mountId 与 Mower Type 决定 companion；固定支撑走统一支撑求值，碎石与 Speed 条件留在专属规则 |
| `original/bean-passage.ts` | `canGrowInto(query, cell)` 分别检查明确语义地形集合和阻止生长的持久对象；单独处理 Snow、纯地面与动态载体 |
| `original/moving-support-passage.ts` | Cloud / Leaf 共享木板、Ice 阶段、碎石、Fence 静态表；Cloud 查询 sky，Leaf 查询 water，再执行风向/潮流条件 |
| `original/fireball-passage.ts` | 查询固定地形传播域 ground / water / sky；Dragon 按 role、色块按 raised、碎石按 Type 判断；Mirror 入射表与 Ice 融化入口独立 |
| `original/egg.ts` | state 的初始化、离开填充、通行、目标查询和视觉集中维护 |

上表新增文件按职责抽取，已有规则从原文件迁入后由原 Entity 模块调用。`world/` 与 `mechanism/` 不导入这些具体对象表。

有 Snow 或其它基础地形替换物的现代叠放，不能仅因下方生成过 `ground` 就让 Fireball 传播；地形域查询必须把 Adapter 产生的替换/覆盖组合规范化为当前有效环境。这个解析在原版 Entity 领域内共用，视图不依赖视觉栈顺序。Bean 的特殊可生长集合留在 Bean 领域，不由 ground 的取反推导。

## 实施阶段与提交边界

1. **事实与基线。** 已有 `original-passage.md` 保存原版表。实现开始时记录当前分支 HEAD、检查工作区，建立原版表 → 语义 Entity 输入 → 预期结果 → 现有测试的矩阵。标出明确产品差异与尚未实现的原版条件。
2. **Egg 状态目标。** 实现 `satisfy-all`、ObjectiveResolver 和 Egg 的查询；同步 Model、Editor、HUD、Original 生成与已存在地图规则的转换。删除两个 Egg 专属 Fact，验证 state 更新、计数与 Undo。
3. **支撑通行与 layer 移除。** 实现 `resolveSupport` 及候选排除，迁移 Plank、Mower、Beanstalk 和地形组合，删除 Definition、Presence、Inspector、Debug、preview、公开导出及测试中的语义 `layer`。保留视觉与 Editor 结构各自职责。
4. **特殊传播与生长。** 迁移 Bean 地形集合和占用规则、Cloud / Leaf 静态阻挡表和方向条件、Fireball 域与特判；同步清理 `surface-facts.ts` 的坐标序号判定。原版语义重建文件补上事实文档已指出的遗漏，复杂规则用链接引用事实表。
5. **语义词汇与跨模块收尾。** 完成目标选择器、HUD、Editor、Original 目标生成、测试与示例的同步；清理 `ride-carried`、闲置 Fact 和失效查询；将可机械验证的约束加入正式 verify。

阶段 2～5 按实际依赖可合并为更小数量的完整提交，每次提交必须可独立验证和回滚。实现阶段在提交前运行完整 `npm run verify`；含本机 Chromium 的验证直接在沙箱外执行。

## 回归与验收

- 按事实文档第 10 节覆盖范围边界、阶段变化、Actor 状态与方向组合；已有的产品 Fidelity 差异单独说明。
- 验证相同 `walkable` 不会使 Fireball 获得木板支撑带来的传播能力；水上支撑允许步行时，独立对象障碍仍有效。
- 验证 Mower 在允许 terrain 上经过木板/豆茎，在拒绝 terrain 上失败；Bean Base 与 Tip / Middle 不同。
- 验证 Bean 查询真实语义地形和占用对象，动态 Cloud / Leaf 的存在不会被当成原版 object grid 非空。
- 验证 Cloud / Leaf 对静态阻挡名单外对象的处理、水流回退、同色 Parking，以及世界移动预留和携带关系。
- 验证 Egg 的 filled 状态、`satisfy-all` 聚合、Editor 自动规则、HUD 统计、Original 生成和地图导入；两个 Egg 同格仍按两个对象计数。
- 验证缺少目标、目标缺少查询实现、重复目标查询实现、多部位去重与目标替换；这些情况的规则结果必须明确。
- 验证支撑排除与候选生成次序无关，同格独立障碍始终执行；空 / 已填 Egg 和升起 / 降下色块在主 Actor 与 companion 校验中一致。
- 状态修改、spawn、destroy、运动、Undo、Restart、Snapshot restore、Replay 后，Fact 查询与运行结果一致。
- 最小测试地图在 Editor Play Test 使用正式 Engine，Runtime 保持 Draft 原样；原版证据不足时再 patch 只读原始 JAR 的副本。
- 门禁按真实类型/字段使用点检查 layer 与已移除 Fact，防止误报视觉 `layers`、局部绘图变量和 Editor 分类。

## 兼容性与范围

`EntityDefinition.layer`、`EntityLayer` 和 Debug 对应字段的删除属于 Engine 对外类型变化。地图 JSON 本身没有该字段，不为它增加兼容运行路径。

`egg-nest / filled-egg` 已出现在 `LevelMap.rules.win` 示例与 Editor/Original 默认输出，属于已存在的数据合同。标准旧表达转换为 `satisfy-all { target: "egg" }`，递归处理 all / any。其它包含旧 selector 的自定义组合不能推定等价，迁移检查须报告具体路径与所需处理，避免静默改写自定义含义。

实施时检查仓库地图、用户 Draft、分享地图和内含地图的 Replay。转换位于明确的数据迁移边界，严格 Model parser 与 World 只消费目标合同。Replay 内嵌地图变更会影响哈希和重放版本，须按 Replay 合同处理，不能直接修改地图后声称旧记录仍可验证。新增获胜条件和目标计数方式属于公共合同变化，完整验证包含格式、生成和重放。

本计划的 Engine 改造尚未执行；当前提交只更新待实施文档。
