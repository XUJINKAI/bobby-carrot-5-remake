# 输入

`InputController` 是 `@bobby/engine` 提供的通用 gameplay 输入适配器。它只负责把键盘、指针、滚轮、Pinch 或外部方向控件翻译成 Game Action，**不得判断某一格能不能走**；合法性必须由 Engine Mechanics 决定。

当前通用映射：

```text
WASD / 方向键       -> continuous direction
R                    -> Restart
Z / U                -> Undo
+ / -                -> Zoom
~                    -> Debug
鼠标左键 / 单指拖动 -> 沿主轴移动一格
鼠标中键拖动        -> Pan
Pinch / 滚轮         -> Zoom
```

鼠标左键或单指从落点开始累计位移。位移达到离散拖动阈值后，Engine 取水平/垂直主轴方向并只提交一次 `Game.move()`；本次 pointer 生命周期内继续拖动不会连续追加格数。进入双指 Pinch 后，两根 pointer 都退出单指移动判定，松开其中一根也不会产生残留的单格移动。

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

## Continuous Input 与 update

键盘、Screen Joystick 和 `InputController.setHeldDirection()` 接入的外部方向控制器都属于 Continuous Input。DOM 事件或摇杆回调只更新当前 held state，不直接连续调用 `Game.move()`；真正的移动请求由公开的 `InputController.update(deltaMs)` 统一推进。

```text
Keyboard / Joystick / External Controller
                  │
                  └─ 更新 held direction
                             │
                             ▼
                    InputController.update()
                             │
                             ▼
                   HeldDirectionRepeater
                             │
              ┌──────────────┴──────────────┐
              │                             │
          首格立即尝试                 initial delay
                                            │
                                            ▼
                                      continuous repeat
                                            │
                                            ▼
                                         Game.move()
```

Continuous Input 的第一格在下一次 `update()` 时立即尝试；第二格必须经过 input source 自己的 `initialRepeatDelayMs`。首次方向 edge 会被缓冲到下一次 `update()`：即使用户在同一个 62.5ms tick 内完成按下并松开，仍会保留一次单格移动，但因为 held state 已经清空，不会进入 repeat。之后不额外设置 repeat interval，而由 `Game.move()` 的 animation busy 状态限制连续步频。如果一次移动已经被地图规则明确阻挡，本次 held direction 会停止 repeat，直到松开或改变方向，避免按 16Hz 不断产生重复 blocked 事件。

当前默认手感：

| Input Source | Initial Repeat Delay |
| --- | ---: |
| Keyboard | 250 ms |
| External held direction | 250 ms |
| Screen Joystick | 375 ms |

方向变化被视为新的 Continuous Input edge：新方向的第一格重新立即尝试，并重新计算 initial repeat delay。Screen Joystick 回到 dead zone 时方向变为 `null`，repeat state 随即重置；再次推出 dead zone 时按新的第一格处理。

目前世界时钟尚未接入，因此 `InputController` 默认用一个 **16Hz（62.5ms）临时 timer** 调用自己的 `update()`，方便验证输入手感。这个 timer 只是过渡适配层：世界时钟接管后，将 `autoUpdate` 设为 `false`，由 Engine Clock 每 tick 调用 `input.update(deltaMs)`，Continuous Input 状态机本身无需改动。

默认值集中在 Engine 内：

- `DEFAULT_INPUT_CONTROLLER_OPTIONS`：Input 能力默认值、Keyboard / External repeat delay、临时 update interval 与 `autoUpdate`。
- `DEFAULT_SCREEN_JOYSTICK_OPTIONS`：Screen Joystick 尺寸、透明度、dead zone、右下识别区、默认圆盘位置与 Joystick repeat delay。

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

识别区直接贴住右下 safe area，不再因为圆盘半径额外向左上偏移。默认圆盘完整位于识别区内部，因此圆盘自身的任何位置都属于可启动区域；不会再出现“看得到摇杆，但按它右下半边没有响应”的情况。

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

其中 `activationWidth / activationHeight / activationInset*` 只改变识别区；`size / defaultInset*` 只改变摇杆默认显示尺寸和位置。二者不再互相推导。`InputController.setHeldDirection()` 仍允许外部无障碍控制器或宿主自定义输入接入，同样经过 Continuous Input repeat 状态机。

Screen Control 的布局、默认开关和响应式行为见 [`ui.md`](ui.md)。

Editor Authoring 状态的放置、删除、旋转、编辑历史等操作属于 Editor 输入；Editor Play Test 则复用通用 `InputController`。

Tap-to-pathfind 暂缓，因为自动寻路必须先理解木板、陷阱、开关等具有副作用的格子，不能让寻路算法替玩家解谜。
