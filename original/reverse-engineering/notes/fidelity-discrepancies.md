# 原版 Entity 语义与当前 Engine 差异

本文件以 UP09 `a.class`、`original/reverse-engineering/semantic/` 和当前
`engine/src/entities/`、`engine/src/world/` 的控制流为依据，记录截至 2026-09-12
已经交叉确认的差异。它是后续实现的审阅入口，不表示这些差异都应该照原版修复。

审计边界是单张纯语义 `LevelMap` 的地图内运行。Adventure Save、全局经济、永久商品、
章节流程和宿主交互脚本不属于本表的单关重放合同；涉及这些能力的差异单独标为产品选择。

标记：

- **确认**：原版控制流与当前实现都已定位，能够说明具体分歧；
- **组合图**：官方地图未必使用该叠放方式，但 Editor / 自定义 `LevelMap` 可以构造；
- **产品选择**：当前语义有明确产品目的，不应只因原版不同就直接回退。

## 优先摘要

| 优先级 | 差异 | 直接影响 |
|---|---|---|
| P0 | High Grass 下的隐藏 Carrot 会挡住 Mower | 原版可完成的胡萝卜割草关可能无法推进 |
| P0 | Beanstalk 不能越过 Tide | 原版可成立的藤蔓路径会提前停止 |
| P0 | Snow 被瞬间清除并直接通过 | 少了约 992ms 铲雪动作、输入锁和自动重试 |
| P0 | Ice Block 被 Fireball 瞬间删除 | E4/E5/E6 三阶段、并发上限与中间碰撞状态缺失 |
| P0 | Mower 可以进入 Mirror | 与原版明确的 Mower 通行规则相反 |
| P1 | Bobby、Speed、Flight 的格移动时长偏快 | 当前 350/175/350ms，原版约 496/248/496ms |
| P1 | Cloud / Leaf 使用整格占用而不是原版像素碰撞 | 同向跟随、交叉和动态相撞结果可不同 |
| P1 | Mower sprite 裁切和动画节拍错误 | `b7.png` 被错误四等分，`mow.png` 行、帧数和速度均不符 |
| P1 | Dragon / Fireball 的单例、碰撞相位和镜头生命周期不同 | 多 Dragon、Mirror、Ice Block 与输入解锁时机会不同 |
| P1 | 通用 Behavior 堆叠没有复现原版 midpoint early-return | 同格多机关组合会一次触发多项原版不会同时触发的规则 |

## Gameplay 与状态机

### 1. High Grass 隐藏目标

**确认。** 原版 `0xC8` 允许 Mower 进入，抵达后割草，并根据本关目标类型恢复
Carrot 或 Empty Egg Nest。目标在载入时已经计数。

当前 Adapter 会把隐藏目标预先 materialize 为同格 Carrot / Egg，再覆盖一层
High Grass。`collectible.canEnter()` 原本试图通过 `hidden-objective` trait 让 Mower
穿过隐藏 Carrot，但仓库中没有任何 Definition 或实例真正提供这个 trait。因此：

- 隐藏 Carrot 先以 `mower-cannot-collect-carrot` 阻挡移动，High Grass 来不及清除；
- 隐藏 Egg 没有同样的 Carrot 阻挡，两个目标类型出现不对称行为。

证据：`tools/original/entity-adapter.mjs`、`engine/src/entities/behaviorLibrary.ts`、
`semantic/LevelObjectives.java`、`semantic/MowerRuntime.java`。

### 2. Bean / Beanstalk 与 Tide

**确认。** 原版生长条件是“目标 object 为空且 terrain raw `<=0x5D`”，因此能长过
Sky、Snow、Water、Tide 和 Waterfall。

当前 `bean-field.ts` 要求目标格存在 `bean-growth-space`，并要求每个非 Surface
Presence 也提供该 trait。`tide.ts` 同时缺少 `layer: "surface"` 和
`bean-growth-space`，所以 Tide 会截断生长。这正是实测“藤蔓被 Tide 阻挡”的原因。

当前模型对任意额外叠放 Entity 也比原版严格：原版只检查单个 object byte；当前会让
不带 `bean-growth-space` 的 Cover / Object 阻止生长。对合法 DAT 通常等价，对组合图
并不等价。

藤蔓上的 Bobby 表现也有差异：原版 Tip / Mid / Base 都强制使用 `b2.png` 的 Up
人物 strip；当前 `World.isActorClimbing()` 没有进入 Bobby Visual resolver，角色仍按
实际朝向显示。

### 3. Snow / Shovel

**确认。** 原版有 Shovel 时，本次碰撞仍失败，然后播放 32 gameplay step、约
992ms 的阻塞动作；动作结束才把 Snow 改为 `0x7C`，再自动重试保存的方向。没有
Shovel 时显示闪烁的缺失物品提示。

当前 `shovelable.resolveEntry()` 在碰撞解析期直接删除 Snow，并以
`clear-and-pass` 完成本次移动。当前 Bobby Visual 虽然定义了 `shovel` 分支，实际
Gameplay 不会启动它；无 Shovel 时也只剩普通阻挡，没有 `missing-item` 事件。

`b8.png` 原版动画在动作期间循环：四方向各 72px 宽，三行由 `av/3` 选择，每行约
保持 6 gameplay step。当前 Visual 若被外部强制进入 `shovel`，只按整段 progress
单向走三行，也不是原版节拍。

### 4. Ice

当前 Ice 已能继承进入动作的 cadence，连续滑行主路径与原版接近，仍有三项确认差异：

1. 原版按“当前所在格是否为 Ice”开始续滑；当前只在 `onEnter` 创建 Action。地图开局
   直接把 Bobby 放在 Ice 上时，当前不会自动滑行。
2. 原版前方阻塞后在同一次 movement decision 继续读取 held direction；当前 Action
   先失败并取消，普通输入要等后续 World tick。
3. 原版滑行固定 zero-based frame 1，即人物 strip 第 2 帧；当前固定 frame 6，即第
   7 帧。

### 5. Speed

Speed 的“三格、同向 held 续期、碰撞清零、恒定快速度”状态机已经与原版主路径对齐。
仍有两个边界差异：

- 与 Ice 一样，当前依赖 `onEnter`；Bobby 开局已经站在 Speed 上时不会按板方向启动；
- 原版 Mower 站在 Speed 上会用 `speedProbe=true` 预探并撞碎下一格 Crumbly Rock；
  当前开局没有 Speed Action，也就没有这条预探路径。

### 6. Mower 通行、割草与冲撞

**确认。** 当前 Mirror 只有旋转 `onLeave`，没有对 mounted Bobby 的进入限制，因此
Mower 能驶入 Mirror；原版明确拒绝。

原版割草后从四张普通地面中运行时随机选一张。为保证纯 `LevelMap` 和 Replay 可复现，
当前 Adapter 用坐标确定性预选底图。这是可观察的画面差异，也是合理的确定性取舍。

原版 Speed Mower 撞碎 Crumbly Rock 后有 8 gameplay step、约 248ms 的大幅随机
Camera shake。当前虽然发出 `crumbly-rock-smashed` 和 `shakeSteps: 8`，Game 只消费
`speed-impact`，所以撞石头没有 shake。普通 Speed impact 的当前 shake 也只有默认
150ms / 6px；原版随机 span 从 42px 逐步衰减到 0，持续约 248ms。

### 7. Plank

基本通行与“离开后立即失去桥面能力”已经对齐。差异在衰变并发：原版只追踪一块旧
Plank；新 Plank 开始 D5 衰变时会立即清掉此前仍在 D5/D6 的那块。当前每个
`plank-decay-started` 都创建独立 Presentation transient，因此多块可以同时播放完。

### 8. Lock 与地图内钥匙

当前开锁后只设置 `opened=true` 并隐藏画面，Lock Entity 及其 `gate` / `blocking` traits
仍留在 SpatialIndex；原版在 midpoint 直接把 object 改为空。普通通行由 `canEnter`
特判后相同，但 Entity 查询、同格组合和未固定 variant 的 Fence 邻接仍会把已打开的
Lock 当作 Gate。

原版无钥匙会显示 Key 缺失提示；当前 `lock.ts` 不发 `missing-item`。

`requireKey=false` 的默认值让 Explore 的 Lock 可直接打开；Adventure 再通过 patch 要求
钥匙。这是让单张 Explore 地图独立可玩的**产品选择**，不是待机械回退的缺陷。

### 9. Kite / Whirlwind / Landing

飞行期间绕过普通 terrain/object 的主规则与原版一致。异常路径不同：原版没有地图边缘
自动降落，官方地图必须在出界前放置 Landing；当前边界检查拒绝 forced move，取消
Flight Action，并把 Bobby 恢复 grounded。自定义图如果缺 Landing，会得到不同状态。

### 10. Dragon / Fireball / Ice Block

**确认。** 当前与原版有以下成组差异：

- 原版整张地图只有一套 Dragon Head / wind-up / Fireball 全局状态；Fireball 未结束时
  其它 Tail 不能再次启动。当前每只 Dragon 独立持有 Action，可同时生成多枚 Fireball。
- 原版 Head 的 E8/E9 攻击帧意外不在 Bobby blocking 集合中，wind-up 时可以走入；
  当前 footprint 的 Head 始终带 `blocking`。
- 原版 Fireball 每 gameplay step 移动 6px，在距 tile boundary 还剩 3 个子步时检查
  terrain/object，Mirror 的 pending turn 到边界才生效。当前按整格 Action 检查并移动，
  动态 Entity 或同 tick 机关变化会有不同交互时序。
- 原版命中 Ice Block 后立即 E3→E4，随后 E4→E5→E6→empty，每阶段约 186ms，最多
  5 个并发融化任务；第 6 个会立即清掉最老目标。当前直接 destroy Ice Block；已有
  `meltStage` Visual 字段没有 Gameplay 写入者。
- 原版 Fireball 存活时每 step 刷新镜头，消失后仍保留最多 16 gameplay step 的 input
  gate / focus countdown。当前 Action 消失即释放 focus 和普通输入。
- 原版 Dragon wind-up 完成后，同一 gameplay step 的后续 `Q()` 就能推进新 Fireball；
  当前新 Fireball 先由 `onTick` 建立自己的 Action，首次推进至少晚一个 World tick。

Fireball 不检测 Bobby 的碰撞，这一点当前与原版一致。

### 11. Cloud / Leaf / Tide / Wind

方向、Tide 逆流、Waterfall 加速、同色 Cloud Parking 和“Leaf 停下后需下船再登船”主规则
已经对齐。剩余差异集中在动态碰撞和跨 Entity 作用：

- 原版以 48x48 pixel box 每 gameplay step 检查动态 Entity；规划时特意忽略同方向
  moving entity，子步时只与仍在移动的 Entity 碰撞。当前以 anchor / 目标格 reservation
  做整格冲突，跟随、擦肩和交叉的停顿位置会不同。
- 原版 Cloud / Leaf 的路线规划只检查各自 terrain domain、风和其它 moving entity，
  不读取 objectGrid，因而能越过 domain 上叠放的普通 Object。当前
  `movingSupportOccupiedAt()` 把几乎所有非 domain Presence 都当障碍；例如当前测试明确
  要求 Cloud 停在 Plank 前，这与原版相反。
- 多个方向风区重叠时，原版逆风判定会专门检查运动反方向。当前 `forcedWindAt()` 返回
  第一条非当前方向的生效风；若先命中垂直风，可能掩盖后面的水平逆风。
- 原版 Wind Switch 从 Off 切 On 会先聚焦 Windmill，再把镜头交给第一朵真正被改向的
  Cloud，并在约 64 gameplay step 内阻塞普通输入。当前只切状态和路线，没有这段镜头 /
  input lifecycle。

## Entity 之间的组合顺序

### 12. Midpoint early-return

**确认，组合图。** 原版 `J()` 顺序是：先结算一种 previous-leave marker，再处理当前
object，最后处理 terrain；Whirlwind 和 Plank 会提前 return。当前 Movement lifecycle
会遍历完整 source / target stack 并运行所有适用 Behavior。

因此自定义叠放会出现差异，例如：

- Plank 叠在 Switch 上：原版登记 Plank 后返回，当前还会触发 Switch；
- Whirlwind 叠在 Trap / Switch 上：原版开始 takeoff 后返回，当前可同时触发 terrain；
- 同时存在多种 previous-leave marker：原版按 Trap→Carousel→Mirror→Plank→Egg 的
  优先级一次只结算一个，当前会在同一 marker 执行所有 source `onLeave`。

纯 `LevelMap` 允许堆叠，因此这不只是 DAT 异常输入问题；需要明确现代组合语义究竟以
原版优先级还是 Behavior composition 为准。

### 13. Surface layer 缺失造成的组合差异

**确认，组合图。** Tide、Trap、Mirror、Carousel、Color Block 和多类 Switch 使用
`SURFACE_STACK_ORDER`，但 Definition 没声明 `layer: "surface"`；SpatialIndex 会把它们
默认为 Object。除检查器显示不准确外，这会影响明确读取 layer 的机制。

例：原版 Mower 在底层 terrain 本来可走时，可以穿过同格 Plank / Beanstalk overlay。
当前 overlay 只认 `presence.layer === "surface"` 的底层 walkable；叠在 Trap、Switch 等
当前“Object layer”地面上时会误判为没有可走底面。Mirror / Carousel 本来就拒绝 Mower，
不受这个例子影响。

### 14. Runtime subsystem 固定顺序

**确认。** 原版一拍使用固定子系统顺序：Player core（含 Plank、Ice melt、Dragon
wind-up）→ Fireball → Moving Entities → Bean growth → Tile animation → Ambient →
Camera shake。当前 RuntimeAction 按创建 id 更新，并把同批 commands / intents 分阶段
统一提交。

单机制时通常只影响一个 tick 的边界；多个长动作在同一格或同一 tick 相交时，后一个
机制看到的是旧状态还是前一个刚提交的状态，可能与原版不同。Dragon 完成 wind-up 后
Fireball 首拍延后，就是已经能单独观察到的例子。

### 15. Exit 完成时点

原版在移动跨过格中点时检查 Exit 并开始 Bobby clear transition。当前 Reach condition
虽然在 anchor 更新后已经成立，但 `completionReady()` 会等全部 motion 抵达再完成世界，
因此胜利表现比原版晚半格移动。

## Presentation、节拍与音乐

### 16. Bobby 基准移动

原版普通 Bobby 为 3px/gameplay step，48px 约 16 step，即约 496ms/格；Fast / Speed
为 6px/step，约 248ms/格。当前名为 `ORIGINAL_BOBBY_LOCOMOTION_TIMING` 的默认值是
350ms，Speed 是 175ms，Flight 也继承 350ms。

这会让 Bobby 相对 Bean、Cloud、Leaf、Dragon 等仍按 `31ms * step` 换算的机关明显偏快，
也会改变多机制相遇的顺序。`docs/decisions/mixed-clock-runtime-actions.md` 与
`docs/contracts/engine-api.md` 当前把 350ms 写成原版默认，和逆向事实文档
`docs/reference/runtime-animation.md` 的 496ms 结论互相矛盾。

### 17. Mower `b7.png` 裁切

**确认。** `b7.png` 是 216x166，两行各 83px，但不是四个等宽方向列：

| 方向 | source x | 宽 | x offset |
|---|---:|---:|---:|
| Left | 0 | 60 | -6 |
| Right | 60 | 60 | -6 |
| Up | 120 | 48 | 0 |
| Down | 168 | 48 | 0 |

当前声明 `frameColumns: 4, frameRows: 2`，把每列裁成 54px，所以四个方向都会串图或截断。
精确证据已固化在 `semantic/MowerPresentation.java`。

### 18. Mower 与 `mow.png` 节拍

原版普通 Mower 两帧约每 2 gameplay step（62ms）切换；Speed Mower 每 step（31ms）
切换。当前直接用 60Hz Presentation frame 奇偶，约 16.7ms 切换，且不区分速度。

`mow.png` 为 5列x2行，但原版 `aD % 12 / 3` 只使用前 4 列：row 0 表示正在割
High Grass，row 1 表示 Speed 尾迹。普通割草约 186ms/帧，Speed 尾迹约 93ms/帧。
当前：

- 只画 row 1；割 High Grass 的 row 0 效果缺失；
- 使用全部 5 列；
- 固定 80ms/帧；
- 动画相位来自绝对 Presentation 时间，不来自原版与 Bobby/Mower 共用的 `aD` gate。

### 19. Bobby 其它帧

- Idle：原版约 4.96s 后进入，约 62ms/帧，按 `0→1→2→1→0` ping-pong；当前
  5s 后以 50ms/帧做 `0→1→2→0` 循环。
- Ice：原版 frame 1；当前 frame 6。
- Beanstalk climbing：原版强制 Up strip；当前未接入 climbing 状态。
- Level enter / clear：当前使用 310ms / 279ms。`O()` 中 `aw=6` 仍受 `bf` 隔次门控，
  原版可见/逻辑帧约每 62ms 推进；当前时长约短一半。进入与通关使用 10 个逻辑槽、
  素材只有 8 帧这一映射本身是正确的。

### 20. Fireball 与 Ice melt 画面

原版 Fireball 使用 HUD 中两张 28x28 sprite，每 4 gameplay step、约 124ms 换帧。
当前是程序绘制的两层圆，并以 Presentation frame 做 4/4 明暗脉冲。

Ice Block 的 E4/E5/E6 atlas 帧已经登记，但因 Gameplay 直接销毁目标，运行中不会显示。

### 21. Plank、Bonus Coin 与通用 ambient

- Bonus Coin 原版使用全场共享随机 sparkle gate，稳态开启概率 1/8；一次触发显示三帧，
  每帧约 124ms。当前每枚 Coin 都按绝对时间稳定循环，完全没有随机静默区。
- 原版 Water、Tide、Windmill、Speed、Exit、Whirlwind 等共享 phase 每 4 gameplay step，
  约 124ms 推进一步。当前 `ORIGINAL_AMBIENT_FRAME_MS=248`，整体慢一倍。
- Plank 单块的两阶段总时长当前按 372ms 配置，与原版近似；并发所有权仍见第 7 节。

### 22. Missing-item、天气与星光

原版 Gas / Key / Kite / Shovel / Bean 缺失提示使用 `hud.png` 图标，持续 32 gameplay
step、约 992ms，并以 50% duty cycle 闪烁。当前 Gas、Kite、Bean 只发
`missing-item` WorldEvent，Snow / Lock 连事件也没有；Renderer / HUD 没有消费这些事件
绘制提示。

原版只要地图存在 Snow，就显示固定 5 粒随 Camera 修正的雪花；否则始终运行一只随机
Butterfly。Sky 空格另有 3 个活跃 shimmer slot。当前 Gameplay Renderer 没有这三套
环境表现。

### 23. 动态音乐

原版 Mower mount 完成后切换 `/mow.mid`，Parking dismount 后恢复普通关卡音乐；当前
虽然 AudioRuntime 已登记 `mow`，Web 只在载入关卡时选一次音乐，没有消费
`mower-mounted` / `mower-dismounted`。

原版 Timed Bonus 在打开 Lock、倒计时正式开始时从 Shop 音乐切到 Bonus 音乐；当前
`death-countdown-started` 也没有动态切曲。当前 Countdown 使用 World 游戏内时间，
而不是原版 `System.currentTimeMillis()`；这是为了暂停和 Replay 确定性的**产品选择**。

## 明确的产品差异

以下行为确实与原版不同，但属于当前单关 / Adventure 边界设计，修复前必须先确认产品
目标，不能作为普通 fidelity bug 直接处理：

- Explore 的 Lock 默认 `requireKey=false`，Adventure 用 level patch 开启钥匙要求；
- Lock Key 是现代 `LevelMap` 的关卡内可收集 / 消耗机关，原版临时许可来自 Campaign
  对话，永久 Super Key 来自全局商品；
- Shop 商品当前为 blocking touch interaction，原版 `0x97..0x9D` 是可进入 terrain，
  在 midpoint 打开购买对话；
- High Grass 割后底图以坐标确定性选择，服务纯地图和 Replay 重建；
- Countdown 使用可暂停、可重放的游戏内时间；
- 多 Bobby、通用对话、多选项和自定义 Portal 是现代扩展，没有原版一一对应物。

## 已复核对齐的高风险项

为避免旧审计结论继续误导实现，以下项目已在当前分支复核，不再列为差异：

- Tide raw 方向：`0x57 Down / 0x58 Up / 0x59 Right / 0x5A Left`；
- Speed / Carousel / Tide Switch 的 triggerable 与 latched 状态；
- Speed 三格恒定快速度与同向 held 续期；
- Carousel 的进出方向、离开旋转和 Switch 全图旋转；
- Mirror 顺时针离开旋转及 Fireball 反射真值表；
- Trap 离开后激活、Egg 离开后填充、Carrot 留坑；
- Leaf 的 Tide / Waterfall 路由、Cloud 同色 Parking、moving support 携带 Bobby；
- Beaver / Sandman / Dream Machine 以 Body 为语义 anchor，interaction 只由 Body
  Presence 发出。

## 建议的实现批次

若进入修复阶段，建议按可回滚边界处理：

1. 先修直接改变通关能力的 High Grass、Bean/Tide、Mower/Mirror；
2. 再实现 Shovel 与 Ice melt 两个完整 RuntimeAction；
3. 单独校准 Bobby/Mower/ambient 的素材裁切与节拍；
4. 再处理 Cloud/Leaf pixel collision、Dragon/Fireball 与固定 subsystem order；
5. 最后决定组合图 early-return、Lock Entity 删除语义和动态音乐等产品取舍。

每一批都应补“单 Entity + 至少一个跨 Entity 组合”的最小回归地图和 Replay fixture。
