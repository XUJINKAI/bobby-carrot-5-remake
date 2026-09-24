# Entity Goal 与通行规则实施基线

本记录以 `a6e7ddba665513dd9440cd95ad35435d42c93634` 为代码基线，实施范围见
[实施计划](entity-fact-passage-plan.md)。原版规则以
[UP9 通行事实](../reference/original-passage.md)为依据；保留的产品差异以
[Fidelity 边界](../decisions/original-fidelity-boundaries.md)为依据。

## 目标条件审计

扫描 `assets/maps/` 下 680 个地图文件后，叶子条件只有以下五种标准表达；没有需要
人工解释的自定义 selector。组合节点仍按地图现有的 `all / any` 关系保留。

| 现有条件 | 地图叶子数 | 目标实现 | 当前回归入口 |
| --- | ---: | --- | --- |
| `collect-all / carrot` | 357 | `carrotGoal` | `tests/module/engine/selector-count.test.mjs` |
| `fill-all / egg-nest / filled-egg` | 42 | `eggGoal` | `tests/module/engine/entity-runtime-semantics.test.mjs` |
| `fill-all / push-goal / pushable` | 187 | `pushGoal` | `tests/integration/assets/loma.test.mjs` |
| `reach / exit` | 492 | `exitGoal` | `tests/module/engine/world-runtime.test.mjs` |
| `reach / golden-carrot` | 80 | `goldenCarrotGoal` | `tests/module/engine/adventure-bonus.test.mjs` |

`assets/replays/original/1-1.json` 和 `1-2.json` 包含旧条件的终态摘要。地图与 Replay
需在 Goal 阶段一起更新，并用正式 Runner 重放确认哈希和终态。

## 通行规则矩阵

| 领域 | 原版事实 | 当前回归入口 | 实施核对点 |
| --- | --- | --- | --- |
| Bobby、Mower、Plank | 原版事实第 1～3 节 | `mower.test.mjs`、`plank-runtime.test.mjs` | 地形覆盖先于独立对象，驾驶只用地形通行 |
| Bean | 第 4 节 | `bean-growth.test.mjs` | 生长区间边界、普通 object 占用与动态载体 |
| Cloud、Leaf | 第 5～6、8～9 节 | `moving-support-passage.test.mjs` | 静态阻挡表、逆风逆流、续行回退与运动预留 |
| Fireball | 第 7 节 | `dragon-fireball.test.mjs`、`projectile-passage.test.mjs` | terrain 域、Mirror 入射、Color Block 状态与 Ice 融化 |

当前 `EntityDefinition.layer` 同时被空间投影和通行分支读取；这与计划中的领域通行
职责重叠。视觉层、footprint role 和 Editor stackSlot 各有独立合同，清理时逐处核对。

## 已确认的产品边界

移动节拍、Ice 开局、Plank 逐实例衰变、Kite 地图边缘恢复、Dragon 实例与 Head
碰撞，以及 Lock 倒计时，遵循 Fidelity 文档。Cloud / Leaf 的像素子步与现代多人
目的格预留同时涉及原版和现有 World 合同，实施时以独立回归固定最终行为。
