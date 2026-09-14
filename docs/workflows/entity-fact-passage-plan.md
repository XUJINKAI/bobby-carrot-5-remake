# Entity Goal、Fact 与通行规则实施计划

状态：已实施。实施基线与规则矩阵见 [Entity Goal 与通行规则实施基线](entity-fact-passage-baseline.md)；当前行为以对应合同和代码为准。

原版条件统一引用 [UP9 原版通行与碰撞规则](../reference/original-passage.md)，重制版明确差异引用 [Fidelity 产品边界](../decisions/original-fidelity-boundaries.md)。当前合同见 [Engine 机制合同](../contracts/engine-mechanisms.md)、[地图合同](../contracts/level-format.md) 和 [World Runtime 合同](../contracts/world-runtime.md)。

## 1. 目标与职责

本次改造包含两条完整链路：

1. 地图以具体 Goal 声明目标；对应 Goal 读取 Entity 状态，解释达标条件。World 汇总目标树，HUD 与 Editor 复用结果和定义。
2. 通行、落脚、生长、传播由所属 Entity 规则判断；这些规则组合必要的共享 Fact 与语义特例表。移除 `EntityDefinition.layer` 及相关依赖。

| 所属模块 | 职责 |
| --- | --- |
| Model | 目标条件的数据形状、稳定 Goal ID、地图解析和参数结构 |
| Entity 领域 | 对象状态、专属通行、对象交互、具体 Goal 实现 |
| Fact | 跨对象共享的当前语义及注册校验 |
| Mechanism | 已经能够通过通用 Fact 和协议复用的规则 |
| World | 时间、空间、调度、目标树求值、移动裁决、命令事务、快照 |
| Editor / HUD | 通过 Engine 的 Goal 定义与查询结果生成配置、提示和展示 |

视觉 `layers`、`renderPass`、`stackOrder`、footprint `role` 和 Editor `stackSlot` 各自保留职责。Fact 与机关实例状态继续属于 Engine；`LevelMap` 保持纯语义地图。

## 2. 地图直接声明具体 Goal

### 条件形状

组合节点使用 `all / any`，叶子节点使用具体 Goal ID。示例：

```json
{
  "type": "all",
  "conditions": [
    { "type": "carrot" },
    { "type": "exit" }
  ]
}
```

```json
{
  "type": "all",
  "conditions": [
    { "type": "egg" },
    { "type": "exit" }
  ]
}
```

推箱子地图使用 `{ "type": "push-goal" }`。Golden Carrot 地图使用 `{ "type": "golden-carrot" }`，与 Exit 的组合沿用该地图已有的 all / any 关系。

首批内置 Goal ID 为 `carrot / egg / exit / push-goal / golden-carrot`。条件树通过 `condition.type` 查找对应定义；Goal ID 是目标语义，具体查询哪些 Entity 由 Goal 决定。

每种 Goal 可以声明自己的 `parameters`。当前五种 Goal 均不需要参数，正式输出只保存 type。后续确有需求时，由该 Goal 增加参数的数据合同和校验；Model 只校验数据，Engine 解释运行语义。组合节点只接受 conditions，参数归具体 Goal。

### 具体 Goal 的规则

| 实现 | 查询对象及达标条件 | 计数与边界 |
| --- | --- | --- |
| `carrotGoal` | 查询当前 Carrot Entity 的 `state.consumed`；全部收集后完成 | remaining 为未收集的 Carrot 数量，包含高草下的隐藏对象；计数为零即完成；Editor 对开局零目标给出配置提示 |
| `eggGoal` | 查询当前 Egg，逐个读取 `state.filled === true` | 按 Entity ID 去重，remaining 为未填数量；至少存在一个 Egg 且全部填充才完成 |
| `pushGoal` | 查询 Push Goal 的目标格，检查各格是否被具有 pushable 能力的对象占据 | 目标按坐标去重，remaining 为未被占据的目标格数；至少存在一个目标格 |
| `exitGoal` | 查询玩家和 Exit，使用 Exit 的到达条件 | 至少一个玩家；所有当前玩家均满足 Exit 到达要求，驾驶限制仍由对象规则解释；remaining 可省略 |
| `goldenCarrotGoal` | 任一玩家成功到达并完成 Golden Carrot 的交互 | 保留对象在交互中被消费时的成功记录；开局没有目标不能自动完成 |

`eggGoal` 对同格的两个 Egg 按两个对象计数。`pushGoal` 对同格重叠的目标按一个目标格计数。这些差别由各 Goal 自己规定。

目标读取当前已提交的 World；组合节点只组合子结果。关卡进入最终完成状态仍遵守既有运动结束时机、死亡和暂停规则。目标失去满足条件时是否仍完成，按具体 Goal 定义：Egg 读取当前状态，Exit 读取当前到达条件，Golden Carrot 使用成功交互记录。

### Goal 协议与注册

World 定义最小的只读求值协议：

```ts
interface GoalResult {
  readonly completed: boolean;
  readonly remaining?: number;
}

interface GoalDefinition {
  readonly type: GoalType;
  evaluate(context: GoalContext): GoalResult;
}
```

`GoalContext` 提供只读 World 查询、当前条件，以及目标需要读取的已提交成功交互记录。当前实现没有参数时，求值器只消费 type。Goal 求值不接收 mutation commands。

- `world/outcome/GoalRegistry.ts` 保存 Goal ID 与求值实现，校验重复注册和缺失定义。
- 具体 `carrotGoal / eggGoal / exitGoal / goldenCarrotGoal` 位于 `entities/original/goals/`；`pushGoal` 位于 `entities/custom/goals/`。
- Engine 组合入口注册这些实现，并将 registry 注入 World。World 源码只依赖 Goal 协议。
- `WorldRuleEvaluator` 对 all / any 递归求值，对叶子调用 registry 中的 Goal。
- `WinConditionState` 保留叶子的具体 type、completed 和可选 remaining；组合节点保留完整子结果。
- 必要的成功交互记录由 World runtime 保存并进入 Snapshot / Undo。Golden Carrot 的消费不能使成功结果丢失；优先复用当前已经保存的到达记录，调整时同时更新 Replay。
- Goal 实现是无共享可变状态的对象。查询结果按需计算，额外性能缓存必须按 World 提交版本失效。

Goal 的编辑可用性检查与运行求值共用对象选择规则。Engine 对外提供注册 Goal 的可用性结果；Editor 不维护一份 Egg 或箱子判定代码。

## 3. Egg 使用自身状态

将 Egg 定义、填充行为和视觉解析从 `static-catalog.ts` 抽到 `entities/original/egg.ts`。

| 职责 | 实现 |
| --- | --- |
| 初始配置 | 继续由 Model 声明的 filled 字段初始化 runtime state |
| 填充 | 普通 Bobby 离开时，经 World 命令设置同一 Egg 的 `state.filled = true`；保留 Entity ID |
| Mower | 经过空 Egg 时不执行填充 |
| 碰撞 | Egg 的对象规则直接读取 `state.filled` 决定能否进入 |
| 视觉 | Egg Visual 读取同一 state 选择画面 |
| 目标 | `eggGoal` 读取同一 state 计算 remaining |
| 恢复 | Snapshot / Undo 恢复 state，后续碰撞、视觉和目标读取恢复后的值 |

Color Block 的 `state.raised` 同样由 Color Block 的规则解释。通用 blocking 的声明或动态投影只表达通行所需的共享语义；具体字段始终由所属对象维护。所有占用入口必须读取同一有效判断，避免主 Actor 可走而 companion 被静态标签错误拒绝。

## 4. Fact 处置清单

Fact 只保存有真实生产方、消费方和独立语义的共享事实；具体目标由 Goal 解释，具体对象规则可以读取 Type、state、实例字段和 role。

| 当前 Fact | 处理 | 后续归属 |
| --- | --- | --- |
| `bean-growth-space` | 删除 | Bean 专属的语义地形集合与生长位置判断 |
| `cloud-space` | 改为 `sky` | 天空域；Cloud、Fireball 各自解释通行 |
| `egg-nest` | 删除 | `eggGoal` 按 Egg Type 选择对象 |
| `filled-egg` | 删除 | Egg state、Egg 碰撞与 `eggGoal` |
| `ride-carried` | 删除 | Bobby / Mower 的 mountId 关系与 companion 提案 |
| `terrain-overlay` | 删除 | Plank、Beanstalk 等对象的通行特判 |
| `meltable` | 删除当前闲置声明 | Ice Block 的融化入口，由 Fireball 规则调用 |
| `hidden-objective` | 删除失效查询及声明 | High Grass 与 Carrot / Egg 的真实遮蔽关系，由 Entity 规则处理 |
| `reach-all-players` | 迁移到 `exitGoal` 后删除 | Exit 与 Golden Carrot 分别解释多人达标条件 |
| `walkable` | 保留 | 标准步行可落脚的部位；特殊移动者使用自己的规则 |
| `blocking` | 保留 | 需要执行通行阻挡检查的部位，实际条件可由对象行为解释 |
| `water` | 保留 | 水域语义；潮流和瀑布方向由 Entity 规则处理 |
| `climbable` | 保留 | 可攀爬部位，动作及人物表现读取相同语义 |
| `moving-platform` | 保留 | 可承载 Actor 的移动平台；具体搭乘和续行属于对象行为 |
| `player` | 保留 | World Actor 生命周期所需的 kernel Fact |
| `pushable` | 保留 | 推机制与 `pushGoal` 共享的能力 |
| `collectible` | 核对实际消费后收敛 | 通用收集能力有独立消费时保留；Carrot 数量由 `carrotGoal` 按 Type 查询 |

注册表中每项说明生产方、消费方和是否随 state 变化。`sky` 对混合 Surface variant 按真实语义声明。纯私有字段由对象规则直接解释。

## 5. 通行判断由 Entity 领域实现

### 调用与提交边界

| 判断内容 | 所属规则 |
| --- | --- |
| Bobby / Mower 的目标地形、木板/豆茎覆盖、搭乘和对象交互 | 玩家与相关原版 Entity 规则 |
| Bean 的下一格生长条件 | Bean 规则 |
| Cloud / Leaf 的下一格 terrain、静态阻挡、风向/水流/停车 | 动态载体规则 |
| Fireball 的传播范围、对象阻挡、反射、融化 | Fireball 规则与被交互对象的领域入口 |
| 边界、busy、移动预留、多人冲突、原子提交 | World |

复用 `planMovement`、`canEnter`、`canLeave`、`resolveEntry` 与 RuntimeAction 的调用入口。移除 layer 消费点时，同步把 `hasWalkable` 等提前决定结果的检查调整到对应移动策略中，让特殊对象有机会完成自己的判断。

通行代码只能查询和提出结果；砍草、铲雪、开锁、碎石等命令通过已有事务路径提交。World 不根据某个具体 Entity Type 执行通行分支，领域函数也不直接操作 World 内部存储。

### Bobby / Mower 的直接判断顺序

1. World 检查目标边界和运动有效性。
2. 玩家规则处理 airborne，并检查来源 Carousel 的离开方向。
3. 非驾驶状态检查目标格停止且对齐的 Cloud / Leaf，按原版搭乘优先级决定进入。
4. 玩家地形规则判断目标环境，执行高草、色块、Mirror、Carousel、Snow 等专属条件。
5. 地形拒绝时，非驾驶 Bobby 检查完整 Plank、Bean Tip、Bean Middle；命中则允许跨越该地形。Mower 仍依赖地形本身允许。
6. 对独立对象执行对应的进入条件。木板对地形的作用范围到第 5 步为止；同格额外 Ice Block、已填 Egg 等对象仍然执行自己的条件。
7. World 校验全部参与者及目的格预留，提交命令与移动，继续中点/到达/离开生命周期。

原版一个 terrain 和一个 object 的输入按事实表验证。现代多实体输入将“跨越地形”与“其它独立对象的进入限制”分别处理；判定由 Entity 规则直接完成。

| 输入 | 普通 Bobby | Mower |
| --- | --- | --- |
| 水＋完整 Plank | 允许 | 拒绝 |
| 允许通行的地形＋完整 Plank | 允许 | 允许 |
| 水＋碎裂 Plank | 拒绝 | 拒绝 |
| 水＋Bean Tip / Middle | 允许 | 拒绝 |
| 水＋Bean Base | 拒绝 | 拒绝 |
| 水＋完整 Plank＋独立 Ice Block | 被 Ice Block 拒绝 | 拒绝 |
| 高草＋完整 Plank | 木板允许跨越该地形 | 按 Mower 高草规则进入 |

来源离开约束、方向特判的副作用、成功搭乘的检查优先级由对应 Entity 保持。现有 `resolveEntry` 对象处理与通行判断应抽成可复用领域代码，由一个权威入口调用，避免同一次尝试执行两遍开锁或清除。

### 语义地形与叠放

原版 Adapter 会把某些一个 terrain 值展开为多个现代 Entity，例如基础地面与 Snow、高草及隐藏目标。因此通行函数要理解这些语义组合：

- Snow 覆盖了地面时，Fireball 不能仅因下方存在 walkable 就通过。
- 水上有 Plank 时，Plank 的步行能力不能成为 Fireball 的地形传播依据。
- 高草下的 Carrot 计入目标，但进入、收集与割草顺序由覆盖关系决定。
- Bean 判断生长位置时，纯地形与 Cloud / Leaf 动态载体不能被当作原版 object grid 的普通占用。

共用的组合识别放在 `entities/original/terrain-semantics.ts`。它只解析 semantic type、实例字段、role 与 state，输出对应领域判断所需的信息。需要共享具体对象名单时，在所属原版领域引用同一张表。

现代自定义地图多种地形叠放的判定必须明确且与渲染排序无关。范围限定为可由语义组合解释的游戏行为；无法由已知语义确定的组合先建立最小例图，在实现阶段写明处理规则和回归结果。

### 六类规则的落地位置

| 文件/领域 | 具体工作 |
| --- | --- |
| `entities/player/bobby-passage.ts` | 编排玩家地形、覆盖与对象通行顺序，读取驾驶/飞行关系，复用对象自己的规则 |
| `entities/original/terrain-semantics.ts` | 识别基础地形与覆盖组合，按明确语义 variant 解释原版地形；替代坐标线性化范围判断 |
| `entities/original/plank.ts`、Beanstalk 定义 | 木板完整阶段、豆茎部位、离开行为与跨越地形的条件 |
| `entities/original/mower.ts` | Gas、mountId、停车、割草、Speed 碎石条件 |
| `entities/original/bean-passage.ts` | 原版可生长语义集合、静态占用、动态载体边界 |
| `entities/original/moving-support-passage.ts` | Cloud / Leaf 共用静态阻挡表，分别处理 sky / water、逆风/逆流、停车及续行回退 |
| `entities/original/fireball-passage.ts` | 地形传播范围、Dragon role、Color Block state、Crumbly Rock、Mirror 入射表、Ice 融化 |

新增文件均按领域职责抽取，简单规则保留在所属 Entity。原版编号和 ts 坐标换算只位于 `tools/original/dat/`；事实文档提供原始表，Engine 运行表使用语义身份。

主 Actor、被推物和携带对象的可占用性检查都复用其对应规则。所有运动仍经 World 事务执行；Cloud / Leaf 的原版同向碰撞与快速子步差异应与现代运动预留单独核对，并在 Fidelity 边界明确结果。

## 6. 目标合同、生成与历史数据

现有已提交代码使用 `collect-all / fill-all / reach` 及 target/filler 选择器。本次实施将正式输出统一为具体 Goal 条件，all / any 递归结构保留。

| 现有标准表达 | 新表达 |
| --- | --- |
| `collect-all { target: "carrot" }` | `{ type: "carrot" }` |
| `fill-all { target: "egg-nest", filler: "filled-egg" }` | `{ type: "egg" }` |
| `fill-all { target: "push-goal", filler: "pushable" }` | `{ type: "push-goal" }` |
| `reach { target: "exit" }` | `{ type: "exit" }` |
| `reach { target: "golden-carrot" }` | `{ type: "golden-carrot" }` |

维护方地图和样例统一转换，官方/自定义 collection 生成器直接输出新合同。现有地图合同处于 schemaVersion 1 开发期，实施时明确本次格式变化与转换命令；正式 parser 按更新后的合同严格校验。

对需要保留的旧地图提供显式转换入口，转换工具递归处理上述标准表达。其它自定义 selector 组合逐项审计，能确定含义时配置对应具体 Goal 及确有必要的参数；不能确定时返回条件路径，不静默改变含义。runtime Goal Registry 只维护目标合同。

Replay 的内嵌地图、completedConditions、哈希和最终结果一起更新。旧 Replay 文件保持原样；维护中的验证记录在转换地图后重新执行并生成新版本证据，不能只修改 JSON 后沿用旧校验值。Draft、分享地图和存档恢复入口都须明确接受哪个合同以及如何调用显式转换。

### 同步文件

- `model/src/map/rules.ts`、`parser.ts`、schema 生成：具体 Goal 条件和参数结构。
- `engine/src/world/WorldRuleEvaluator.ts`、`WorldTypes.ts`：registry 求值与条件结果树。
- Engine `LevelWarnings` / `validateLevelPlayability`：调用对应 Goal 的配置检查。
- `editor/src/authoring/rules.ts`：检测、勾选、生成和识别具体 Goal。
- `engine/src/ui/GameplayHudModel.ts`：按具体 Goal type 读取 remaining。
- 原版 Exit 视觉对目标状态的读取：跟随具体 Goal 结果，保持目标未完成时的门状态。
- `tools/original/win-condition.mjs`、自定义地图生成器和 pipeline 校验：输出新条件。
- `engine/src/replay/`：条件序列化、解析、最终状态对照及消费目标的成功记录。
- 地图、Engine、World、Replay 合同与使用示例。

## 7. 实施阶段与提交边界

| 阶段 | 修改内容 | 验收重点 |
| --- | --- | --- |
| 1. 基线与规则矩阵 | 记录当前分支和 HEAD；把原版事实对应到语义地图与已有测试；整理所有实际目标条件 | 标明原版事实、现有产品差异和待补行为；审计自定义 selector |
| 2. 具体 Goal 链路 | Goal 协议与 Registry、五个 Goal、Model 条件、World 求值、Editor/HUD/生成器/Replay、显式转换 | 对象状态目标、多人 Exit、Golden Carrot 消费、全部生成地图与回放合同 |
| 3. 玩家通行与 layer | 整理 Bobby/Mower、Plank/Beanstalk、地形/独立对象判断；删除 Definition、Presence、Debug、preview、公开类型中的 layer | 原版先后顺序、现代额外叠放、主 Actor/推/携带一致性 |
| 4. 特殊移动与 Fact | Bean、Cloud/Leaf、Fireball 领域表和方向条件；完成 Fact 清理与 semantic variant 声明 | 原版名单逐项、区间边界、阶段/方向/状态组合 |
| 5. 完整验收与文档 | Editor 最小图、Snapshot/Undo/Replay、正式 verify 门禁、合同和 Fidelity 对照 | 全量通过、提交可审查、工作区干净 |

每个阶段形成内容聚焦的提交；相互依赖的 schema、生成器与消费方一起提交。实现阶段属于跨模块公共合同及 Engine 逻辑修改，每次准备提交前执行完整 `npm run verify`；包含本机 Chromium 的验证直接在沙箱外运行。

## 8. 最小回归与完成标准

### Goal

- Carrot 普通收集、高草覆盖、最后一个目标被消费、开局零目标。
- Egg 空/已填初值、普通 Bobby 离开、Mower 经过、同格多个 Egg、Undo/Restart。
- Push Goal 空位、箱子进入/离开、多个目标、目标部位与对象计数边界。
- Exit 单人、多人分处不同 Exit、驾驶状态、目标尚未达标以及运动完成时机。
- Golden Carrot 消费后成功记录、任一玩家到达、缺少目标、与 Exit 的 any 组合。
- all / any 递归结果、缺失 Goal 注册、重复注册、不合法参数、HUD 与 Editor 使用同一结果。
- 显式转换的标准条件与无法自动解释的自定义条件；Replay 哈希和 completedConditions。

### 通行

按 [原版事实文档的边界清单](../reference/original-passage.md#10-对照用边界清单) 完成六类对象测试，额外覆盖：

- 水＋木板＋独立障碍，地面＋木板＋Mower，高草/Snow 覆盖与隐藏目标。
- 多格 Dragon 的 head/body/tail，Bean Tip/Middle/Base，以及 Ice/Plank 不同阶段。
- Bean 空 object 与动态载体，混合 variant 的真实语义。
- Cloud/Leaf 静态名单内外对象、同色/异色停车、逆风/逆流、改向失败的原向续行。
- Fireball 的地形域不会从 Plank 的 walkable 获得许可；Mirror 入射和对象 state 特判。
- 通行失败时命令未提前提交，成功时交互只执行一次；Snapshot、Undo、Replay 恢复同一状态。

### 正式门禁

- 检查已删除 layer 的真实类型/字段引用，保留视觉绘图变量与 Editor slot 的合法使用。
- 检查已移除 Fact 的声明和消费；历史数据转换、原版事实记录使用显式范围豁免。
- World 与通用 Mechanism 的依赖方向检查覆盖 Goal Registry 与 Entity 通行入口。
- Goal ID、条件参数、Fact ID 的注册与运行校验进入 `npm run verify`。
- 最小地图在 Editor Play Test 运行正式 Engine，Runtime 不反写 Draft。
- 原版字节码不足以解释的行为，用独立生成的 patch JAR 验证，原始 JAR 保持只读。

## 9. 实施结果

五种具体 Goal、Entity 领域通行、语义地形与特殊移动、Fact 注册词汇、Editor Play Test 及 Replay 均由正式 Engine 合同约束。Goal 条件及公开类型的转换见 [地图合同](../contracts/level-format.md) 与 [Engine API](../contracts/engine-api.md)；原版像素碰撞粒度对应的产品边界见 [Fidelity 产品边界](../decisions/original-fidelity-boundaries.md)。
