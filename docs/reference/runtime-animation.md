# 原版运行时动画与动态对象

本文记录从 Bobby Carrot 5 UP9 高清版 `a.class` 字节码中已经确认的运行时事实，并说明 Web Engine 如何在 **WorldClock + PresentationClock + RuntimeAction** 架构下承接这些节拍。逆向事实与现代实现必须分开描述。

## 1. 原版主循环事实

原版 `run()` 的外层循环目标周期约为 **62ms**，但每个外层周期会调用两次 runtime advance `b()`：

```text
outer loop start
  -> b()
  -> repaint / serviceRepaints（需要时）
  -> b()
  -> 补 sleep，使整个 outer loop 约 62ms
```

因此需要区分两个代码结构上的时间单位：

- outer loop：目标约 62ms，约 16Hz；
- gameplay step：一次 `b()` 调用，按循环目标换算约 31ms，约 32Hz。

`H/N/P/Q/R/S/V/...` 等 gameplay 方法按 `b()` 调用推进，而不是每个 outer loop 只推进一次。原版以“6 step / 16 step”实现的机关，应先保留 step 数这一结构事实，再用同路径墙钟实测校准可执行的毫秒值。循环目标、设备调度、模拟器与每轮工作耗时都可能使实际墙钟间隔偏离 31ms。

### 墙钟校准记录

时间结论分为三层，不得用其中一层替代其余两层：

1. 原版结构事实：每 step 位移量、状态所需 step 数与帧相位；
2. 原版墙钟实测：固定地图、起止事件、距离与运行环境；
3. Engine 毫秒配置：在不同 World / Presentation 帧率下保持的可执行时间。

当前直接校准结果：

- Fireball 和 Kite Flight 都为 48px / 6px，即 8 gameplay step/格；
- `custom-maps/original-patch/38/38-1.json` 的 100 格人工计时中，Bobby、Leaf、Cloud、
  Ice Floor Slide 均约 42s，Kite Flight、Speed、Speed Mower、Fireball、Speed Shoes Bobby
  均约 21s；
- `custom-maps/original-patch/38/38-2.json` 的 50 格人工计时中，Waterfall 约 11s，
  Bean Growth 约 21s；
- 上述结果支持原版慢速 `416ms/格`、原版快速 `208ms/格`；50 格 Waterfall 的
  `10.4s` 与 50 段 Bean 的 `20.8s` 也落在人工计时误差内；
- Fireball 长路径与 37-2 的 82 格纯 Flight 实测同样支持约 `208ms/格`；
- 37-2 的 Whirlwind `x=4` 到 Landing `x=86`，理论 Flight 时长为
  `82 × 208ms = 17.056s`，原版人工计时约 18s。

长路径人工计时允许约一秒的观察误差。Engine 在
`engine/src/entities/movement/MovementCadence.ts` 集中维护两档原版速度和两档 Bobby
调校速度，并由每种 Entity 的独有配置引用。后续实现不以追平原版设备循环或模拟器调度的
逐拍误差为目标。

这项校准只确认同类快速位移的墙钟节拍，不会把所有原版 step 计数机械换算为 26ms。其他机关仍需保留自己的结构证据并独立校准。

这是原版实现事实，不代表 Web 版必须复制这种“双 update + 单 repaint”的循环结构。

## 2. Web Engine 混合时钟

Web Engine 明确拆成：

```text
requestAnimationFrame
        │
        ├──────────── PresentationClock
        │                 │
        │                 ├─ VisualRuntime
        │                 ├─ Camera
        │                 ├─ Tween / sprite
        │                 └─ ambient animation
        │
        └──────────── WorldClock
                          │
                          ├─ InputController
                          ├─ World / Behavior
                          └─ RuntimeActionScheduler
```

### WorldClock

当前默认 `60Hz / 约 16.67ms`，负责 Grid Truth 与 gameplay。这个值是现代 Engine 的通用采样策略，不复用原版约 32Hz 的 runtime advance 频率。

逆向已经确认原版在每个目标约 62ms outer loop 内推进两次 gameplay。缺少实测时可用约 31ms/step 作为代码结构估算；有可重复的同路径墙钟证据时，以该结果校准机制自身的毫秒配置，不改变 Engine 的全局默认频率。

### PresentationClock

默认 `60Hz`，负责视觉采样与真实毫秒插值。WorldClock pause 时 PresentationClock 仍可运行，因此纯环境动画、Camera 收敛、Bobby 已经开始的 tween 可以继续表现。

### 时间单位规则

持续时间默认以毫秒表达：

```text
250ms 的行为 = 250ms
```

而不是：

```text
N 个 Web WorldTick
```

原版若明确以 N 次 `b()` gameplay step 控制状态，则先保存这个原版计数事实，再使用墙钟实测或循环目标估算换算时长。Web 实现仍应优先把行为表达为可解释的时间语义，而不是盲目复制混淆代码计数器。

## 3. Grid Truth 与视觉过渡

World 中 Entity 的格子坐标是唯一 gameplay truth。一次成功移动可以在 World 中立即从 A 格变为 B 格，同时 Presentation 创建：

```text
entityId
from A
to B
durationMs
```

VisualRuntime 使用 `PresentationFrame.nowMs` 做 Tween/Lerp。动画完成只是表现事实，**不得通过 animation-complete callback 再修改 World**。

Ice 在移动中点接管角色表现：步行进入时只播放前半格行走动画，随后使用固定滑行姿势；
驾驶 Mower 进入时始终保留载具外观，中点后冻结 Mower 的两帧震动。连续 Ice 强制移动
以权威 `WorldMotion` 完成与下一段启动为交接边界，Presentation 到达格末时保持当前移动
姿势，避免在相邻冰格之间短暂插入站姿。

玩家下一次是否能行动、forced movement 何时继续等 gameplay sequencing 由 RuntimeActionScheduler 决定，而不是由 VisualRuntime `isAnimating` 决定。

## 4. RuntimeAction 与原版阻塞过程

火球飞行、藤蔓生长、漂流、机关连续动作等跨多个 gameplay step 的过程使用 RuntimeAction：

```text
Entity          运行时对象与状态
Behavior        触发/响应规则
RuntimeAction   跨多个 WorldTick 的持续 gameplay 过程
```

RuntimeAction：

- 固定顺序、单线程推进；
- 可以并存多个 Action，但不是 Promise 并发；
- 只通过 CommandQueue 修改 World；
- 可以声明 `blocksInput`；
- 可以声明一个或多个 Camera focus target；
- gameplay state 可进入 World snapshot。

原版 Fireball 存活时每拍刷新共享 aT=16，所以普通方向输入路径被挡住；但 Speed continuation、Ice forced continuation、airborne flight 在 aT 检查之前，世界子系统也继续推进。现代 blocking Action 必须表达“挡普通输入”而不是误写成 World pause。

## 5. Undo 与 Presentation

玩家 move 前保存 gameplay snapshot。Snapshot 可以包含当时存在的 RuntimeAction gameplay state，但**不保存 Visual tween、Camera tween 或 Presentation frame**。

对于原版阻塞流程，例如 Bobby 踩龙尾后火球飞行，期间玩家不能产生下一次 move，所以 Undo 点自然仍是“踩龙尾之前”。不需要、也不应该 Undo 到“火球视觉上飞了一半”。

Undo 恢复后 VisualRuntime 丢弃当前 transition，并直接从恢复后的 Grid Truth 重建表现。

## 6. `ta.png` 动态格图集

高清版 `ta.png` 为 192×720，即 **4 列 × 15 行 × 48px**。原版 `V()` 维护四组动画计数器：

- `bC`: 0..7，8 相循环；
- `bD`: 0..5，6 相循环；
- `bE`: 0..3，4 相循环；
- `bF`: 0..2，3 相循环。

`V()` 每次 gameplay `b()` 都被调用，但只有内部四相门控 `bG == 0` 时才推进这些 phase；`bG` 每 4 次 gameplay step 回到 0。因此 phase 约每：

```text
4 × 31ms ≈ 124ms
```

推进一次，而不是 248ms。

由于原版每个 outer loop 只在两次 `b()` 之间最多 repaint 一次，simulation step 与实际可见帧并不是一一对应；但连续 phase 改变在稳态仍约隔两个 62ms outer loop，即约 124ms。

`ta.png` 的具体对象、方向与帧序列统一登记在
`model/src/map/entity/original-tile-visuals.json`。本文只保存计数器、门控与节拍事实，
避免与可执行目录重复维护坐标表。

Web Runtime 的 Original Visual resolver 应按最终确认的原版毫秒节拍计算 phase，而不是把 `time.tick % 4` 当作原版事实。Renderer 的 image layer 支持 `frameWidth + frameHeight + frameIndex`，这项能力仍属于纯表现层。

Windmill 还受同方向 Wind Switch 的状态门控：关闭时始终显示静态 `ts.png`，开启时才按
`bF` 播放叶片。原版 gameplay paint 在 moving entity 之后、Bobby 之前绘制三段风场；
三段都读取同一个 `52 + bF`（纵向）或 `55 + bF`（横向）帧。首段从 Windmill 中心
开始，另外两段沿风向各错开一格，因此整条风场从半格处延伸三格。

Wind Switch 从 Off 切到 On 时设置 `aT=64` 并把 Camera target 指向对应 Windmill；
Camera 的 `Y()` 使用全局逐步加减速：每次 `Y()` 积分调用增加 1 source px/step，focus
期间最高 24 source px/step。只有 Camera 的实际位置 `bI/bJ` 到达目标 `bO/bP` 后，
`aT` 才开始递减，Cloud 也才允许接受新开启风向的强制接管。这 64 个 gameplay step
继续锁住普通输入；Engine 与已实测的慢速移动共用 `26ms/step` 墙钟校准，约为
`64 × 26ms = 1.664s`。第一朵真正被该方向改向的 Cloud
会接过 Camera target，并把 `aT` 重置为 64；On 切到 Off 只关闭该方向并替换 Switch
图块，不设置 Camera focus。

原版 `Y()` 分别计算横纵轴速度。这里的 `Y()` 积分调用与 Engine Camera 的逻辑步不是
同一计数单位：Engine 不复刻原版函数调用次数，而是按实测墙钟以 `26ms` 为一个校准步，
每步使用 2 source px 的加减速幅度。Engine 由较长轴决定总行程时间，再把同一进度按
目标位移比例应用到两轴，使斜向镜头转移保持直线路径。

Bonus Coin 的随机门控也已完整恢复：`bE==0` 的四步窗口每步更新 `bH`，窗口结束时 gate 为 true 的稳态概率为 `1/8`；随后 `bE=1/2/3` 三帧各保持 4 step，一次可见闪耀固定约 372ms。

## 7. Bobby 四方向人物图

原版方向枚举 `aw` 与人物图数组对应关系确认：

- `aw=0`：左，`b0.png`；
- `aw=1`：右，`b1.png`；
- `aw=2`：上/背面，`b2.png`；
- `aw=3`：下/正面，`b3.png`。

藤蔓攀爬状态下原版会设置攀爬标志并强制使用 `b2.png`。

Bobby Carrot 5 Remake 已让 Beanstalk 上站立和移动的 Bobby 使用 Up 人物条带；朝向仍由
World 保存，不因纯表现选择而改写。

原版普通格移动每次 `N()` 推进 3px，共需 16 次 gameplay step；Speed / 特殊快速状态
每次推进 6px，共 8 step。按循环目标估算分别为 `496ms` 与 `248ms`，38-1 的 100 格
墙钟实测则支持 `416ms` 与 `208ms`，因此 Engine 对已实测移动采用后者。现代 Bobby
为了操作手感采用 `350ms` 与 `175ms` 两档。

Kite 起飞完成时原版同时写入 `airborne=true` 与 `aN=1`。airborne 移动分支不递减 `aN`，所以 Flight 全程都满足 `N()` 的快速条件，每 step 推进 6px，而不是普通 Bobby 的 3px。Engine 根据 37-2 实测使用 `208ms/格`。

Whirlwind 的起飞表现从入格移动中点开始。此时原版设置 `bb=1, aW=0`，但仍绘制
`b0.png..b3.png` 的普通方向人物；后半格每个 gameplay step 将纯绘制高度 `aW`
增加 6px。普通 3px/step 移动对应 8 个上抬阶段，内部在抵达时到达 48px；快速
6px/step 移动对应 4 个阶段，到达 24px。抵达结算随后才设置 `airborne=true`、把
`aW` 固定为 24px，并切换四方向 `b9.png` 风筝素材。Landing 保持 `b9.png`，在后半格
以四个 6px 阶段从 24px 降到 0，再恢复普通人物。

Landing 抵达后 `airborne` 清除，`aN=1` 仍保留到下一次 `M()`，因此 Bobby 会按当前方向自动尝试续行一格。未持续按住同方向时，该次移动建立后 `aN` 减为 0，所以使用 3px/step 的普通 cadence。受阻分支设置 `aO=8`，与 Speed / Mower impact 共用 8 阶段 Camera shake；当前每阶段按实测校准为 `26ms`。

Web 版 Bobby 的逻辑位置由 World move 瞬时确定；像素位移由 PresentationFrame 以真实
`durationMs` 插值。起飞和降落阶段按同一 WorldMotion 的后半段真实毫秒进度分段采样，
不会把原版 gameplay step 绑定到浏览器渲染帧。

### `b6.png` 关卡过渡

UP9 `a.class` 的 player renderer 在 `aw=6` 时从 `b6.png` 取图，`av` 作为
`48px` 宽的 source frame index。素材本身是 `384×72`，因此只有 `0..7` 共 8 张
图；原版状态机仍使用 `0..9` 共 10 个逻辑槽，`8/9` 落在素材范围外，表现为空白：

- `ab()` 初始化关卡时写入 `aw=6, av=9, be=false`；
- `O()` 的 `aw=6` 分支在 `be=false` 时逐步递减 `av`，低于 0 后恢复普通正面状态；
- 通关路径写入 `aw=6, av=0, be=true`；
- `O()` 在 `be=true` 时逐步递增 `av`，到达 10 后进入结果流程。

两条路径的墙钟长度并不相同。`aw=6` 不满足 `O()` 的 fast-motion bypass 条件，
因此仍受共享 `bf` 隔次门控，逻辑槽约每 2 个 gameplay step、即约 62ms 推进一步。
关卡进入需要完整倒过 10 个逻辑槽；通关状态可能在建立状态的同一 gameplay step
先推进一次，通常还剩 9 个门控推进间隔。具体首帧相位受进入该状态时的 `bf` 影响，
稳定量级分别约为 **620ms** 与 **558ms**，不是逐 gameplay step 切一帧。

Web Engine 使用 `620ms / 558ms` 两个独立配置承接进入/通关差异，并把 10 个逻辑槽映射为
“两个透明槽 + 8 张素材帧”或“8 张素材帧 + 两个透明槽”。

### `b7.png` Mower 人物图

高清版 `b7.png` 宽 `216px`，两行各高 `83px`。四个方向依次使用
`Left 0/60`、`Right 60/60`、`Up 120/48`、`Down 168/48` 的源矩形；
左右方向相对格子中心偏移 `-6px`。Renderer 读取 Image layer 声明的源矩形，
人物图的像素分割保持在 Bobby Visual Definition 中。

## 8. 魔豆与藤蔓

踩到 `0xDF` 豆田且持有魔豆后，原版：

1. 豆田变为 `0xEF` 萌芽；
2. 创建生长任务，倒计时初值 16；
3. 每次 gameplay `b()` 调用执行 `S()` 并递减；
4. 可继续生长时，旧顶端变 `0xDE` 中段，基座为 `0xEE`，新顶端为 `0xCE`；
5. 向上重复，直到越界、目标格已有对象，或目标地形 unsigned ID 大于 `0x5D`。

相邻两次生长 mutation 相隔 16 个 gameplay step。38-2 的 50 段墙钟实测约 21s，
Engine 因此使用 `416ms/段`；生长 Action 通过累计 elapsed 余量维持长期平均节拍。

`0xCE` Tip 与 `0xDE` Middle 能覆盖本来不可普通步行的 terrain；`0xEE` Base 只有 terrain 自身可走时才能进入。三者都可触发 climbing presentation，但碰撞 override 不相同。

## 9. 其它已确认 step 时长

按约 31ms/gameplay step 换算：

- Ice Block melting：每阶段 6 step，约 186ms；
- Plank `D5→D6→empty`：每阶段 6 step，约 186ms；
- Dragon Head 喷火准备 `D7→E8→E9→D7 + fireball`：对应 `ts-14-8 → ts-15-9 → ts-15-10 → ts-14-8`，每阶段 6 step，约 186ms；
- Fireball：6px/gameplay step，48px 一格；同距离原版实测校准为约 208ms；
- Shovel：32 gameplay step 后清除 Snow，约 992ms。

Fireball 的现代实现以 `FIREBALL_MOVEMENT` 统一声明墙钟毫秒：整格移动
`208ms`、两张 `hud.png` 素材各 `104ms`、障碍边界半格收尾 `104ms`。RuntimeAction
会把固定 World tick 的舍入余量带到下一格，因此长距离速度在不同 World Hz 下保持一致；
Visual 直接读取 Presentation 毫秒选择素材帧，不依赖渲染帧数。

持有 Shovel 的 Bobby 首次撞到 Snow 时停在原位；清雪期间普通输入被锁住。
第 32 个 gameplay step 清除目标 Snow 并结束铲雪姿势，下一 gameplay step 才按碰撞时保存的
方向重新执行一次普通移动判定。`b8.png` 的三行按约 186ms 一行循环，而不是在整个动作
期间只播放一遍；开始移动后立即使用对应方向的普通行走素材。
Engine 用可快照的 RuntimeAction 推进这段 gameplay，`b8.png` 铲雪动画读取开始事件；
原版地图展开的 Snow 下方已有 `ts-8-13` 地面，独立放置的 Snow 清除时生成同款可走地面。

这些换算是根据当前恢复出的控制流与稳态主循环得到的近似真实时间；原版 `System.currentTimeMillis()` 调度、设备执行耗时和 sleep 抖动会让实测存在少量偏差。

## 10. 荷叶

原版帮助文本明确说明：荷叶沿 Bobby 进入时的方向漂流，**一旦停住就不能直接再次启动，必须先下叶再重新登上**。

原版动态实体更新时 Bobby 与荷叶的像素坐标使用相同增量。Web 版应让 World / RuntimeAction 决定荷叶和 Bobby 的逻辑格变化，而 Presentation 为两者建立共享时长/轨迹的视觉过渡；不能让两者以互不相关的 Tween 漂移。

## 11. Pause 与逐帧调试语义

World 与 Presentation 可以独立暂停：

```text
World paused, Present running  -> gameplay 停止，环境与视觉过渡继续
World running, Present paused  -> gameplay 可推进，视觉冻结在当前表现帧
World paused, Present paused   -> 适合逐帧检查某个 gameplay 触发出的视觉过程
```

Debug 提供独立的 World / Present pause-resume，以及 Presentation `◀ 1 Frame` / `1 Frame ▶`。VisualRuntime 与 Camera 会保留最近一次过渡参数，因此已经刚刚完成的 tween 仍可向后逐帧检查。

Presentation 倒帧不回滚 World 或 RuntimeAction gameplay state。若需要倒退 Action 自身的 gameplay phase，应使用 World snapshot / rewind 机制，而不是让动画时钟承担逻辑回溯。
