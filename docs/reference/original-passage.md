# UP9 原版通行与碰撞规则

本文记录 Plank、Mower、Bean / Beanstalk、Cloud、Fireball、Leaf 的原始通行条件，供机关实现和最小回归对照。事实来源为 UP9 高清版 `a.class` 的字节码，并与反编译代码、研究性语义重建交叉检查。

本文描述原版行为；重制版的明确差异由 [Fidelity 产品边界](../decisions/original-fidelity-boundaries.md) 规定。本文不定义 Engine Fact，也不把原版存储结构要求传递给 `LevelMap`。

## 证据与坐标约定

- **确认**：下文条件已在 UP9 字节码中定位。没有逐个构造所有组合并在模拟器中重放，也未据此推定 Base、UP1 的全部边界一致。
- `ts-行-列` 的行列均从 1 开始。跨行区间按从左到右、逐行连续计算，包含两端；例如 `ts-6-15`～`ts-13-9` 包含中间各行全部格子。
- 坐标由 [Original DAT mapping](../../tools/original/dat/mapping.mjs) 转换，名称由 [Model 视觉目录](../../model/src/map/entity/original-tile-visuals.json) 核对。本文中的区间是原版分支证据，不是根据图片推测的材质分类。
- 上、下、左、右描述移动方向；原版方向值为 Left=0、Right=1、Up=2、Down=3、Stopped=4。
- 原版 UP9 的 `cu` 是 terrain grid，`cv` 是 object grid。object 空值对应 `ts-16-16`；Cloud / Leaf 在加载时转入独立动态实体数组，其位置不等于 object grid 的占用。

| 入口 | 核对内容 |
| --- | --- |
| [`a(int,int,boolean)`](../../original/reverse-engineering/bytecode/up09/methods/player-collision-a-int-int-boolean.javap.txt) | Bobby / Mower、terrain 与 object 覆盖；主要偏移 278、309、420、853、1754 |
| [`a(int,int,int,byte)`](../../original/reverse-engineering/bytecode/up09/methods/moving-entity-grid-pass-a-int-int-int-byte.javap.txt) | Cloud / Leaf；边界 0、object 阻挡 30、水域 170、风区 330 |
| [`S()`](../../original/reverse-engineering/bytecode/up09/methods/bean-growth-S.javap.txt) | Bean 生长；边界 56、object 70、terrain 87、写入 134 |
| [`Q()`](../../original/reverse-engineering/bytecode/up09/methods/fireball-Q.javap.txt) | Fireball；边界 61、terrain 111、色块 192、object 233、Mirror 289 |
| [`P()`](../../original/reverse-engineering/bytecode/up09/methods/moving-entities-P.javap.txt) | 动态实体格边界续行与像素子步；快速子步检测 116～149 |
| [`a(int,int,int,int)`](../../original/reverse-engineering/bytecode/up09/methods/moving-entity-pixel-collision-a-int-int-int-int.javap.txt) | 动态实体矩形碰撞、方向过滤及 Bobby 目标预测 |
| [`H()`](../../original/reverse-engineering/bytecode/up09/methods/gameplay-H.javap.txt)、[`J()`](../../original/reverse-engineering/bytecode/up09/methods/arrival-J.javap.txt) | 登叶启动、搭乘完成、中点交互、木板离开结算 |

研究性 `semantic/*.java` 用于阅读；精确边界以表中原始字节码为准。尤其是动态通行 helper 开头的 object 阻挡表、`P()` 仅在快速子步执行的碰撞检查，以及水流改向失败后的续行，必须一起核对。

## 1. Bobby 通行的判定顺序

Plank、Beanstalk 和 Mower 均经过统一玩家格通行函数，其顺序如下：

1. 目标越界则拒绝；airborne 在此后直接允许。
2. 检查当前位置 Carousel 的离开方向。
3. 非驾驶状态尝试搭乘目标格停止且对齐的 Cloud / Leaf，成功即允许。
4. 判断目标 terrain 的基础范围及特判。
5. terrain 不允许时，仅检查 Bean Tip、Bean Middle、完整 Plank 的通行覆盖。
6. terrain 允许时，执行目标 object 分支。

基础 terrain 允许区间为 `ts-6-15`～`ts-13-9`。高草、色块、Mirror、Carousel 等会进一步改变结果；完整木板和豆茎的覆盖位于这些特判之后。

| 当前 Carousel | 允许离开的移动方向 | 普通 Bobby 允许进入的移动方向 |
| --- | --- | --- |
| `ts-12-10` | 右、上 | 左、下 |
| `ts-12-11` | 左、上 | 右、下 |
| `ts-12-12` | 左、下 | 右、上 |
| `ts-12-13` | 右、下 | 左、上 |
| `ts-12-14` | 上、下 | 上、下 |
| `ts-12-15` | 左、右 | 左、右 |

普通 Bobby 遇到 Snow `ts-5-14`，有 Shovel 时安排 32-step 铲雪过程，否则提示缺少工具；terrain 本次判定仍为不允许，随后仍会进入 object 覆盖判断。

## 2. Plank

| 目标格条件 | 普通 Bobby | 驾驶 Mower |
| --- | --- | --- |
| terrain 判定允许，object 是完整木板 `ts-14-5` | 允许 | 允许 |
| terrain 判定拒绝，object 是完整木板 `ts-14-5` | 允许 | 拒绝 |
| terrain 判定允许，object 是碎裂阶段 `ts-14-6`、`ts-14-7` | 允许 | 允许 |
| terrain 判定拒绝，object 是碎裂阶段 `ts-14-6`、`ts-14-7` | 拒绝 | 拒绝 |

覆盖条件是“terrain 判定拒绝”，没有限定为水或天空。它也不会绕过此前的地图边界和来源 Carousel 离开限制。

非驾驶 Bobby 进入完整木板的移动跨过中点时登记该木板；下一次移动跨过中点时，上一块木板写为 `ts-14-6`，立即失去通行覆盖。之后经过 6 step 写为 `ts-14-7`，再过 6 step 清空。

原版只跟踪一个衰变中的旧木板；开始另一块衰变时会直接清除此前跟踪的碎片。Mower 不执行普通 Bobby 的木板登记分支。过程参见 [PlankDecay 重建](../../original/reverse-engineering/semantic/PlankDecay.java)。

## 3. Mower

Mower 使用玩家碰撞函数，由驾驶状态改变条件。先判断 terrain，再判断 object。

| 目标 terrain | 驾驶状态结果 |
| --- | --- |
| `ts-6-15`～`ts-13-9` | 基础允许，再执行本表特判 |
| Mirror `ts-12-2`～`ts-12-5` | 拒绝 |
| Carousel `ts-12-10`～`ts-12-15` | 拒绝 |
| 升起的色块 `ts-13-4`、`ts-13-6` | 拒绝 |
| 高草 `ts-13-8`、`ts-13-9` | 允许，并登记移动完成时割草 |
| 基础区间以外，包括 Snow `ts-5-14` | 拒绝 |

terrain 拒绝后，Mower 不能使用完整 Plank、Bean Tip、Bean Middle 提供的覆盖。

terrain 允许后，object 按下表判断：

| 目标 object | 驾驶状态结果 |
| --- | --- |
| Carrot `ts-13-11` | 拒绝 |
| 已填蛋窝 `ts-13-13` | 拒绝 |
| Lock `ts-13-14` | 拒绝 |
| Windmill `ts-14-1`～`ts-14-4` | 拒绝 |
| Dragon Head / Body `ts-14-8`、`ts-14-9` | 拒绝 |
| Sandman Head / Body `ts-14-11`、`ts-15-11` | 拒绝；Body 可触发对话流程 |
| Dream Machine Head / Body `ts-14-12`、`ts-15-12` | 拒绝；Body 可触发交互流程 |
| Ice Block `ts-15-4` | 拒绝 |
| Beaver Head / Body `ts-15-8`、`ts-16-8` | 拒绝；Body 可触发对话流程 |
| Fence `ts-16-10`～`ts-16-15` | 拒绝 |
| Whirlwind `ts-16-5` | 拒绝 |
| Crumbly Rock `ts-15-14` | `speedContinuation > 0` 或当前是 Speed 预探调用时允许；成功进入后撞碎 |
| Mower `ts-14-13` | 原始 object 分支只检查 Gas，有则允许 |
| 其余 object | 默认允许 |

因此，terrain 允许时，豆茎顶端、中段、底座、完整及碎裂木板、空蛋窝 `ts-13-12` 都不额外阻挡 Mower。驾驶经过空蛋窝不会填充它。Dragon 攻击准备帧 `ts-15-9`、`ts-15-10` 也落入原版 object 默认允许分支。

普通 Bobby 有 Gas 时进入 Mower，移动完成后删除该 object 并进入驾驶状态。驾驶进入 Mower Parking `ts-11-1` 后，移动完成时在停车格放回 Mower，将 Bobby 直接移到右侧一格；此处没有再次调用普通通行判定。参见 [MowerRuntime 重建](../../original/reverse-engineering/semantic/MowerRuntime.java)。

## 4. Bean / Beanstalk

### 生长目标

`S()` 每次尝试向上长一格，目标必须同时满足：

1. 目标纵坐标没有越过地图上边界。
2. object 为空，即 `ts-16-16` 对应的空值。
3. terrain 位于 `ts-1-1`～`ts-6-14`。

这个完整编号区间包含树桩、背景、天空、雪、水等，不能按图像理解成只有水或天空。目标 object 有任何非空值都会结束任务；该检查没有访问 Cloud / Leaf 动态数组。

成功时，旧顶端位置写入中段 `ts-14-15`；第一段同时在起点写入底座 `ts-15-15`；新目标写入顶端 `ts-13-15`。倒计时写回 16。`S()` 在倒计时大于零时只减一并结束本次处理，归零后的下一次调用才尝试生长；因此不要将赋值 16 简化为精确间隔 16 次调用。

### Bobby 通行与触发

| 对象 | 坐标 | 通行及中点行为 |
| --- | --- | --- |
| 顶端 | `ts-13-15` | 非驾驶 Bobby 可覆盖 terrain 拒绝；中点设置攀爬标记 |
| 中段 | `ts-14-15` | 非驾驶 Bobby 可覆盖 terrain 拒绝；中点设置攀爬标记 |
| 底座 | `ts-15-15` | 依赖 terrain 允许；非驾驶 Bobby 中点设置攀爬标记 |
| 豆芽 | `ts-15-16` | 依赖 terrain 允许；没有攀爬标记分支 |
| 魔豆 | `ts-13-16` | 依赖 terrain 允许；非驾驶 Bobby 中点收集 |
| 豆田 | `ts-14-16` | 依赖 terrain 允许；非驾驶 Bobby 有豆则消耗一个并启动任务，否则提示 |

是否有豆不是豆田的进入条件。terrain 本身允许时，上表对象均不额外阻挡 Mower；驾驶状态不执行种植、收集魔豆或攀爬标记分支。

## 5. Cloud / Leaf 共用的下一格检查

两类动态实体共用 `a(int,int,int,byte)`。检查顺序为地图边界、object 阻挡表、各自 terrain / 方向条件，然后由调用方检查动态实体矩形碰撞。

| 阻挡 object | 坐标 |
| --- | --- |
| 木板及两个碎裂阶段 | `ts-14-5`～`ts-14-7` |
| 冰块及三个融化阶段 | `ts-15-4`～`ts-15-7` |
| 碎石 | `ts-15-14` |
| 围栏 | `ts-16-10`～`ts-16-15` |

其它 object 默认不在此 helper 中阻挡。该集合既不同于 Bobby 阻挡集合，也不同于 Fireball 阻挡集合；Cloud Parking 在这里放行，在 Cloud 的到达续行逻辑中判断颜色。

## 6. Cloud

红、紫、绿云分别为 `ts-15-1`、`ts-15-2`、`ts-15-3`。

下一格除了通过第 5 节检查，还必须满足：

- terrain 位于 `ts-5-8`～`ts-5-13`；
- 不得逆向进入已开启风车正前方第 1～3 格风区。

| 当前移动方向 | 禁止进入的已开启风区 |
| --- | --- |
| 左 | 向右吹的风区 |
| 右 | 向左吹的风区 |
| 上 | 向下吹的风区 |
| 下 | 向上吹的风区 |

在格边界，`P()` 按以下顺序规划续行：

1. 当前 object 是同色 Parking 时停止：红 `ts-16-1`、紫 `ts-16-2`、绿 `ts-16-3`。异色 Parking 不触发停车。
2. 允许风向接管时，依次尝试上、下、左、右风。云须位于对应风区、当前方向不同于风向，并且沿风向的下一格检查及动态碰撞检查成功。
3. 没有成功规划风向移动且未同色停车时，尝试沿原方向继续。
4. 最终没有下一格移动时设为 Stopped。

风向接管受镜头状态门控：`aT == 0`、镜头已追上目标（`bO == bI && bP == bJ`）、或 `aE != -1`，满足其一才进入该分支。此门控控制接管时机，不改变下一格 helper 的逆风拒绝条件。

风区坐标与开关行为可配合 [CloudWind 重建](../../original/reverse-engineering/semantic/CloudWind.java) 阅读，完整续行以 `P()` 为准。

## 7. Fireball

`Q()` 在当前 8-step 格运动阶段剩余 3 时检查所在格；顺序为边界、terrain 允许范围、升起色块、指定 object、Mirror 入射方向。任一拒绝使火球结束。

| 允许传播的 terrain | 范围 |
| --- | --- |
| 天空 | `ts-5-8`～`ts-5-13` |
| 水、潮流、瀑布 | `ts-6-6`～`ts-6-14` |
| 基础地面编号范围 | `ts-6-15`～`ts-13-9` |

| 特判 | 结果 |
| --- | --- |
| terrain 为升起色块 `ts-13-4`、`ts-13-6` | 火球结束 |
| object 为 Dragon Head / Body `ts-14-8`、`ts-14-9` | 火球结束 |
| object 为 Crumbly Rock `ts-15-14` | 火球结束 |
| object 为 Ice Block `ts-15-4` | 调用融化入口，火球继续 |
| 其它 object | 此项检查放行 |

| Mirror terrain | 允许的运动方向变化 |
| --- | --- |
| `ts-12-2` | 左 → 下；上 → 右 |
| `ts-12-3` | 右 → 下；上 → 左 |
| `ts-12-4` | 左 → 上；下 → 右 |
| `ts-12-5` | 右 → 上；下 → 左 |

箭头左侧是火球当前运动方向，其余方向入射使火球结束。转向先写入 pending direction，到格运动阶段重置时才生效。

木板、豆茎、围栏等 object 可被火球经过，但它们不会覆盖 terrain 范围的拒绝。高草与 Carousel 均在火球 terrain 允许区内；火球不借用 Bobby 的高草或 Carousel 通行条件。

`Q()` 没有 Bobby 碰撞框或 Cloud / Leaf 动态数组检测。本文只据此确认该函数的检查范围，不推断其它未审计入口是否存在额外伤害来源。过程解读见 [DragonFireball 重建](../../original/reverse-engineering/semantic/DragonFireball.java)。

## 8. Leaf

荷叶为 `ts-15-13`。下一格通过第 5 节检查后，按目标 terrain 与本次运动方向判断：

| 目标 terrain | 允许进入的运动方向 |
| --- | --- |
| 静水 `ts-6-6`、水波 `ts-6-7` | 四个方向 |
| 向下潮流 `ts-6-8` | 除上以外 |
| 向上潮流 `ts-6-9` | 除下以外 |
| 向右潮流 `ts-6-10` | 除左以外 |
| 向左潮流 `ts-6-11` | 除右以外 |
| 瀑布 `ts-6-12`～`ts-6-14` | 除上以外 |
| 其它 terrain | 拒绝 |

### 登叶与续行

- Bobby 刚登上停止且对齐的荷叶时，`H()` 消费 `justMounted` 标记，并按 Bobby 的进入方向尝试启动。
- 启动还检查荷叶当前格：不能逆当前潮流或逆瀑布启动；然后检查下一格 terrain / object 与动态实体碰撞。
- `P()` 在格边界优先尝试沿当前格潮流方向移动；瀑布优先尝试向下。成功规划瀑布向下移动时启用 6px/step，其余普通移动使用 3px/step。
- 水流方向规划失败时，还会尝试沿原方向继续；最终没有下一格移动才停止。
- 普通水面上的荷叶撞停后不会重新产生 `justMounted`；Bobby 后续方向输入用于下叶，离开再登上才重新触发登叶启动。
- 潮流 / 瀑布格的自动续行仍由 `P()` 持续尝试，也可使停止的荷叶再次移动；应与“普通水面重新登叶启动”区分。

参见 [LeafWater 重建](../../original/reverse-engineering/semantic/LeafWater.java)，续行失败回退以 `P()` 字节码为准。

## 9. 动态碰撞与搭乘

### Cloud / Leaf 查询其它动态实体

- 格移动规划使用目标像素位置的 48×48 矩形；忽略自己，且只检查其它方向与本次查询方向不同的实体。同方向实体在该检查中放行，Stopped 与异向实体重叠时阻挡。
- `P()` 的快速 6px 子步会检查候选像素位置，传入的查询方向为 Stopped，因此只检查其它正在移动的实体。碰撞时本拍不更新位置，也不减少剩余距离，下一拍重试。
- 普通 3px 子步跳过这项中途检测。格边界的下一格碰撞检查仍然执行。
- 动态实体按数组顺序更新；像素框检查读取该时刻的其它实体位置。

### Bobby 查询与搭乘

- 玩家格通行函数在 terrain / object 之前寻找目标格 Stopped 且像素完全对齐的 Cloud / Leaf；非驾驶 Bobby 命中时记录搭乘关系并直接允许。
- 共用像素碰撞 helper 的 Bobby 分支使用 `selfIndex == -1`：将每个动态实体按方向和剩余像素推到本段运动的终点，再与 Bobby 候选矩形比较。它与停止实体搭乘查询是两个入口，应按调用位置区分。
- 已搭乘时，载体每次像素移动给 Bobby 添加同样的增量。

## 10. 对照用边界清单

以下组合直接来自上述条件，适合作为后续 Engine 验收输入；具体产品差异仍查 Fidelity 文档。

- 完整与碎裂 Plank × 允许 / 拒绝的 terrain × 步行 / Mower。
- Bean Tip / Middle / Base × 允许 / 拒绝的 terrain；有豆 / 无豆进入豆田。
- 生长范围首尾及相邻坐标；object 空 / 非空；同格动态 Cloud / Leaf。
- Cloud / Leaf 共用 object 阻挡表的每个阶段，以及表外的普通收集物、豆茎和 Parking。
- Cloud 天空范围两端、同色 / 异色 Parking、逆风与垂直入风、风向接管失败后沿原向续行。
- Leaf 各水面 × 四方向，登叶当前格的逆流限制，改向失败而原向可行，Stopped 在潮流格恢复移动。
- Fireball 三个 terrain 区间边界、升起 / 降下色块、四面 Mirror 的完整入射表、Ice 命中与 object 默认放行。
- 动态实体同向 / 异向 / 停止的目标矩形，3px / 6px 子步条件，停止对齐载体的搭乘优先级。
