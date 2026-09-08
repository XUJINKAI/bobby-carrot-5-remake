# 原版机关与关卡机制

## 图集与角色资源

`ts.png` 与 `ta.png` 的尺寸、静态单元和动画序列统一登记在
`model/src/map/entity/original-tile-visuals.json`。本页使用目录中的
`type / fields / role / phase / animation id` 指代 Tile Visual，不重复保存坐标。

- `b0.png`～`b3.png`：1×8，Bobby 左 / 右 / 上 / 下。
- `b4.png`：1×3，待机。
- `b5.png`：1×8，死亡。
- `b6.png`：1×10，Bobby 关卡进入 / 通关过渡；进入关卡时反向播放，通关时正向播放。
- `b7.png`：2×4，割草机。
- `b8.png`：3×4，雪铲。
- `b9.png`：1×4，风筝。
- `bf.png`: 3x1, 蝴蝶。
- `alarm.png`: 1x2, 闹钟。
- `hud.png`: 1x11, 游戏内HUD层。
- `misc.png`: 1x9, 章节进度、难度、国家图标。
- `mow.png`: 2x5, 割草动画。

`arrows.png` 是滚动/菜单箭头：Up `(0,0,17×9)`、Down `(0,9,17×9)`、Left `(17,0,9×17)`、Right `(26,0,9×17)`。

其他资源包括：

- `icon.png`: 金色胡萝卜ICON。
- `sleep.png`: 兔子睡觉图。
- `title.png`: 标题图。
- `train.png`: 原版night train 动画图。

此外 `font.png` 和 `numbers.png` 为字体图，白色字体，本项目使用自己的文字覆盖。

## 地形说明

地形大体分为：草地，水，沙漠，雪

完整地形含义参考 `surface.md`。

## 通关目标

普通 release 关的计数目标是二选一：收集全部胡萝卜，或填充全部 Easter Egg Nest；计数归零后再到达 Exit 才完成。Golden Carrot 使用另一条特殊关完成流程，触碰后直接结算并持久化。隐藏 Cheat 还可把普通关剩余目标直接清零，但仍走正常 Exit 完成流程。

普通关通关时进入结果界面，原版文本列出本次 `TIME`、本关获得的 `BONUS COINS` 与累计 `TOTAL COINS`，并播放一次性音乐 `cleared.mid`。原版结果界面不显示步数。

### carrot 胡萝卜

- 胡萝卜是可收集物品，关卡目标是收集胡萝卜时，界面HUD显示胡萝卜剩余数量。

视觉使用 `carrot` 的 base、`consumed` phase，以及 `high-grass` 的 `objective`
phase。

### egg 彩蛋

- 关卡目标是填充彩蛋时，将地图上所有的egg-nest-empty填充彩蛋视为达成目标。界面HUD显示还要填充的彩蛋数。

视觉使用 `egg` 的 base、`filled` phase，以及 `high-grass` 的 `objective` phase。

注意：胡萝卜和彩蛋洞被高草覆盖的画面visual一样，但含义不同。

### golden-carrot 金色胡萝卜

- bobby 触碰金色胡萝卜也可以作为通关条件。

### exit 出口

- 其他目标未完成时，Exit 使用 `exit` 的 base。
- 通关条件只剩 reach Exit 时，播放 `exit/ambient` 动画。

## 移动类机关

### Speed 加速带

- Up / Down / Left / Right 四方向强制移动。
- 按下 Speed Switch 可改变 Up/Down，Left/Right 方向
- 按下 Speed Switch 还会弹出其他按下的 Speed Switch
- 按下状态的 Speed Switch 无法再次按下

加速效果：
- Bobby 走上 Speed 之后，会拥有加速效果，移动速度加快
- Bobby 走出 Speed 之后，加速效果至少还会保持3格，如果一直按着加速方向键，则加速效果会一直保持，直到撞停
- Bobby 开着割草机上 Speed 也会获得加速效果，拥有加速效果的割草机可以撞碎易碎岩石。

四个方向分别使用对应 `direction` 的 `speed/ambient` 动画。

### mower 割草机

- bobby 可以获取地图上的汽油gas，此获取状态仅限此地图
- 获取汽油后可以开割草机
- 割草机可以割除普通高草和覆盖目标的高草，获得加速效果后可以撞碎易碎岩石。
- 割草机可以停在 Mower Parking 上，Bobby 下车后位于 Mower Parking 右边一格。

表现：
- bobby坐割草机的动画在`b7.png`（2x4），每列两个图片循环，从左到右分别代表左/右/上/下四个方向
- bobby坐割草机会播放音乐`mow.mid`
- 割草机撞碎易碎岩石会有全屏震动的效果

### Carousel 旋转机关

- 四种转角状态，以及垂直/水平两种竖直状态。
- bobby只能从旋转机关定义的两个方向进入，其他两个方向blocking
- Bobby离开旋转机关时，机关会顺时针旋转90度
- 通过按下 Raised 状态的 Carousel Switch，可旋转一次 Carousel，并抬起其他按下的开关
- 已按下的 Switch 无法再次被按下

Carousel 视觉由 `variant` 选择；Carousel Switch 视觉由 `pressed` 选择。

旋转机关旋转改变顺序：
```text
Right-Up   -->   Right-Down   -->   Left-Down   -->   Left-Up
Vertical   -->   Horizontal
```

### Leaf 叶子/荷叶

- bobby 可以踩着荷叶在水面上漂流，漂流方向就是bobby进入荷叶的方向
- 湍流Tide可以改变荷叶的漂流方向
- 瀑布Fall会让荷叶向下漂流，且只能向下无法回去
- 直到遇到不是水的环境，荷叶漂流才会停止

### Tide 潮汐/湍流

- 湍流有四个方向，荷叶遇到湍流会改变方向为湍流的方向
- 通过踩下抬起的Tide Switch可以改变湍流的方向，以及抬起其他被踩下的Switch
- Tide的方向改变，就是Up/Down互相转变，Left/Right互相转变
- 已经踩下的Switch无法再次被踩下

Tide Switch 视觉由 `pressed` 选择。四个方向分别使用对应 `direction` 的
`tide/ambient` 动画。

### Water Fall 瀑布

瀑布以 `top / middle / bottom` 三种 `variant` 从上到下表达，横向可以重复，
Middle 可以重复多次。三种形态分别使用对应 `variant` 的 `waterfall/ambient` 动画。

### Windmill 风车 / Cloud 云

- 云在星空中，云是可以走的
- 云可以被风车吹动，直到遇到 Cloud Parking，或撞到不是星空的障碍物
- 风车有四个方向，由四种开关控制
- bobby 走到风车开关上，可以切换开关状态
- bobby 触发 Wind Switch 后，原版用共享的 Camera Focus/Input Lock 把镜头目标切到对应 Windmill，固定 focus countdown 为 64 个 gameplay step（稳态约 1.98 秒），再加上镜头飞行时间。
- 如果第一朵 Cloud 真正被刚开启的风改向，镜头可继续 handoff 到该 Cloud，并跟随约 64 个 gameplay step，最后再回 Bobby。因此肉眼看到的完整抢镜头过程可能接近 3 秒或更久，但原版没有一个简单的“固定 3 秒”计时器。

Cloud 与 Cloud Parking 视觉由 `color` 选择；Wind Switch 视觉由 `direction + active`
选择。四个方向分别使用对应 `direction` 的 `windmill/ambient` 动画。

风车吹出的纵向和横向风场素材分别登记为 `windmill/gust-vertical` 与
`windmill/gust-horizontal`。

风车吹出的风，起点在风车一半处，并在风车方向上延申3格。

例如向右的风车（以下使用带小数的坐标，且只标明横轴）：
风车在第一格（visual坐标0到1），
则从坐标 0.5 到 3.5，起始依次显示横向风场的三张图，
然后三张图各自向前循环，形成动画。

### Kite 风筝 / Whirlwind 旋风/龙卷风

- Kite是关卡内的可收集物品
- 拥有Kite的 Bobby 走到 Whirlwind 上会起飞
- airborne 状态完全绕过普通 terrain/object 碰撞，只保持当前方向逐格飞行
- airborne Bobby 跨过 Landing 的移动中点时开始降落
- 原版 class 没有“飞到地图边缘自动降落/停止”的逻辑；正常 flight path 必须在出界前由 Landing 收尾

如果 airborne Bobby 被异常地图布局引导出 grid 数组边界，下一 movement cycle 会访问越界坐标；这是无保护的异常路径，而不是一种正常玩法结算。

旋风使用 `whirlwind/ambient` 动画。

### Switch 开关 / Block

- 开关分为黄色/粉色两种，Block 也分为黄色/粉色两种。
- Bobby 每次走上开关，都会切换同色开关状态，同时切换同色 Block 状态。
- Color Switch 视觉由 `color + state` 选择，Color Block 视觉由 `color + raised`
  选择。

### Bean 种子 / Beanfield 藤蔓

- 种子是可收集物品
- 带着种子的bobby走到beanfield上，会使藤蔓发芽生长
- 藤蔓会一直长到遇到下一个可行走的地面为止

无种子时使用 `bean-field`。刚发芽时使用 `beanstalk` 的 `sprout` phase；完整藤蔓
使用 `tip / middle / base` 三种 role。

完整藤蔓最矮两格，最高中间可以衔接若干中间格

### Plank 一次性木板

- 木板可以供bobby通过
- bobby离开木板后，木板会损坏

木板损坏过程使用 `plank/crumbling` 动画。

### dragon 火龙 / ice block 冰块 / Mirror 镜子

- 冰块会阻挡bobby前进
- 火龙的头和身体会阻挡bobby前进；bobby走到火龙尾巴上，火龙会射出火球
- 火龙射出的火球会融化冰块
- 火龙的火球会根据镜子拐弯
- 火球碰到blocking障碍物会消失
- 火球会临时获取镜头，并通过同一个 Camera Focus 字段阻止 Bobby 开始新的普通移动

- bobby离开镜子时，镜子会顺时针变换方向

镜子视觉由 `variant` 选择。

镜子变换顺序：
Right-Up   -->   Right-Down   -->   Left-Down   -->   Left-Up

冰块融化使用 `ice-block/melt` 动画，结束后消失。火龙的 Head 使用
`dragon/fire` 动画，结束后回到 Head 静态视觉。

火球动画：
`hud.png`中有两个火球静态帧，循环产生动画；
hud图内容宽度不一，具体x坐标截取范围在代码中调整。

### Trap 陷阱

- 陷阱初始状态未触发，bobby可以走入
- bobby离开时陷阱触发
- bobby进入触发的陷阱会死亡

Trap 视觉由 `active` 选择。

### Ice 冰面

- bobby走到冰面上会沿当前方向自动继续滑行；下一格可走时不会读取新的方向选择，直到前方走不通后才回到普通输入。
- 滑行没有独立的固定 cadence，仍继承 Bobby 当前普通/Speed Shoes 的 3px 或 6px gameplay-step 位移。
- 原版 `a.J()` / `a.O()` 在 sliding 状态将 `av=1`，renderer 直接用 `av * 48` 取帧，因此固定的是 `b0/b1/b2/b3` 对应方向 sprite sheet 的 zero-based frame 1（第 2 格）。
- class 中没有“离开冰面专门播放第 8 帧”的状态分支；滑行结束后直接回到普通 movement/standing presentation state。

### Snow 雪块 / Shovel 雪铲

- 雪铲是可收集物品
- 雪块会阻挡bobby前进
- bobby可以拿着雪铲铲除雪块

铲雪动画在`b8.png`，四列分别代表左/右/上/下四个方向，一次播放横向三格静态帧

## 动态 Tile

### Bonus Coin 闪耀

闪耀帧使用 `bonus-coin/ambient` 动画。

所有场上的 Bonus Coin 共用同一个闪烁门控，因此会同时开始和结束闪烁。

原版 `V()` 把动态 tile phase 与随机 gate 分成两个节拍：

- `bC/bD/bE/bF` 只在 `bG==0` 时推进一次并立即重绘 tile cache；`bG` 每 4 个 gameplay step 回到 0；
- `bE` 回到 0 后会保持 4 个 gameplay step，这四步中的**每一步**都更新 `bH`：当前为 true 就关闭，否则以 `1/7` 概率开启；
- 四步窗口结束时 `bH` 是否恰好为 true，决定下一次 `bE=1` cache 重绘是否进入闪耀；
- 稳态下启动概率精确收敛为 `1/8`。若窗口开始时 `bH=false`，本轮结束为 true 的概率为 `300/2401`；开始时为 true 则为 `43/343`；
- 一旦可见，`bH` 在 `bE=1/2/3` 期间不再变化，三张动态帧各保持 4 step。因此一次可见闪耀固定持续 **12 gameplay step，约 372ms**。

随机 gate 和 cache 重绘的先后顺序很重要：`bE` 刚回到 0 时先把 Coin 重绘为静态帧，再更新 `bH`；新 gate 要到下一次 `bE=1` 才能显示。

### 水面涟漪

水面涟漪使用 `water` 的 `variant: ripple` 及其 `ambient` 动画。

### 星星闪耀效果

`starfield/sparkle-source` 的两个单元组合后切割为 3 行 6 列，在星空上随机播放。

```text
(1,1) --> (1,2) --> (1,3) --> (1,4) --> (1,5) --> (1,6) --> (2,1) --> (2,2)
```

在星空背景会概率出现。

### 蝴蝶

bf(1,1) --> bf(2,1) --> bf(3,1) --> bf(2,1)

在草地背景会有蝴蝶飞舞。

## 角色对象

这些对象虽然在原版 DAT 中可能由多个格子和多个 byte ID 组成，但在 BC5R 中应优先建模为一个 Entity + footprint / presence，而不是拆成多个互不关联的 Entity。

## Beaver

Beaver 是两格对象，Head / Body 属于同一个 Entity。方向、交互和视觉都不应通过两个独立地图对象维持同步。

## Sandman

Sandman 是两格角色型对象，由 Head / Body 共同组成一个 Entity。视觉和碰撞都应从 footprint 展开，Editor 不应把它伪装成一张单格大图。

## Dream Machine

Dream Machine 同样是两格对象，采用单 Entity + footprint。其特殊场景行为与普通 Entity runtime 共用同一套机制。
