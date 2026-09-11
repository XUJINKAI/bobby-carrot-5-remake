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
+ Bobby 初始 gameplay 移动时长
+ tick 0 actor intents
+ 逐 Tick Gameplay Intent
```

Replay 不保存 `WorldSnapshot`、Entity runtime state、WorldMotion、RuntimeAction 或中途
恢复点。跳转和重新接管通过从 tick 0 快速执行到目标 Tick 实现。现有 Undo / Redo
快照仍是单局游戏的内部能力，不属于 Replay 格式。

## 输入

Replay 在浏览器输入源映射到 controller channel 后记录产生 gameplay 效果的语义动作。因此它保留：

- 同一 channel 中多个 Bobby 的联动分组与方向变换；
- 生效输入的 Tick 与组内顺序；
- 成功启动的移动，以及改变 World / RuntimeAction 状态或产生 WorldEvent 的输入；
- 宿主提交的 `set-actor-locomotion`、`set-actor-lock-key` 等封闭 gameplay 动作。

按住方向时，Bobby 移动期间产生的纯 `busy` 重试和没有 gameplay 效果的阻挡输入不会写入
Replay。记录数量因此由实际 gameplay 动作决定，不随 `worldHz` 线性增长。旧 Replay 中已经
保存的重复输入仍按相同格式正常播放。

移动使用数字 `channel`，省略表示通道 `0`；键盘、Pointer、摇杆等输入源名称不进入
Replay。一个 channel 同时控制多个 Bobby 时只记录一次输入方向，播放时根据地图中的
`controller / mirrorX / mirrorY` 重新解析各 Bobby 的实际方向。

直接针对 actor 的 Debug 移动与 actor effect 使用 Bobby 在该动作处的地图位置 `{ x, y }`
作为稳定引用。单 Bobby 地图省略该引用；多 Bobby 地图在执行动作前用当前位置解析
Bobby。机关产生的 forced intent 由 World 在重放时重新计算。

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
    "note": ""
  },
  "runtime": {
    "worldHz": 60,
    "bobbyLocomotion": {
      "moveMs": 350
    }
  },
  "initialIntents": [
    {
      "type": "set-actor-lock-key",
      "kind": "reusable",
      "enabled": true
    }
  ],
  "finalState": {
    "status": "won",
    "moves": 14,
    "elapsedMs": 2000,
    "counters": {
      "collect-carrot": 9,
      "fill-egg-nest": 4
    },
    "completedConditions": [
      { "type": "collect-all", "target": "carrot" },
      { "type": "reach", "target": "exit" }
    ]
  },
  "endTick": 120,
  "frames": [
    {
      "tick": 0,
      "groups": [
        {
          "intents": [{ "type": "move", "direction": "right" }]
        }
      ]
    }
  ]
}
```

`meta.name` 和 `meta.url` 由宿主在开始录制时提供。`note` 初始为空字符串，Engine
不读取或解释其内容，用户可以在 Replay 文本中直接填写。

录制器生成完整的轻量 `finalState` 摘要：`status` 为 `playing / won / dead`；`moves` 记录
本局成功的玩家移动步数；`elapsedMs` 记录取整后的 World 时间，只用于查看录像信息；
`counters` 累计本次运行中实际发出的 `collect-* / fill-*` WorldEvent，零值省略；
`completedConditions` 展开并列出终点已经满足的 `collect-all / fill-all / reach` 叶子条件。
它不复制完整 World 或 Entity state，因此地图中与终局无关的细节调整不会扩大 fixture
维护面。

Replay 文件中的 `finalState` 同时是声明式校验子集：回归测试只比较文件实际包含的字段，
未声明字段不参与比较，`finalState: {}` 表示只验证 Replay 能执行到 `endTick`。`elapsedMs`
即使存在也始终排除在结果一致性校验之外，因此它只承担录制信息职责。未来增加终局摘要
字段时，现有 fixture 不会因实际结果多出字段而失效。

Web 生成 `meta.url` 时固定使用 `https://bc5r.xujinkai.net/`，并保留当前页面的路径、
查询参数和 fragment，使本地开发环境录制的文件也指向正式站点。

Replay 本身不解析地图身份。调用方负责选择用于播放或无头执行的 `LevelMap`；Runner
从起点执行到 `endTick` 并返回实际 `finalState` 与 Tick 数。仓库 fixture 测试按上述字段
子集比较；Web 录像面板在文件声明 `status` 时比较该字段，用于提示回放是否到达相同终局。

`initialIntents` 是 runtime 的通用 actor target 在建局后得到的 gameplay 动作，按数组顺序
于 tick 0 前应用，并使用同一套位置引用规则。Replay playback 不调用宿主
`onInteractionRequest()`，因此购买等外部决定只会按已经录入 frame 的 Engine Intent
执行一次。地图字面 `dialogue` 已存在于 LevelMap；纯展示对白不会重复写入 Replay。

## 仓库内置过法

Web 为每张地图约定一个默认内置过法地址：

```text
assets/replays/<collection>/<map-id>.json
```

Web 录制面板只按当前关卡的 collection 和 map ID 尝试该固定地址。测试 fixture 的
文件名可以表达 take、路径或测试目的，不承担地图身份；`npm run verify` 递归扫描
`assets/replays/` 的全部 JSON，从每个 Replay 的 `meta.url` 解析
`/explore/play/<collection>/<map-id>`，再加载对应 `assets/maps/` 地图复跑。因此同一地图
可以拥有多个 Replay 测试文件。每新增一个 JSON 都会自动进入这项回归测试，也会随
`assets/` 原样发布到 `dist/assets/`。

## Web 录制入口

Explore 游戏页底栏左侧提供“录制”入口。“重新开始并录制”从关卡正式起点创建一次 take，
录制期间同一按钮用于停止；停止后立即调用无头 Runner 从 tick 0 复跑到录制终点。
Replay JSON 可以直接编辑，并可从起点播放、暂停、停止、跳转起点或终点、复制到剪贴板或
下载为 Engine 测试 fixture；“加载内置过法”按当前关卡读取仓库 fixture。面板速率是
Engine 的常驻 `timeScale`，同时作用于普通游戏、
录制和播放。输入合法正数时立即更新 World 与 Presentation；输入为空或非法时保留最近
一次合法倍率，并在尝试播放时标红。开始、暂停和停止 Replay 均不改变已选择的倍率。快退
与快进按钮依次选择 `0.1 / 0.5 / 1 / 1.25 / 1.5 / 2 / 4 / 8` 中相邻的预设值。

录制面板的打开状态和 Replay 录制状态都不改变 GamePage 的终局流程。通关与失败照常播放角色过渡、终局音乐并显示结果卡片；录制中的 take 由用户在面板中停止并生成 Replay JSON。

关卡进入表现期间 WorldClock 不推进，键盘、指针、摇杆和外部移动意图会被丢弃，
因此进入动画不增加 Replay tick、`elapsedMs` 或输入 frame。Replay 播放从同一个
tick 0 World 状态开始，进入表现只属于 PresentationClock。

Replay 文本较大，编辑时在输入停止后延迟解析 JSON；播放与时间线跳转只使用已经通过
解析的内容。Textarea 聚焦时保留当前光标和选择范围，复制完整内容使用面板按钮。

“跳过思考时间”默认启用。播放进入稳定状态后，无输入区间超过一秒时会分批快速执行
其中的 World Tick，并在下一次输入前保留 250ms。每个 Tick 仍经过正式 Session；运动、
输入阻塞过程、世界事件和终局表现会恢复正常展示。该设置只影响浏览器播放耗时，不改变
Replay 输入、`endTick` 或无头复跑结果。

Explore 游戏页使用 `Tab` 开关录制面板；焦点位于链接、按钮、输入框、Textarea、Select
或其它可交互元素时保留浏览器原有的焦点导航。面板开关写入当前标签页的
`sessionStorage`，因此地图导航与刷新会恢复同一状态。

通过 `npm run dev` 启动时，Adventure 游戏页提供相同的底栏入口与 `Tab` 快捷键；正式
构建保持 Adventure 玩家界面。Adventure 页面装配器把 Campaign node 实际引用的地图
身份解析成内置 Replay URL 和 canonical Explore URL 后交给录制面板，因此面板只消费
普通 URL，不解释 Adventure identity。录制结果可以直接放入 `assets/replays/` 参与回归。

桌面布局为面板保留固定宽度并缩小 Canvas 可用区域；窄屏布局将面板悬浮在游戏区域内，
保持 Canvas 尺寸。面板开关引起可用区域变化时，Web 必须触发 Engine viewport resize。
