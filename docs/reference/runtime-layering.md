# Engine 运行时层序

> Engine 已统一为 Entity / Presence 模型。原 DAT 的 Terrain / Object 只是导入语义，不再对应运行时类型或固定渲染层。

## 两套职责必须分开

### Spatial：完整栈、接触栈与 `stackOrder`

`SpatialIndex` 使用 `stackOrder` 管理同格 Presence 的逻辑顺序：

```text
stackOrder ASC
→ entityId 仅作为 deterministic fallback
```

- `stackOrder` 属于 Level / Runtime Entity 实例，同一多格 Entity 的全部 Presence 共用一个值；
- 未显式给值的初始或 Runtime Entity 按加载、生成顺序放到重叠范围顶层，空栈从 `0` 开始；
- Editor 新放置的 Entity 使用当前重叠范围最高值 `+1`，同 slot 替换保留原顺序，手动重排写成从 `0` 开始的连续整数；
- 相同 `stackOrder` 表示同一接触平面；`entityId` 只保证完整栈的确定性排列；
- `SpatialIndex.topPresenceAt()` 表达完整空间栈顶部，`WorldQueryApi.topPresenceAt()` 表达接触栈顶部。

完整空间栈供 Render、Editor、Debug 和非接触目标查询使用。玩法查询默认读取接触栈：找到
最高的 `contact-cover` Presence，只保留该 `stackOrder` 平面及其上方的 Presence。没有
`contact-cover` 时，接触栈等于完整栈。Behavior 使用 `query.presencesAt(cell)` 读取接触栈；
需要完整空间事实的对象特例显式使用 `query.allPresencesAt(cell)`。

## Presentation：固定 render pass

视觉层序属于 Presentation。Entity 的 `VisualDefinition.renderPass` 只有 `world / standing /
effect` 三种；Renderer 在三个 Entity pass 后追加 Callout，再由 Canvas 外的 DOM 显示 HUD：

```text
world
→ standing
→ effect
→ callout（Canvas 地图提示）
→ HUD（DOM，canvas 外）
```

- `world`：所有正常世界 Entity，包括地面、目标、道具、机关、障碍、冰块、高草、雪等；这是默认 pass；
- `standing`：Bobby 与具有直立遮挡关系的 Entity，按共享脚底锚点进行纵深排序；
- `effect`：明确属于表现层、需要最后覆盖的环境或视觉效果，不代表任何 gameplay Entity 分类；
- `callout`：由语义 WorldEvent 产生、锚定 Entity 或格子的纯表现提示；
- HUD 由 `GameplayHud` 在 DOM 中呈现，不进入 World/Spatial/RenderScene。

`world` 与 `effect` pass 内按完整空间栈的 `stackOrder` 排序。`standing` 先按独立的
`depthY / depthX` 脚底锚点排序，同一锚点才回落到 `stackOrder`。`visualX / visualY` 只决定
各 Presence 的绘制位置；多格直立 Entity 的所有部位共用 Entity body anchor 的 depth。

因此 Bobby 站在 Empty Egg Nest 上时，Nest 属于 `world`，Bobby 属于 `standing`，绘制顺序天然是 Nest → Bobby。冰块即使在 gameplay stack 中使用较高的 `stackOrder`，仍属于 `world`，不会因为“覆盖对象”这一逻辑分类被错误画到 Bobby 之后。

## 原版数据映射

原 DAT 可以同时提供 terrain/object/dynamic 信息，但 Adapter 会把它们 materialize 为独立 Entity。底层 Entity 不会因为上层 Entity 存在而被跳过：同一格的所有 Presence 都会进入对应 render pass。

例如：

- 水 + 木板：水和木板都进入 `world` pass；木板通过 `contact-cover` 使水不参与接触规则，木板消失后水重新进入接触栈。
- 高草 + 收集物：两者都进入 `world` pass；高草位于目标上方时隐藏并阻挡目标的接触交互，但目标计数仍读取完整对象集合。
- Bobby + 蛋巢：蛋巢属于 `world`，Bobby 属于 `standing`，不会发生蛋巢盖住 Bobby。

不要为了新视觉效果继续增加 Spatial band，也不要从 surface/content/cover 一类 gameplay 或 authoring 分类推导 render pass。只有真正独立于正常 Entity 绘制的表现效果才使用 `effect`。

Callout 不是 `VisualDefinition.renderPass` 的第四个 Entity pass。它在 Entity 场景完成后由
独立 Callout Runtime 追加，完整合同见 [`../features/world-callouts.md`](../features/world-callouts.md)。

## Editor

Editor Canvas 使用与 Runtime 相同的 VisualRegistry 与 `world → standing → effect` pass，并按
相同 body anchor 规则排列 `standing`，因此编辑器预览和实际游戏保持同一层序语义。Editor
的删除、Inspector 与重排读取完整空间栈；Engine gameplay 统一从同一 `stackOrder` 派生接触栈。
