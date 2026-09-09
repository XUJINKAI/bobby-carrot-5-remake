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

因此需要区分两个时间单位：

- outer loop：约 62ms，约 16Hz；
- gameplay step：一次 `b()` 调用，稳态约 31ms，约 32Hz。

`H/N/P/Q/R/S/V/...` 等 gameplay 方法按 `b()` 调用推进，而不是每个 outer loop 只推进一次。原版以“6 tick / 16 tick”实现的机关，换算真实时间时必须按 gameplay step 计算。

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

逆向已经确认原版在每个约 62ms outer loop 内推进两次 gameplay。原版机制按约 31ms/step 换算各自的时间语义，不改变 Engine 的全局默认频率。

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

原版若明确以 N 次 `b()` gameplay step 控制状态，则先保存这个原版计数事实，再按约 31ms/step 换算原版时长。Web 实现仍应优先把行为表达为可解释的时间语义，而不是盲目复制混淆代码计数器。

## 3. Grid Truth 与视觉过渡

World 中 Entity 的格子坐标是唯一 gameplay truth。一次成功移动可以在 World 中立即从 A 格变为 B 格，同时 Presentation 创建：

```text
entityId
from A
to B
durationMs
```

VisualRuntime 使用 `PresentationFrame.nowMs` 做 Tween/Lerp。动画完成只是表现事实，**不得通过 animation-complete callback 再修改 World**。

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
- 可以声明 `cameraTarget`；
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

Bonus Coin 的随机门控也已完整恢复：`bE==0` 的四步窗口每步更新 `bH`，窗口结束时 gate 为 true 的稳态概率为 `1/8`；随后 `bE=1/2/3` 三帧各保持 4 step，一次可见闪耀固定约 372ms。

## 7. Bobby 四方向人物图

原版方向枚举 `aw` 与人物图数组对应关系确认：

- `aw=0`：左，`b0.png`；
- `aw=1`：右，`b1.png`；
- `aw=2`：上/背面，`b2.png`；
- `aw=3`：下/正面，`b3.png`。

藤蔓攀爬状态下原版会设置攀爬标志并强制使用 `b2.png`。

原版普通格移动每次 `N()` 推进 3px，共需 16 次 gameplay step；连续格移动 cadence 约 `16 × 31ms ≈ 496ms`。Speed / 特殊快速状态每次推进 6px，共 8 step，约 `248ms`。

Web 版 Bobby 的逻辑位置由 World move 瞬时确定；像素位移由 PresentationFrame 以真实 `durationMs` 插值。

## 8. 魔豆与藤蔓

踩到 `0xDF` 豆田且持有魔豆后，原版：

1. 豆田变为 `0xEF` 萌芽；
2. 创建生长任务，倒计时初值 16；
3. 每次 gameplay `b()` 调用执行 `S()` 并递减；
4. 可继续生长时，旧顶端变 `0xDE` 中段，基座为 `0xEE`，新顶端为 `0xCE`；
5. 向上重复，直到越界、目标格已有对象，或目标地形 unsigned ID 大于 `0x5D`。

相邻两次生长 mutation 相隔约 **16 个 gameplay step ≈ 496ms**。

`0xCE` Tip 与 `0xDE` Middle 能覆盖本来不可普通步行的 terrain；`0xEE` Base 只有 terrain 自身可走时才能进入。三者都可触发 climbing presentation，但碰撞 override 不相同。

## 9. 其它已确认 step 时长

按约 31ms/gameplay step 换算：

- Ice Block melting：每阶段 6 step，约 186ms；
- Plank `D5→D6→empty`：每阶段 6 step，约 186ms；
- Dragon Head 喷火准备 `D7→E8→E9→D7 + fireball`：对应 `ts-14-8 → ts-15-9 → ts-15-10 → ts-14-8`，每阶段 6 step，约 186ms；
- Fireball：6px/gameplay step，48px 一格约 248ms；
- Shovel：32 gameplay step 后清除 Snow，约 992ms。

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
