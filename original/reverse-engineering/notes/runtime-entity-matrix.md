# UP9 Runtime Entity 行为矩阵

本表按原版 runtime raw byte 汇总已经从 `a.class` 恢复的 gameplay 行为。它不是 DAT Adapter 映射表，也不是 Engine 配置；用途是回答：**原版看到这个 terrain/object byte 时实际执行什么控制流。**

状态：

- **确认**：已经在碰撞 / midpoint / task / loader 控制流中直接定位；
- **部分**：主行为确认，但 Campaign / Presentation 边角仍待恢复；
- **静态**：当前只看到普通通行或视觉用途，没有专门 gameplay 分支。

## Terrain

| Raw | 语义 | 原版 runtime 行为 | 状态 / 入口 |
|---:|---|---|---|
| `0x47..0x4C` | Sky variants | Bobby 普通移动不可走；Cloud / fireball 有独立通行规则；Star shimmer 只在这些 terrain 且 object 为空时随机出现。 | 确认 |
| `0x4D` | Snow | Bobby 普通不可进入；有 Shovel 时碰撞失败并启动 32-step shovel action，完成后改 `0x7C` 并 replay move；关卡只要存在任意 Snow 就全局启用 5 粒雪花天气。 | 确认 |
| `0x55` | Water | Bobby 普通不可走；Leaf 可走。 | 确认 |
| `0x56` | Animated Water | 同 `0x55`，另有 ambient animation。 | 确认 |
| `0x57` | Tide Down | Bobby 普通不可走；Leaf 到达后改 Down；禁止 Leaf 逆向 Up 进入。 | 确认 |
| `0x58` | Tide Up | Leaf 改 Up；禁止逆向 Down。 | 确认 |
| `0x59` | Tide Right | Leaf 改 Right；禁止逆向 Left。 | 确认 |
| `0x5A` | Tide Left | Leaf 改 Left；禁止逆向 Right。 | 确认 |
| `0x5B..0x5D` | Water Fall | Leaf 只能向下继续，改 Down 且开启 6px/step fast motion；禁止向上进入。 | 确认 |
| `0x5E..0x93` | Ground / walkable variants | Bobby 默认可走；仍受目标 object 覆盖。 | 确认 |
| `0x94` | Ice | 默认可走；midpoint 标记 sliding；下一移动周期先按当前方向自动续滑，前方阻塞才恢复普通输入。 | 确认 |
| `0x95` | Start | Loader 后扫描并初始化 Bobby grid/pixel 坐标。 | 确认 |
| `0x96` | Exit | 默认可走；只有 `remainingObjectiveCount==0` 且非 mower 时 midpoint 启动 completion。 | 确认 |
| `0x97..0x9D` | Shop tiles | 可走；midpoint 打开对应购买 dialog；成功购买后扣全局 currency、D[index]++、当前 tile 改 0x9E 并持久化。 | 确认主干 |
| `0x9E` | Shop unavailable | 已购买 shop 的静态结果；可走，没有 shop midpoint action。 | 确认 |
| `0x9F` | Shovel Pickup | 非 mower midpoint：`hasShovel=true`，terrain 立即改 `0x7C`。 | 确认 |
| `0xA0` | Mower Parking | riding mower midpoint 登记下车；真正 dismount 在当前格视觉移动结束后完成，Mower 写回 Parking 格，Bobby 被放到右一格。 | 确认 |
| `0xA1` | Speed Switch latched | 可走，不触发。 | 确认 raw 行为 |
| `0xA2` | Speed Switch triggerable | midpoint 全图 swap `B5↔B6`、`B7↔B8`、`A1↔A2`。 | 确认 |
| `0xA3` | Carousel Switch latched | 可走，不触发。 | 确认 raw 行为 |
| `0xA4` | Carousel Switch triggerable | midpoint 对全图调用 Carousel transform：Switch pair swap + 所有 Carousel 旋转。 | 确认 |
| `0xA5` | Tide Switch latched | 可走，不触发。 | 确认 raw 行为 |
| `0xA6` | Tide Switch triggerable | midpoint 全图 swap Tide opposite pairs + Switch pair。 | 确认 |
| `0xA7/A9/AB/AD` | Wind Switch On | midpoint 关闭对应风，并把所有同向 On 改 Off。 | 确认 |
| `0xA8/AA/AC/AE` | Wind Switch Off | midpoint 开启对应风，把所有同向 Off 改 On；camera 先去 Windmill，风真正改向 Cloud 后可 handoff 跟随该 Cloud，再回 Bobby。 | 确认 |
| `0xAF` | Trap Active | 非 mower midpoint 进入统一 death pipeline。 | 确认 |
| `0xB0` | Trap Inactive | midpoint 登记；下一次 midpoint 开头把上一格改 `0xAF`。 | 确认 |
| `0xB1..0xB4` | Mirror | 非 mower 可走；进入方向无约束；离开下一 midpoint 顺时针旋转。Fireball 使用独立入射/反射真值表。 | 确认 |
| `0xB5..0xB8` | Speed U/D/L/R | 开始移动周期时覆盖 Bobby 当前方向并设 `speedContinuation=3`；整个 continuation 恒为 6px/step，同向 held 可持续续期。 | 确认 |
| `0xB9..0xBC` | Carousel corners | 非 mower；进入与离开都受当前两条开放方向约束；离开后顺时针旋转。 | 确认 |
| `0xBD/0xBE` | Carousel V/H | 只允许对应轴进入/离开；离开 `V↔H`。 | 确认 |
| `0xBF/0xC0` | Yellow Switch pair | 每次 midpoint 都全图 `BF↔C0` 与 Yellow Block `C3↔C4`。 | 确认 |
| `0xC1/0xC2` | Pink Switch pair | 每次 midpoint 全图 `C1↔C2` 与 Pink Block `C5↔C6`。 | 确认 |
| `0xC3` | Yellow Block Raised | Bobby / fireball 不可通过。 | 确认 |
| `0xC4` | Yellow Block Lowered | 默认可走。 | 确认 |
| `0xC5` | Pink Block Raised | Bobby / fireball 不可通过。 | 确认 |
| `0xC6` | Pink Block Lowered | 默认可走。 | 确认 |
| `0xC7` | High Grass | 只有 mower 可进入；完成跨格后被割掉。 | 确认 |
| `0xC8` | High Grass Objective | Loader 计入 objective；只有 mower 可进入；割草时根据本关目标类型恢复成 Carrot/Egg，但 objective count 不重复增加。 | 确认 |

## Object

| Raw | 语义 | 原版 runtime 行为 | 状态 / 入口 |
|---:|---|---|---|
| `0xC9` | Consumed Carrot | 没有专门碰撞；所在 terrain 可走时普通通过。 | 静态 |
| `0xCA` | Carrot | 非 mower midpoint：objective--，改 `0xC9`。 | 确认 |
| `0xCB` | Empty Egg Nest | midpoint 只登记；下一 midpoint previous-leave 阶段 objective-- 并改 `0xCC`。 | 确认 |
| `0xCC` | Filled Egg Nest | blocking。 | 确认 |
| `0xCD` | Lock | mower blocking；有一次性 `de` 或持久 `D[2]` 才可进入。midpoint 删除 Lock 并清 `de`；Timed Bonus map 首次通过时启动 60s。 | 确认 |
| `0xCE` | Beanstalk Tip | 非 mower；可覆盖不可走 terrain 使 Bobby 进入；midpoint 标 climbing。 | 确认 |
| `0xCF` | Bean | 非 mower midpoint 收集，`beanCount++`。 | 确认 |
| `0xD0..0xD3` | Windmill U/D/L/R | Bobby blocking；`ae()` 记录坐标；开启风后影响前方 1~3 格 Cloud。 | 确认 |
| `0xD4` | Plank | 非 mower；可覆盖不可走 terrain；midpoint 登记，离开时变 `D5`。 | 确认 |
| `0xD5` | Plank Crumbling | 6 step 后 `D6`；自身不覆盖不可走 terrain。 | 确认 |
| `0xD6` | Plank Fragment | 再 6 step 后 empty；自身不覆盖不可走 terrain。 | 确认 |
| `0xD7` | Dragon Head | blocking；Loader / `ae()` 记录 Head；喷火准备会改 E8/E9。 | 确认 |
| `0xD8` | Dragon Body | blocking。 | 确认 |
| `0xD9` | Dragon Tail | 默认可走；midpoint 在 fireball idle 时启动 Head 6-step 分阶段准备。 | 确认 |
| `0xDA` | Sandman Head | blocking；DAT anchor，Loader 自动在 y+1 写 EA Body。 | 确认 |
| `0xDB` | Dream Machine Head | blocking；DAT anchor，Loader 自动写 EB Body。 | 确认 |
| `0xDC` | Mower | 无 Gas 时 blocking + hint；有 Gas 可进入，视觉移动完成才切 `ridingMower=true`。 | 确认 |
| `0xDD` | Gas | 非 mower midpoint 收集，`hasGas=true`。 | 确认 |
| `0xDE` | Beanstalk Mid | 非 mower；可覆盖不可走 terrain；midpoint 标 climbing。 | 确认 |
| `0xDF` | Bean Field | 默认可走；有 Bean 消耗 1 并启动增长任务，无 Bean显示 hint。 | 确认 |
| `0xE0..0xE2` | Cloud R/P/G | Loader 不写 objectGrid，转 moving entity；独立像素碰撞、风、parking、camera handoff 状态机。 | 确认 |
| `0xE3` | Ice Block | Bobby blocking；Fireball 命中立即改 E4 并启动 melt task，Fireball 本身继续。 | 确认 |
| `0xE4..0xE6` | Ice Melt phases | `E4→E5→E6→empty`，每阶段 6 gameplay step。 | 确认 |
| `0xE7` | Beaver Head | blocking；DAT anchor，Loader 自动写 F7 Body。 | 确认 |
| `0xE8/0xE9` | Dragon Head attack frames | Head wind-up 中间状态，各 6 gameplay step；不在 player collision blocking 集合中，wind-up 也没有 camera/input lock，因此 Bobby 按原版控制流可进入 Head 格。 | 确认原版 quirk |
| `0xEA` | Sandman Body | blocking interaction；与 F7 Beaver Body 共用 handler，具体对话/action 由 `bU` Campaign mode 决定。 | 确认主干 |
| `0xEB` | Dream Machine Body | blocking interaction；直接进入独立 runtime state 16 dialog。 | 确认主干 |
| `0xEC` | Leaf | Loader 转 moving entity；只走 Water/Tide/Fall；停止实体可 mount，Bobby 与载体共享 pixel delta；停下后必须离开再重新 mount 才能再次启动。 | 确认 |
| `0xED` | Crumbly Rock | Bobby blocking；mower 在 Speed continuation 或 Speed probe 下可撞碎，撞碎后立即 empty + camera shake。Fireball 被它阻挡。 | 确认 |
| `0xEE` | Beanstalk Base | 所在 terrain 本身可走时非 mower 可进入并标 climbing；与 CE/DE 不同，它不覆盖不可走 terrain。 | 确认 |
| `0xEF` | Bean Sprout | Bean growth 的初始 object；没有 climbing midpoint 分支。 | 确认 |
| `0xF0..0xF2` | Cloud Parking R/P/G | Bobby 无特殊 override；Cloud 到同色 Parking 命中特殊停止条件。 | 确认 |
| `0xF3` | Kite | 非 mower midpoint 收集，`hasKite=true`。 | 确认 |
| `0xF4` | Whirlwind | mower blocking；无 Kite blocking + hint；有 Kite 可进入，midpoint 开始 takeoff。 | 确认 |
| `0xF5` | Landing | Grounded Bobby 普通通过；airborne midpoint 开始 landing。Airborne movement 本身绕过普通 terrain/object collision；原版没有地图边缘自动 landing 分支。 | 确认 |
| `0xF6` | Golden Carrot | 非 mower midpoint 直接进入特殊关完成/持久化流程。 | 确认主干 |
| `0xF7` | Beaver Body | 与 EA 共用角色 interaction handler；Campaign mode 决定具体文案/action。 | 确认主干 |
| `0xF8` | Bonus Coin | 非 mower midpoint 收集，增加本关 bonus count；全场 Coin 共用 sparkle gate：每约 16 gameplay step 检查，inactive 时 1/7 概率开启，active 下一周期必关闭。 | 确认 |
| `0xF9..0xFE` | Fence variants | Bobby blocking。 | 确认 |
| `0xFF` | Empty | 无 object。 | 确认 |

## 当前剩余专项逆向

核心地图 gameplay 的 raw byte 行为已经基本闭环。当前剩余工作主要转向以下三类：

1. **Campaign 人类语义**：继续给 `bU=1..12`、Sandman / Beaver / Dream Machine 特殊场景补正式名称与持久化后果；控制流主干已恢复。
2. **Presentation 收尾**：Snow / Butterfly / Star shimmer / Bonus Coin gate 已恢复，继续核对 scene-specific 粒子状态与低价值菜单动画。
3. **原版实现覆盖审计**：逐项检查 semantic 文件是否完整覆盖 collision / midpoint / task / camera / presentation，避免已知事实只散落在 notes 中。
