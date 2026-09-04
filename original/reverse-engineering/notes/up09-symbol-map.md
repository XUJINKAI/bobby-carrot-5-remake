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
| `a.cv` | `objectGrid` | 已确认 | 与 `cu` 同尺寸；空值初始化为 `0xFF(-1)`；`ae()` 按 object ID 扫描；移动判定同时读取目标 object byte。 |
| `a.dw` | `mapWidthTiles` | 已确认 | Loader 直接读取 width byte；两张 gameplay grid 的第二维长度，移动边界判定比较目标 X `< dw`。 |
| `a.dx` | `mapHeightTiles` | 已确认 | Loader 直接读取 height byte；两张 gameplay grid 的第一维长度，移动边界判定比较目标 Y `< dx`。 |
| `a.ar` | `playerGridX` | 已确认 | `ae()` 在找到 terrain `0x95` 后设为列 `i`；移动判定以 `ar + dx` 得到目标 X。 |
| `a.as` | `playerGridY` | 已确认 | `ae()` 在找到 terrain `0x95` 后设为行 `n2`；移动判定以 `as + dy` 得到目标 Y。 |
| `a.ap` | `playerPixelX` | 已确认 | 出生点扫描后赋值 `gridX * tileWidth`；`N()` 每 tick 按方向更新。 |
| `a.aq` | `playerPixelY` | 已确认 | 出生点扫描后赋值 `gridY * tileHeight`；`N()` 每 tick 按方向更新。 |
| `a.h` | `tileWidth` | 已确认 | 高清版默认 48；出生点像素 X、动态实体像素 X、地图像素宽度均使用该字段。 |
| `a.i` | `tileHeight` | 已确认 | 高清版默认 48；出生点像素 Y、动态实体像素 Y、地图像素高度均使用该字段。 |
| `a.N` | `inputUpHeld` | 已确认 | `keyPressed(50/-1)` 置 true，`keyReleased` 置 false；`M()` 对应 `(0,-1)`。 |
| `a.O` | `inputDownHeld` | 已确认 | `keyPressed(56/-2)` 置 true，`keyReleased` 置 false；`M()` 对应 `(0,+1)`。 |
| `a.P` | `inputLeftHeld` | 已确认 | `keyPressed(52/-3)` 置 true，`keyReleased` 置 false；`M()` 对应 `(-1,0)`。 |
| `a.Q` | `inputRightHeld` | 已确认 | `keyPressed(54/-4)` 置 true，`keyReleased` 置 false；`M()` 对应 `(+1,0)`。 |
| `a.R` | `inputFireHeld` | 已确认 | `keyPressed(53/-5)` 置 true，`keyReleased` 置 false。具体 gameplay 语义按当前 runtime state 分派。 |
| `a.S` | `leftSoftkeyHeld` | 已确认 | Nokia key code `-6`。 |
| `a.T` | `rightSoftkeyHeld` | 已确认 | Nokia key code `-7`。 |
| `a.U` | `anyKeyActivity` | 高置信 | 任意非零 `keyPressed` 先置 true，多处 scene/menu 状态消费。 |
| `a.aw` | `playerDirectionOrMotionState` | 已确认（部分枚举） | `0/1/2/3 = 左/右/上/下`；同一字段还使用 `4/5/6` 表示特殊 motion/state，因此职责比纯方向更宽。 |
| `a.ay` | `playerMovePixelsRemaining` | 已确认 | 每次格移动成功后赋 48；`N()` 普通每 tick 减 3，快速状态每 tick 减 6。 |
| `a.aN` | `speedContinuation` | 高置信 | Speed tile 进入时设 3，连续移动过程中递减/续期；同时决定 `N()` 使用 6px/tick。 |
| `a.M()` | `advancePlayerMovement()` | 已确认 | 同时处理普通 held direction、Speed `0xB5..0xB8`、若干 forced movement，并在碰撞成功后直接更新 `playerGridX/Y`。 |
| `a.N()` | `advancePlayerPixelMotion()` | 已确认 | 将剩余像素量每 tick 减 3 或 6，并同步修改 `playerPixelX/Y`。 |
| `a.a(int,int,boolean)` | `canPlayerMove(dx,dy,specialMode)` | 已确认（内部规则待拆） | `M()` 所有格移动前统一调用；方法读取源/目标 terrain、目标 object、边界和状态后返回是否允许进入。 |
| `a.cB` | `movingEntityCapacity` | 已确认 | DAT loader 在 object 表之前读取一个 byte，并据此分配 `cE/cF/cG/cI/cJ/cH` 六组平行数组。 |
| `a.cE` | `movingEntityType` | 已确认 | Loader 对 `0xE0/0xE1/0xE2/0xEC` 写入原 object type；`H()` 以 `0xEC` 分支处理 Leaf。 |
| `a.cF` | `movingEntityDirection` | 已确认 | Loader 初值 4；Leaf 启动后写入 Bobby 方向 `0..3`；动态实体更新按该值修改 X/Y。 |
| `a.cG` | `movingEntityPixelStep` | 高置信 | Loader 初值 0；动态实体运动与碰撞代码把它作为像素位移/步进量使用。 |
| `a.cI` | `movingEntityPixelX` | 已确认 | Loader 写 `x * tileWidth`；后续动态实体移动与碰撞直接读取/修改。 |
| `a.cJ` | `movingEntityPixelY` | 已确认 | Loader 写 `y * tileHeight`；后续动态实体移动与碰撞直接读取/修改。 |
| `a.cH` | `movingEntityFlag` | 未完全命名 | 与每个动态实体一一对应；运动启动时会清 false，具体语义继续追踪。 |
| `a.az` | `mountedMovingEntityIndex` | 高置信 | `a(x,y)` 命中 `cF==4` 的动态实体后保存索引；`H()/M()` 后续围绕该索引处理 Bobby 与 Leaf/Cloud 的交互。 |
| `a.bC` | `ambientPhase8` | 已确认 | 原版动态格 8 相循环计数器。 |
| `a.bD` | `ambientPhase6` | 已确认 | 原版动态格 6 相循环计数器。 |
| `a.bE` | `ambientPhase4` | 已确认 | 原版动态格 4 相循环计数器。 |
| `a.bF` | `ambientPhase3` | 已确认 | 原版动态格 3 相循环计数器。 |
| `a.dH` | `renderTerrainCache` | 高置信 | `af()/ag()` 与离屏 `Image/Graphics` 一起分配/清空；不参与正常移动判定，`6328+` 用来判断某格是否需要重绘。 |
| `a.dI` | `renderObjectCache` | 高置信 | 与 `dH` 成对维护，保存最近绘制的 object byte；属于 tile render cache，而非 gameplay grid。 |

## 已确认的主干调用事实

### DAT Loader

`a.e(int,int)` 已通过 `javap` 恢复：

```text
NN.dat
  -> 跳过前 record 的 signed-short length + payload
  -> 读取当前 record length
  -> width / height
  -> terrain rows: readFully
  -> objectGrid 全填 0xFF
  -> moving entity capacity
  -> compact object entries (type, x, y)
      -> 普通 object 写入 objectGrid
      -> multi-cell object 展开额外格
      -> Cloud/Leaf 转为 runtime moving entity
```

Cloud 三色 `0xE0/0xE1/0xE2` 与 Leaf `0xEC` 不进入 `objectGrid`，而进入六组平行 runtime 数组。这证明原版自身已经区分 static grid object 与 moving entity。

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
                         │
                         ▼
                        N()
              normal: 3px/tick
              fast:   6px/tick
```

## 下一批优先恢复

1. 动态实体 update 方法：恢复 Cloud/Leaf 的统一运动结构、停车与 Bobby 挂载关系。
2. `a(int,int,boolean)`：继续拆 terrain/object 通行分支，把 Carousel、Water、Ice、Vehicle 等规则定位出来。
3. `Q/R/S` 等持续任务：目前 Bean `S()` 已确认，继续给其它任务命名。
4. `V()`：环境动画每四 tick 更新一次的调用顺序已确认，继续区分纯表现与 gameplay。
5. 将 `semantic/` 逐步拆成 LevelLoader / PlayerMovement / MovingEntities / MechanicTasks 等可读模块。
