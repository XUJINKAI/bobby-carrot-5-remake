# UP9 Runtime 符号映射

本表记录 `original/reverse-engineering/decompiled/up09/` 到 `semantic/` 的逐步命名结果。只把已有字节码、控制流和原版资源能够支撑的结论写成确定名称；仍有疑义的字段保留原名或明确标注待解。

## 顶层 Runtime

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `Bobby.a` | `display` | 已确认 | 构造时调用 `Display.getDisplay(this)`，`startApp()` 设置当前 Displayable。 |
| `Bobby.b` | `runtime` | 已确认 | 构造为 `new a(this)`，同时作为 Displayable 和 Runnable。 |
| `Bobby.c` | `runtimeThread` | 已确认 | `startApp()` 创建并启动。 |
| `a.e` | `shutdownRequested` | 已确认 | `run()` 以 `while (!e)` 为主循环。 |
| `a.x` | `runtimeState` | 已确认 | `a.b()` 直接按该字段分派 gameplay / menu / scene / result。 |
| `a.run()` | `mainLoop()` | 已确认 | 每轮调用 `b()` 两次，并把整轮节拍控制在约 62ms。 |
| `a.b()` | `advanceRuntimeState()` | 已确认 | 顶层每 tick 状态机；`x==1` 为 gameplay。 |

## 地图与玩家坐标

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.cu` | `terrainGrid` | 已确认 | Loader 读入；出生点、碰撞、动态地形均读写。 |
| `a.cv` | `objectGrid` | 已确认 | Loader 展开紧凑 object；空值 `0xFF(-1)`。 |
| `a.dw` | `mapWidthTiles` | 已确认 | Loader width；X 边界。 |
| `a.dx` | `mapHeightTiles` | 已确认 | Loader height；Y 边界。 |
| `a.h` | `tileWidth` | 已确认 | UP9 为 48。 |
| `a.i` | `tileHeight` | 已确认 | UP9 为 48。 |
| `a.ar` | `playerGridX` | 已确认 | `ae()` 从 terrain `0x95` 初始化；移动时先改变。 |
| `a.as` | `playerGridY` | 已确认 | 同上。 |
| `a.ap` | `playerPixelX` | 已确认 | 出生点、普通移动、moving entity mount 都直接修改。 |
| `a.aq` | `playerPixelY` | 已确认 | 同上。 |
| `a.aw` | `playerDirectionOrMotionState` | 已确认（枚举部分） | `0/1/2/3=左/右/上/下`，`4=idle`，`5=dead`，`6=completion transition`。 |
| `a.ax` | `savedDirectionBeforeCompletion` | 高置信 | 进入 `aw=6` 前保存方向；像素更新在特殊 state 下仍取 `ax`。 |
| `a.ay` | `playerMovePixelsRemaining` | 已确认 | 每次格移动设 48，`N()` 每 tick 减 3 或 6。 |
| `a.av` | `playerAnimationFrame` | 已确认 | `O()` 按 movement/death/shovel/mower 等状态推进。 |
| `a.aW` | `playerVerticalVisualOffset` | 高置信 | Mount / kite takeoff / landing 改变，绘制 Bobby 时从 Y 扣除。 |

## 输入

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.N` | `inputUpHeld` | 已确认 | `50/-1`。 |
| `a.O` | `inputDownHeld` | 已确认 | `56/-2`。 |
| `a.P` | `inputLeftHeld` | 已确认 | `52/-3`。 |
| `a.Q` | `inputRightHeld` | 已确认 | `54/-4`。 |
| `a.R` | `inputFireHeld` | 已确认 | `53/-5`。 |
| `a.S` | `leftSoftkeyHeld` | 已确认 | Nokia `-6`。 |
| `a.T` | `rightSoftkeyHeld` | 已确认 | Nokia `-7`。 |
| `a.U` | `anyKeyActivity` | 高置信 | 任意非零 keyPressed 先置 true，多 scene 消费。 |

## 玩家 Runtime 状态

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.aN` | `speedContinuation` | 已确认 | Speed tile 设 3；每个快速格递减或按同向 held 续为 3；`>0` 时 6px/tick。 |
| `a.bl` | `fastPixelMotion` | 高置信 | 普通输入在某个全局 speed option 开启时设；`N()` 与 `aN>0` 一样走 6px/tick。 |
| `a.bn` | `slidingOnIce` | 已确认 | Ice `0x94` 进入/自动续滑置 true；每次新移动周期先清；动画固定在滑行帧。 |
| `a.bi` | `ridingMower` | 已确认 | Mower 上车/停车改变；碰撞、音乐、绘制大量分支直接读取。 |
| `a.bj` | `climbingBeanstalk` | 已确认 | Bobby midpoint 位于 `CE/DE/EE` 时置 true；绘制固定使用上向角色。 |
| `a.bm` | `airborne` | 已确认 | Whirlwind 起飞完成后 true；Landing 完成后 false；`M()` airborne 分支跳过普通碰撞。 |
| `a.bo` | `retryMoveAfterShovel` | 已确认 | 铲雪 32 tick 完成后置 true；下一次 `M()` 先按原方向重放移动。 |
| `a.bc` | `shovelTicksRemaining` | 已确认 | Snow 碰撞时设 32；`H()` 每 tick 递减，归零时清雪并触发 retry。 |
| `a.cX` | `hasGas` | 已确认 | 进入 Gas `0xDD` 后 true；Mower 碰撞读取。 |
| `a.cY` | `hasKite` | 已确认 | 进入 Kite `0xF3` 后 true；Whirlwind 碰撞读取。 |
| `a.cZ` | `hasShovel` | 已确认 | 进入 terrain `0x9F` 后 true；Snow 碰撞读取。 |
| `a.cD` | `beanCount` | 已确认 | Bean `0xCF` 收集 +1；Bean Field `0xDF` 消耗。 |
| `a.bk` | `mowerWillCutGrass` | 高置信 | Mower 进入 `C7/C8` 时置 true；格移动完成后恢复地形并更新目标。 |
| `a.aO` | `cameraShakeTicks` | 已确认 | Speed/Mower impact 设 8；`G()` 每 tick随机抖相机并递减。 |

## 临时 / Campaign 能力

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.de` | `temporaryLockPermit` | 高置信 | Lock collision 允许通过；进入 Lock midpoint 后无条件清 false；dialog action 7 授予。 |
| `a.D[2]` | `permanentSuperKeyUpgrade` | 高置信 | 持久化 Shop upgrade；Lock collision 直接允许通过。 |
| `a.I` | `globalCurrency` | 高置信 | 持久化 short；Shop / 临时 Lock permit 会消费；level clear 增加本关 bonus coin。 |
| `a.dg` | `specialInsufficientFundsState` | 待继续命名 | dialog action 7 在 `I < 3` 时置 true；会改变死亡后的 campaign continuation。 |
| `a.cV` | `timedBonusMap` | 已确认 | `ae()` 仅对 `bU==11/12` 置 true；HUD/Lock/60 秒逻辑均读取。 |
| `a.df` | `timedBonusRunning` | 已确认 | Timed Bonus map 中进入 Lock midpoint 首次置 true；启动 60 秒计时。 |
| `a.cb` | `levelTimerPaused` | 已确认 | `l()/m()` 切换暂停/运行；计时 HUD 和 timeout 都据此计算。 |
| `a.ca` | `levelTimerResumeStartedAtMs` | 已确认 | `m()` 记 `System.currentTimeMillis()`。 |
| `a.bZ` | `levelElapsedAccumulatedMs` | 已确认 | `l()` 累计当前运行段；clear / timed bonus HUD 使用。 |
| `a.ba` | `alarmAnimationFrame` | 高置信 | 默认 `-1`；Bonus timeout 设 0；死亡音乐据此在 death/alarm 间选择。 |

## Moving Entity

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.cB` | `movingEntityCount` | 已确认 | Loader 分配数组，`P()` 逐个更新。 |
| `a.cE` | `movingEntityType` | 已确认 | `E0/E1/E2` Cloud 与 `EC` Leaf。 |
| `a.cF` | `movingEntityDirection` | 已确认 | `0..3` 四向，`4` 停止。 |
| `a.cG` | `movingEntityPixelsRemaining` | 已确认 | 新跨格设 48，按 3/6 递减。 |
| `a.cH` | `movingEntityFastMotion` | 已确认 | false=3px/tick，true=6px/tick。 |
| `a.cI` | `movingEntityPixelX` | 已确认 | Loader 写 `x*tileWidth`。 |
| `a.cJ` | `movingEntityPixelY` | 已确认 | Loader 写 `y*tileHeight`。 |
| `a.az` | `mountedMovingEntityIndex` | 已确认 | Bobby mount 后保存索引；平台 delta 同时应用给 Bobby。 |
| `a.bh` | `justMountedMovingEntity` | 高置信 | 停止动态实体碰撞置 true；下一移动周期按 Bobby 方向启动 Leaf。 |

## Wind / Dragon / 持续任务

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.da/db/dc/dd` | `windUp/Down/Left/RightEnabled` | 已确认 | Wind Switch 切换；`P()` 用于 1~3 格风区。 |
| `a.cK/cL` | `windmillUpX/Y` | 已确认 | `ae()` 扫描 object `0xD0`。 |
| `a.cM/cN` | `windmillDownX/Y` | 已确认 | `0xD1`。 |
| `a.cO/cP` | `windmillLeftX/Y` | 已确认 | `0xD2`。 |
| `a.cQ/cR` | `windmillRightX/Y` | 已确认 | `0xD3`。 |
| `a.cS/cT` | `dragonHeadX/Y` | 已确认 | `ae()` 扫描 object `0xD7`。 |
| `a.ds` | `fireballState` | 高置信 | `-1` 无火球；Tail 触发后准备，`Q()` 持续更新。 |
| `a.dp/dq` | `fireballPixelX/Y` | 已确认 | `Q()` 每 tick 按 6px 更新。 |
| `a.dt` | `fireballDirection` | 已确认 | `0..3` 四向；Mirror 改写。 |
| `a.du` | `fireballPendingDirection` | 高置信 | Mirror collision 先设置，跨像素阶段后生效。 |
| `a.dr` | `iceMeltTaskCount` | 已确认 | 最多 5；`R()` 更新。 |
| `a.do` | `beanGrowthTaskCount` | 已确认 | `S()` 更新。 |
| `a.aJ/aK` | `pendingPlankX/Y` | 已确认 | Midpoint 进入 `D4` 登记，下一 midpoint 触发破碎。 |
| `a.aL/aM/aP` | `crumblingPlankX/Y/countdown` | 已确认 | `D5→D6→empty`，每段 6 tick。 |

## 关卡目标

| 原始符号 | 语义名称 | 置信度 | 依据 |
|---|---|---|---|
| `a.cC` | `remainingObjectiveCount` | 已确认 | `ae()` 数 Carrot / Empty Egg Nest / High Grass Objective；Exit 只有 0 才完成。 |
| `a.cU` | `eggObjectiveMode` | 高置信 | 扫描 `CA/CB` 时根据目标类型设置；HUD 图标与高草恢复结果读取。 |
| `a.bX` | `levelBonusCoinCount` | 已确认 | `F8` 收集递增；clear 时加入 `I`。 |
| `a.J` | `goldenCarrotCount` | 高置信 | `F6` 收集递增并持久化；相关 scene 也读写。 |

## 核心方法

| 原始方法 | 语义名称 | 状态 |
|---|---|---|
| `a.e(int,int)` | `loadLevelRecord()` | 已通过 javap 恢复完整 Loader 主干。 |
| `a.ae()` | `scanLoadedLevel()` | 已确认出生点、目标、Windmill、Dragon Head 与任务容量初始化。 |
| `a.H()` | `advanceGameplayPlayerPhase()` | 已确认：timer、mount start、movement、midpoint interaction、shovel、death input、持续任务前半。 |
| `a.M()` | `advancePlayerMovement()` | 已确认普通输入、Speed、Ice、airborne、shovel retry。 |
| `a.N()` | `advancePlayerPixelMotion()` | 已确认 3px/6px tick。 |
| `a.a(int,int,boolean)` | `canPlayerMove(dx,dy,speedProbe)` | 已拆完主规则，见 `PlayerCollisionRules.java`。 |
| `a.J()` | `dispatchMidpointInteraction()` | 已确认 previous-leave settlement + current midpoint enter；大量机关在这里结算。 |
| `a.O()` | `advancePlayerPresentationState()` | 已确认 movement / ice / shovel / mower / death / completion animation。 |
| `a.P()` | `advanceMovingEntities()` | 已确认 Cloud/Leaf、Wind/Tide/Fall 与 Bobby 同步。 |
| `a.Q()` | `advanceDragonFireball()` | 已确认 6px/tick、Mirror、Ice Block。 |
| `a.R()` | `advanceIceMelting()` | 已确认 `E4→E5→E6→empty`，6 tick/阶段。 |
| `a.S()` | `advanceBeanGrowth()` | 已确认 16 tick/格。 |
| `a.K()` | `startDeath()` | 已确认统一死亡入口。 |
| `a.L()` | `rotateAllCarouselsAndSwitches()` | 已确认全图变换。 |
| `a.c(int)` | `toggleSpeedOrTideGroup()` | 已确认 Speed/Tide 全图 pair swap。 |
| `a.a(byte)` | `toggleColorGroup()` | 已确认 Yellow/Pink 全图 pair swap。 |
| `a.b(byte)` | `rotateCarouselOrToggleSwitch()` | 已确认 Carousel 顺时针 + switch pair。 |
| `a.c(byte)` | `rotateMirror()` | 已确认 Mirror 顺时针。 |
| `a.l()/m()` | `pauseLevelTimer()/resumeLevelTimer()` | 已确认。 |

## 已确认 Gameplay tick 顺序

`runtimeState == gameplay (x==1)` 时，顶层 `b()` 的主顺序是：

```text
H()  player phase
    - timed bonus timeout
    - player movement / pixel movement
    - midpoint interaction J()
    - shovel completion
    - death input
    - plank / dragon-head preparation housekeeping

if fireball active: Q()
P() moving entities (Cloud / Leaf)
S() bean growth
V() ambient tile animation
T() stars OR U() butterfly
G() camera shake
F() optional radar/effect
camera free-pan / follow Y()
```

其中主线程 `run()` 每一轮会调用 `b()` 两次，然后补 sleep，使整轮约为 62ms。因此文档中基于“每次 b() 调用”还是“每个外层 run loop”描述 tick 时必须明确上下文；持续任务的实际节拍以相应方法被调用频率为准。

## 原版移动生命周期

```text
M() 选择下一格
  -> grid X/Y 立即切到目标格
  -> ay = 48
  -> N() 推 pixel
  -> ay <= 24 时只执行一次 J()
       1. 结算上一个登记机关的 leave
       2. 处理当前格 midpoint enter
  -> 继续 pixel 位移
  -> ay == 0 做 mount / mower / kite 等完成收尾
```

这意味着原版大量 object interaction 的 gameplay 时刻是“跨过目标格中线”，而不是视觉完全抵达目标格。

## DAT Loader

`a.e(int,int)` 已通过 `javap` 恢复：

```text
NN.dat
  -> 跳过前 record 的 signed-short length + payload
  -> 当前 record length
  -> width / height
  -> terrain rows readFully
  -> objectGrid 全填 0xFF
  -> movingEntityCount
  -> compact object entries (type, x, y)
      -> 普通 object 写 objectGrid
      -> multi-cell object 展开额外格
      -> E0/E1/E2/EC 转 moving entity runtime arrays
```

Cloud 与 Leaf 在原版 runtime 中已经是独立动态实体，不属于普通 objectGrid。

## 当前继续恢复重点

1. Beaver / Sandman / Dream Machine 的 campaign interaction 与 action 编号。
2. `dg` 的准确语义，以及 temporary Lock permit 不足 3 currency 时的特殊流程。
3. Fireball 对所有 terrain/object 的完整 collision matrix。
4. Kite 飞到地图边缘的真实结束逻辑。
5. Top-level `runtimeState` 全枚举与 scene transition。
6. 对照 semantic 总表建立原版机制覆盖矩阵；本逆向 PR 不修改 Engine / DAT Adapter。
