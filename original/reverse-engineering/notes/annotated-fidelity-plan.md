# 已批注 Entity fidelity 实施计划

本文只承接 `fidelity-discrepancies.md` 第 1～9 节现有批注，记录已经明确的实现结果与
仍需独立设计的后续工作。后续批注形成结论后再追加对应范围。

## 本轮直接实现

- Bobby 位于可攀爬 Presence 时固定使用 `bobby-up` 人物 strip；World 中的实际朝向保持
  原值。
- Ice 运动过程使用第 7 帧，静止在 Ice 上使用普通方向的停止帧。
- Behavior 增加一次性的 `onInitialize()` 生命周期；开局位于 Speed 上的 Bobby 在第一
  个 World Tick 按 Speed 方向启动连续移动。
- `speed-impact` 与 `crumbly-rock-smashed` 都启动约 248ms、42 source-pixel 初始幅度的
  确定性 Camera shake。
- Lock 开启后从 EntityStore 与 SpatialIndex 移除。带死亡倒计时的 Lock 会生成一个
  Engine 私有 Timed Challenge Runtime Entity，继续承载 HUD、WorldClock、Undo 与
  Replay 所需的计时状态。
- Plank 衰变并发与 Kite 越界降落保持当前产品语义。

## 统一空间属性与通行裁决

### 目标

High Grass、隐藏 Carrot、Bean、Mower、Mirror 与地面机关需要共享一套可以审阅的空间
语义。裁决应依据 Entity 自身的自然属性和同格堆叠关系，避免每加入一个机关就产生一组
两两组合 Trait。

### 设计阶段

1. 在 `engine/src/mechanics/definition/` 建立 Trait 与 Behavior 的集中定义：每个 Trait
   记录语义、适用 layer 与读取者，每个 Behavior 记录 ID、实现和绑定范围。Entity 模块
   只引用集中定义；统一 index 作为完整审阅入口，并由测试保证目录与 Registry 注册结果
   一致。
2. 为 Presence passage 引入“本次 actor 可见的有效堆叠”概念。Mower 驶入 High Grass
   时，High Grass 是本次通行的有效顶层对象；其下被遮盖的 Carrot 参与目标计数，但不再
   单独否决 Mower 通行。抵达后仍由 `mowable` Behavior 清除 High Grass。
3. 用少量正交属性表达地面支撑、平面机关和具有高度的障碍。Speed 属于可驶入的平面
   Surface，Mirror 属于具有高度的阻挡对象；Mower 规则只组合这些基础属性与
   `mowable` 能力。
4. 在替换通行主路径前建立组合矩阵，至少覆盖 High Grass + Carrot、High Grass + Egg、
   Water + Plank、Beanstalk + Water、Speed、Mirror、Lock、NPC footprint 和同格多个
   Cover。矩阵同时断言 Bobby、Mower、Flight 三种 passage policy，防止“只看全局最
   顶层”误伤支撑面与 actor 专属规则。

### 完成条件

- 官方隐藏目标关可由 Mower 正常推进，目标总数与割草后的目标状态正确。
- Mower 能进入平面机关并被具有高度的对象阻挡。
- Trait/Behavior 集中目录能够完整列出 Registry 中的声明与绑定，新增未登记 ID 时验证
  失败。

## Bean 生长空间

Bean 生长改为读取统一空间属性，不再由每种 terrain 单独声明生长专用能力。实现阶段按
以下顺序推进：

1. 先把 Tide 的 Presence 归入 `surface` layer，并补齐 Water、Waterfall、Snow、Sky
   等已确认原版可生长地形的语义矩阵。
2. 生长目标必须在地图内，并具有可承接藤蔓的 Surface；同格具有高度的 Object 或 Cover
   时停止，平面 Surface 机关不构成额外阻挡。
3. Tip / Mid / Base 的通行差异继续由藤蔓自身 Definition 表达；生长判定只负责能否建立
   下一段，不复制 Bobby passage 逻辑。
4. 增加 Tide、Waterfall、Snow、普通可走地面、Mirror、High Grass 与地图边缘的最小
   World/Replay 测试，再删除 `bean-growth-space` 及其派生表。

这里需要先用组合矩阵固定“Cover 是否具有高度”的公共定义；该结论与 Mower 通行共用，
因此两项应在同一空间属性阶段完成。

## Snow / Shovel 阻塞动作

铲雪是一个会影响输入与后续移动的 WorldClock 过程，计划实现为 Snow 所属的
`RuntimeAction`：

1. Bobby 持有 Shovel 并碰到 Snow 时，本次移动返回 blocked，同时启动约 992ms 的
   owner-scoped Action，保存 actor、Snow、尝试方向与目标格。
2. Action 期间锁定该 Bobby 的普通输入，并通过可快照的 elapsed time 推进；Undo 回到
   尝试铲雪之前。
3. Action 完成时删除 Snow，在原位置生成 `shovel-cleared-ground`（`ts-8-13`），随后发出
   forced semantic move，重新经过正式 passage / collision 裁决。
4. Presentation 从 Action delta 派生 `b8.png` 的三行循环表现；World gameplay 不等待
   动画完成回调。
5. 缺少 Shovel 的分支发出 `missing-item { item: "shovel" }`，由通用世界叠加层显示。

测试覆盖 60Hz/不同 WorldHz 的近似时长、输入锁、自动重试途中出现新障碍、Undo、Replay
以及双 Bobby owner scope。

## 世界坐标叠加层

Engine Presentation 增加统一的 world-anchored overlay 能力，用于 NPC 名字、气泡对白和
缺失物品图标。建议 API 由一个短生命周期描述组成：

```ts
interface WorldOverlay {
  anchor: { entityId: number } | { x: number; y: number };
  content:
    | { type: "text"; text: string }
    | { type: "icon"; asset: string }
    | { type: "dialogue"; text: string };
  placement: "above" | "center";
  durationMs?: number;
  blinkMs?: number;
}
```

Camera 每帧把 world anchor 投影为 Canvas 坐标，Renderer 在 `effect` pass 绘制；生命周期
属于 PresentationClock。`missing-item` 由 Engine 内部映射为 icon overlay，NPC 名字与
轻量气泡可以由 Entity presentation metadata 或宿主通过 Game façade 请求。具体文字、
购买流程和多选对话仍由宿主交互控制器持有。

最小验证矩阵包括 Camera pan/zoom、Entity 移动与删除、多个 overlay 层序、暂停 World
但继续 Presentation、Debug 倒帧以及 viewport 边缘裁切。
