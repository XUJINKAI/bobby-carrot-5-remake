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
| `a.N` | `inputUpHeld` | 已确认 | `keyPressed(50/-1)` 置 true，`keyReleased` 置 false；`M()` 对应 `(0,-1)`。 |
| `a.O` | `inputDownHeld` | 已确认 | `keyPressed(56/-2)` 置 true，`keyReleased` 置 false；`M()` 对应 `(0,+1)`。 |
| `a.P` | `inputLeftHeld` | 已确认 | `keyPressed(52/-3)` 置 true，`keyReleased` 置 false；`M()` 对应 `(-1,0)`。 |
| `a.Q` | `inputRightHeld` | 已确认 | `keyPressed(54/-4)` 置 true，`keyReleased` 置 false；`M()` 对应 `(+1,0)`。 |
| `a.R` | `inputFireHeld` | 已确认 | `keyPressed(53/-5)` 置 true，`keyReleased` 置 false。具体 gameplay 语义按当前 runtime state 分派。 |
| `a.S` | `leftSoftkeyHeld` | 已确认 | Nokia key code `-6`。 |
| `a.T` | `rightSoftkeyHeld` | 已确认 | Nokia key code `-7`。 |
| `a.U` | `anyKeyActivity` | 高置信 | 任意非零 `keyPressed` 先置 true，多处 scene/menu 状态消费。 |
| `a.aw` | `playerDirectionOrMotionState` | 已确认（部分枚举） | `0/1/2/3 = 左/右/上/下`；同一字段还使用 `4/5/6` 表示特殊 motion/state，因此职责比纯方向更宽。 |
| `a.ay` | `playerMovePixelsRemaining` | 已确认 | 每次格移动成功后赋 `tileWidth/tileHeight`；`N()` 在动画/移动推进中递减，归零后处理到达格效果。 |
| `a.M()` | `advancePlayerMovement()` | 已确认 | 同时处理普通 held direction、Speed `0xB5..0xB8`、若干 forced movement，并在碰撞成功后直接更新 `playerGridX/Y`。 |
| `a.a(int,int,boolean)` | `canPlayerMove(dx,dy,specialMode)` | 已确认（内部规则待拆） | `M()` 所有格移动前统一调用；方法读取源/目标 terrain、目标 object、边界和状态后返回是否允许进入。 |
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

其中 `x == 1` 的分支会先调用 `H()`，随后执行 `Q/P/S/V/T-or-U/G/F/X/Y` 等 gameplay 更新步骤。

### Gameplay Grid

```text
terrainGrid = cu[mapHeightTiles][mapWidthTiles]
objectGrid  = cv[mapHeightTiles][mapWidthTiles]
```

`objectGrid` 空格使用 `0xFF(-1)`。`ae()` 在载入关卡后扫描两层网格，识别玩家出生点、目标计数以及特殊 object 坐标。

### 输入到一次移动

```text
keyPressed / keyReleased
        │
        ├─ N = up
        ├─ O = down
        ├─ P = left
        └─ Q = right
              │
              ▼
             H()
              │
              ▼
             M()
              │
              ├─ canPlayerMove(dx, dy, false)
              │
              ├─ playerGridX/Y += direction
              │
              └─ playerMovePixelsRemaining = 48
```

`M()` 同时检查当前 terrain。站在 `0xB5..0xB8` Speed tile 时，它会设置对应方向并维护连续移动计数 `aN`；因此原版 Speed 不是独立 actor，而是直接嵌在 Bobby movement state machine 中。

## 下一批优先恢复

1. `e(int,int)`：关卡 DAT 记录如何解码并填入 `cu/cv`；CFR 对该方法失败，使用 `bytecode/up09/a.javap.txt` 恢复。
2. `N()`：确认 `ay` 如何从 48px 递减到 0，以及 grid truth 与 pixel movement 的先后顺序。
3. `a(int,int,boolean)`：继续拆 terrain/object 的通行分支，把 Carousel、Water、Ice、Vehicle 等规则定位出来。
4. `V()` 等 gameplay update：确认动态对象更新顺序。
5. 按机制建立独立 semantic 文件，避免把恢复后的 8000 行逻辑再次堆回一个巨型类。
