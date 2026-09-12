# 地图内 Callout

World Callout 是 Engine 在地图 Canvas 中显示的轻量提示。它与 Entity 或格子绑定，跟随
Camera 和移动插值，不阻塞 gameplay。带选项或需要暂停游戏的对白由 `GameplayDialog`
承担。

原版依据见 `original/reverse-engineering/semantic/MissingItemHint.java` 与
`GameplayRenderOrder.java`。图片切片来自原版第三方资产，权利边界以根目录
`THIRD_PARTY_ASSETS.md` 为准。

## 职责边界

```text
World / Behavior
    发布语义 WorldEvent
        ↓
Callout Definition
    选择内容、锚点和表现时序
        ↓
VisualRuntime
    维护 Presentation 生命周期
        ↓
Renderer Canvas + aria-live
```

Callout 是纯 Presentation 状态，不进入 `LevelMap`、World snapshot、碰撞、目标统计或
Replay 文件，也不计入 `presentationBlocksInput`。公共 `Game` façade 不提供任意创建、
修改或删除 Callout 的入口；地图提示由 Engine 内部的语义事件映射产生。

## 内容与锚点

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

`sliceId` 是 `ImageManager` 中登记的语义图片切片 ID。`clearanceSourcePx` 使用原始图片像素
描述 Callout 与主体之间的距离，并随 Camera zoom 缩放。

`channel` 是互斥展示槽。同一 channel 收到新提示时替换内容并刷新持续时间。Entity 锚点
读取当前插值 pose；Entity 消失后提示立即结束。格子锚点使用格子中心。`auto-vertical`
优先显示在主体上方，空间不足时翻到下方；屏幕外锚点不会吸附到视口边缘。

Renderer 的顺序是：

```text
world → player → effect → callout → debug overlay
```

DOM Gameplay HUD 位于 Canvas 外部。

## 缺少道具提示

Mower、Lock、Whirlwind、Snow 和 Bean Field 使用统一事件：

```ts
interface MissingItemEvent extends WorldEvent {
  type: "missing-item";
  actorId: EntityId;
  entityId: EntityId;
  x: number;
  y: number;
  data: {
    item: "gas" | "lock-key" | "kite" | "shovel" | "bean";
  };
}
```

- `actorId`：缺少道具的 Bobby，也是 Callout 锚点；
- `entityId`：触发提示的地图 Entity；
- `x / y`：触发 Entity 所在格；
- `data.item`：缺少的地图内道具。

Presentation 集中映射图标和辅助文本：

| `data.item` | `sliceId` | 播报文本 |
| --- | --- | --- |
| `gas` | `hud-gas` | 需要汽油 |
| `lock-key` | `hud-key` | 需要钥匙 |
| `kite` | `hud-kite` | 需要风筝 |
| `shovel` | `hud-shovel` | 需要雪铲 |
| `bean` | `hud-bean` | 需要魔豆 |

同一 Bobby 使用 `missing-item:<actorId>` channel，因此同时只显示最新的一种缺失道具；
不同 Bobby 的提示可以并存。

## 时间和生命周期

缺少道具提示沿用原版确认参数：

- 总持续时间 `992ms`；
- 闪烁周期 `248ms`；
- 每个周期前半段隐藏、后半段显示。

Callout 由 PresentationClock 推进。Presentation pause 和逐帧调试会冻结或推进提示，World
debug pause 不会阻止纯表现继续播放。改变 `presentationHz` 只影响采样精度；
`setTimeScale()` 按 Engine 的统一时间倍率同时影响表现。

Load、Restart、Undo、Redo、死亡和通关会清理当前提示。Replay 正常播放时由重新发生的
WorldEvent 创建提示；`jumpReplayToEnd()` 只保留终点表现，不展示快进期间的历史提示。

## 可访问性

Canvas 内容通过 Gameplay mount 中独立的 `role="status"`、`aria-live="polite"` 节点同步
播报。图片使用 `accessibleText`，文字提示使用正文。每次创建或替换提示只播报一次；
闪烁帧和 Camera 更新不重复播报。该节点不参与布局和 pointer interaction。

## 验证入口

`tools/pipeline/callout-smoke.json` 可以直接导入 Editor。地图沿通道排列五种触发对象，
用于依次验证 Gas、Lock Key、Kite、Shovel 与 Bean 提示。

自动回归覆盖事件字段、图标映射、生命周期、channel 替换、移动插值、Camera 缩放、顶部
翻转、屏幕外裁剪、重置和辅助技术播报。

## 扩展规则

NPC 名称、气泡文字或距离触发提示可以增加独立 producer，并复用同一 Cue、Runtime 与
Renderer。距离阈值、迟滞和内容来源属于 producer；Callout 渲染核心只处理已经形成的
内容、锚点和表现时序。
