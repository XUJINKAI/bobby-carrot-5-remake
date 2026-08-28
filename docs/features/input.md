# 输入

`InputController` 是 `@bobby/engine` 提供的通用 gameplay 输入适配器。它只负责把键盘、指针、滚轮、Pinch 或外部方向控件翻译成语义输入，**不得判断某一格能不能走**；合法性必须由 Engine Mechanics 决定。

当前通用映射：

```text
WASD / 方向键       -> continuous direction
R                    -> Restart
Z / U                -> Undo
+ / -                -> Zoom
~                    -> Debug
鼠标左键 / 单指拖动 -> 沿主轴排队移动一格
鼠标中键拖动        -> Pan
Pinch / 滚轮         -> Zoom
```

鼠标左键或单指从落点开始累计位移。位移达到离散拖动阈值后，Engine 取水平/垂直主轴方向并只排队一次 movement；本次 pointer 生命周期内继续拖动不会连续追加格数。这个 movement 与键盘、Screen Joystick 一样，要等下一次 `EngineTick` 才由 Game 处理，不从 DOM event 直接修改 World。进入双指 Pinch 后，两根 pointer 都退出单指移动判定，松开其中一根也不会产生残留的单格移动。

调用方可以按场景逐项开关：

```text
movement
undo
restart
pan
zoom
debug
```

例如 Adventure 可以关闭 Undo / Debug，Explore 可以开启；这种差异通过能力配置表达，`InputController` 不认识 Adventure、Explore 或 Editor 页面。

## EngineClock 与 Input update

Engine 使用统一的固定世界时钟：

```ts
interface EngineTick {
  tick: number;
  stepMs: number;
}
```

默认 `16Hz`，因此 `stepMs = 62.5`。浏览器事件只记录 input state；真正的 gameplay movement 统一在世界 Tick 中产生：

```ts
const input = inputController.update(time);
world.update(time);
visual.update(time);
```

Game 会读取 `input.move`，尝试语义移动，再把 `moved / blocked / busy` 结果回填给 Input repeat 状态机。这样 Keyboard、Joystick、外部 held direction 和 Pointer 离散移动不会因为 DOM event 到达时机、显示器 60/120/144Hz 或浏览器键盘 repeat 频率而改变 gameplay 节奏。

```text
DOM / Joystick events
        │
        └─ 只更新 held / queued state
                    │
                    ▼
            EngineClock 16Hz
                    │
                    ▼
       InputController.update(time)
                    │
                    ▼
              InputState.move
                    │
                    ▼
              Game / World
                    │
                    └─ resolve moved / blocked / busy
```

`R / Undo / Redo / Zoom / Pan / Debug` 不是格子 gameplay movement，不强制等待世界 Tick；这些显式产品/表现动作仍可即时调用 Game façade。

## Continuous Input

键盘、Screen Joystick 和 `InputController.setHeldDirection()` 接入的外部方向控制器都属于 Continuous Input。事件只更新 held state，不直接调用 `Game.move()`。

Continuous Input 的第一格在下一次 `EngineTick` 立即尝试；第二格必须经过 input source 自己的 `initialRepeatDelayMs`。首次方向 edge 会被缓冲到下一 Tick：即使用户在同一个 62.5ms Tick 内完成按下并松开，仍会保留一次单格移动，但因为 held state 已经清空，不会进入 repeat。

当前默认手感：

| Input Source | Initial Repeat Delay |
| --- | ---: |
| Keyboard | 250 ms |
| External held direction | 250 ms |
| Screen Joystick | 375 ms |

方向变化被视为新的 Continuous Input edge：新方向的第一格重新立即尝试，并重新计算 initial repeat delay。Screen Joystick 回到 dead zone 时方向变为 `null`，repeat state 随即重置；再次推出 dead zone 时按新的第一格处理。

如果 World 当前 motion 尚未结束，移动结果为 `busy`，Input 在之后的世界 Tick 重试；如果地图规则明确返回 `blocked`，当前 held direction 停止 repeat，直到松开或改变方向，避免按 16Hz 重复产生 blocked 事件。

默认值集中在 Engine 内：

- `DEFAULT_INPUT_CONTROLLER_OPTIONS`：Input 能力默认值、Keyboard / External repeat delay；
- `DEFAULT_SCREEN_JOYSTICK_OPTIONS`：Screen Joystick 尺寸、透明度、dead zone、右下识别区、默认圆盘位置与 Joystick repeat delay；
- `ENGINE_TICK_STEP_MS`：统一世界 Tick 步长，默认 62.5ms。

## Screen Joystick

`ScreenJoystick` 属于 Engine Gameplay Input。它把“右下角可以落指的识别区”和“圆盘平时显示在哪里”拆成两套独立几何参数。识别区只负责决定哪里可以启动摇杆；手指在识别区内按下后，仍以落指坐标作为本次摇杆中心，并把可见底座移动到该坐标。

默认布局面向手机：

| 参数 | 默认值 | 含义 |
| --- | ---: | --- |
| `size` | 128 px | 可见圆盘直径 |
| `activationWidth` | 180 px | 右下识别区宽度 |
| `activationHeight` | 180 px | 右下识别区高度 |
| `activationInsetRight` | 0 px | 识别区离右侧 safe area 的额外距离 |
| `activationInsetBottom` | 0 px | 识别区离底部 safe area 的额外距离 |
| `defaultInsetRight` | 28 px | 默认圆盘右边缘离识别区右边的距离 |
| `defaultInsetBottom` | 28 px | 默认圆盘下边缘离识别区底边的距离 |
| `deadZone` | 0.2 | dead zone 比例 |
| `opacity` | 0.45 | 圆盘透明度 |
| `initialRepeatDelayMs` | 375 ms | 连续移动前的初始 repeat delay |

识别区的 CSS 右/下定位为 `safe-area-inset + activationInset*`，因此默认值 `0` 表示紧贴设备可交互的右下 safe area。默认圆盘完整位于识别区内部；圆盘自身的任何位置都属于可启动区域。

```text
右下 activation area
┌────────────────────────┐
│                        │
│       pointerdown      │
│            │           │
│            ▼           │
│       以落点为圆心     │
│            │           │
│            ▼           │
│     dead zone / 主轴    │
│            │           │
│            ▼           │
│    Continuous Input    │
└────────────────────────┘
```

`pointerup`、`pointercancel`、失去 pointer capture 或窗口失焦时，Engine 让球头回中、底座回到默认锚点并清空 held direction。全局 Dialog 或 Result 决策层取得交互焦点时，宿主暂停 Engine Input，Engine 执行相同清理。

调用方可以通过 Runtime Config 分别调整：

```ts
screenJoystick: {
  size: 128,
  activationWidth: 180,
  activationHeight: 180,
  activationInsetRight: 0,
  activationInsetBottom: 0,
  defaultInsetRight: 28,
  defaultInsetBottom: 28,
  deadZone: 0.2,
  opacity: 0.45,
  initialRepeatDelayMs: 375,
}
```

其中 `activationWidth / activationHeight / activationInset*` 只改变识别区；`size / defaultInset*` 只改变摇杆默认显示尺寸和位置。`InputController.setHeldDirection()` 仍允许外部无障碍控制器或宿主自定义输入接入，同样经过世界时钟采样和 Continuous Input repeat 状态机。

Screen Control 的布局、默认开关和响应式行为见 [`ui.md`](ui.md)。

Editor Authoring 状态的放置、删除、旋转、编辑历史等操作属于 Editor 输入；Editor Play Test 则复用通用 `InputController`。

Tap-to-pathfind 暂缓，因为自动寻路必须先理解木板、陷阱、开关等具有副作用的格子，不能让寻路算法替玩家解谜。
