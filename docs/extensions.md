# Engine 扩展机制

Bobby Carrot 5 Remake 使用 `custom:` semantic ID 和 `LevelMap.rules` 承载自定义地图机制。扩展地图集中保存在 `custom_maps/`，可由 Editor 导入并使用正式 Engine Play Test。

## Portal

Portal 使用对象 `custom:portal`，实例属性 `channel` 支持 `blue`、`red`、`green`。Bobby 进入 Portal 后传送到地图中同频道的另一端；Portal Definition 位于 `engine/src/custom/object/portal.ts`，并通过通用 relocation API 完成状态变更。

Portal 由 Engine 和 Editor 共用 Canvas 绘制入口生成发光圆环素材。该素材属于项目原创的程序化视觉，不使用原版 atlas 或第三方资源。

## Pushbox

推动对象复用 `crumbly-rock` 的语义身份与原版美术。地图实例通过以下属性启用推动能力：

```json
{
  "type": "crumbly-rock",
  "x": 3,
  "y": 4,
  "traits": ["pushable"]
}
```

`custom:push-goal` 是可步行目标地形。具有 effective `pushable` trait 的对象可以推动；所有 Push Goal 都被这类对象占据后，该完成条件成立。它与原版主要目标、到达 Exit 共同组成 AND 条件。实例 Trait 只能从 Object Definition 的 `authoring.traits` 白名单选择。推动要求后方为可步行地形、没有静态对象且没有动态实体。通用推动算法位于 `engine/src/mechanics/movement/pushable.ts`。

## 最大步数

地图可在 `LevelMap.rules` 声明最大步数：

```json
{
  "rules": { "maxMoves": 20 }
}
```

第 21 次成功的主动移动触发地图内死亡。阻挡输入与强制移动不计入步数，Undo 和 Restart 通过 Engine snapshot 生命周期恢复规则状态。Level load 从 `LevelMap.rules` 创建当前地图的 active rule 列表。

## 验证地图

- `custom_maps/engine-lab/portal.json`
- `custom_maps/engine-lab/pushbox.json`
- `custom_maps/engine-lab/max-moves.json`

`npm run verify` 校验这些地图的 Editor JSON round-trip、Definition 注册、实例属性和规则格式。
