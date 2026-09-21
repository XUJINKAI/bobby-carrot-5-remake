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

## 可推动石头

`pushable-stone` 是单格阻挡 Entity，并通过 Engine 的通用 `pushable` 语义参与推动。当前视觉复用 `crumbly-rock`；两者保持独立身份，后续爆炸等机关可以只作用于可推动石头而不改变 Bobby Carrot 原有关卡中的碎石规则。

## 激光发生器

`laser-emitter` 使用必填 `direction` 字段声明固定发射方向。Engine 从发生器相邻格开始投影激光，遇到首个阻挡对象、Exit 或 Bobby Carrot 5 Mirror 时终止；Bobby 进入激光格会在移动交互点死亡。发生器是单格可推动阻挡对象，从侧面或背面推动后保持发射方向，并从新位置重新投影光束。光束格由 Engine 作为 Runtime Entity 派生，不写回 `LevelMap`。

`laser-mirror` 是可推动的双面反射镜，使用必填 `variant` 区分两种对角线。`slash`（`/`）按 `up ↔ right`、`down ↔ left` 反射；`backslash`（`\`）按 `up ↔ left`、`down ↔ right` 反射。光路通过镜面后继续投影，循环光路在相同格子和入射方向再次出现时终止追踪。

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
- `custom-maps/engine-lab/test/02-pushable-stone.json`
- `custom-maps/engine-lab/test/03-laser-emitter.json`

`npm run verify` 校验这些地图的 Editor JSON round-trip、Definition 注册、实例属性和规则格式。
