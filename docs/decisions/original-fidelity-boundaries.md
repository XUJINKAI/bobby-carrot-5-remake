# 原版 Fidelity 产品边界

本文记录 Bobby Carrot 5 Remake 明确保留的现代设计。它们与 Bobby Carrot 5 原版存在可观察
差异，但属于长期产品行为；机关实现和回归测试应以本文为准。

原版事实仍记录在 `docs/reference/` 与 `original/reverse-engineering/semantic/`。本文只说明
Bobby Carrot 5 Remake 的选择和理由。

## Bobby 移动节拍

### 现象差异

原版普通移动和 Flight 每格约 `496ms`，Speed 每格约 `248ms`。Bobby Carrot 5 Remake
默认使用普通移动和 Flight `350ms`、Speed `175ms`。

### 可能影响

玩家操作更紧凑；Bobby 与仍按原版毫秒换算的 Bean、Cloud、Leaf、Dragon 等持续机关相遇
时，先后顺序可能与原版不同。需要精确还原原版节奏的宿主可以通过公开 locomotion 配置
覆盖移动时长。

### 设计原理

移动 cadence 是 Bobby 和各机关的策略，不是 WorldClock 频率。Engine 保留现代默认值，
并继续使用毫秒和 WorldMotion 表达规则，使改变 `worldHz` 不会改变真实动作时长。

## Ice 的开局与人物姿势

### 现象差异

Bobby 出生在 Ice 上时保持静止。进入滑动后使用普通人物条带的第 7 帧；滑动结束而仍停在
Ice 上时恢复当前方向的普通站立帧。

### 可能影响

自定义地图可以把 Ice 当作合法出生地，不会在玩家输入前自动改变位置。移动和静止使用
不同姿势，避免角色停住后仍显示滑行动作。

### 设计原理

Ice 的强制续滑由进入动作建立，出生位置本身不等同于一次进入事件。人物姿势读取当前
WorldMotion，而不是只看脚下地形。

## Plank 衰变实例

### 现象差异

原版只保留一块正在衰变的旧 Plank；Bobby Carrot 5 Remake 允许多块 Plank 各自完成衰变
动画和状态变化。

### 可能影响

连续离开多块 Plank 时，每块都按自己的时间消失。官方地图主路径通常不依赖原版的单槽
覆盖行为，自定义地图则得到更容易理解的逐实例语义。

### 设计原理

每块 Plank 是独立 Entity，衰变表现也按 Entity 建立独立实例，不共享原版的全局临时槽。

## Cloud / Leaf 的动态碰撞粒度

### 现象差异

原版在格边界使用动态实体像素矩形规划，并在快速子步再次检查碰撞。Bobby Carrot 5 Remake 在格边界检查目标格的载体方向，并由 World 的通用运动预留裁决本次移动。

### 可能影响

多个 Cloud / Leaf 在同一格附近交会时，极短的像素级擦碰时机可能不同。相同方向的移动载体可以续行；异向或停止的载体阻挡目标格。

### 设计原理

WorldMotion 持有连续位置和运动进度，规则提交仍以语义格移动为单位。目标格预留与其它 Entity 移动使用同一事务边界，Snapshot、Undo 和 Replay 因而读取相同的世界事实。

## Kite 的地图边缘恢复

### 现象差异

原版飞行路线依赖 Landing 阻止 Bobby 出界。Bobby Carrot 5 Remake 在飞行的下一格越界时
停止 Flight，并让 Bobby 在地图内恢复普通状态。

### 可能影响

缺少 Landing 的自定义地图不会留下永久飞行状态，也不会把 Bobby 移出地图；这类异常图
的结束位置与原版不同。

### 设计原理

地图边界是 Engine 的硬约束。Flight Action 在移动请求被边界拒绝后完成自己的状态清理。

## Dragon 实例与 Head 碰撞

### 现象差异

每只 Dragon 独立准备并发射 Fireball，多只 Dragon 可以同时工作。Dragon Head 在攻击准备
期间始终保持阻挡。

### 可能影响

自定义地图可以组合多只 Dragon；玩家也不能利用原版攻击帧的意外空档穿过 Head。多火球
场景的难度和时序可能不同于原版的全图单槽实现。

### 设计原理

Dragon 的持续状态归属于对应 Entity 和 RuntimeAction。Head 的碰撞身份不随纯视觉帧改变。

## Lock、关卡钥匙与倒计时

### 现象差异

Explore 地图中的 Lock 默认可以直接打开；地图只有显式设置 `requireKey: true` 时才消耗
关卡内 Lock Key。Timed Challenge 使用可暂停、可 Undo、可 Replay 的 World 游戏时间。

### 可能影响

单独加载官方或自定义 `LevelMap` 时仍可游玩。Adventure 可以在加载前根据 Campaign Save
设置钥匙要求；暂停游戏也会暂停倒计时。

### 设计原理

地图内开锁和计时属于 Engine，永久钥匙和购买权限属于 Adventure。成功开锁后删除 Lock，
需要继续计时的地图由 Engine 私有 Runtime Entity 保存挑战状态。

## 确定性与现代扩展

- High Grass 割除后的普通地面由 Adapter 按坐标确定性选择，保证同一 `LevelMap` 与 Replay
  可以稳定重建。
- 多 Bobby、通用对话、多选项和 Portal 使用现代 Engine 合同，不要求存在原版一一对应物。
- 地图内商品通过通用 interaction 接入宿主业务；商品、价格和永久进度不进入 Engine。

这些设计仍需遵守 `docs/architecture.md` 的 Engine / Adventure 边界和
`docs/contracts/engine-api.md` 的公开 API。
