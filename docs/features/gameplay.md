# 游戏运行时

当前 Engine 以“恢复原版规则、现代化呈现”为原则，不再把关卡当作只能浏览的静态地图。

已经实现的基础能力：

- 通过纯 semantic `LevelMap` 加载官方关卡或自定义地图；
- 根据 `Terrain.START` 初始化 Bobby；原版 DAT `0x95` 映射只属于 `@bobby/dat`；
- 四方向原版 Bobby 动画与格间插值；
- 原版 `ts.png` 静态图集与 `ta.png` 动态图集；
- Camera、Zoom、键盘、Swipe、Pinch；
- 基础碰撞、方向性地板和多种状态机关；
- 胡萝卜/巢穴目标、出口完成判定；
- 割草机、汽油、高草、雪铲、冰面、加速；
- 颜色开关、陷阱、旋转地板、魔法镜、木板；
- 魔豆分段生长与藤蔓攀爬；
- 荷叶漂流与停靠语义；
- 风筝、龙火、风车、动态云等已恢复逻辑；
- 完整 World Snapshot Undo、Restart；
- 死亡/通关事件与 Web 结果层；
- semantic Tile/Object Definition 调试检查；需要原版 hex provenance 时由 Web/Editor Debug 层查询 `@bobby/dat`。

官方 Bonus Round 的倒计时等发行上下文不是 `LevelMap` 字段，由 Web 在创建 session 时显式传入 Engine runtime options。分享地图和 Editor Play Test 不根据地图内容猜测 Bonus 模式。

尚未经过 485 关逐关人工验证的复杂行为必须继续标明 `confirmed / inferred`，不能因为“看起来能玩”就声称与原版完全一致。
