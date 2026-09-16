# 待确认的 Fidelity 问题

本文记录已经观察到、但产品结论或精确目标尚未确认的差异。这里的问题不能直接作为实现
要求；完成验证或产品审阅后，应移动到设计决策或已确认实施清单。

## 空间、通行与组合

### Q01. High Grass 遮住目标时应该怎样参与通行

**现象差异**

原版 Mower 可以进入隐藏 Carrot 的 High Grass，抵达后割草并露出目标。当前 Adapter 把
Carrot 和 High Grass 同时放在一格；Carrot 先以“不可由 Mower 收集”为由挡住移动，导致
外层 High Grass 没有机会被割掉。隐藏 Egg 没有同样的阻挡，所以两类隐藏目标表现不同。

**可能影响**

含隐藏 Carrot 的官方割草关可能无法推进。若简单规定“只看最上层 Entity”，Water、Tide、
Snow 或多层自定义组合又可能丢失必要的底层地面事实。

**原理说明**

原版只有一个 terrain 槽和一个 object 槽，`0xC8` 本身就代表特殊 High Grass。现代地图把
地面、目标和覆盖物拆成多个 Entity，需要定义“覆盖物遮住了哪些碰撞和 touch 行为”，而
不是把原版两个槽的优先级直接套到任意多层堆叠。

**待确认**

需要确认 Mower、普通 Bobby 和 Flight 分别读取哪些被遮蔽 Entity，并用至少
`Grass/Water + Carrot/Egg + High Grass` 的组合地图验证。

### Q02. Engine 应该怎样表达格子中的地面、主体和覆盖物

**现象差异**

当前部分 Entity 明确声明 `surface / object / cover`，部分只靠默认值和 `stackOrder`。
同样看起来位于地面的机关，叠上 Plank、Beanstalk 或 Mower 后可能因为 metadata 不同得到
不同通行结果。例如 Tide、Trap、Mirror、Carousel 和部分 Switch 缺少统一的空间声明。

**可能影响**

普通官方地图通常只有简单叠放，问题不明显；Editor 可以创建多层组合，此时下层是否算
可站立地面、上层是否遮挡目标会变得不可预测。它同时影响 Mower、Bean、Inspector 和
通用通行查询。

**原理说明**

`stackOrder` 只能回答同格先后，不能回答“是否平坦”“是否承载 actor”“是否遮住下层
交互”。此前草案提出 `substrate / occupant / cover + elevation`，但这只是候选模型，且与
现有 `docs/reference/runtime-layering.md` 的表述存在冲突。

**待确认**

先列出所有相关 Entity 的实际空间事实和查询使用者，再决定是补全现有 layer、增加独立
物理 profile，还是采用更小的能力集合。不能先确定类型名字再反推规则。

### Q03. Beanstalk 具体可以长过哪些现代 Entity 组合

**现象差异**

原版允许 Beanstalk 长过 raw terrain `<= 0x5D` 且 object 为空的格子，其中包括 Tide、
Water、Waterfall、Snow 和 Sky 的若干表示。现代 Entity Map 可以把这些内容与额外 Entity
任意叠放，已经超出原版单 object 槽能表达的范围。

**可能影响**

允许范围过窄会截断官方藤蔓路线；允许范围过宽会让藤蔓穿过墙、角色或其它高位机关。

**原理说明**

已确认的方向是移除 Bean 专用空间 trait，改用通用承载与占用事实。仍需把原版 raw 范围
翻译成现代 `Grass / Water / Waterfall / Tide / Snow / Sky + overlay` 组合表。

**待确认**

为每类 substrate 建最小原版验证图，确定 Snow 作为覆盖物时看底层还是看 Snow 自身，并
明确 Plank、目标物和角色是否占用藤蔓空间。

### Q04. Ice 撞墙后是否要在同一拍接续玩家输入

**现象差异**

原版自动滑行撞到障碍后，会在同一次移动决策中继续读取玩家按住的方向。当前 Ice Action
先结束，普通输入要到后续 World tick 才能重新生效。

**可能影响**

通常只差一个 tick，手感上可能不明显；在紧邻其它自动机关或多 Bobby 同拍移动时，先后
顺序可能改变。

**原理说明**

原版把自动滑行和普通输入写在同一条过程里。当前 Engine 把它们分成 RuntimeAction 与
InputController 两个阶段。

**待确认**

先用可持续按键的最小地图确认是否存在实际解法差异，再决定是否增加同拍 handoff。

## Dragon、Fireball 与 Ice Block

### Q05. 同时融化很多冰块时采用什么并发规则

**现象差异**

原版最多同时维护五个 Ice Block 融化任务；第六个开始时，最早的目标会立即结束。现代
Engine 可以让每个 Ice Block 独立持有融化状态。

**可能影响**

只有能连续命中六块以上冰块的自定义布局会观察到差异。复制原版上限会让最早的冰块突然
消失，逐实例处理则更直观。

**原理说明**

五个上限来自原版固定数组容量，不一定是关卡规则。需要区分资源限制和设计机制。

**待确认**

决定采用原版五槽语义，还是让所有 Ice Block 独立完成融化。

### Q06. Fireball 的格内移动和碰撞精度

**现象差异**

原版 Fireball 每个 gameplay step 在格内移动 `6px`，接近格子边界时提前检查下一格，
Mirror 的转向到真正跨过边界才生效。当前 Engine 把 Fireball 表达成一格一格的移动，
每次开始整格运动前完成碰撞判断。

**可能影响**

静态直线路径通常相同；如果 Mirror、Ice Block 或其它动态 Entity 恰好在火球接近边界时
改变状态，命中对象、转向时间和画面位置可能不同。

**原理说明**

原版碰撞读取连续像素位置，当前 Engine 的规则入口主要读取整数 anchor、WorldMotion 和
格子 reservation。要提高精度，需要明确哪一个格内进度点产生碰撞事件，而不是只缩短
Presentation 动画。

**待确认**

先构造“火球接近边界时旋转 Mirror”和“动态目标横穿路径”的验证图，确认官方玩法是否
依赖这三个子步的提前量。

### Q07. Fireball 生成后的第一步是否必须同拍发生

**现象差异**

原版 Dragon 完成喷火准备后，会在同一个 gameplay step 立刻推进新 Fireball。当前
Fireball 建立自己的 RuntimeAction 后，要到下一个 World tick 才开始第一次推进。

**可能影响**

火球整体晚一个 tick；在 Fireball 出生格附近存在动态碰撞时，结果也可能不同。

**原理说明**

原版用固定子系统顺序让 Dragon 更新先于 Fireball。当前 Action scheduler 在本轮遍历开始
后不会再次更新刚创建的 Action。

**待确认**

测量可见延迟并验证出生点附近碰撞，再决定支持“同拍首步”还是保留稳定的下一 tick 启动。

## 移动平台与风

### Q09. Cloud 和 Leaf 相遇时使用像素碰撞还是整格占用

**现象差异**

原版按两个 `48×48px` 方框的实际位置判断动态碰撞：同方向移动的对象可以保持间距跟随，
交叉路径也要等方框真正重叠才停。当前 Engine 在规划整格移动时预留目标格，两个对象只要
争用同一格就会提前阻挡。

**可能影响**

Cloud 或 Leaf 编队会停得更早，同向跟随、擦肩和交叉路线的最终位置可能不同，进而改变
Bobby 被携带后的落点。

**原理说明**

原版以连续像素坐标同时承担规则和画面；当前 Engine 用整数格保证事务和 Replay 确定性，
WorldMotion 只提供连续过程。若采用连续碰撞，必须定义它怎样参与 reservation 和同 tick
提交。

**待确认**

用同向追逐、垂直交叉和迎面相遇三张最小图比较结果，再决定哪些动态 Entity 需要连续碰撞。

### Q10. Cloud 和 Leaf 是否应越过路线上的普通 Object

**现象差异**

原版规划 Cloud 和 Leaf 路线时主要检查各自可运行的 terrain、风和其它移动对象，不读取
普通 object 槽。当前 Engine 把目标格中几乎所有非路线 Entity 都视为障碍，例如 Cloud
会停在 Plank 前。

**可能影响**

同一地面上叠放 Plank、收集物或其它普通 Object 时，移动平台的路线长度会不同。自定义图
尤其容易构造这种组合。

**原理说明**

现代 Entity Map 没有原版 terrain/object 两槽的天然过滤条件，需要明确平台规划读取的是
地面 domain、实体高度还是完整格子栈。

**待确认**

先决定这类叠放在现代地图中是否合法，再为合法组合列出平台应忽略和应阻挡的空间事实。

### Q11. 多个方向的 Wind 重叠时如何选择逆风

**现象差异**

原版会专门查找移动反方向的 Wind。当前 Engine 按查询顺序取第一条与当前方向不同的 Wind；
如果先遇到垂直风，可能漏掉后面的水平逆风。

**可能影响**

只有多个 Wind Entity 覆盖同一格时出现，Cloud 或 Leaf 可能继续前进，也可能被错误方向的
风影响。

**原理说明**

“不是顺风”和“正好是逆风”是两个不同条件。多 Entity 地图还需要定义同格风的优先级。

**待确认**

确认重叠 Wind 的合法性；若允许，明确逆风优先、叠加或固定排序规则。

### Q12. Wind Switch 是否需要原版镜头和输入过程

**现象差异**

原版把 Wind Switch 从 Off 切到 On 后，镜头先看 Windmill，再跟随第一朵真正改变方向的
Cloud；这段过程约持续 `64` 个 gameplay step，并锁住普通输入。当前 Engine 立即切换风和
路线，Camera 与玩家输入没有这段过程。

**可能影响**

玩家可能看不到远处哪朵 Cloud 被改变，也能在机关演示期间继续行动，造成下一步状态与原版
不同。

**原理说明**

状态切换是即时 World mutation，镜头目标和输入锁是持续 gameplay 生命周期。若保留，应该
由 RuntimeAction 表达，Camera 只负责平滑跟随。

**待确认**

确认 Adventure 的信息边界是否需要这段强制演示，以及 Explore / 自定义地图是否使用同一
规则。

## 组合顺序与 World 时点

### Q13. 同一格叠放多个机关时触发一个还是全部触发

**现象差异**

原版每格只有有限的 terrain/object 状态，并在一些机关处理后立即结束本次中点逻辑。例如
Plank 叠在 Switch 上时只登记 Plank，Whirlwind 叠在 Trap 上时只开始起飞。当前 Engine
会遍历完整 Entity stack，因此一次移动可能把同格所有适用 Behavior 都触发。

**可能影响**

官方 DAT 通常无法表达这些叠放，主要影响 Editor 自定义地图。采用全部触发更具组合性，
采用原版优先级则会让部分下层机关在视觉上存在却不响应。

**原理说明**

原版的 early-return 同时承担流程控制和单槽限制；现代 Behavior composition 刻意允许多个
Entity 响应同一 lifecycle。两者没有天然等价关系。

**待确认**

决定现代组合语义：完整组合、明确优先级，或由 authoring 规则禁止存在歧义的叠放。

### Q14. 多个持续机关在同一 tick 更新时采用什么顺序

**现象差异**

原版每个 gameplay step 固定按“玩家持续动作 → Fireball → Cloud/Leaf → Bean → 环境动画
→ Camera”更新。当前 RuntimeAction 主要按创建顺序推进，并在阶段边界统一提交结果。

**可能影响**

单个机关通常只差一个 tick；当 Fireball、Bean、移动平台或其它长动作在同一格、同一 tick
相交时，后更新者看到的是旧状态还是刚变化的状态，可能改变碰撞和停止位置。Fireball 首步
延后就是一个可观察例子。

**原理说明**

原版顺序来自一组写死的全局子系统。现代 Engine 把持续过程拆成多个 RuntimeAction，需要
在“按 Entity/Action 稳定排序”和“为机制建立固定 phase”之间选择。

**待确认**

先收集至少两个会改变实际结果的组合图，再判断是否值得增加机制 phase；不能为了形式上像
原版而重建整套全局更新器。

## 环境表现与音乐

### Q16. Snow、Butterfly 与 Sky shimmer 是否进入正式 Renderer

**现象差异**

原版有三类地图环境表现：存在 Snow 时显示五粒跟随 Camera 的雪花；其它地图运行一只随机
Butterfly；Sky 空格维护三个随机 shimmer。当前 Gameplay Renderer 没有这些效果。

**可能影响**

不改变解法，但雪地图、普通户外和天空场景缺少明显的原版氛围。

**原理说明**

三者都是 Presentation 状态。是否出现取决于地图 Entity，随机位置和动画由表现时钟管理，
不应进入 World snapshot。

**待确认**

确认三类效果的产品优先级，以及随机表现是否需要 session seed 以支持稳定视觉测试。

### Q17. Mower 与 Timed Bonus 是否动态切换音乐

**现象差异**

原版完成 Mower mount 后播放 `/mow.mid`，Parking 下车后恢复关卡音乐；Timed Bonus 在
Lock 打开、倒计时开始时切换 Bonus 音乐。当前 Web 在载入关卡时选曲一次，不消费这些
WorldEvent 动态切换。

**可能影响**

地图规则保持正确，但 Mower 和 Bonus 挑战缺少原版的音乐反馈。恢复曲目时还必须知道进入
覆盖音乐前播放的是哪一首。

**原理说明**

Engine 已报告 mount、dismount 和 countdown 事件，争议在于地图内选曲由 Engine Audio
处理还是宿主产品处理。该边界与
[`docs/decisions/background-music-selection-ownership.md`](../../../docs/decisions/background-music-selection-ownership.md)
是同一个未决问题。

**待确认**

先完成音乐职责 ADR，再决定事件消费者和恢复策略。
