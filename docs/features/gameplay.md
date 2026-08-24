# 游戏运行时

Engine 负责恢复原版地图内规则，并提供现代浏览器所需的运行时呈现能力。

已经实现的基础能力：

- 通过纯 semantic `LevelMap` 加载官方关卡或自定义地图；
- 根据 `Terrain.START` 初始化 Bobby；原版 DAT `0x95` 映射属于 `@bobby/dat`；
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
- 通用 `killPlayer(reason)` 外部失败入口；
- 通用 `onWorldEvent()` 世界事件流；
- 死亡/通关事件与 Web 结果层；
- semantic Tile/Object Definition 调试检查；需要原版 hex provenance 时由 Web/Editor Debug 层查询 `@bobby/dat`。

原版 Bonus 倒计时由 `@bobby/adventure` 持有和更新。Engine 在成功开锁时产生通用事件：

```text
object-interaction
objectType = ObjectId.LOCK
action = open
```

`@bobby/adventure` 订阅这条事件流后实现原版 Bonus 的 60 秒规则；收到 `complete/death` 时结束倒计时，超时通过 `killPlayer()` 通知 Engine。Explore、分享地图与 Editor Play Test 使用纯 Engine gameplay 流程。

尚未经过全部正式关卡逐关人工验证的复杂行为必须继续标明 `confirmed / inferred`；“与原版一致”的结论以原版验证结果为依据。
