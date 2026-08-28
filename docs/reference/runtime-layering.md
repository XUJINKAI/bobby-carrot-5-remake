# Engine 运行时层序

> Engine 已统一为 Entity / Presence 模型。原 DAT 的 Terrain / Object 只是导入语义，不再对应运行时类型或固定渲染层。

## 两套职责必须分开

### Spatial：`stackOrder`

`SpatialIndex` 只管理同格 Presence 的逻辑顺序：

```text
stackOrder ASC
→ entityId 仅作为 deterministic fallback
```

- `EntityDefinition.stackOrder` 是单格 Entity 与 footprint 的默认基准；
- `FootprintPart.stackOrder` 可以覆盖单个 part；
- 没有 `surface/content/cover`、`stackBand` 或其他类别层；
- `topPresenceAt()` 只表达同格逻辑栈顶部，不承担视觉遮挡语义。

原版 helper 当前使用约定值：地表 `0`、普通实体 `100`、前景覆盖对象 `200`。这些只是 stackOrder 默认值，不形成新的枚举类型。

## Presentation：固定 render pass

视觉层序属于 Presentation。`VisualDefinition.renderPass` 只有三个 pass：

```text
world
→ player
→ overlay
→ HUD（DOM，canvas 外）
```

- `world`：绝大多数 Entity，包括地面、目标、道具、机关、障碍；
- `player`：Bobby；
- `overlay`：明确需要压在 Bobby 上方的前景视觉，例如高草、雪；
- HUD 由 `GameplayHud` 在 DOM 中呈现，不进入 World/Spatial/RenderScene。

同一个 pass 内只按 `stackOrder` 排序。`visualX` / `visualY` 只决定动画中的绘制坐标，绝不参与层序。

因此 Bobby 站在 Empty Egg Nest 上时，Nest 属于 `world`，Bobby 属于 `player`，绘制顺序天然是 Nest → Bobby，不再依赖 Entity id、移动方向或视觉 Y。

## 原版数据映射

原 DAT 可以同时提供 terrain/object/dynamic 信息，但 Adapter 会把它们 materialize 为独立 Entity。底层 Entity 不会因为上层 Entity 存在而被跳过：同一格的所有 Presence 都会进入对应 render pass。

例如：

- 水 + 木板：水和木板都是 `world`，通过各自 `stackOrder` 保持水在下、木板在上；木板消失后水自然暴露。
- 高草 + 收集物：收集物属于 `world`，高草 visual 属于 `overlay`，所以高草可以遮挡 Bobby 与收集物，而 gameplay 仍由各 Entity 独立处理。
- Bobby + 蛋巢：蛋巢属于 `world`，Bobby 属于 `player`，不会发生蛋巢盖住 Bobby。

不要为了新视觉效果继续增加 Spatial band。若未来需要新的视觉层次，应首先判断是否属于 Presentation pass 或 VisualComposition，而不是污染 World 的空间模型。

## Editor

Editor Canvas 使用与 Runtime 相同的 VisualRegistry 与 `world → player → overlay` pass，因此编辑器预览和实际游戏保持同一层序语义。Editor 的删除、Inspector、occupancy 等逻辑继续通过 Spatial `stackOrder` 工作，不从 render pass 推导 gameplay 行为。
