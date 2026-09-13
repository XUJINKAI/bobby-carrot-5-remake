# 已确认的 Fidelity 实施清单

本文只记录目标行为已经确认、但当前 Engine 尚未完成的差异。优先级描述对官方地图解法、
输入控制和画面正确性的影响，不代表必须在一个提交中实现。

原版事实是否可靠与是否决定修改是两个维度。下列条目均已有实施结论；仍需决定的细节链接
到 [`fidelity-open-questions.md`](fidelity-open-questions.md)，不会在实现时擅自补全。

## P0：会改变通行或持续状态

### A1. Trait 与 Behavior 建立集中审阅入口

**现象差异**

当前 trait 名称由多个 Entity 模块分别使用，`bean-growth-space` 等名称直接绑定某个机关。
Behavior 也缺少一份能够集中查看“有哪些行为、由谁使用”的目录。

**可能影响**

增加新机关时容易重复创造含义接近的 trait，或为了一个例外给大量 Entity 补专用标记。
审阅者很难判断一个通用空间属性会影响哪些机关。

**目标行为**

- trait 描述 Entity 自身可复用的物理或能力事实；
- 特例优先留在拥有该规则的机制中；
- 所有 trait 与 Behavior 有集中目录，能查到定义、语义和使用者；
- `npm run verify` 检查未登记、重复含义和无人使用的项目。

**原理说明**

集中目录负责词汇治理，Entity Definition 继续负责组合能力。具体采用哪种空间结构仍需先解决
[`Q02`](fidelity-open-questions.md#q02-engine-应该怎样表达格子中的地面主体和覆盖物)。

### A2. Bean 生长改用通用空间事实

**现象差异**

原版 Beanstalk 可以越过 Tide 等地形。当前 Bean 只允许向带 `bean-growth-space` trait 的
Entity 生长，因此会在 Tide 前提前停止。

**可能影响**

依赖藤蔓跨越水域或 Tide 的官方关卡可能无法完成；自定义地图还会因为某个无关 Entity
缺少 Bean 专用 trait 而截断生长。

**目标行为**

Bean 查询“目标格是否存在可承载藤蔓的地面，以及是否已经有占据生长空间的高位对象”，
不再查询以 Bean 命名的空间类别。通行判断与藤蔓放置判断保持独立。

**原理说明**

原版通过 terrain 范围和单个 object 槽判断；现代 Entity Map 需要从可复用的地面承载能力
与占用事实得到同样结论。各类地形的精确允许表仍由
[`Q03`](fidelity-open-questions.md#q03-beanstalk-具体可以长过哪些现代-entity-组合) 收口。

**证据**

- `semantic/BeanGrowth.java`
- `engine/src/entities/original/bean-field.ts`

### A3. Snow 使用完整 Shovel 动作

**现象差异**

原版中，Bobby 持有 Shovel 时第一次撞上 Snow 仍会停住，播放约 `992ms` 的铲雪动作，
Snow 清除后自动重试刚才的方向。当前 Engine 在碰撞解析时立刻删除 Snow，并让 Bobby 在
同一次移动中直接通过。

**可能影响**

玩家看不到铲雪过程，也没有对应的输入锁；Snow 附近的其它机关会比原版提前约一秒触发，
Replay 中的动作边界也不同。

**目标行为**

1. 第一次碰撞保持 Bobby 原位；
2. 建立由该 Bobby 持有的 `992ms` gameplay 动作并锁住其普通输入；
3. 动作结束时重新确认目标 Snow 仍然存在；
4. 删除 Snow，生成 `ts-8-13` 对应的清雪地面；
5. 通过正常移动解析自动重试保存的方向。

**原理说明**

清雪过程会影响输入和后续碰撞，因此属于可快照的 RuntimeAction。`b8.png` 动画只读取动作
进度，不负责删除 Snow。缺少 Shovel 的 Callout 已由正式 Engine Presentation 处理。

**证据**

- `semantic/ShovelRuntime.java`
- `engine/src/entities/behaviorLibrary.ts`
- `engine/src/entities/player/bobby.ts`

### A4. Mower 按地面高度决定通行

**现象差异**

原版 Mower 可以驶过 Speed 等平坦地面机关，会被 Mirror 这类有高度的机关挡住。当前
Mirror 没有 mounted Bobby 的通行限制，因此 Mower 可以驶入。

**可能影响**

Mirror 附近的官方谜题可以被错误穿过；继续为每个机关单独增加 Mower 特判，也会让通行
规则越来越难审阅。

**目标行为**

Mower 可以驶过普通地面和无高度的地面机关，明确被 Mirror 等高位障碍阻挡。High Grass
等覆盖物的处理方式在 [`Q01`](fidelity-open-questions.md#q01-high-grass-遮住目标时应该怎样参与通行) 决定后并入同一空间查询。

**原理说明**

Mower 需要读取 Entity 的通用空间事实，而不是维护一份机关 ID 白名单。具体字段和有效格子
视图与 [`Q02`](fidelity-open-questions.md#q02-engine-应该怎样表达格子中的地面主体和覆盖物) 一起确认。

**证据**

- `semantic/MowerRuntime.java`
- `semantic/PlayerCollisionRules.java`
- `engine/src/entities/original/mirror.ts`

### A5. Ice Block 完成融化后再删除

**现象差异**

原版 Fireball 命中 Ice Block 后，冰块依次显示三个融化阶段，每阶段约 `186ms`，最后才
消失。当前 Engine 命中后立即删除 Ice Block；已经登记的融化视觉没有机会显示。

**可能影响**

冰块在规则和画面上过早消失，玩家无法判断火球是否命中；冰块后方路径也会比原版提前
开放。

**目标行为**

Fireball 命中后把 Ice Block 置入 E4、E5、E6 三阶段融化过程，动画结束时再销毁 Entity。
运行中碰撞读取当前融化阶段，画面读取同一 gameplay state。

**原理说明**

融化期间冰块是否仍阻挡会影响后续移动和火球，因此阶段属于 World gameplay state，并由
RuntimeAction 推进。原版“最多五个融化任务”的全局槽限制是否保留，见
[`Q05`](fidelity-open-questions.md#q05-同时融化很多冰块时采用什么并发规则)。

**证据**

- `semantic/IceMelting.java`
- `semantic/DragonFireball.java`
- `engine/src/entities/original/ice-block.ts`

## P1：输入生命周期和画面校准

### A6. Dragon 从踩 Tail 起锁定普通输入

**现象差异**

当前 Bobby 踩下 Dragon Tail 后，在 Dragon 准备喷火的间隔里仍能继续移动；Fireball
消失后也立即释放控制。原版从 Tail 触发开始，到 Fireball 生命周期结束并经过短暂收尾前，
普通方向输入保持锁定。

**可能影响**

玩家可以在喷火准备阶段离开预期位置，降低机关约束；镜头跟随和输入恢复的先后也会显得
突然。

**目标行为**

Tail 触发时立即建立输入锁，贯穿 Dragon wind-up 和 Fireball 飞行，并在 Fireball 消失后
保留明确的收尾时间再释放。强制移动和其它 World 子系统继续按各自规则推进。

**原理说明**

输入锁属于持续 gameplay 过程，由 RuntimeAction 声明；Camera 使用同一过程提供的 focus，
但平滑移动仍由 Presentation 负责。

**证据**

- `semantic/DragonAttack.java`
- `semantic/GameplayCameraFocus.java`
- `engine/src/entities/original/dragon.ts`

### A7. 修正 Mower 人物图裁切

**现象差异**

`b7.png` 的左右人物各宽 `60px`，上下人物各宽 `48px`，并不是四个等宽方向列。当前按
四等分裁成 `54px`，会截断当前方向并带入相邻方向的像素。

**可能影响**

所有 Mower 方向都可能出现串图、偏移或边缘缺失。

**目标行为**

按 `Left 0/60`、`Right 60/60`、`Up 120/48`、`Down 168/48` 的源矩形裁切，左右方向使用
`-6px` 水平偏移，上下方向保持居中。

**原理说明**

该素材需要逐方向 source rect，不能使用统一 `frameColumns`。

**证据**

- `semantic/MowerPresentation.java`
- `engine/src/entities/player/bobby.ts`

### A8. 修正 Mower 与割草轨迹节拍

**现象差异**

原版普通 Mower 约每 `62ms` 切换人物帧，Speed Mower 约每 `31ms` 切换。`mow.png` 的
第 1 行用于割 High Grass，第 2 行用于 Speed 尾迹，而且每行只使用前四列。当前人物动画
约每 `16.7ms` 切换，轨迹只使用第 2 行、使用五列并固定为 `80ms` 一帧。

**可能影响**

Mower 抖动过快，割草时缺少对应效果，Speed 尾迹的帧序和速度也不正确。

**目标行为**

- 普通与 Speed Mower 分别使用原版确认的帧间隔；
- High Grass 割草显示 `mow.png` 第 1 行；
- Speed 尾迹显示第 2 行；
- 两类效果都只循环前四列，并使用各自确认的节拍。

**原理说明**

人物和轨迹可以由 PresentationClock 采样，但动画相位必须来自同一次 Mower 动作的状态，
不能各自读取无关的绝对帧奇偶。

### A11. 恢复 Bonus Coin 的随机闪光

**现象差异**

原版所有 Bonus Coin 共用随机 sparkle gate，大部分时间静止，触发后连续显示三帧。当前
每枚 Coin 都按绝对时间持续循环闪光。

**可能影响**

大量 Coin 会整齐同步闪烁，画面比原版更忙，也失去随机出现的质感。

**目标行为**

使用可测试的共享随机源模拟原版 `1/8` 稳态开启概率；一次触发的三帧各保持约
`124ms`。随机表现不进入 gameplay state。

**原理说明**

随机源属于 Presentation session，并应支持测试注入或固定 seed，避免依赖不可重放的
`Math.random()` 全局状态。

## 实施约束

1. 每项修改必须先建立最小 Engine 回归测试；涉及组合关系时再增加组合地图。
2. 持续过程影响通行、输入或碰撞时进入 RuntimeAction；纯画面变化留在 Presentation。
3. 未解决的开放问题不得在实现中顺便作出产品决定。
4. 每个逻辑阶段独立提交，并执行 `npm run verify`。
