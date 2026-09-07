# 游戏运行时

Engine 负责恢复原版地图内规则，并提供现代浏览器所需的运行时呈现与通用输入能力。核心约束是：给 Engine 一个纯 semantic `LevelMap` 和少量运行配置，就应当能够独立把这张地图完整地玩起来。

已经实现的基础能力：

- 通过纯 semantic `LevelMap` 加载官方关卡或自定义地图；
- 根据 `Terrain.START` 初始化 Bobby；原版 DAT `0x95` 映射属于 `@bobby/dat`；
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
- semantic Tile/Object Definition 调试检查；需要原版 hex provenance 时由 Web/Editor Debug 层查询 `@bobby/dat`。

地图内限时挑战由 Lock 的类型专属字段描述：

```text
deathCountdownSeconds = 60
```

成功打开带该属性的 Lock 后，Engine 启动倒计时；取得 Golden Carrot、完成关卡或死亡时结束倒计时，超时由 Engine 触发死亡。Undo 恢复计时快照，Restart 和重新加载关卡重置计时状态。

Adventure Bonus 只负责把原版 Campaign 事实增强为普通 `LevelMap` 属性；自定义 JSON 和 Editor Play Test 使用相同 Engine 规则，不存在另一份 Bonus gameplay 实现。

Result 的重玩、下一关、返回章节等产品动作仍由 Web 持有。

## HUD 与计时边界

目标、背包、地图内收集物和 Timed Challenge 的状态与基础 HUD 渲染属于 Engine。它们在所有 Engine session 中保持相同语义和呈现，包括 Welcome Demo、Adventure、Explore、Custom Play 和 Editor Play Test。

所有已获得道具统一显示在 GameStage 右上角。道具从右向左排列，并在窄屏上向下换行；Adventure、Explore、Custom Play 和 Editor Play Test 使用同一布局。

本次游玩用时、模式完成记录等统计信息由 Web 记录，并作为产品 Overlay 展示。统计 Timer 不参与移动、死亡、完成或 Undo Snapshot。HUD 和 Result 的页面布局见 [`ui.md`](ui.md)。

地图完成与死亡是 Engine 事实；下一关、返回章节、打开 Editor 等动作由启动该 session 的产品入口决定。

尚未经过全部正式关卡逐关人工验证的复杂行为必须继续标明 `confirmed / inferred`；“与原版一致”的结论以原版验证结果为依据。
