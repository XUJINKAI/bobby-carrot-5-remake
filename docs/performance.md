# 性能优化记录

本文记录 Bobby Carrot 5 Remake 截至 2026-09-09 的 Engine / Editor 性能优化、验证入口和后续候选。当前优化阶段已收尾；后续以可复现的卡顿和性能采样为依据，再决定具体项目。

玩法与时间边界以 [Engine API](contracts/engine-api.md)、[World Runtime](contracts/world-runtime.md) 为准；编辑交互以 [Editor](features/editor.md) 为准。本文只记录性能实现与排查方法。

## 已完成

### Engine

| 项目 | 当前实现与收益边界 | 主要源码 |
| --- | --- | --- |
| 场景共享胜利条件求值 | 一次场景构建只读取一次 `world.winState`，所有实体视觉共享结果；下一次构建重新读取 | `engine/src/visual/VisualSceneBuilder.ts` |
| 按需历史快照 | 启用历史且进入新玩家操作边界时创建快照；续接步骤沿用待提交快照 | `engine/src/core/Game.ts` |
| type / Trait 语义索引 | 玩家与目标查询使用随空间生命周期同步的索引；列表按 Entity identity 稳定排序，多格 Trait 按实体去重 | `engine/src/world/spatial/EntitySelectorIndex.ts` |
| TickIndex | tick phase 只选择显式或 Trait 绑定 `onTick` 的候选，保留原有 hook 与提交顺序；镜头外机关继续运行 | `engine/src/world/behavior/TickIndex.ts` |
| 绘制阶段视口裁剪 | atlas / image 按实际目标像素范围跳过屏幕外绘制，考虑帧尺寸、锚点、偏移、旋转和插值；自定义 Canvas 回调保守执行 | `engine/src/render/VisualPainter.ts` |
| 瞬态特效按绘制层合并 | 合并阶段只解析活跃特效；仅复制、排序实际追加特效的层，其余复用基础列表；没有可见特效时复用基础场景 | `engine/src/visual/VisualRuntime.ts` |
| 专用目标计数 | Trait 直接读取集合大小；type / Trait 联合计数通过较小集合检查交集，省去 ID 数组创建、实体解析及排序 | `engine/src/world/WorldRuleEvaluator.ts`、`engine/src/world/spatial/EntitySelectorIndex.ts` |

### Editor

| 项目 | 当前实现与收益边界 | 主要源码 |
| --- | --- | --- |
| 平移与缩放复用地图画布 | 视口操作更新父层 CSS transform，复用地图像素内容 | `web/src/pages/editor/EditorCanvas.vue` |
| 交互分层与空间预览复用 | 地图底图与 hover / 选区 / 放置预览分层；交互复用已有空间预览，放置 ghost 只实例化待放对象并查询叠加后的邻格；批量删除共用一次预览 | `editor/src/canvas/EditorCanvasRenderer.ts`、`editor/src/authoring/EditorPlacementPreview.ts` |

## 回归证据与收益解释

以下是确定性的操作次数或复用断言，适合进入自动门禁；它们不是用户设备的 FPS 基准，也不能直接换算为同比例帧率提升。

| 场景 | 当前断言 | 回归测试 |
| --- | --- | --- |
| 场景目标求值 | 每次构建读取 `winState` 一次；收集与恢复后出口视觉正确 | `engine/tests/visual-scene-builder.test.mjs` |
| 历史配置与操作续接 | 快照次数符合历史策略与操作边界 | `engine/tests/game-history-snapshot.test.mjs` |
| 40×40 静态地图 | 每步 `EntityStore.all()` 调用为 0；tick 机关的生成、销毁、恢复与绑定仍正确 | `engine/tests/entity-selector-index.test.mjs`、`engine/tests/tick-index.test.mjs` |
| 40×40 地图显示 2×2 格 | atlas 绘制调用为 4，完整地图包含 1600 格；大图边缘、帧尺寸与插值仍可见 | `engine/tests/viewport-rendering.test.mjs` |
| 特效活跃、结束与倒帧 | 未受影响列表保持引用复用；结束后返回原场景；倒帧恢复相同特效和层序 | `engine/tests/transient-scene-performance.test.mjs`、`engine/tests/plank-runtime.test.mjs` |
| 目标与奖励计数 | 联合 selector 去重正确；求值走专用计数接口；空间生命周期后与全量查询等价 | `engine/tests/selector-count.test.mjs`、`engine/tests/entity-selector-index.test.mjs` |
| Editor 大地图交互 | 选区、擦除与放置预览保持底图绘制次数；ghost 只实例化一个实体 | `editor/tests/canvas-performance.test.mjs` |
| 浏览器真实指针交互 | 中键平移更新 transform，hover 更新交互层，地图底图新增绘制调用为 0 | `tools/custom/editor-performance-browser.mjs`，由 Web 浏览器回归调用 |

统一门禁为 `npm run verify`，包含上述 Node 回归、Web 测试、浏览器回归、构建与浏览器 smoke。计时采样应单独记录地图、操作、浏览器、设备、DPR、视口和缩放比例。

## 当前仍存在的开销

- Engine 场景构建仍遍历完整地图，解析视觉并对三个基础绘制层排序。视口裁剪发生在绘制提交阶段。
- 胜利条件在不同调用方、不同 phase 或帧之间仍会重新求值；专用计数优化只减少计数路径的工作。
- 有效 Undo 操作边界仍创建完整 gameplay snapshot。
- 瞬态特效历史保留供 Debug 倒帧使用；`updateTransients()` 仍遍历历史记录更新活跃集合。合并阶段的优化不改变这部分成本或历史占用。
- Editor 地图内容变更仍重建底图预览并整图绘制；底图和交互画布的像素缓冲仍随地图面积与 DPR 增长，交互更新仍清空完整交互层。
- Editor 选区与 Inspector 路径仍可能分别创建 `EditorPreview`；当前画布内部复用不代表整个编辑页面共享同一预览。

## 暂缓项目

下表是出现对应瓶颈后可重新评估的候选，不是后续实施承诺。风险与收益属于预估，应在修改前重新采样确认。

### Engine

| 候选 | 风险 / 预期收益 | 启动条件与实现约束 |
| --- | --- | --- |
| 基础绘制顺序缓存 | 中 / 中 | 排序占用明显时评估；实体增删、格子位置、footprint、层序和恢复都必须正确失效 |
| 静态视觉缓存 | 中 / 高 | 固定地形反复解析成为主要成本时评估；明确声明视觉依赖，覆盖邻格、全局状态、目标和动画变化 |
| 可见范围驱动场景构建 | 中 / 高 | 大地图局部视野的场景构建占用明显时评估；使用保守视觉边界处理大图、移动、震动和特效，保持全图 gameplay 更新 |
| 胜利条件缓存或增量求值 | 中 / 中 | 规则求值成为热点时评估；同 tick 内多次提交、reach 历史、多格填充和恢复都需要失效依据 |
| Undo 结构共享或增量记录 | 高 / 中 | 有效操作快照造成耗时尖峰或内存压力时评估；必须完整恢复 Entity、GlobalState、Action、Motion 和终局状态 |
| 特效历史更新与保留策略 | 中 / 依运行时长而定 | 长时间游玩后历史遍历或内存持续增长时评估；先明确 Debug 时间回退范围，再调整存储和活跃集合更新 |

### Editor

| 候选 | 风险 / 预期收益 | 启动条件与实现约束 |
| --- | --- | --- |
| 选区与 Inspector 共用预览 | 低 / 中 | 选择卡顿且预览重建占比高时评估；文档版本变化后失效 |
| 同帧重绘请求合并 | 低 / 中 | 连续编辑产生一帧多次重绘时评估；保留最终指针状态和输入结束后的刷新 |
| 交互层局部清理 | 中 / 中 | 高 DPR 下 hover 清屏成本突出时评估；覆盖新旧选区、ghost 越界和缩放后的清理区域 |
| 地图分块缓存、局部重绘或视口大小画布 | 中 / 高 | 内容编辑整图重绘或画布内存成为瓶颈时评估；覆盖邻格依赖、多格对象、缩放与地图尺寸变化 |

## 再次出现卡顿时

1. 记录入口：Explore / Adventure / Editor 编辑态 / Play Test，以及地图 ID、连续操作、卡顿发生时机。先区分持续掉帧、移动瞬间停顿与长时间运行后退化。
2. 在同一设备、浏览器、DPR、视口和缩放下复现。可先用 `21-2` 检查大地图，用 `15-bonus-2` 检查密集机关；编辑态单独测试平移、hover、选区和连续绘制。
3. 预热资源后采集浏览器 Performance，分别观察 World 更新、快照、场景解析、排序、Canvas 绘制、Editor 预览、GC 和长任务。保存至少几段相同操作的样本。
4. 按实际热点选择一个候选，只改一项；比较同条件下的耗时分布、尖峰、内存和操作次数，记录结果与适用范围。
5. 增加对应边界回归，执行 `npm run verify`，独立提交并更新本文。地图玩法、计时和持久化语义继续遵守既有合同。
