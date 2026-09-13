# 原版 Fidelity 审阅入口

本目录记录 Bobby Carrot 5 原版与 Bobby Carrot 5 Remake 的已知行为差异。这里既不把
原版实现自动当成目标，也不把当前实现自动当成正确答案；每项差异必须先判断产品结论，
再进入对应文档。

审计范围是单张纯语义 `LevelMap` 的地图内运行。Adventure Save、全局经济、永久商品、
章节流程和宿主交互脚本按照各自产品合同处理。

## 阅读入口

| 状态 | 文档 | 含义 |
| --- | --- | --- |
| 设计如此 | [`docs/decisions/original-fidelity-boundaries.md`](../../../docs/decisions/original-fidelity-boundaries.md) | 已决定保留 Bobby Carrot 5 Remake 的行为 |
| 已确认待改 | [`fidelity-approved-backlog.md`](fidelity-approved-backlog.md) | 目标行为已经确定，等待实现 |
| 待确认 | [`fidelity-open-questions.md`](fidelity-open-questions.md) | 已观察到差异，但产品结论或精确规则尚未确定 |

“原版事实已经确认”和“确认要按原版修改”是两个不同维度。前者说明证据可靠，后者才决定
进入实施清单。一个已由字节码确认的差异，仍然可以成为现代设计选择或待确认问题。

## 条目规则

每项差异只记录在一个状态文档中，并按以下顺序描述：

1. **现象差异**：玩家或地图作者能够观察到什么不同；
2. **可能影响**：它会改变解法、输入时机、画面还是只影响异常组合；
3. **原理说明**：原版与当前 Engine 为什么产生不同结果；
4. **证据**：对应 semantic 文件、当前实现与最小测试；
5. **结论**：保留现状、进入实施，或还需要回答的问题。

原始批注应改写成明确结论或问题，不在正文中保留行尾 `//` 讨论。一个章节包含多个独立
差异时必须拆开，避免用一个状态覆盖整组机制。

## 状态流转

```text
发现差异
   ↓
待确认 ──确认保留──> 设计决策
   │
   └────确认修改──> 已确认待改
                         ↓ 实现并验证
                    机制文档 / 合同 / 测试
```

实现完成后，该项从差异文档中删除。稳定行为写入 `docs/contracts/`、`docs/features/`、
`docs/reference/` 或对应机制说明，回归依据进入测试；Git 历史负责保存实施过程，不在这里
维护“已完成差异”档案。

## 证据入口

- 原版运行时总览：[`runtime-entity-matrix.md`](runtime-entity-matrix.md)
- 原版动画与时间：[`docs/reference/runtime-animation.md`](../../../docs/reference/runtime-animation.md)
- 当前 Engine 合同：[`docs/contracts/engine-api.md`](../../../docs/contracts/engine-api.md)
- World 运行边界：[`docs/contracts/world-runtime.md`](../../../docs/contracts/world-runtime.md)
- 原版验证流程：[`docs/workflows/validate-original.md`](../../../docs/workflows/validate-original.md)
- 新机关流程：[`docs/workflows/add-mechanic.md`](../../../docs/workflows/add-mechanic.md)

原版 JAR、美术、音频、地图和逆向派生材料的权利边界统一以根目录
`THIRD_PARTY_ASSETS.md` 为准。
