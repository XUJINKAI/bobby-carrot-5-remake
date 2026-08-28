# 原版运行时动画与动态对象

本文记录从 Bobby Carrot 5 UP9 高清版 `a.class` 字节码中已经确认的运行时事实，并说明 Web Engine 如何在 **WorldClock + PresentationClock + RuntimeAction** 架构下承接这些节拍。逆向事实与现代实现必须分开描述。

## 1. 原版主循环事实

原版游戏主循环目标间隔约为 **62ms**。部分 gameplay 机制确实按这个逻辑循环计数，因此可以把原版理解为约 16Hz 的单线程更新环境。

这是原版实现事实，不代表 Web 版必须把所有视觉也限制在 16Hz。

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

默认 `16Hz / 62.5ms`，负责 Grid Truth 与 gameplay。默认值集中在 `resolveEngineTiming()`，不是业务代码中的隐式常量。

### PresentationClock

默认 `60Hz`，负责视觉采样与真实毫秒插值。WorldClock pause 时 PresentationClock 仍可运行，因此纯环境动画、Camera 收敛、Bobby 已经开始的 tween 可以继续表现。

### 时间单位规则

持续时间默认以毫秒表达：

```text
250ms 的行为 = 250ms
```

而不是：

```text
4 ticks
```

改变 `worldHz` 或 `presentationHz` 只改变采样粒度，不能自动改变行为速度。只有逆向证据明确证明“恰好 N 个原版逻辑循环”本身就是玩法规则时，文档才应保留这个原版计数事实；Web 实现仍应优先把它换算为可解释的时间语义。

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

因此原版“火球飞完以前 Bobby 不能动”可以通过 blocking Action 表达；未来自制玩法允许火球与 Bobby 并行时，只需让对应 Action 不阻塞输入，不需要第二套 Actor 模型或第二套 Engine mode。

## 5. Undo 与 Presentation

玩家 move 前保存 gameplay snapshot。Snapshot 可以包含当时存在的 RuntimeAction gameplay state，但**不保存 Visual tween、Camera tween 或 Presentation frame**。

对于原版阻塞流程，例如 Bobby 踩龙尾后火球飞行，期间玩家不能产生下一次 move，所以 Undo 点自然仍是“踩龙尾之前”。不需要、也不应该 Undo 到“火球视觉上飞了一半”。

Undo 恢复后 VisualRuntime 丢弃当前 transition，并直接从恢复后的 Grid Truth 重建表现。

## 6. `ta.png` 动态格图集

高清版 `ta.png` 为 192×720，即 **4 列 × 15 行 × 48px**。原版 `V()` 每约 4 个逻辑循环更新一次四组动画计数器：

- `bC`: 0..7，8 相循环；
- `bD`: 0..5，6 相循环；
- `bE`: 0..3，4 相循环；
- `bF`: 0..2，3 相循环。

按原版约 62ms 主循环计算，动态格约每 **248ms** 换一帧。Web Engine 把这个逆向事实表达为 Presentation 时间，而不是 `time.tick % 4`；因此未来调整 `worldHz` 不会改变环境动画速度。

已经确认并接入的映射包括：

| 对象/地形 | `ta.png` 基础线性序号 | 原版计数器 |
|---|---:|---|
| 已解锁出口 `0x96` | 0 | `bE` |
| 加速格 `0xB5..0xB8` | 3 / 6 / 9 / 12 | `bE` |
| Bonus Coin `0xF8` | 15 | `bE` |
| 四向风车 `0xD0..0xD3` | 18 / 20 / 22 / 24 | `bF` |
| 龙卷风 `0xF4` | 26 | `bD` |
| 水域 `0x56` | 39 | `bC` |
| 潮汐 `0x57..0x5A` | 33 / 31 / 37 / 35 | `bF` |
| 水域边缘 `0x5B..0x5D` | 46 / 48 / 50 | `bF` |

Web Runtime 的 Original Visual resolver 使用 `PresentationFrame.nowMs` 计算 phase：

```text
phase = floor(nowMs / 248ms) % cycleLength
```

`phase == 0` 时继续绘制 `ts.png` 的静态格；其余 phase 把 `ta.png` 当作 4×15 的规则网格 sprite sheet，并按 `baseIndex + phase - 1` 取帧。Renderer 的 image layer 因此支持 `frameWidth + frameHeight + frameIndex`，这项能力仍属于纯表现层。

这些环境动画不创建 RuntimeAction、不写 Entity state，也不读取 WorldTick。Debug Pause 使 WorldClock 停止后，它们仍随 PresentationClock 正常播放，这正是混合时钟的预期语义。

原版 Bonus Coin 还存在随机闪烁门控；当前已恢复确认的基础相位动画，随机门控仍作为后续 fidelity 项处理。

## 7. Bobby 四方向人物图

原版方向枚举 `aw` 与人物图数组对应关系确认：

- `aw=0`：左，`b0.png`；
- `aw=1`：右，`b1.png`；
- `aw=2`：上/背面，`b2.png`；
- `aw=3`：下/正面，`b3.png`。

藤蔓攀爬状态下原版会设置攀爬标志并强制使用 `b2.png`。

Web 版 Bobby 的逻辑位置由 World move 瞬时确定；像素位移由 PresentationFrame 以真实 `durationMs` 插值。默认 16Hz World 不再意味着 Bobby 只能以 16fps 移动。

## 8. 魔豆与藤蔓

踩到 `0xDF` 豆田且持有魔豆后，原版：

1. 豆田变为 `0xEF` 萌芽；
2. 创建生长任务，倒计时初值 16；
3. 主循环逐次递减；
4. 可继续生长时，旧顶端变 `0xDE` 中段，基座为 `0xEE`，新顶端为 `0xCE`；
5. 向上重复，直到越界、目标格已有对象，或目标地形 unsigned ID 大于 `0x5D`。

原版 16 次约 62ms 循环对应约 **992ms**。Web 版应由 RuntimeAction 保存生长 gameplay phase / remaining time，并使用 `WorldTick.stepMs` 累计毫秒；藤蔓“长出一格”的 World mutation 与这次变化如何动画呈现继续分离。

`0xCE / 0xDE / 0xEE` 都是可攀爬段，能够覆盖本来不可普通步行的背景格。

## 9. 荷叶

原版帮助文本明确说明：荷叶沿 Bobby 进入时的方向漂流，**一旦停住就不能直接再次启动，必须先下叶再重新登上**。

原版动态实体更新时 Bobby 与荷叶的像素坐标使用相同增量。Web 版应让 World / RuntimeAction 决定荷叶和 Bobby 的逻辑格变化，而 Presentation 为两者建立共享时长/轨迹的视觉过渡；不能让两者以互不相关的 Tween 漂移。

## 10. Pause 语义

Gameplay pause 与视觉 freeze 是不同概念：

```text
WorldClock paused       -> gameplay / RuntimeAction / input 停止
Presentation running    -> 环境与已经开始的纯视觉过渡可以继续
```

Debug 的 `+1 Tick` 只推进 World，不逐帧推进 Presentation。若后续需要研究某个 sprite 的具体动画帧，再增加独立 Presentation 调试控制。
