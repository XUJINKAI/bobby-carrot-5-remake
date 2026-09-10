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
