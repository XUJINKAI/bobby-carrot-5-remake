# Engine 扩展机制

Bobby Carrot 5 Remake 使用普通 semantic Entity ID 和 `LevelMap.rules` 承载自定义地图机制。扩展地图集中保存在 `custom-maps/`，可由 Editor 导入并使用正式 Engine Play Test。

## Portal

Portal 使用 Entity `portal`。必填顶层字段 `channel` 接受任意非空字符串，用于配对传送门；必填顶层字段 `color` 接受 `#rgb`、`#rrggbb` 以及 `red`、`orange`、`yellow`、`green`、`cyan`、`blue`、`purple`、`pink`、`white`、`gray`、`grey`、`black`。Bobby 进入 Portal 的运动到达中点时切换到同频道的另一端，并沿进入方向续行一格；出口前方不能通行时停在出口 Portal。Portal Definition 位于 `engine/src/entities/custom/portal.ts`，中点切换使用通用 relocation API，出口续行仍通过正式 movement intent 裁决碰撞与机关。

Portal 由 Engine 和 Editor 共用 Canvas 绘制入口生成三帧循环的发光圆环。选择 Portal 画笔或地图中的 Portal 时，Inspector 提供 `channel` 文本输入与 `color` 调色板。该视觉属于项目原创的程序化视觉，不使用原版 atlas 或第三方资源。

## Pushbox

推动对象使用 `pushable-box` 的稳定语义身份，并由 Engine Canvas 绘制正上方视角的木箱视觉：

```json
{
  "type": "pushable-box",
  "x": 3,
  "y": 4
}
```

`push-goal` 是可步行目标 Entity，使用正上方视角的方形标记。`pushable-box` 的 Engine Definition 提供 `pushable` Trait；所有 Push Goal 都被这类对象占据后，该完成条件成立。它与其它目标可通过 `all` 条件组合。推动要求后方可通行且没有冲突占用，通用推动流程位于 Engine movement pipeline。

Novoban 和 LOMA 的 XSB 地图由 `tools/custom/sokoban-xsb.mjs` 转换。地形素材填写在 `tools/custom/pushbox-terrain-table.mjs`：顶层键各定义一个主题，名称仅用于辨认主题，不参与随机选材；每个主题分别填写 `ground`、`boundary`、`obstacle` 素材数组。`ground` 是普通可行走格，`boundary` 填充地图最外一圈的矩形边框，`obstacle` 填充其余墙格和原本连通地图外部的空格。外部空格保持阻挡语义，箱子、目标和 Bobby 的原始坐标保持不变。单一形态的 Surface 可以填写语义名称，如 `sand`、`stump`、`rock`；`snow` 是可用于边框和阻挡的单格对象；有多个形态的 Surface 填写具体 `ts-行-列` 坐标。地图使用固定种子和 collection/map ID 选定一个主题，再按格子坐标从该主题的各类素材中选材；同一地图重新生成时结果保持一致。素材应在 Model 视觉目录登记，并保持所属类别的通行语义。

## 激光石头

`laser-stone` 是 Robo 2 激光机关中的单格阻挡 Entity，通过 Engine 的通用 `pushable` 语义参与推动，并使用 JAR 中的 `stone.png` 原图。它与 Bobby Carrot 5 的 `crumbly-rock` 保持独立身份，炸弹只把 `laser-stone` 视为爆破目标。

## 激光发生器

`laser-emitter` 使用必填 `direction` 字段声明固定发射方向。Engine 从发生器相邻格开始投影激光，遇到首个阻挡对象、Exit 或 Bobby Carrot 5 Mirror 时终止；Bobby 进入激光格会在移动交互点死亡。发生器是单格可推动阻挡对象，从侧面或背面推动后保持发射方向，并从新位置重新投影光束。四个方向分别使用 Robo 2 JAR 中的 `laserUp/Right/Down/Left.png`，光束格由 Engine 作为 Runtime Entity 派生，不写回 `LevelMap`。

光束在红、蓝、紫三色之间连续循环，并同步改变线宽。每个发生器以稳定 `sourceId` 派生自己的相位、周期和粗细节奏，同一发生器经过镜面反射后的全部线段始终保持一致；这组参数只属于 Presentation，不进入地图格式、World 状态或伤害判定。Editor 复用 Engine Visual，并只在地图含发生器时以 30 FPS 刷新光束表现。

地图加载时已经覆盖 Bobby 起点的既有光路提供一次离开机会；Bobby 主动进入光路，或机关变化后光路重新投影到 Bobby 所在格，都会触发死亡。这个边界允许 Robo 2 来源地图保留原始起点，同时不削弱运行中的激光危险。

`laser-mirror` 是可推动的双面反射镜，使用必填 `variant` 区分两种对角线。`slash`（`/`）按 `up ↔ right`、`down ↔ left` 反射；`backslash`（`\`）按 `up ↔ left`、`down ↔ right` 反射。光路通过镜面后继续投影，循环光路在相同格子和入射方向再次出现时终止追踪。

激光命中另一个 `laser-emitter` 时摧毁目标发生器及其光束。若两个发生器互相照射，它们在同一个 World tick 中一起摧毁；其它发生器随后按更新后的阻挡布局重新投影。

发生器和所属光束在 gameplay 中立即销毁，并把销毁前的完整光路快照交给 Presentation。表现层以 `100ms` 为一相位，按亮、灭、亮完成三次明暗切换后消失，总时长 `300ms`。发生器与光束始终使用同一相位；销毁前已经建立的移动也会在交互点重新确认光束仍存在，因此遗留表现不参与碰撞或伤害。

`laser-bomb` 是使用 Robo 2 `bombTickTick.png` 原图的可推动阻挡对象。激光命中后，炸弹摧毁自身以及上、右、下、左相邻格中的 `laser-stone`、`laser-mirror` 和 `laser-emitter`；对角格、其它 Entity 与 Surface 保持不变。不可摧毁的阻挡对象会在边界截去对应方向的爆炸范围。

爆炸中心使用 JAR 中 14×84 的 `bombExplode.png`，相邻格使用 14×72 的 `explosion.png`；两张图都按六帧播放。相邻炸弹加入非阻塞 RuntimeAction 队列，每隔 `600ms` 逐颗结算各自当前位置的十字爆炸。连锁期间 Bobby、WorldMotion 与其它机关继续推进；队列与计时进入 World Snapshot、Undo 和 Replay。

同一 World 的全部发生器由单个 Runtime 激光调度器统一更新。每个 World tick 中，每个发生器只追踪一次光路；命中发生器、启动炸弹链、同步光束 Entity 与机关变化后的伤害复用该次追踪结果。

## 最大步数

地图可在 `LevelMap.rules` 声明最大步数：

```json
{
  "rules": {
    "limits": [
      { "type": "max-moves", "moves": 20 }
    ]
  }
}
```

第 21 次成功的主动移动触发地图内死亡。阻挡输入与强制移动不计入步数，Undo 和 Restart 通过 Engine snapshot 生命周期恢复规则状态。Level load 从 `LevelMap.rules` 创建当前地图的 active rule 列表。

## 验证地图

- `custom-maps/engine-lab/portal/portal.json`
- `custom-maps/engine-lab/pushbox/pushable.json`
- `custom-maps/engine-lab/max-moves.json`

`npm run verify` 校验这些地图的 Editor JSON round-trip、Definition 注册、实例属性和规则格式。
