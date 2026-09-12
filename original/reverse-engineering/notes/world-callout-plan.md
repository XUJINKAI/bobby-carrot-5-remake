# 地图内 World Callout 实施设计

本文规划 Engine 在 Canvas 中显示非阻塞、与地图 Entity 或格子绑定的轻量提示。首轮以原版缺少道具提示闭环验证能力；NPC 名称、气泡文字等需求后续通过独立 producer 复用同一表现基础设施。

原版事实依据见 [`MissingItemHint.java`](../semantic/MissingItemHint.java)、[`GameplayRenderOrder.java`](../semantic/GameplayRenderOrder.java) 与 [`runtime-animation.md`](../../../docs/reference/runtime-animation.md)。Engine 的时钟和表现边界以 [`engine-api.md`](../../../docs/contracts/engine-api.md) 和 [`world-runtime.md`](../../../docs/contracts/world-runtime.md) 为准。

## 1. 目标与职责边界

Callout 由两部分协作产生：

```text
World / Behavior
    产生“缺少某项道具”等语义 WorldEvent
        ↓
Engine Presentation
    选择内容、位置、闪烁和持续时间
        ↓
Canvas Callout + aria-live 播报
```

首轮实际消费者为：

- Mower 缺 Gas；
- Lock 缺 Key；
- Whirlwind 缺 Kite；
- Snow 缺 Shovel；
- Bean Field 缺 Bean。

Callout 是纯 Presentation 状态，不进入 `LevelMap`、World snapshot、碰撞、目标统计或 Replay 文件。它不阻塞输入，也不驱动 gameplay mutation。带选项或阻塞式对白继续由 `GameplayDialog` 承担。

首轮只由 Engine 内部的 WorldEvent 映射创建 Callout。公共 `Game` façade 不增加任意创建、更新或删除 Callout 的入口；宿主动态业务信息继续走现有产品 UI 或 `GameplayDialog` 边界。

## 2. 复用现有表现链路

Engine 已有以下事实链路：

```text
WorldDelta(world-event)
        ↓
VisualRuntime transient
        ↓
RenderScene
        ↓
Renderer
```

Callout 沿这条链路扩展，不建立第二套事件分发或 gameplay 状态系统。`VisualRuntime` 在消费 `world-event` delta 时，根据 Callout Definition 创建纯表现实例；Renderer 使用独立 Callout pass 绘制。

Callout pass 位于世界 Entity 与特效之后、DOM Gameplay HUD 之前。Debug overlay 可以继续位于 Callout 之上。未来增加原版前景雪花或 Butterfly 时，应按原版顺序明确放在缺少道具 Callout 之后。

## 3. 内容与锚点模型

首轮只定义图片切片和纯文字，不引入富文本 token 流：

```ts
type WorldCalloutContent =
  | {
      type: "image-slice";
      sliceId: string;
      accessibleText: string;
    }
  | {
      type: "text";
      text: string;
    };

interface WorldCalloutCue {
  channel: string;
  anchor:
    | { type: "entity"; entityId: EntityId }
    | { type: "cell"; x: number; y: number };
  content: WorldCalloutContent;
  placement: "above" | "below" | "auto-vertical";
  durationMs: number;
  clearanceSourcePx?: number;
  blink?: {
    periodMs: number;
    visibleFromMs: number;
    visibleUntilMs: number;
  };
}
```

`clearanceSourcePx` 使用原始图片像素描述 Callout 与 Entity 视觉主体之间的避让距离，
并随 Camera zoom 一起缩放。

`sliceId` 是注入 `ImageManager` 的语义图片切片 ID，不是 URL。创建 Callout 前必须验证切片已经登记。纯文字只接受普通字符串；具体排版由 Renderer 统一完成。

`channel` 表达互斥展示槽。同一 channel 收到新提示时替换内容并刷新持续时间。缺少道具使用 `missing-item:<actorId>`，所以每个 Bobby 同时最多显示一个缺少道具提示，多 Bobby 之间互不覆盖。

Entity 锚点读取当前插值后的 Entity pose，保证 Bobby 移动、Camera 跟随和缩放时提示连续移动。Entity 被删除后，对应 Callout 立即结束。格子锚点使用格子中心与相同 Camera 变换。

`auto-vertical` 默认把内容水平居中放在 Entity 上方；上方越过 Canvas 顶部时翻到下方。锚点位于视口外时不把提示吸附到屏幕边缘，避免把屏幕外事件误示为当前可见位置。

## 4. Missing Item 事件合同

World 只报告语义事实，不携带图片、排版、颜色或动画参数：

```ts
type MissingItemKind =
  | "gas"
  | "lock-key"
  | "kite"
  | "shovel"
  | "bean";

interface MissingItemEvent extends WorldEvent {
  type: "missing-item";
  actorId: EntityId;
  entityId: EntityId;
  x: number;
  y: number;
  data: {
    item: MissingItemKind;
  };
}
```

字段含义固定为：

- `actorId`：需要道具的 Bobby，也是 Callout 锚点；
- `entityId`：触发提示的 Mower、Lock、Whirlwind、Snow 或 Bean Field；
- `x / y`：触发对象所在格，供事件观察和 Debug 使用；
- `data.item`：缺少的地图内道具。

现有 Mower、Whirlwind 和 Bean Field 的 `missing-item` 事件迁移到这个合同；Lock 与 Snow 补齐相同事件。为 `MissingItemEvent` 提供类型守卫，Presentation 不直接猜测开放 `WorldEvent.data` 的形状。

Presentation 使用集中映射选择现有 `hud.png` 语义切片和可访问名称：

| `data.item` | `sliceId` | 播报文本 |
| --- | --- | --- |
| `gas` | `hud-gas` | 需要汽油 |
| `lock-key` | `hud-key` | 需要钥匙 |
| `kite` | `hud-kite` | 需要风筝 |
| `shovel` | `hud-shovel` | 需要雪铲 |
| `bean` | `hud-bean` | 需要魔豆 |

图片切片继续属于原版第三方资产，其版权边界以根目录 `THIRD_PARTY_ASSETS.md` 为准。

## 5. 时间、闪烁与替换

缺少道具 Callout 使用原版确认的表现参数：

- 总持续时间 `992ms`；
- 闪烁周期 `248ms`；
- 每个周期前半段隐藏、后半段显示；
- 同一 Bobby 再次触发时更新内容并重新开始完整持续时间。

这些值从原版 `32 gameplay step` 和 `8-step blink cycle` 换算为毫秒。Callout 不影响后续 gameplay，因此由 `PresentationClock` 推进：

- Presentation pause 与逐帧调试冻结或推进 Callout；
- World debug pause 时 Callout 继续播放；
- 改变 `presentationHz` 只改变采样精度，不改变毫秒持续时间；
- `setTimeScale()` 按现有合同同步改变 Presentation 的相对播放速度。

Callout 不计入 `VisualRuntime.blocksGameplay`。是否存在 Callout 也不改变 `Game.presentationBlocksInput`。

## 6. 重置、Undo 与 Replay

Callout 是可丢弃的表现状态：

- Load、Restart、Undo、Redo、死亡和通关清理当前 Callout；
- Entity 锚点在提示期间消失时立即清理对应实例；
- Replay 正常播放时，由重新发生的 WorldEvent 创建提示；
- `jumpReplayToEnd()` 只呈现终点状态，不保留快进期间产生的 Callout；
- Callout 不进入 Replay command、final state 或 World snapshot。

快进实现必须显式抑制或在终点渲染前清空沿途瞬态 Callout，不能把批量发布的历史事件都当作终点刚发生的表现。

## 7. Canvas 与可访问性

图片和文字都绘制在 Engine Canvas 中，跟随 Camera 的世界到屏幕坐标变换。Callout 使用与地图视觉一致的 source-pixel 尺寸语义，并随 Camera zoom 缩放；布局测试覆盖 Adventure portrait viewport 与 Explore 自由缩放。

Canvas 内容本身不形成可访问名称。Engine 在 Gameplay mount 中维护一个视觉隐藏的 `aria-live="polite"` 状态节点：

- 图片 Callout 使用 `accessibleText`；
- 文字 Callout 直接使用正文；
- 每次新提示只播报一次；
- 闪烁帧和 Camera 更新不重复播报；
- 同一 channel 被新提示替换时播报新内容。

这个 DOM 节点只承接辅助技术输出，不参与 Callout 布局或 pointer interaction。

## 8. 后续 producer 扩展

NPC 名称、气泡文字和距离出现条件通过独立 producer 接入：

```text
Entity Definition / presentation metadata
        ↓
producer 计算进入、离开与迟滞
        ↓
创建或结束 WorldCalloutCue
        ↓
复用 Callout Runtime 与 Renderer
```

距离 metric、进入/离开阈值和持久 ID 属于 producer 的触发策略，不进入 Callout 渲染核心。引入具体 NPC 需求时，再根据相应 Entity 的字段合同决定哪些内容进入 `LevelMap`；首轮缺少道具提示不修改地图格式。

## 9. 实施批次

### 批次 A：Callout 渲染基础

1. 增加 Callout Definition、runtime instance 与独立 render pass。
2. 实现 Entity / Cell 锚点、Camera 变换和 `auto-vertical`。
3. 支持语义图片切片与纯文字绘制。
4. 在 Gameplay mount 中建立 `aria-live` 输出节点。

### 批次 B：表现生命周期

1. 使用 `PresentationClock` 管理持续时间和闪烁。
2. 实现 channel 替换与 Entity 锚点失效清理。
3. 接入 Load、Restart、Undo、Redo、终局和 Replay 跳转清理。
4. 保证 Callout 不参与 gameplay input blocking。

### 批次 C：Missing Item 闭环

1. 定义 `MissingItemKind`、`MissingItemEvent` 与类型守卫。
2. 统一 Mower、Lock、Whirlwind、Snow、Bean Field 的事件字段。
3. 集中登记五种 `hud.png` 图片切片与可访问文本映射。
4. 在 Editor 最小测试地图中验证五种触发路径。

每个批次独立提交，并执行完整 `npm run verify`。

## 10. 回归矩阵与完成标准

自动测试至少覆盖：

- 图片切片和纯文字 Callout；
- 五种缺少道具事件、图标映射和播报文本；
- `actorId / entityId / x / y / data.item` 事件语义；
- 多 Bobby 分别锚定与同 actor channel 替换；
- Bobby 移动时跟随插值 pose；
- Camera pan、zoom、顶部翻转和屏幕外 culling；
- `992ms` 生命周期、`248ms` 周期与 50% duty cycle；
- Presentation pause、World pause、逐帧和不同 `presentationHz`；
- Entity 删除与各类 session 重置；
- Replay 正常播放与 `jumpReplayToEnd()`；
- `aria-live` 单次播报；
- Callout 不改变 World snapshot、Replay final state 或输入阻塞状态。

完成时应能在同一张 Editor 测试地图中依次触发 Gas、Key、Kite、Shovel 与 Bean 提示，并在 Bobby Carrot 5 Remake 的正式 Engine session 中观察一致的锚定、闪烁、替换和清理行为。
