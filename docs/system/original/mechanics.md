# 原版机关与关卡机制

## 图集与角色资源

文档统一使用 `asset(row,column)`，从 1 开始。

- `ts.png`：16×16 静态 tile 图集。
- `ta.png`：15×4 动态 tile 图集。
- `b0.png`～`b3.png`：1×8，Bobby 左 / 右 / 上 / 下。
- `b4.png`：1×3，待机。
- `b5.png`：1×8，死亡。
- `b7.png`：2×4，割草机。
- `b8.png`：3×4，雪铲。
- `b9.png`：1×4，风筝。
- `bf.png`: 3x1, 蝴蝶。
- `alarm.png`: 1x2, 闹钟。
- `hud.png`: 1x11, 游戏内HUD层。
- `misc.png`: 1x9, 章节进度、难度、国家图标。
- `mow.png`: 2x5, 割草动画。

`b6.png`、`arrows.png` 的具体语义或帧布局尚未在这里固定，后续确认后补充。

其他资源包括：

- `icon.png`: 金色胡萝卜ICON。
- `sleep.png`: 兔子睡觉图。
- `title.png`: 标题图。
- `train.png`: 原版night train 动画图。

此外 `font.png` 和 `numbers.png` 为字体图，白色字体，本项目使用自己的文字覆盖。

## 地形说明

地形大体分为：草地，水，沙漠，雪

完整地形含义参考`surface.md`

## 通关目标

原版关卡可组合三类目标：

- 收集全部胡萝卜；
- 填充全部 Easter Egg Nest；
- 收集到金色胡萝卜。
- 到达 Exit。

通关时，弹出通关菜单，列举本次用时和步数信息，并播放音乐`cleared.ogg`。

### carrot 胡萝卜

- 胡萝卜是可收集物品，关卡目标是收集胡萝卜时，界面HUD显示胡萝卜剩余数量。

视觉：
```text
胡萝卜                  ts(13,11)
收集胡萝卜后的空洞      ts(13,10)
胡萝卜被高草覆盖        ts(13,9)
```

### egg 彩蛋

- 关卡目标是填充彩蛋时，将地图上所有的egg-nest-empty填充彩蛋视为达成目标。界面HUD显示还要填充的彩蛋数。

视觉：
```text
空的彩蛋洞           ts(13,12)
填充了彩蛋的洞       ts(13,13)
彩蛋洞被高草覆盖     ts(13,9)
```

注意：胡萝卜和彩蛋洞被高草覆盖的画面visual一样，但含义不同。

### golden-carrot 金色胡萝卜

- bobby 触碰金色胡萝卜也可以作为通关条件。

### exit 出口

- 其他目标未完成时，exit表现未静态图`ts(10,7)`
- 通关条件只剩reach exit时，播放动画`ts(10,7) --> ta(1,1) --> ta(1,2) --> ta(1,3)`

## 移动类机关

### Speed 加速带

- Up / Down / Left / Right 四方向强制移动。
- 按下 Speed Switch 可改变 Up/Down，Left/Right 方向
- 按下 Speed Switch 还会弹出其他按下的 Speed Switch
- 按下状态的 Speed Switch 无法再次按下

加速效果：
- Bobby 走上 Speed 之后，会拥有加速效果，移动速度加快
- Bobby 走出 Speed 之后，加速效果至少还会保持3格，如果一直按着加速方向键，则加速效果会一直保持，直到撞停
- Bobby 开着割草机上 Speed 也会获得加速效果，拥有加速效果的割草机可以撞碎易碎岩石ts(15,14)

加速带动画：
```text
Up:    ts(12,6) --> ta(1,4) --> ta(2,1) --> ta(2,2)
Down:  ts(12,7) --> ta(2,3) --> ta(2,4) --> ta(3,1)
Left:  ts(12,8) --> ta(3,2) --> ta(3,3) --> ta(3,4)
Right: ts(12,9) --> ta(4,1) --> ta(4,2) --> ta(4,3)
```

### mower 割草机

- bobby 可以获取地图上的汽油gas，此获取状态仅限此地图
- 获取汽油后可以开割草机
- 割草机可以割草ts(13,8) ts(13,9), 获得加速效果可以撞碎易碎岩石
- 割草机可以停在mower parking ts(11,1)上，bobby从割草机下来会停在mower parking右边一格

表现：
- bobby坐割草机的动画在`b7.png`（2x4），每列两个图片循环，从左到右分别代表左/右/上/下四个方向
- bobby坐割草机会播放音乐`mow.ogg`
- 割草机撞碎易碎岩石会有全屏震动的效果

### Carousel 旋转机关

- 四种转角状态，以及垂直/水平两种竖直状态。
- bobby只能从旋转机关定义的两个方向进入，其他两个方向blocking
- Bobby离开旋转机关时，机关会顺时针旋转90度
- 通过按下 Raised 状态的 Carousel Switch，可旋转一次 Carousel，并抬起其他按下的开关
- 已按下的 Switch 无法再次被按下

旋转机关定义和视觉：
```text
Carousel Right-Up:      ts(12,10)
Carousel Left-Up:       ts(12,11)
Carousel Left-Down:     ts(12,12)
Carousel Right-Down:    ts(12,13)
Carousel Vertical:      ts(12,14)
Carousel Horizontal:    ts(12,15)
Carousel Switch:      Pressed ts(11,4), Raised ts(11,5)
```

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

Tide Switch 静态图:   Pressed ts(11,6), Raised ts(11,7)

Tide 动画：
Up:    ts(6,9)  --> ta(8,4)  --> ta(9,1)
Down:  ts(6,8)  --> ta(9,2)  --> ta(9,3)
Left:  ts(6,11) --> ta(9,4)  --> ta(10,1)
Right: ts(6,10) --> ta(10,2) --> ta(10,3)

### Water Fall 瀑布

```text
Start:  ts(6,12) --> ta(12,3) --> ta(12,4)
Middle: ts(6,13) --> ta(13,1) --> ta(13,2)
End:    ts(6,14) --> ta(13,3) --> ta(13,4)
```

瀑布分为三部分，只表达从上到下，横向可以重复，Start和End为开始和结尾，Middle可以重复多次。

### Windmill 风车 / Cloud 云

- 云在星空中，云是可以走的
- 云可以被风车吹动，直到遇到 Cloud Parking，或撞到不是星空的障碍物
- 风车有四个方向，由四种开关控制
- bobby 走到风车开关上，可以切换开关状态
- bobby 走到风车开关上，对应风车也会暂时抢走镜头控制3秒

静态资产：
Cloud Red:    ts(15,1)
Cloud Purple: ts(15,2)
Cloud Green:  ts(15,3)
Cloud Red Parking:    ts(16,1)
Cloud Purple Parking: ts(16,2)
Cloud Green Parking:  ts(16,3)
Windmill Switch Up:     On ts(11,8), Off ts(11,9)
Windmill Switch Down:   On ts(11,10), Off ts(11,11)
Windmill Switch Left:   On ts(11,12), Off ts(11,13)
Windmill Switch Down:   On ts(11,14), Off ts(11,15)

风车开启后的动画：
Up:    ts(14,1) --> ta(5,3) --> ta(5,4)
Down:  ts(14,2) --> ta(6,1) --> ta(6,2)
Left:  ts(14,3) --> ta(6,3) --> ta(6,4)
Right: ts(14,4) --> ta(7,1) --> ta(7,2)

风车吹出的风：
UP/Down：   ta(14,1) --> ta(14,2) --> ta(14,3)
Left/Right：ta(14,4) --> ta(15,1) --> ta(15,2)

风车吹出的风，起点在风车一半处，并在风车方向上延申3格。

例如向右的风车（以下使用带小数的坐标，且只标明横轴）：
风车在第一格（visual坐标0到1），
则从坐标0.5到3.5，起始依次显示ta(14,4), ta(15,1), ta(15,2)三张图，
然后三张图各自向前循环，形成动画。

### Kite 风筝 / Whirlwind 旋风/龙卷风

- Kite是关卡内的可收集物品
- 拥有Kite的bobby，走到旋风上会起飞
- 飞起来的bobby，遇到 Landing 会降落，或直到撞到地图边缘

待验证：地图边缘为blocking地貌如何降落

旋风动画：
Whirlwind: ts(16,5) --> ta(7,3) --> ta(7,4) --> ta(8,1) --> ta(8,2) --> ta(8,3)

### Switch 开关 / Block

- 开关分为黄色/粉色两种，Block也分为黄色/粉色两种
- bobby每次走上开关，都会切换开关状态，同时切换Block状态

Yellow Switch:     State1 ts(12,16), State2 ts(13,1)
Pink Switch:       State1 ts(13,2),  State2 ts(13,3)
Yellow Block:      Raised ts(13,4),  Lowered ts(13,5)
Pink Block:        Raised ts(13,6),  Lowered ts(13,7)

### Bean 种子 / Beanfield 藤蔓

- 种子是可收集物品
- 带着种子的bobby走到beanfield上，会使藤蔓发芽生长
- 藤蔓会一直长到遇到下一个可行走的地面为止

藤蔓生长动画：
无种子时：      ts(14,16)
刚刚发芽：      ts(15,16)
完整藤蔓：      最高处 ts(13,15) 中间 ts(14,15) 底部(15,15)

完整藤蔓最矮两格，最高中间可以衔接若干中间格

### Plank 一次性木板

- 木板可以供bobby通过
- bobby离开木板后，木板会损坏

木板损坏动画：
ts(14,5) --> ts(14,6) --> ts(14,7)

### dragon 火龙 / ice block 冰块 / Mirror 镜子

- 冰块会阻挡bobby前进
- 火龙的头和身体会阻挡bobby前进；bobby走到火龙尾巴上，火龙会射出火球
- 火龙射出的火球会融化冰块
- 火龙的火球会根据镜子拐弯
- 火球碰到blocking障碍物会消失
- 火球或临时获取镜头

- bobby离开镜子时，镜子会顺时针变换方向

镜子静态图：
Mirror Right-Down:      ts(12,2)
Mirror Left-Down:       ts(12,3)
Mirror Right-Up:        ts(12,4)
Mirror Left-Up:         ts(12,5)

镜子变换顺序：
Right-Up   -->   Right-Down   -->   Left-Down   -->   Left-Up

冰块融化动画：
ts(15,4) ==> ts(15,7) (然后消失)

火龙喷火动画（只有火龙头有动画）：
火龙头： ts(14,8) --> ts(15,9) --> ts(15,10)  // 然后回归ts(14,8)

火球动画：
`hud.png`中有两个火球静态帧，循环产生动画；
hud图内容宽度不一，具体x坐标截取范围在代码中调整。

### Trap 陷阱

- 陷阱初始状态未触发，bobby可以走入
- bobby离开时陷阱触发
- bobby进入触发的陷阱会死亡

静态图：
Trap:   Active ts(11,16),     Inactive ts(12,1)

### Ice 冰面

- bobby走到冰面上会向前打滑，直到走出冰面

bobby走到冰面上滑动时，会固定在b0/b1/b2/b3的第7帧，走出冰面时播放第8帧结束。

### Snow 雪块 / Shovel 雪铲

- 雪铲是可收集物品
- 雪块会阻挡bobby前进
- bobby可以拿着雪铲铲除雪块

铲雪动画在`b8.png`，四列分别代表左/右/上/下四个方向，一次播放横向三格静态帧

## 动态 Tile

### Bonus Coin 闪耀

```text
ts(16,9) --> ta(4,4) --> ta(5,1) --> ta(5,2)
```

Bonus Coin 的闪烁动画规则是，扔色子，按以下概率获得下一次闪烁时间：
50% --> 1s
30% --> 3s
20% --> 6s
所有场上的Coin使用同一个色子一起闪烁。

### 水面涟漪

```text
Water: ts(6,7) --> ta(10,4) --> ta(11,1) --> ta(11,2) --> ta(11,3) --> ta(11,4) --> ta(12,1) --> ta(12,2)
```

### 星星闪耀效果

ta(15,3)和ta(15,4)两幅图，再切割为3行6列，为星星闪耀效果，在星空上会随机出现。

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
