# Web UI 规范

本文定义 Bobby Carrot 5 Remake 的 Web 信息架构、页面视觉、游戏舞台、Overlay、响应式布局和主要交互层级。Shell API 以 [`../contracts/web-shell.md`](../contracts/web-shell.md) 为准，模块依赖与 gameplay 归属以 [`../architecture.md`](../architecture.md) 为准，Engine API 以 [`../contracts/engine-api.md`](../contracts/engine-api.md) 为准。

## 设计目标

Bobby Carrot 5 Remake 的界面由同一个产品外壳和同一个游戏运行时组成：

```text
Web Product Shell
├── Home
├── Adventure
├── Explore
├── Editor
├── Settings / Help / Import
└── Product Result Flow
        │
        ▼
Engine Game Runtime
├── World / Mechanics
├── Renderer / Camera
├── InputController
├── Gameplay HUD state + rendering
├── Screen Joystick rendering + gesture
└── Timer / Rules
```

四类界面信息保持稳定分工：

- TopBar：当前位置、模式和页面操作；
- Game HUD：当前游戏世界状态；
- BottomBar：操作提示和屏幕控件开关；
- Dialog / Overlay：低频操作、需要集中注意力的决策和游戏结果。

应用层负责组织地图、模式和完成后的流程；地图运行由 Engine 完成。

## 信息架构

```text
Bobby Carrot 5 Remake
├── Home
│   ├── Welcome Demo
│   ├── Adventure 入口
│   ├── Explore 入口
│   ├── Editor 入口
│   ├── Import Custom Map
│   └── 项目介绍
├── Adventure
│   ├── Adventure Home
│   ├── Chapter Select
│   ├── Level Select
│   └── Play
├── Explore
│   ├── Original Collection
│   ├── Sokoban Collection
│   ├── Engine Lab Collection
│   └── Play
├── Editor
│   ├── New Map
│   ├── Imported Map
│   ├── Built-in Map Copy
│   └── Play Test
└── Custom
    └── Imported Map Play
```

Settings 和 Help 是全局 Overlay，可以从各主要页面打开。Import 是内容进入动作；导入后由用户选择游玩或进入 Editor。

## Home

Home 是产品入口页，承担品牌展示和快速进入模式两项职责。桌面首屏使用双栏 Hero：

```text
┌─────────────────────────────────────────────────────────────┐
│ [icon] Bobby Carrot 5 Remake                       ♫  ⚙     │
│                                                             │
│ ┌────────────────────────┐  ┌─────────────────────────────┐ │
│ │ Welcome Demo           │  │ Adventure                   │ │
│ │ Engine Game Stage      │  │ Explore                     │ │
│ │ 操作提示 / Restart     │  │ Editor                      │ │
│ └────────────────────────┘  │ Import Custom Map           │ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Adventure 是主入口，Explore 和 Editor 是并列的次级入口，Import Custom Map 是明确的文件入口。

首页顶栏的 GitHub 仓库入口与“开发中”状态在桌面和移动端都保持外露，Settings 与 Help 在移动端进入更多菜单。

Welcome Demo 使用正式 Engine 运行一张短小的演示地图，用于展示移动、收集物和代表性机关。它有独立 session，不写入 Adventure Save 或 Explore 完成记录。完成或死亡时在原 Stage 中展示重玩和进入 Adventure 的动作。

Hero 以下的项目介绍聚焦三类信息：原作重制、原版研究、Editor / 自定义地图。版本、技术说明和第三方资产权利边界位于更低的信息层级，并链接 [`../../THIRD_PARTY_ASSETS.md`](../../THIRD_PARTY_ASSETS.md)。

移动端先展示模式入口，再展示 Welcome Demo 和项目介绍，使首屏操作保持直接。

## App Shell

所有页面共享三段式 App Shell。完整配置接口与所有权边界见 [`../contracts/web-shell.md`](../contracts/web-shell.md)：

```text
┌─────────────────────────────────────────────────────────────┐
│ TopBar                                                      │
├─────────────────────────────────────────────────────────────┤
│ Content / GameStage / Editor Workspace                      │
├─────────────────────────────────────────────────────────────┤
│ BottomBar                                                   │
└─────────────────────────────────────────────────────────────┘
```

页面通过 `ShellConfig` 声明身份、返回、命令、页面操作和底栏信息。Shell 只负责布局、响应式折叠与 action 派发，不识别 Home、Explore、Adventure、Editor 或 Gameplay。

Shell 允许页面分别配置 TopBar 与 BottomBar 是否固定。固定栏位位于页面滚动视口之外，滚轮、触摸滚动与 Page Up / Page Down 只影响中间的 Content 区域；关闭固定能力时，对应栏位进入 Content 滚动视口并随页面内容移动。

页面按自身滚动模型分别声明固定状态。暂时隐藏的栏位不参与布局。

```text
┌──────────────────────────────────────────────┐
│ TopBar                              FIXED    │
├──────────────────────────────────────────────┤
│ Content                                 ▲    │
│                                         │    │
│         滚轮 / 触摸只滚动这里           █    │
│                                         │    │
│                                         ▼    │
├──────────────────────────────────────────────┤
│ BottomBar                           FIXED    │
└──────────────────────────────────────────────┘

topBarFixed = false                 bottomBarFixed = false
┌──────────────────────┐            ┌──────────────────────┐
│ TopBar               │ ▲          │                      │ ▲
├──────────────────────┤ │          │ Content              │ █
│ Content              │ █          ├──────────────────────┤ │
│                      │ │          │ BottomBar            │ ▼
└──────────────────────┘ ▼          └──────────────────────┘
   TopBar 随内容滚动                    BottomBar 随内容滚动
```

### TopBar

TopBar 固定为三列结构：

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Identity + Back        │            Commands            │ Actions / Overflow │
└──────────────────────────────────────────────────────────────────────────────┘
```

三列使用 `minmax(0, 1fr) auto minmax(0, 1fr)`。`Identity` 可包含产品 icon、产品名、页面上下文和页面提供的导航菜单；页面可在左列追加 Back。游戏页将 Undo、Redo、Restart 放在中间，将 Edit 和产品级操作放在右侧。

Music、Settings、Help 与全局 Dialog 由 App 层持有，以普通 action 配置给 Shell。Help 使用同一份全局 `HelpDescriptor`，不随页面切换。

桌面与移动端复用同一套 DOM。空间收窄时，CSS 依次收敛产品名和上下文名；标记为 `overflow` 的操作自动进入菜单，`keep` 操作保持可见，`hide` 操作隐藏。

### BottomBar

BottomBar 使用 `Leading | Info | Trailing` 三段结构。Info 只用于首页署名、Editor 校验问题和 Engine 运行时警告等状态反馈，不展示快捷键提示。Explore 游戏与 Adventure 游戏保留各自的 Leading / Trailing 操作且 Info 为空；Adventure 首页、章节选择、夜间列车与 Embed 页面隐藏 BottomBar。首页 Demo 的基础移动引导位于 `home-demo-status`。需要选择的流程进入 Dialog；游戏完成或死亡进入 Result Overlay。

## GameStage

所有可游玩入口复用同一 GameStage。基础 HUD 和摇杆与 Canvas 一起由 Engine 渲染：

```text
┌───────────────────────────────────────────────────────────────────────┐
│ GameStage                                                      🥕 12 │ ← 目标
│                                                    🔑  🫘×2  🪙×1 │ ← 道具
│                                                                       │
│                                                                       │
│                              Canvas                                   │
│                                                                       │
│                                                                       │
│                                                        ╭─────────╮  │ ← 摇杆
│                                                        │    ●    │  │
│                                                        ╰─────────╯  │
└───────────────────────────────────────────────────────────────────────┘

叠加与归属：

Web Product Layer
├── ResultOverlay
├── DebugOverlay / product statistics
└── Dialog presentation
            ↑
Engine Gameplay Layer
├── Gameplay HUD
├── Screen Joystick
└── Renderer Canvas
```

Engine Gameplay Layer 接收 `LevelMap + Runtime Config` 后即可创建 Canvas 渲染、基础 HUD 和 Screen Joystick。Web 提供响应式 GameStage 容器，并把产品侧 Overlay 叠加在 Engine Layer 上方；Overlay 不改变 Canvas 的布局尺寸。

Welcome Demo、Adventure、Explore、Custom Play 和 Editor Play Test 均通过正式 Engine session 运行地图。

### Game HUD

基础 Gameplay HUD 属于 Engine，包括数据读取、图标选择、可见性更新、布局锚点与渲染生命周期。

Adventure HUD：

```text
┌─────────────────────────────────────┐
│                                8 🥕 │
│                         🪁 2 🫘 🛷 ⛽ │
│                                     │
│                GAME                 │
│                                     │
└─────────────────────────────────────┘
```

Explore HUD：

```text
┌──────────────────────────────────────────────────────┐
│ 02:31                                         12 🥕 │
│ 84 STEPS                              🪁 2 🫘 🛷 ⛽  │
│                                                      │
│                         GAME                         │
│                                                      │
│                                               DEBUG │
└──────────────────────────────────────────────────────┘
```

HUD 数据：

- 当前目标与剩余数量；
- 当前地图中的风筝、魔豆、雪铲与汽油持有状态；
- Engine Timed Challenge 剩余时间；
- 当前模式允许展示的移动步数和统计用时。

Engine HUD 使用原版图标和紧凑 Overlay，统一锚定在 GameStage 右上角。第一行以 26px 字号在目标图标左侧显示剩余数量；第二行只显示当前持有的风筝、魔豆、雪铲与汽油，并按此顺序从左向右排列。两行直接显示半透明图标和数字，不使用容器边框、底色或阴影；数字使用 Jersey 10 像素字体和 1px 黑色描边增强复杂地图上的辨识度。物品只在持有或数量大于零时出现。

Explore 的统计 Overlay 锚定在 GameStage 左上角，以 22px 字号分两行显示统计用时和移动步数，并与 Engine HUD 使用相同透明度和纯文字样式。

```text
右上角 HUD 锚点

                                      12 🥕
                              🪁  2 🫘  🛷  ⛽
```

Adventure 通过 Runtime Config 选择紧凑 HUD，优先保持原作信息边界。Explore 可以在 Engine 基础 HUD 之外叠加 Steps、统计用时和 Debug 入口；统计用时由 Web 记录，不参与地图规则。

### Screen Control

Screen Control 是 Engine 提供的 `ScreenJoystick`。Engine 负责半透明圆形底座、可拖动球头、手势状态与渲染生命周期，并把拖动向量持续转换为四方向 Game Action。

```text
静止                         向左拖动                     向右上拖动

    ╭───────────╮               ╭───────────╮               ╭───────────╮
    │           │               │           │               │       ●   │
    │     ●     │               │ ●         │               │           │
    │           │               │           │               │           │
    ╰───────────╯               ╰───────────╯               ╰───────────╯
      半透明底座                   held: left                  held: up
      球头在中心
```

手势到 Engine Action 的转换：

```text
pointerdown
    │  记录摇杆中心 C
    ▼
pointermove P ──> 向量 (dx, dy) ──> 限制球头在底座半径内
                                      │
                  ┌───────────────────┴──────────────────┐
                  │                                      │
           距离 ≤ dead zone                       距离 > dead zone
                  │                                      │
                  ▼                                      ▼
 setHeldDirection(null)                  取绝对值更大的主轴方向
                                           │
                           ┌───────────────┼───────────────┐
                           ▼               ▼               ▼
                        left/right       up/down        方向迟滞
                           └───────────────┬───────────────┘
                                           ▼
                              setHeldDirection(direction)

pointerup / pointercancel / lost capture / window blur
    └──> 球头回中 + setHeldDirection(null)
```

斜向拖动仍输出四方向 Game Action。主轴判断配合少量方向迟滞，避免在对角线附近快速抖动。球头位移只提供视觉反馈，不把模拟量传入格子移动规则。

摇杆叠加在 GameStage 的右下安全区域：

```text
┌──────────────────────────────┐
│                       🥕 12 │
│                   🔑  🫘×2 │
│                              │
│            GAME              │
│                              │
│                 ╭─────────╮  │
│                 │    ●    │  │
│                 ╰─────────╯  │
│                              │
└──────────────────────────────┘
```

桌面和移动端都允许用户在 Settings 或 BottomBar 中切换。Web 持久化产品偏好，并把开关写入 Engine Runtime Config。首次使用时：

- coarse pointer 设备默认开启；
- fine pointer 设备默认关闭。

页面进入全局 Dialog、Result 决策状态或其它需要暂停操作的 Overlay 时，Web 暂停 Engine Input；Engine 清空 held direction 并让球头回中。

### Debug Overlay

Debug 属于 Explore 和 Editor 调试体验，以右侧浮动 Inspector 展示：

- Tile 坐标；
- semantic Terrain / Object；
- multi-cell Object owner；
- passage 判定与置信度；
- Engine 最近事件或阻挡原因。

关闭 Debug 后 Inspector 完整隐藏，GameStage 恢复为普通游玩视图。Adventure 不提供 Debug 能力。

### Result Overlay

Result 保留最后一帧并覆盖在 Stage 中央：

```text
┌──────────────────────────────────────────────┐
│                                              │
│                 GAME WORLD                   │
│         ┌────────────────────────┐           │
│         │       关卡完成！       │           │
│         │                        │           │
│         │      [ 下一关 ]        │           │
│         │  [ 重玩 ]  [ 返回 ]    │           │
│         └────────────────────────┘           │
│                                              │
└──────────────────────────────────────────────┘
```

Engine 只报告完成或死亡事实，Web 根据入口决定动作：

| 入口 | 完成后的主要动作 | 其它动作 |
| --- | --- | --- |
| Welcome Demo | 开始 Adventure | 重玩 |
| Adventure | 下一关 | 重玩、返回章节 |
| Explore | 下一关或返回选关 | 重玩、Undo、打开 Editor |
| Custom | 返回地图信息 | 重玩、打开 Editor |
| Editor Play Test | 返回编辑 | Restart |

Result Overlay 原地覆盖 GameStage，保留最后一帧世界画面作为上下文。

## 页面规范

### Adventure

Adventure Home：

Adventure 的首页菜单、章节入口、关卡入口与夜间列车入口复用首页按钮的主题色、边框、圆角、阴影和交互状态；切换 Bobby / FC 主题时由同一组 `--bc-*` 变量驱动。

```text
┌────────────────────────────────────────────────────────────┐
│ [icon] 冒险模式 ▾                                      ♫ ⚙ ? │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                 BOBBY CARROT 5 REMAKE                      │
│                                                            │
│                    冒险模式                                 │
│                    [ 继续 12-4 ]                           │
│                    [ 选择章节 ]                            │
│                                                            │
│ BONUS  18       GOLDEN CARROT  7       GOLDEN KEY  ★      │
├────────────────────────────────────────────────────────────┤
│ 原版 Campaign · 章节解锁、永久奖励和受限游戏视野           │
└────────────────────────────────────────────────────────────┘
```

Chapter Select 与 Level Select：

```text
┌────────────────────────────┐   ┌────────────────────────────┐
│ ←     CHAPTER SELECT       │   │ ←      CHAPTER 12      ★★ │
├────────────────────────────┤   ├────────────────────────────┤
│ 01  Green Garden    ★  12/12│   │ LEVEL 1      12-1       ✓ │
│ 02  Snow World     ★★  8/12│   │ LEVEL 2      12-2       ✓ │
│ 03  Dream Land    ★★★  0/12│   │ LEVEL 3      12-3       ▶ │
│ 04  ...             🔒     │   │ BONUS 1      12-BONUS-1 🔒│
│                            │   │ ...                        │
└────────────────────────────┘   └────────────────────────────┘
```

Chapter Select 展示连续 1～40 章、原版 1～3 星章节难度、锁定状态和完成进度。Level Select 按正式 Campaign 顺序展示：

```text
1, 2, 3, bonus-1, 4, 5, 6, bonus-2, 7, 8, 9, 10
```

Adventure Play 在桌面也使用 portrait puzzle viewport：

```text
┌───────────────────────────────────────────────────────────────┐
│ [icon] 冒险模式 ▾ │ ← 返回  ↻                         │ ♫ ⚙ ? │
├───────────────────────────────────────────────────────────────┤
│                 ┌─────────────────────────┐                   │
│                 │                   12 🥕 │                   │
│                 │               🪁 2 🫘 🛷 │                   │
│                 │                         │                   │
│                 │          GAME           │                   │
│                 │                         │                   │
│                 │             ╭────────╮  │                   │
│                 │             │   ●    │  │                   │
│                 │             ╰────────╯  │                   │
│                 └─────────────────────────┘                   │
├───────────────────────────────────────────────────────────────┤
│                                             屏幕摇杆 [ 开 ] │
└───────────────────────────────────────────────────────────────┘
```

Camera 最小 zoom 保持谜题信息边界。通用 App Shell 仍保持可用，Adventure 的能力配置关闭 Undo 和 Debug。

### Explore

Level Browser：

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [icon] Bobby Carrot 5 Remake │ 自由探索模式 ▾ │ 自由选关     ♫ ⚙ ? │
├────────────────────────────────────────────────────────────────────────┤
│ [ 原版关卡 ] [ Novoban ] [ LOMA ] [ Engine Lab ]                    │
│                                                                        │
│ [继续 12-4]  [随机一关]                                               │
│                                                                        │
│ 筛选：难度 ▼  机关 ▼  道具 ▼  场景 ▼                    [ 清除 ]      │
│                                                                        │
│ ┌─ CHAPTER 1 · ★ ────────────────────────────────────────────────────┐ │
│ │  1✓  2✓  3✓  B1✓  4✓  5✓  6✓  B2✓  7✓  8✓  9✓  10✓             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ CHAPTER 2 · ★★ ───────────────────────────────────────────────────┐ │
│ │  1✓  2✓  3   B1   4   5   6   B2   7   8   9   10               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ 全部关卡开放 · ✓ 表示曾通关                            屏幕摇杆 [ 关 ]│
└────────────────────────────────────────────────────────────────────────┘
```

Explore 的一级导航是地图 collection。`/explore` 与 `/explore/original` 显示原版关卡，`/explore/novoban-pushbox`、`/explore/loma-pushbox` 与 `/explore/engine-lab` 分别显示 Novoban、LOMA 和 Engine Lab 地图。Original Tab 平铺 40 章，展示 400 个普通关卡和 80 个 Bonus 奖励关，并提供：

- 最近浏览；
- 随机一关；
- 难度、机关、道具和场景筛选；
- 独立完成记录；
- 章节星级与单关难度的来源区分。

每个 collection 独立记录最近游玩的地图，并与 Original 共用继续游玩和随机关卡入口。Custom collection 使用整张可点击的地图卡片展示名称与说明，点击卡片直接开始游玩；编辑入口位于游玩页顶栏。Tab 外壳保持统一，列表内容可以根据 collection 的信息需求专门设计。

Explore Play：

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [icon] Bobby Carrot 5 Remake │ 自由探索模式 ▾ │ ←返回 ⏮ ⏭ ↻ │ ↶ ✎ ♫ ⚙ ? │
├────────────────────────────────────────────────────────────────────────┤
│ 02:31                                                         12 🥕 │
│ 84 STEPS                                                🪁 2 🫘 🛷 ⛽ │
│                                                     ┌────────────────┐ │
│                      GAME                           │ Tile 14,8      │ │
│                                                     │ Object: Dragon │ │
│                                                     │ blocked        │ │
│                                                     └────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Rock Door · 需要钥匙 · ~ Debug                         屏幕摇杆 [ 关 ]│
└────────────────────────────────────────────────────────────────────────┘
```

所有 Explore 地图使用 `/explore/play/<collection>/<map-id>` 进入同一个 GamePage，并在解析后统一向 Engine 提交 `LevelMap`。页面从当前 collection `index.json` 取得前后关顺序；顶栏左侧依次显示返回、上一关、下一关和 Restart，移动端收起上一关与下一关。返回按钮固定显示“返回”，相邻的上一关、下一关使用媒体切换图标。Explore 使用自由 Camera，提供 Undo、Redo、Restart、Debug 和打开地图 clone 到 Editor 的动作；返回操作进入 `/explore/<collection>`。

### Editor

桌面 Editor：

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [icon] Bobby Carrot 5 Remake │ 编辑器模式 ▾ │ Untitled ↶ ↷ ▶ Test File │ ♫ ⚙ ? │
├───────────────┬────────────────────────────────────┬─────────────────────┤
│ PALETTE       │                                    │ INSPECTOR           │
│               │                                    │                     │
│ Terrain       │                                    │ Dragon              │
│ □ □ □ □       │              CANVAS                │ Anchor 8,12         │
│               │                                    │ Variant East        │
│ Objects       │                                    │                     │
│ □ □ □ □       │                                    │                     │
├───────────────┴────────────────────────────────────┴─────────────────────┤
│ Dragon · 8,12 · Q/E 切换方向 · Del 删除完整对象       屏幕摇杆 [ 关 ]   │
└──────────────────────────────────────────────────────────────────────────┘
```

Play Test 在同一工作区切换 Stage：

```text
EDIT MODE                                  PLAY TEST

┌────────┬─────────────┬──────────┐        ┌──────────────────────────────┐
│Palette │   Canvas    │Inspector │  ▶     │          GAME STAGE          │
└────────┴─────────────┴──────────┘        │                    ╭──────╮  │
                                           │                    │  ●   │  │
                                           │                    ╰──────╯  │
                                           └──────────────────────────────┘
                                           TopBar: ■ Stop  ↻ Restart
```

TopBar 上下文区域提供地图名称、Undo / Redo、Play Test 和文件入口；BottomBar 展示当前素材、坐标、变体和操作提示。

Editor Play Test 在当前工作区中切换为正式 GameStage。Stop 销毁临时 Game 和 InputController，并回到相同 Draft。运行时状态不反写 Draft。

移动端 Editor 使用 Drawer：

```text
┌──────────────────────────────┐   ┌─────────────────┬────────────┐
│ [icon] Bobby Carrot 5 Remake│   │ PALETTE         │            │
│ 编辑器模式 ▾       ▶  ⋯  ? │   │                 │            │
├──────────────────────────────┤   │ Terrain         │  CANVAS    │
│                              │   │ □ □ □ □         │            │
│            CANVAS            │   │ Objects         │            │
│                              │   │ □ □ □ □         │            │
├──────────────────────────────┤   └─────────────────┴────────────┘
│ Rock · 左键放置              │
└──────────────────────────────┘
```

Editor 的完整地图和对象编辑规则见 [`editor.md`](editor.md)。

### Custom Map

Import Dialog：

```text
┌──────────────────────────────────────────┐
│ 导入自定义地图                        × │
├──────────────────────────────────────────┤
│                                          │
│      ┌────────────────────────────┐      │
│      │      拖入 JSON 文件        │      │
│      │                            │      │
│      │       [ 选择文件 ]         │      │
│      └────────────────────────────┘      │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│ My First Level                        × │
├──────────────────────────────────────────┤
│ by Alice · 24 × 18                       │
│ 一个关于魔豆和龙的谜题……                │
│                                          │
│       [ ▶ 游玩 ]      [ ✎ 编辑 ]        │
└──────────────────────────────────────────┘
```

Import Dialog 接受语义 JSON，解析成功后展示地图名称、作者、尺寸和描述，并提供“游玩”和“编辑”两个动作。

内置 Custom Map 通过 Explore collection 进入通用 GameStage，上下文标识地图名称，Result 动作返回对应 collection。用户导入地图同样使用通用 GameStage。用户地图交换格式以 [`../contracts/level-format.md`](../contracts/level-format.md) 为准；当前产品入口使用 JSON Import / Export。

## Settings 与 Help

Settings 是全局 Dialog：

```text
                 ┌──────────────────────────────┐
                 │ 设置                      × │
                 ├──────────────────────────────┤
                 │ AUDIO                        │
                 │ 音乐                  [ 开 ] │
                 │ 音乐音量          ━━━━━●━━  │
                 │ 音效音量          ━━━●━━━━  │
                 │ MIDI 音色               ▼   │
                 │                              │
                 │ CONTROLS                     │
                 │ 屏幕摇杆              [ 开 ] │
                 │                              │
                 │ ADVENTURE SAVE               │
                 │ [ 导入 ] [ 导出 ] [ 清空 ]   │
                 └──────────────────────────────┘
```

设置按领域组织：

- Audio：Music、Sound、音量、MIDI 音色与混响；
- Controls：Screen Control 偏好和输入提示；
- Adventure Save：导入、导出和清空；
- About：版本、项目链接与第三方资产说明。

Music TopBar 按钮只负责静音切换，其它音频配置进入 Settings。首次加载时如果浏览器仍在等待用户交互才能播放音乐，按钮下方显示轻量提示；页面收到交互并恢复音频后自动收起。

Help 在所有页面展示同一份快捷键说明：

```text
┌──────────────────────────────────────┐
│ 快捷键帮助                        × │
├──────────────────────────────────────┤
│ 游戏                                 │
│ WASD / 方向键：控制移动              │
│ Tab：切换录制面板                    │
│ ~：切换 Debug                        │
│                                      │
│ Editor                               │
│ Tab：切换 Palette / Surface          │
│ 1 / 2 / 3 / 4：选择对应编辑工具      │
│ Ctrl/Cmd 系列：编辑与剪贴板操作      │
└──────────────────────────────────────┘
```

Help 是用户界面中完整快捷键说明的唯一来源；首页 Demo 的 `home-demo-status` 只提供基础移动引导。

## Overlay 与反馈规则

界面叠加层从高到低：

```text
┌──────────────────────────────┐
│ Result Overlay               │  最高
├──────────────────────────────┤
│ Global Decision Dialog       │
├──────────────────────────────┤
│ Settings / Help / Import     │
├──────────────────────────────┤
│ Debug / Inspector            │
├──────────────────────────────┤
│ Engine Gameplay HUD          │
├──────────────────────────────┤
│ Engine Screen Joystick       │
├──────────────────────────────┤
│ Canvas                       │  最低
└──────────────────────────────┘
```

统一反馈类型：

- BottomInfo：一句话状态或提示；
- Dialog：需要用户选择、文件操作或集中配置；
- ResultOverlay：地图完成或死亡。

Restart、Undo、Play Test 和普通关卡切换使用直接操作。破坏性存档操作、Editor 未保存离开和其它不可轻易恢复的动作使用统一确认 Dialog。

Editor Draft 发生修改后，离开 Editor 或切换模式时显示未保存保护；继续编辑和确认离开是两个明确动作。

```text
┌──────────────────────────────────┐
│ 地图尚未保存                  × │
├──────────────────────────────────┤
│ 离开编辑器将丢失当前修改。       │
│                                  │
│ [ 留在这里 ]          [ 离开 ]   │
└──────────────────────────────────┘
```

## 响应式与可访问性

移动端游戏：

```text
┌──────────────────────────────┐
│ [icon] Bobby Carrot 5 Remake│
│ 冒险模式 ▾    12-4   ♫ ⚙ ?│
├──────────────────────────────┤
│                       🥕 12 │
│                   🔑  🫘×2 │
│                              │
│            GAME              │
│                              │
│                 ╭─────────╮  │
│                 │    ●    │  │
│                 ╰─────────╯  │
│                              │
├──────────────────────────────┤
│ 拖动圆形摇杆移动    摇杆 [开]│
└──────────────────────────────┘
```

移动端 Home：

```text
┌──────────────────────────────┐
│ [icon] Bobby Carrot 5 Remake│
│                         ♫ ⚙ │
│                              │
│      [ ▶ 冒险模式 ]         │
│                              │
│ [ 自由选关 ] [ 地图编辑器 ] │
│                              │
│ [ 导入自定义地图 ]           │
├──────────────────────────────┤
│        WELCOME DEMO          │
│            GAME              │
├──────────────────────────────┤
│        ABOUT PROJECT         │
└──────────────────────────────┘
```

- 桌面和移动端都使用当前模式下拉；移动端将产品标题与模式上下文分成两行；
- Screen Control、HUD、Debug 和 Result 始终覆盖在 Stage 内，不压缩 Canvas；
- 触摸目标满足移动设备操作尺寸，并避开 `safe-area-inset-*`；
- 所有图标按钮提供可访问名称和状态；
- Dialog 打开时管理焦点、暂停 gameplay 输入，并在关闭后恢复；
- 键盘用户可以完成模式导航、Dialog 操作和 Editor 的主要命令；
- 动画与声音遵循全局用户设置。

## 实现边界

```text
Engine
├── 地图内规则、死亡与完成事实
├── Renderer / Camera
├── Gameplay HUD 状态与渲染
├── Screen Joystick 渲染与手势
├── Gameplay state 与 Timed Challenge
└── InputController / Runtime Config

Web / Editor Host
├── App Shell 与页面导航
├── GameStage 容器与 Engine 能力配置
├── Result 动作与跨关流程
├── Settings / Help / Import
└── 统计用时、Debug Inspector 与产品进度
```

Web 通过页面函数和明确 API 协作。跨模块状态通过数据、事件和生命周期接口传递。
