# UP9 Help ↔ Bytecode 机制交叉验证

UP9 `EN.dat` 的 `a[60]..a[80]` 本身就是官方 Help 文案。它描述“玩家应该理解的规则”；`a.class` 则提供精确状态、时序、raw byte 与边角行为。

因此本表把 Help 作为第二条独立语义证据，并记录 Help 没有说清、但 bytecode 已经确认的执行细节。

| Help ID | 官方主题 | Bytecode / semantic 基准 | Help 与 class 的关系 / class 补充 |
|---|---|---|---|
| `a[60]` | Carrot / Easter Egg Nest | `LevelObjectives`, `MidpointInteractionDispatcher` | 一致。原版用同一个 `remainingObjectiveCount` 统计 Carrot、Empty Nest 与 High-Grass Objective；Filled Nest 之后成为 blocking object。 |
| `a[61]` | High Grass | `MowerRuntime`, `LevelObjectives` | 一致。只有 Mower 能进入/割开；C7/C8 两类高草可恢复成空地、Carrot 或 Egg Nest；Objective 高草在初始化时已经计入目标，不会揭开后再重复计数。 |
| `a[62]` | Target Area / Exit | `LevelObjectives`, `MidpointInteractionDispatcher` | 一致。Exit 只有在共享剩余目标计数归零时才完成关卡。 |
| `a[63]` | Mower Parking + Gas | `MowerRuntime`, `PlayerCollisionRules` | 一致。Gas 为本关持有状态；Parking 才允许正常下车；真正 mount/dismount 在像素移动完成阶段结算，并重新解析 BGM。 |
| `a[64]` | Speed Field + Switch | `SpeedRuntime`, `DirectionalSwitches` | Help 明确“双倍速度、只能直行、同向按住可持续”。class 进一步确认：离开 Speed 后即使没有继续按键，也会额外保持 **3 个完整高速格**；期间始终 6px/gameplay-step，没有 normal/slow 衰减。撞墙立即终止。 |
| `a[65]` | Crumbly Rock | `MowerRuntime`, `PlayerCollisionRules` | 一致。必须是 Mower + Speed 强制移动状态（或 Speed 对下一格的 special probe）才能撞碎。 |
| `a[66]` | Colourful Blocks + Switch | `ColorSwitch` | Help 只说同色联动；class 明确是扫描**整张 terrainGrid**做全局 pair swap，黄色/粉色各自同时切换 Switch 与 Block。 |
| `a[67]` | Traps | `TrapRuntime`, `MidpointInteractionDispatcher` | 一致。进入 inactive 只登记；离开效果在下一次 movement midpoint 的 previous-leave settlement 才写 Active。Active 对普通 Bobby 致死，Mower 可安全通过。 |
| `a[68]` | Carousel Tile + Switch | `CarouselPassage`, `DirectionalSwitches` | 一致。进入和离开各有方向约束；离开旋转同样通过下一 midpoint 的 previous-leave settlement；Raised switch 触发全图 Carousel 旋转。 |
| `a[69]` | Tide + Switch | `LeafWater`, `DirectionalSwitches` | 一致。class 明确 raw：`57=Down, 58=Up, 59=Right, 5A=Left`；Tide Switch 全图成对反转 Up/Down 与 Left/Right。 |
| `a[70]` | Leaf | `LeafWater`, `MovingEntities` | 一致。Help 特别说明 Leaf 停止后必须下去再上来才能重新使用；class 证明这是 `justMounted` 一次性启动标志自然造成的。Bobby 与 Leaf 使用同一个像素 delta。 |
| `a[71]` | Kite | `KiteFlight`, `PlayerCollisionRules` | 一致。Kite 是本关收集状态；有 Kite 后 Whirlwind 可进入并起飞。 |
| `a[72]` | Whirlwind + Landing | `KiteFlight`, `MidpointInteractionDispatcher` | Help 明确“朝当前方向飞直到下一个 Landing”。class 进一步确认 airborne 完全绕过普通 terrain/object collision，而且**没有地图边缘自动降落**保护。 |
| `a[73]` | Fire-breathing Dragon | `DragonAttack`, `DragonFireball`, `IceMelting` | 一致。Tail 启动 Head 准备序列，最终创建火球；Mirror 改向，Ice Block 启动融化。class 额外暴露原版 quirk：Head 在 E8/E9 喷火准备帧不在 player blocking 集合。 |
| `a[74]` | Magic Mirror | `DragonFireball`, `MidpointInteractionDispatcher` | 一致。火球按镜面状态反射；Bobby 跑过后旋转实际上在离开后的下一 movement midpoint 执行。 |
| `a[75]` | Wooden Plank | `PlankDecay`, `MidpointInteractionDispatcher` | 一致。离开后 D4→D5，6 gameplay-step 后 D6，再 6 step 后 empty；原版只维护一个旧 Plank decay 槽。 |
| `a[76]` | Colourful Clouds + Grid | `MovingEntities`, `CloudPassage` | 一致。同色 Parking 才强制停车；否则 Cloud 沿现方向继续，直到非 sky passage / moving-entity collision / wind routing 等阻止。 |
| `a[77]` | Windmill + Switch | `CloudWind`, `CloudPassage`, `GameplayCameraFocus` | 一致。风区为 Windmill 前方 1～3 格。Switch 会抢镜头到 Windmill；第一朵真正被该风改向的 Cloud 还能接管镜头约 64 gameplay-step，然后回 Bobby。 |
| `a[78]` | Giant Bean + Field | `BeanGrowth`, `MidpointInteractionDispatcher` | 一致。Beanfield 消耗一个 Bean 并启动任务；每个新藤蔓高度推进 16 gameplay-step，遇 object occupied / 越界 / 不允许 terrain 停止。 |
| `a[79]` | Snow Shovel | `ShovelRuntime`, `PlayerCollisionRules` | 一致。Snow collision 本次 move 失败并启动 32-step blocking action；完成后清雪，再自动 replay 原 move intent。 |
| `a[80]` | Golden Carrot | `GoldenCarrotCampaign`, `TimedBonusChallenge` | Help 只强调价值；class 明确它会直接结束特殊关、增加全局 Golden Carrot、结算本关 Bonus Coins、写 completion bit，并进入 Golden Carrot result / Night Train → Cloud 9 导流。 |

## 结论

`a[60]..a[80]` 与目前恢复出的 UP9 核心机制没有发现本质矛盾，反而能为很多字段提供原版作者层面的语义名称。当前机制差异主要来自旧的 BC5R 手调实现或早期观察文档，而不是 Help 与 class 相互冲突。

后续规则置信度优先级建议：

1. `a.class` 控制流 / bytecode：精确执行事实；
2. `EN.dat` Help：官方面向玩家的机制语义；
3. 官方地图最小复现实测：补充动画/异常边角；
4. 旧观察文档：仅作为寻找问题的线索。
