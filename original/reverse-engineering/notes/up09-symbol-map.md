# UP9 第一批符号映射

本表记录 `original/reverse-engineering/decompiled/up09/` 到 `semantic/` 的逐步命名结果。只把已有字节码/运行时文档能够支撑的结论写成确定名称。

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `Bobby.a` | `display` | 已确认 | 构造时调用 `Display.getDisplay(this)`，`startApp()` 用它设置当前 Displayable。 |
| `Bobby.b` | `runtime` | 已确认 | 构造为 `new a(this)`，同时作为 Displayable 和 Runnable 使用。 |
| `Bobby.c` | `runtimeThread` | 已确认 | `startApp()` 创建 `new Thread(this.b)` 并启动。 |
| `a.e` | `shutdownRequested` | 已确认 | `destroyApp()` 写入 `true`，`a.run()` 以 `while (!this.e)` 作为主循环退出条件。 |
| `a.x` | `runtimeState` | 已确认 | `a.b()` 直接 `switch (this.x)` 分派 title/gameplay/scene 等顶层运行状态。具体枚举含义继续逐项命名。 |
| `a.cu` | `terrainGrid` | 已确认 | `ae()` 扫描该网格寻找 terrain `0x95` 玩家出生点；移动判定读取源/目标 `cu` 并按 terrain ID 决定方向与通行；动态地形也直接写回该网格。 |
| `a.cv` | `objectGrid` | 已确认 | 与 `cu` 同尺寸；空值初始化为 `0xFF(-1)`；`ae()` 按 `0xCA/0xCB/...` 等 object ID 扫描；移动判定同时读取目标 object byte。 |
| `a.dw` | `mapWidthTiles` | 已确认 | `n()` 作为两张 gameplay grid 的第二维长度，移动边界判定比较目标 X `< dw`。 |
| `a.dx` | `mapHeightTiles` | 已确认 | `n()` 作为两张 gameplay grid 的第一维长度，移动边界判定比较目标 Y `< dx`。 |
| `a.ar` | `playerGridX` | 已确认 | `ae()` 在找到 terrain `0x95` 后设为列 `i`；移动判定以 `ar + dx` 得到目标 X。 |
| `a.as` | `playerGridY` | 已确认 | `ae()` 在找到 terrain `0x95` 后设为行 `n2`；移动判定以 `as + dy` 得到目标 Y。 |
| `a.ap` | `playerPixelX` | 已确认 | 出生点扫描后赋值 `gridX * tileWidth`；后续滚动/表现代码以像素坐标使用。 |
| `a.aq` | `playerPixelY` | 已确认 | 出生点扫描后赋值 `gridY * tileHeight`；后续滚动/表现代码以像素坐标使用。 |
| `a.h` | `tileWidth` | 已确认 | 默认 48；出生点像素 X 为 `gridX * h`，地图像素宽度为 `dw * h`。 |
| `a.i` | `tileHeight` | 已确认 | 默认 48；出生点像素 Y 为 `gridY * i`，地图像素高度为 `dx * i`。 |
| `a.aw` | `playerDirectionOrMotionState` | 已确认（部分枚举） | `0/1/2/3 = 左/右/上/下` 已确认；同一字段还使用 `4/5/6` 表示特殊 motion/state，因此字段职责比纯方向更宽。 |
| `a.bC` | `ambientPhase8` | 已确认 | 原版动态格 8 相循环计数器。 |
| `a.bD` | `ambientPhase6` | 已确认 | 原版动态格 6 相循环计数器。 |
| `a.bE` | `ambientPhase4` | 已确认 | 原版动态格 4 相循环计数器。 |
| `a.bF` | `ambientPhase3` | 已确认 | 原版动态格 3 相循环计数器。 |
| `a.dH` | `renderTerrainCache` | 高置信 | `af()/ag()` 与离屏 `Image/Graphics` 一起分配/清空；不参与正常移动判定，`6328+` 用来判断某格是否需要重绘。 |
| `a.dI` | `renderObjectCache` | 高置信 | 与 `dH` 成对维护，保存最近绘制的 object byte；属于 tile render cache，而非 gameplay grid。 |

## 已确认的主干调用事实

### 主循环

`a.run()` 每轮最多调用两次 `a.b()`，按脏标记决定 `repaint()/serviceRepaints()`，并把一轮目标节拍限制在约 62ms。`a.e` 是退出标志。

### 顶层 Runtime 状态机

`a.b()` 是顶层状态推进函数：

```text
run()
  -> b()
      -> switch (runtimeState / x)
          -> state 1: gameplay
          -> 其它 state: title / scene / menu / transition 等
```

其中 `x == 1` 的分支会连续调用 `H/Q/P/S/V/T-or-U/G/F/X/Y` 等 gameplay 更新步骤，是继续恢复世界更新顺序的核心入口。

### Gameplay Grid

```text
terrainGrid = cu[mapHeightTiles][mapWidthTiles]
objectGrid  = cv[mapHeightTiles][mapWidthTiles]
```

`objectGrid` 空格使用 `0xFF(-1)`。`ae()` 在载入关卡后扫描两层网格，识别玩家出生点、目标计数以及特殊 object 坐标。

## 下一批优先恢复

1. `e(int,int)`：关卡 DAT 记录如何解码并填入 `cu/cv`；CFR 对该方法失败，必须以 `javap` 字节码为基准恢复。
2. `H()` 与周边方法：玩家输入/移动状态如何进入一次 grid move。
3. `a(int,int,boolean)`：已确认是核心通行/碰撞判定之一，继续拆出 terrain/object 分支语义。
4. `V()` 等 gameplay update：确认世界更新顺序与动态机制 dispatch。
5. 将已确认主干逐段搬入 `semantic/OriginalRuntimeCanvas.java`，保持每段可追溯到原始符号。
