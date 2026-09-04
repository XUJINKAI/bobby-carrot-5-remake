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
| `a.ap` | `playerPixelX` | 已确认 | 出生点扫描后赋值 `gridX * tileWidth`；`N()` 和挂载平台 `P()` 都直接修改。 |
| `a.aq` | `playerPixelY` | 已确认 | 出生点扫描后赋值 `gridY * tileHeight`；`N()` 和挂载平台 `P()` 都直接修改。 |
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
| `a.cB` | `movingEntityCount` | 已确认 | DAT loader 直接读取一个 byte，据此分配六组平行数组；`P()` 每 tick `for (n < cB)` 更新全部动态实体。 |
| `a.cE` | `movingEntityType` | 已确认 | Loader 对 `0xE0/0xE1/0xE2/0xEC` 写入原 object type；`P()/H()` 根据 type 区分 Cloud 与 Leaf。 |
| `a.cF` | `movingEntityDirection` | 已确认 | Loader 初值 4；`0..3` 决定 P() 中 X/Y 位移方向，4 为停止。 |
| `a.cG` | `movingEntityPixelsRemaining` | 已确认 | 新一格开始时赋 48；`P()` 每 tick 按 3 或 6 递减到 0，到 0 后重新决定下一格。 |
| `a.cI` | `movingEntityPixelX` | 已确认 | Loader 写 `x * tileWidth`；`P()` 每 tick直接修改。 |
| `a.cJ` | `movingEntityPixelY` | 已确认 | Loader 写 `y * tileHeight`；`P()` 每 tick直接修改。 |
| `a.cH` | `movingEntityFastMotion` | 已确认 | false 时 P() 每 tick 位移 3px，true 时位移 6px；同时影响下一格碰撞预判。 |
| `a.az` | `mountedMovingEntityIndex` | 高置信 | Bobby 命中停止动态实体后保存索引；`P()` 若 `az == n`，把平台的同一个 pixel delta 同时应用给 Bobby，并从 `ap/aq` 反算 `ar/as`。 |
| `a.P()` | `advanceMovingEntities()` | 已确认 | 统一更新 Cloud/Leaf 像素运动、Tide/Fall 改向、Windmill 推动以及挂载 Bobby 的同步位移。 |
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
  -> movingEntityCount
  -> compact object entries (type, x, y)
      -> 普通 object 写入 objectGrid
      -> multi-cell object 展开额外格
      -> Cloud/Leaf 转为 runtime moving entity
```

Cloud 三色 `0xE0/0xE1/0xE2` 与 Leaf `0xEC` 不进入 `objectGrid`，而进入六组平行 runtime 数组。这证明原版自身已经区分 static grid object 与 moving entity。

### 输入与 Bobby 移动

```text
keyPressed / keyReleased
        -> N/O/P/Q held flags
        -> H()
        -> M() choose movement
        -> canPlayerMove(...)
        -> grid X/Y 先改变
        -> ay = 48
        -> N() 每 tick 推进 pixel X/Y
```

普通移动 3px/tick，Speed/快速状态 6px/tick。

### Cloud / Leaf 动态实体

```text
P() for each moving entity
  if pixelsRemaining > 0
      delta = direction × (fast ? 6 : 3)
      movingEntityPixel += delta
      if Bobby mounted on this entity
          Bobby pixel += same delta
          Bobby grid = Bobby pixel / tileSize
      pixelsRemaining -= abs(delta)

  if pixelsRemaining == 0
      inspect terrain / wind / tide / collisions
      choose next direction
      pixelsRemaining = 48 or stop(direction=4)
```

因此 Bobby 搭乘 Leaf/Cloud 时与载体使用同一个原版 pixel delta；这是 gameplay runtime 的显式同步，不是两个独立视觉动画。

## 下一批优先恢复

1. 继续拆 `P()`：把 Leaf 的 Tide/Fall 规则和 Cloud 的 Windmill/Parking 规则分别提炼为 semantic 方法。
2. `a(int,int,boolean)`：拆 terrain/object 通行分支，把 Carousel、Water、Ice、Vehicle 等规则定位出来。
3. `Q/R/S` 持续任务：Bean `S()` 已确认，继续给 projectile / plank 等任务命名。
4. 恢复 gameplay state `x == 1` 的完整每 tick 调用顺序。
5. 对照当前 Engine 实现，建立“原版已确认语义 → BC5R 缺口”矩阵，但暂不修改 Engine。
