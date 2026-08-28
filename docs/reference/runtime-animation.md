# 原版运行时动画与动态对象

本文记录从 Bobby Carrot 5 UP9 高清版 `a.class` 字节码中已经确认的运行时行为，并说明 Web Engine 如何承接这些节拍。这里优先记录逆向事实；实现部分只定义时间边界，不把 presentation state 写入地图。

## 1. 原版主循环节拍与 EngineClock

原版游戏主循环目标间隔约为 **62ms**。部分机制不是按显示器刷新率运行，而是按这个逻辑 Tick 计数。

Web Engine 统一使用固定世界时钟：

```ts
interface EngineTick {
  tick: number;
  stepMs: number;
}
```

默认 `16Hz`，即 `stepMs = 62.5ms`。浏览器 `requestAnimationFrame` 只负责提供真实经过时间给 accumulator，不直接代表 gameplay frame。一个浏览器帧如果需要追赶多个固定 Tick，会依次推进 Input、World 和 Visual，但只绘制最终状态一次。

```text
requestAnimationFrame
        │ elapsed real time
        ▼
    EngineClock
      16 Hz
        │
        ├─ InputController.update(time)
        ├─ World.update(time)
        └─ VisualRuntime.update(time)
                    │
                    ▼
               render once
```

页面长时间处于后台时不会无限追赶历史 Tick；单次追赶有上限，超出的停顿按游戏暂停处理，避免恢复页面时形成更新风暴。

Bobby 的移动插值、Camera 回中和 Behavior `onTick` 都使用同一个 `EngineTick`，不再各自读取 `performance.now()` 或维护独立 timer。Visual resolver 也能读取 `context.time`，因此纯表现动画可以直接由 `tick` 推导帧，不需要写入 World state。

## 2. `ta.png` 动态格图集

高清版 `ta.png` 为 192×720，即 **4 列 × 15 行 × 48px**。原版 `V()` 每约 4 个逻辑 Tick 更新一次四组动画计数器：

- `bC`: 0..7，8 相循环；
- `bD`: 0..5，6 相循环；
- `bE`: 0..3，4 相循环；
- `bF`: 0..2，3 相循环。

因此动态格大约每 **248ms** 换一帧。Web Engine 可以直接用统一时钟分频：

```ts
const ambientTick = Math.floor(time.tick / 4);
```

然后不同 Visual 根据自己的周期取模，例如 8/6/4/3 相循环。环境动画不会启动额外渲染循环，也不需要独立 timer；它只决定当前世界 Tick 绘制哪个 sprite frame。

计数器为 0 时原版画 `ts.png` 静态格，非 0 时从 `ta.png` 取帧。

已经从原版渲染分支确认的映射包括：

| 对象/地形 | `ta.png` 基础线性序号 | 计数器 |
|---|---:|---|
| 已解锁出口 `0x96` | 0 | `bE` |
| 加速格 `0xB5..0xB8` | 3 / 6 / 9 / 12 | `bE` |
| Bonus Coin `0xF8` | 15 | `bE` |
| 四向风车 `0xD0..0xD3` | 18 / 20 / 22 / 24 | `bF` |
| 龙卷风 `0xF4` | 26 | `bD` |
| 水域 `0x56` | 39 | `bC` |
| 潮汐 `0x57..0x5A` | 33 / 31 / 37 / 35 | `bF` |
| 水域边缘 `0x5B..0x5D` | 46 / 48 / 50 | `bF` |

原版 Bonus Coin 还存在随机闪烁门控。具体动态格接入 `ta.png` 时应继续保持这些逆向事实；不要为每种动画创建独立时钟。

## 3. Bobby 四方向人物图

从原版方向枚举 `aw` 与人物图数组对应关系确认：

- `aw=0`：左，`b0.png`；
- `aw=1`：右，`b1.png`；
- `aw=2`：上/背面，`b2.png`；
- `aw=3`：下/正面，`b3.png`。

藤蔓攀爬状态下原版会设置攀爬标志并强制使用 `b2.png`。

Web 版 Bobby motion 的插值进度由 `EngineTick` 推进。它与 World 逻辑位置分离：World 可以先完成一格语义移动，VisualRuntime 再按照固定 Tick 在旧格与新格之间插值；显示器刷新率不会改变这段动画的 gameplay 节奏。

## 4. 魔豆与藤蔓

踩到 `0xDF` 豆田且持有魔豆后：

1. 豆田对象变为 `0xEF` 萌芽；
2. 创建生长任务，倒计时初值 16；
3. 原版 `S()` 按逻辑 Tick 递减倒计时；
4. 可继续生长时，旧顶端变 `0xDE` 中段，基座为 `0xEE`，新顶端为 `0xCE`；
5. 向上重复，直到越界、目标格已有对象，或目标地形 unsigned ID 大于 `0x5D`。

`0xCE / 0xDE / 0xEE` 都是可攀爬段，能够覆盖本来不可普通步行的背景格。

这类倒计时应直接使用 `EngineTick.tick` 或固定 `stepMs`，不要另开 wall-clock timer。

## 5. 荷叶

原版帮助文本明确说明：荷叶沿 Bobby 进入时的方向漂流，**一旦停住就不能直接再次启动，必须先下叶再重新登上**。

原版动态实体更新函数在 Bobby 搭乘荷叶时，会给荷叶和 Bobby 的像素坐标施加完全相同的增量。因此 Web 渲染层不能让逻辑荷叶先跳到目标格、人物再慢慢追过去；两者在漂流动画中必须共用同一条由 `EngineTick` 推进的插值轨迹。
