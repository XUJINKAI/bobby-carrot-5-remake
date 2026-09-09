# Replay 合同

Replay 用于记录一张 `LevelMap` 从正式起点开始的玩家语义输入，并在浏览器或 Node
中通过同一套 `GameplaySession` 重新执行。Replay 的首要用途是生成可长期运行的
Engine 回归测试。

## 执行模型

一次 World Tick 使用固定顺序：

```text
推进已有 WorldMotion、RuntimeAction 与 onTick
        ↓
处理归属于当前 Tick 的玩家语义输入组
        ↓
结算 WorldEvent、ActorLifecycle 与 WorldOutcome
```

`GameplaySession` 持有 World、WorldClock、正式 gameplay 初始化、控制映射和历史记录。
浏览器 `Game` 使用真实时间驱动 Session；`ReplayRunner` 直接逐 Tick 驱动 Session，
不等待真实时间，也不创建 Canvas、Renderer 或 Presentation。

## 起点

Replay 必须从 tick 0 开始。运行结果只由以下内容重建：

```text
LevelMap
+ World Hz
+ Bobby gameplay 运动参数
+ 逐 Tick 玩家语义输入
```

Web 播放使用当前 Explore Session 的 Profile 与 Economy 设置，它们不进入 Replay。

Replay 不保存 `WorldSnapshot`、Entity runtime state、WorldMotion、RuntimeAction 或中途
恢复点。跳转和重新接管通过从 tick 0 快速执行到目标 Tick 实现。现有 Undo / Redo
快照仍是单局游戏的内部能力，不属于 Replay 格式。

使用不可序列化 `initializeEntityState` 回调的 Session 不能录制 Replay；对应入口需要先
提供可序列化、可从起点重建的正式运行配置。

## 输入

Replay 记录控制映射之后、World 判定之前的 `WorldIntentGroup`。因此它保留：

- 多 Actor 同时操作的分组；
- 输入的 Tick 与组内顺序；
- 被阻挡、处于 busy 状态或被 RuntimeAction 消费的输入尝试。

键盘、Pointer 和摇杆原始事件不进入 Replay。机关产生的 forced intent 由 World 在重放
时重新计算。

## 时间与速率

`worldHz` 是 Replay 运行条件，决定固定 `stepMs`。World 速度只决定真实时间内消费
多少 Tick，不进入 Replay；1×、8×与无头运行必须产生相同 gameplay 结果。

Engine 默认使用 `60Hz`，新录制会保存该值。播放和无头 Runner 始终采用文件中的
`worldHz`，因此已有 Replay 可以继续使用录制时的频率。

Presentation Hz、Presentation 速度、Camera、Renderer 和音频均不进入 Replay。

## 格式

Replay 顶层字段按以下顺序序列化，体积通常最大的 `frames` 固定放在末尾：

```json
{
  "formatVersion": 1,
  "meta": {
    "name": "1-1",
    "url": "https://bc5r.xujinkai.net/explore/play/original/1-1",
    "final_status": "won",
    "note": ""
  },
  "runtime": {
    "worldHz": 60,
    "bobbyLocomotion": {
      "moveMs": 350,
      "speedShoesScale": 0.76
    }
  },
  "endTick": 120,
  "frames": []
}
```

`meta.name` 和 `meta.url` 由宿主在开始录制时提供。Engine 在停止录制时写入
`final_status`，其值为 `playing / won / dead`；`note` 初始为空字符串，Engine 不读取或
解释其内容，用户可以在 Replay 文本中直接填写。

Web 生成 `meta.url` 时固定使用 `https://bc5r.xujinkai.net/`，并保留当前页面的路径、
查询参数和 fragment，使本地开发环境录制的文件也指向正式站点。

Replay 本身不解析地图身份。调用方负责选择用于播放或无头执行的 `LevelMap`；Runner
从起点执行到 `endTick` 并返回实际状态、移动计数和 Tick 数。作为仓库内回归 fixture
使用时，verify 将 `meta.final_status` 作为期望状态，并与 Runner 的实际状态比较。

## 仓库内置过法

内置过法与地图使用相同的 collection 和 map ID：

```text
assets/replays/<collection>/<map-id>.json
assets/maps/<collection>/<map-id>.json
```

Web 录制面板按当前关卡尝试读取对应 Replay。`npm run verify` 递归扫描
`assets/replays/` 的全部文件，在对应地图上使用 Explore Profile 从起点复跑，并要求
实际状态等于 Replay 的 `meta.final_status`。每新增一个 Replay 文件都会自动进入这项
回归测试，也会随 `assets/` 原样发布到 `dist/assets/`。

## Explore Web 录制入口

Explore 游戏页底栏左侧提供“录制”入口。“重新开始并录制”从关卡正式起点创建一次 take，
录制期间同一按钮用于停止；停止后立即调用无头 Runner 从 tick 0 复跑到录制终点。
Replay JSON 可以直接编辑，并可从起点播放、暂停、停止、跳转起点或终点、复制到剪贴板或
下载为 Engine 测试 fixture；“加载内置过法”按当前关卡读取仓库 fixture。面板速率是
Engine 的常驻 `timeScale`，同时作用于普通游戏、
录制和播放。输入合法正数时立即更新 World 与 Presentation；输入为空或非法时保留最近
一次合法倍率，并在尝试播放时标红。开始、暂停和停止 Replay 均不改变已选择的倍率。快退
与快进按钮依次选择 `0.1 / 0.5 / 1 / 1.25 / 1.5 / 2 / 4 / 8` 中相邻的预设值。

Replay 文本较大，编辑时在输入停止后延迟解析 JSON；播放与时间线跳转只使用已经通过
解析的内容。Textarea 聚焦时保留当前光标和选择范围，复制完整内容使用面板按钮。

“跳过思考时间”默认启用。播放进入稳定状态后，无输入区间超过一秒时会分批快速执行
其中的 World Tick，并在下一次输入前保留 250ms。每个 Tick 仍经过正式 Session；运动、
输入阻塞过程、世界事件和终局表现会恢复正常展示。该设置只影响浏览器播放耗时，不改变
Replay 输入、`endTick` 或无头复跑结果。

桌面布局为面板保留固定宽度并缩小 Canvas 可用区域；窄屏布局将面板悬浮在游戏区域内，
保持 Canvas 尺寸。面板开关引起可用区域变化时，Web 必须触发 Engine viewport resize。
