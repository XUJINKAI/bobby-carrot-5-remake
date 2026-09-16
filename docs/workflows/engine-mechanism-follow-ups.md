# Engine 机制架构后续任务

本文记录 Engine 机制架构完成后的跨模块改进任务。这些任务不阻塞 PR #53，后续应分别实现、验证和提交。

## 1. 保留 Editor 中的嵌套胜利条件

### 当前行为

Editor 初始化关卡时会执行规则检测：

```ts
const initialDetected = ruleDetector.detect(initialLevel, environment);
if (initialDetected.length > 0)
  document.execute(enableEditorRules(environment, initialDetected));
```

当前规则检查与修改逻辑存在两个限制：

1. `winConditions()` 只展开顶层 `all`。
2. `changeEditorRules()` 根据启用的规则列表重新构造一个扁平的 `all` 条件。

因此，当关卡使用 `any` 或嵌套的 `all`／`any` 条件时，Editor 无法识别其中已有的叶子 Goal，并可能在初始化期间把原条件树改写为扁平的 `all`。

例如：

```json
{
  "type": "any",
  "conditions": [
    { "type": "golden-carrot" },
    { "type": "exit" }
  ]
}
```

可能被改写为：

```json
{
  "type": "all",
  "conditions": [
    { "type": "exit" },
    { "type": "golden-carrot" }
  ]
}
```

这会把“取得 Golden Carrot 或到达 Exit”改变为“必须同时完成两者”。

### 涉及位置

* `web/src/pages/editor/useEditorPage.ts`
* `editor/src/authoring/rules.ts`
* `editor/src/authoring/EditorRuleDetector.ts`
* Editor 规则面板及相关测试

### 推荐设计

将“读取已有条件树”“检测地图中可用的 Goal”和“修改条件树”分成三个独立职责。

#### 1. 递归读取已有 Goal

规则检查必须递归遍历：

* `all`
* `any`
* 叶子 Goal

嵌套层级不能影响叶子 Goal 的识别。

例如：

```json
{
  "type": "all",
  "conditions": [
    { "type": "carrot" },
    {
      "type": "any",
      "conditions": [
        { "type": "golden-carrot" },
        { "type": "exit" }
      ]
    }
  ]
}
```

应识别出：

```text
carrot
golden-carrot
exit
```

但这种识别结果只能用于展示、检查和推荐，不能代替原始条件树。

#### 2. 初始化时保留显式条件树

当关卡已经存在 `rules.win` 时，Editor 初始化不得根据检测结果重新生成条件树。

自动检测可以：

* 标记地图中可用的 Goal；
* 提示存在尚未加入胜利条件的 Goal；
* 为没有 `rules.win` 的新关卡生成默认条件；
* 在用户执行明确的编辑操作后修改规则。

自动检测不能把已经存在的 `any`、嵌套结构或条件顺序隐式转换成扁平 `all`。

#### 3. 区分默认生成与显式编辑

建议定义两条独立路径：

```text
没有 rules.win
    → 根据地图内容生成默认 all 条件

已经存在 rules.win
    → 保留原树，仅用于检查和展示
```

如果规则面板未来需要修改嵌套条件，应提供专门的条件树编辑能力，而不是继续用一组布尔开关重建整棵树。

### 验收条件

* 打开使用顶层 `any` 的关卡不会改变 `rules.win`。
* 打开包含嵌套 `all`／`any` 的关卡不会改变条件结构、顺序或语义。
* Editor 初始化不会因为读取规则而把 Document 标记为已修改。
* 未执行编辑操作时，保存、导出和 Play Test 使用的条件树与输入关卡一致。
* 没有 `rules.win` 的新关卡仍能按既定规则生成合理的默认胜利条件。
* 简单的顶层 `all` 关卡行为保持正常。

### 回归测试

至少增加以下测试：

1. `inspectEditorRules()` 能递归识别 `any` 中的叶子 Goal。
2. `inspectEditorRules()` 能递归识别多层 `all`／`any`。
3. Editor 初始化不会修改已有的顶层 `any`。
4. Editor 初始化不会修改嵌套条件树。
5. 打开后直接导出的 `rules.win` 与原始输入深度相等。
6. Play Test 使用原始条件树进行胜利判断。
7. 没有胜利条件的新关卡仍能生成默认规则。

---

## 2. 在 Web 层按事件匹配外部 Interaction Handler

### 当前行为

外部业务交互采用事件监听模式：

```text
Entity Behavior
    → object-interaction
    → WorldEventDispatcher
    → Game.onInteractionRequest()
    → Web createGameSession()
    → Adventure interaction handler
```

Engine 只发布 `object-interaction`，不知道 Adventure 的具体业务规则。

`CreateGameSessionOptions.interaction` 是当前 Session 的单一总 handler。具体事件是否需要处理，由 Adventure handler 内部根据以下字段判断：

* `objectType`
* `action`
* `role`
* `x`
* `y`
* 当前 Save 或 Campaign 状态

当前 `createGameSession()` 无条件注册 interaction listener，并在调用可选 handler 之前取得 `blocking-interaction` gate：

```ts
const unsubscribeInteraction = game.onInteractionRequest((request) => {
  const lease = gates.acquire("blocking-interaction");

  interactionChain = interactionChain
    .then(async () => {
      await options.interaction?.({ request, game, dialog });
    })
    .finally(() => lease.release());
});
```

这会产生两种错误情况：

1. Session 没有提供 `options.interaction`，事件仍会取得阻塞 gate。
2. Session 存在总 handler，但当前事件不匹配，handler 直接返回，事件仍会取得阻塞 gate。

取得 `blocking-interaction` gate 会：

* 暂停 Gameplay；
* 清理持续输入；
* 中止 Replay 录制；
* 等待 interaction chain 完成后恢复 Gameplay。

因此，“收到事件”和“实际处理事件”目前被错误地视为同一件事。

### 涉及位置

* `engine/src/core/WorldEventDispatcher.ts`
* `engine/src/core/Game.ts`
* `web/src/runtime/game/createGameSession.ts`
* `web/src/runtime/game/GameplayGateManager.ts`
* `web/src/pages/game/mountGamePage.ts`
* `adventure/src/augment/types.ts`
* `adventure/src/augment/catalog.ts`

### 架构边界

继续保持以下职责划分：

#### Engine

* 根据 Entity 行为发出通用 `object-interaction`。
* 提供 `onInteractionRequest()` 事件订阅。
* 不依赖 Adventure。
* 不持有 Campaign 的匹配条件或业务 handler。
* 不判断某个 Campaign 事件是否被处理。

#### Web Session

* 把 Engine 事件路由到外部业务 handler。
* 在确认当前事件确实有 handler 后取得阻塞 gate。
* 管理异步 handler 的串行执行和异常隔离。

#### Adventure

* 根据 Campaign 内容和 Save 状态决定某个事件是否需要处理。
* 执行购买、永久道具、跨关经济和存档等业务。
* 返回当前事件对应的 handler，或者明确表示不处理。

字面 `dialogue` 继续由 Engine 内部的 `GameplayDialogController` 处理，不经过外部 interaction 路由。

### 推荐 API

将 Session 级总 handler 改为同步 resolver：

```ts
export type GameSessionInteractionResolver = (
  request: ObjectInteractionEvent,
) => GameSessionInteractionHandler | undefined;
```

Session options：

```ts
export interface CreateGameSessionOptions {
  canvas: HTMLCanvasElement;
  level: LevelMap;
  gameOptions: Omit<GameOptions, "canvas" | "runtime">;
  runtime?: GameSessionRuntimeConfig;
  resolveInteraction?: GameSessionInteractionResolver;
}
```

事件处理流程：

```ts
const resolver = options.resolveInteraction;

const unsubscribeInteraction = resolver
  ? game.onInteractionRequest((request) => {
      const handler = resolver(request);
      if (!handler) return;

      const lease = gates.acquire("blocking-interaction");
      interactionChain = interactionChain
        .then(() => handler({ request, game, dialog }))
        .catch((error: unknown) => {
          console.error("Gameplay interaction failed", error);
        })
        .finally(() => lease.release());
    })
  : () => {};
```

Adventure 可以根据场景建立 resolver：

```ts
const resolveInteraction = (
  request: ObjectInteractionEvent,
): GameSessionInteractionHandler | undefined => {
  if (
    request.objectType === MapEntityTypeId.LOCK_KEY &&
    request.action === "touch" &&
    request.x === 21 &&
    request.y === 6
  ) {
    return handleBeaverShopKey;
  }

  return undefined;
};
```

这样只有被 resolver 接受的事件才会：

* 进入 interaction chain；
* 暂停 Gameplay；
* 清理持续输入；
* 中止 Replay 录制；
* 执行 Adventure 业务。

### 不建议的局部修复

仅在 `options.interaction` 存在时注册 listener，只能解决整张地图没有 handler 的情况。

它不能解决：

```text
总 handler 存在
    → 当前事件不匹配
    → handler 直接返回
    → gate 已经取得
```

因此实现时必须在取得 gate 之前完成同步匹配。

### 验收条件

* 没有 resolver 的 Session 收到 `object-interaction` 时，不暂停 Gameplay。
* 没有 resolver 的 Session 不清理持续方向输入。
* 没有 resolver 的 Session 不会中止 Replay 录制。
* resolver 返回 `undefined` 时，不取得 gate，也不进入 interaction chain。
* resolver 返回 handler 时，Gameplay 在 handler 执行期间保持暂停。
* 多个已匹配的异步 interaction 按接收顺序串行执行。
* handler 抛出异常时能够释放 gate，后续 interaction 仍能执行。
* Engine 内部字面对话保持现有处理方式，不进入外部 resolver。
* Replay Playback 期间继续抑制外部 interaction 通知。

### 回归测试

至少增加以下测试：

1. 未配置 resolver 时发出 `object-interaction`。
2. resolver 返回 `undefined`。
3. resolver 返回同步 handler。
4. resolver 返回异步 handler。
5. handler 抛出异常后 gate 正确释放。
6. 连续触发两个已匹配 interaction 时保持顺序。
7. 未匹配 interaction 不调用 `abortReplayRecording()`。
8. 已匹配 interaction 按预期中止当前 Replay Recording。
9. `dialogue-request` 仍只由 Engine 内部消费。
10. Replay Playback 不调用 resolver。
