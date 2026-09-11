# 游戏运行时

Engine 负责恢复原版地图内规则，并提供现代浏览器所需的运行时呈现与通用输入能力。核心约束是：给 Engine 一个纯 semantic `LevelMap` 和少量运行配置，就应当能够独立把这张地图完整地玩起来。

已经实现的基础能力：

- 通过纯 semantic `LevelMap` 加载官方关卡或自定义地图；
- 从 Bobby Entity 初始化玩家；Start 是可与 Bobby 同格放置的普通 Surface；
- 四方向原版 Bobby 动画与格间插值；
- 原版 `ts.png` 静态图集与 `ta.png` 动态图集；
- Camera、Zoom 与可配置 `InputController`；
- 基础碰撞、方向性地板和多种状态机关；
- 胡萝卜/巢穴目标、出口完成判定；
- 割草机、汽油、高草、雪铲、冰面、加速；
- 颜色开关、陷阱、旋转地板、魔法镜、木板；
- 魔豆分段生长与藤蔓攀爬；
- 荷叶漂流与停靠语义；
- 风筝、龙火、风车、动态云等已恢复逻辑；
- 完整 World Snapshot Undo、Redo、Restart；
- 通用 `onWorldEvent()` 世界事件流；
- 地图实例参数驱动的 Timed Challenge；
- 死亡/通关状态与 Web Result 层；
- Bobby 载入时约 310ms 倒放、通关时约 279ms 正放的 `b6.png` 过渡；
- 胡萝卜收集后进入持久的 `consumed-carrot` runtime state，并使用 `ts-13-10` 表现；
- semantic Entity Definition 调试检查；原版 hex provenance 只由 Original tooling 查询。

地图内限时挑战由 Lock 的类型专属字段描述：

```text
deathCountdownSeconds = 60
```

成功打开带该属性的 Lock 后，Engine 启动倒计时；取得 Golden Carrot、完成关卡或死亡时结束倒计时，超时由 Engine 触发死亡。Undo 恢复计时快照，Restart 和重新加载关卡重置计时状态。

Adventure Bonus 只负责把原版 Campaign 事实增强为普通 `LevelMap` 属性；自定义 JSON 和 Editor Play Test 使用相同 Engine 规则，不存在另一份 Bonus gameplay 实现。

Result 的下一关、重新开始与返回等产品动作仍由 Web 持有。GamePage 的通关结果显示自然用时、步数、本关 Bonus Coin 收集数和 Adventure 全局 Bonus Coin；失败结果保持简洁。终局音乐继续由 Web 作为当前唯一选曲者切换为 `cleared` 或 `death`。

Adventure Gameplay HUD 在左上角显示 `MM:SS`。普通关卡从公开
`GameplayState.elapsedMs` 正向显示本关用时；配置了 `deathCountdownSeconds` 的
Lock 时，从开局显示冻结的完整时长，开锁后在同一位置开始递减。宿主可通过
`runtime.hud.elapsedTime` 与 `runtime.hud.timedChallenge` 分别控制两类投影，
并通过 `GameplayState.timedChallengePhase` 区分等待开锁与正在计时。

关卡进入过渡会暂停 WorldClock 并丢弃期间产生的 gameplay 移动输入。本关正向计时、
地图内倒计时和 Replay tick 都从 Bobby 完成出现后开始推进。

## HUD 与计时边界

目标、背包、地图内收集物和 Timed Challenge 的状态与基础 HUD 渲染属于 Engine。它们在所有 Engine session 中保持相同语义和呈现，包括 Welcome Demo、Adventure、Explore、Custom Play 和 Editor Play Test。

所有已获得道具统一显示在 GameStage 右上角。道具从右向左排列，并在窄屏上向下换行；Adventure、Explore、Custom Play 和 Editor Play Test 使用同一布局。

本次游玩用时、模式完成记录等统计信息由 Web 记录，并作为产品 Overlay 展示。统计 Timer 不参与移动、死亡、完成或 Undo Snapshot。HUD 和 Result 的页面布局见 [`ui.md`](ui.md)。

地图完成与死亡是 Engine 事实；下一关、返回章节、打开 Editor 等动作由启动该 session 的产品入口决定。

尚未经过全部正式关卡逐关人工验证的复杂行为必须继续标明 `confirmed / inferred`；“与原版一致”的结论以原版验证结果为依据。
