# 产品设计

## 定位

Bobby Carrot 5 Remake 是第五代的现代浏览器重制与原版研究工程。

同一套 semantic LevelMap / Engine 服务两种官方地图体验：

- **Adventure**：尽量恢复原作 Campaign、存档、经济、章节选择和手机竖屏信息限制；
- **Explore**：现代化自由浏览，全部普通关与 Bonus 奖励关开放、可筛选、可调试、可自由缩放。

自定义地图与 Editor Play Test 使用独立的 Engine gameplay 流程；Adventure Campaign 由 `@bobby/adventure` 负责。用户地图的长期交换格式是 JSON，不把原版 DAT 暴露成产品格式。

## 保留

- 原始关卡布局与 semantic Terrain/Object 身份；
- UP9 高清版像素美术和原动画素材；
- 经字节码/原版行为确认的机关规则；
- 原始 MIDI 编曲；
- 原版连续 1～40 章节身份；
- 每章 1～3 星原始难度；
- 章内普通关 / Bonus 实际排列；
- Beaver Shop、Cloud 9、Dream Machine、Dreamland 等特殊内容；
- Base / UP1~UP9 等 archive provenance，供逆向和 JAR patch 使用。

## Adventure

Adventure 恢复原版设计依赖的信息边界与流程，并使用适合现代浏览器的输入与界面：

- 首页优先营造原作怀旧感；
- 桌面也使用 portrait game viewport；
- 设置 Camera 最小缩放，保持原版谜题的信息边界；
- 先选章节，再选该章关卡；
- 章节以四章为一组：`1/5/9/.../37` 这些组首章初始开放；组首章通关后开放同组其余三章；
- 章节之间的进度彼此独立，章内仍按原顺序线性解锁；
- Adventure 的世界状态以单向 Engine session 推进，Campaign runtime 与 Engine world snapshot 保持一致；
- 独立 Adventure Save；
- Bonus Coin / Golden Carrot / 永久道具跨关保存；
- 已领取全局奖励按地图位置记忆，每个稳定奖励位置只领取一次；
- 原版 Bonus 60 秒由 Adventure 写入 Lock 的地图实例参数，并在成功打开金锁后由 Engine 启动；
- Adventure 可以在基础 `LevelMap` 进入 Engine 前增强对象实例参数，倒计时、超时死亡、Undo 和 Restart 等地图内生命周期统一由 Engine 执行。

## Explore

Explore 是现代平铺选关体验：

- 40 章，共 400 个普通关卡 + 80 个 Bonus 奖励关，全部开放；
- 章节平铺、一目了然；
- 难度、萝卜、特殊道具、场景、机关筛选；
- 随机一关、最近浏览；
- 自由缩放和 DEBUG；
- 可以直接在 Editor 中打开官方地图 clone。

Explore 与 Adventure 分别维护自己的完成记录和 Adventure Save。

## Editor 与自定义地图

Editor 编辑的是与 Engine 共用的 semantic `LevelMap`：

- Terrain / Object 都使用稳定语义 ID；
- 多格对象只持久化 anchor；
- 对象实例参数放在 `LevelObject.properties`；
- Inspector 根据 Engine Definition 的 authoring metadata 生成当前需要的属性控件；
- 当前 Sandman 支持可选 `dialogue`；
- JSON Import / Export 是唯一用户地图交换格式。

不提供 DAT 导入导出，也不把 DAT 当作 URL 分享编码。DAT 是原版研究与验证格式，不是面向玩家的地图格式。

## 内容身份

原版 10 个 JAR 共 530 条 source record，去重后：

```text
400 个普通 Campaign 关卡
80 个 Bonus 奖励关
5 个共享商店 / Special Scene
= 485 个唯一 DAT map
```

面向玩家的内容数量统一表述为 400 个普通关卡 + 80 个 Bonus 奖励关，另有商店和特殊场景；480 是 Campaign map 的技术总数。

玩家 Campaign ID：

```text
1-1
1-2
1-3
1-bonus-1
...
40-10
```

Base / UP、DAT package、record index 属于 archive provenance。内部 canonical identity 用于内容去重和工具链定位。

## 难度

这里有两种不同难度数据：

1. **章节难度**：原版章节选择界面的 1～3 星，直接读取 DAT chapter metadata `packType`；
2. **关卡筛选难度**：历史 A～F 数据及其余 Campaign map 的估算值。

关卡筛选难度的数据覆盖：

- 288 个 Campaign map 能直接获得历史单关难度标签；
- 192 个 Campaign map 由构建工具使用已标注关卡特征进行估算；
- 估算结果在 UI 中带 `≈`，明确区分原始数据与推断数据。

## 现代化原则

现代化集中在浏览器外壳、操作和可访问性，同时保留原版谜题设计依赖的信息边界：

- 键盘、触摸、Swipe / Pinch；
- JSON 地图与存档导入导出；
- Engine Debug / Tile Inspector；
- 可替换 AudioBackend；
- Explore 自由视野；
- Adventure 使用 portrait puzzle viewport；
- 游戏世界沿用原版美术与动画素材；
- 正式关卡保持章节与 Bonus 的原作组织语义。

Web UI 使用同一个产品外壳组织 Adventure、Explore、Editor 和 Custom，同一个 GameStage 承载所有可游玩入口。Engine 在 GameStage 中渲染基础 Gameplay HUD 和可配置 Screen Joystick；TopBar 表达产品位置与操作，BottomBar 表达操作提示，Result Overlay 表达地图结束后的产品流程。完整规范见 [`features/ui.md`](features/ui.md)。
