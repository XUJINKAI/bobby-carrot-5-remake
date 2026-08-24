# 产品设计

## 定位

Bobby Carrot 5 Remake 是第五代的现代浏览器重制与原版研究工程。

同一套 semantic LevelMap / Engine 服务两种官方地图体验：

- **Adventure**：尽量恢复原作 Campaign、存档、经济、章节选择和手机竖屏信息限制；
- **Explore**：现代化自由浏览，全部正式关开放、可筛选、可调试、可自由缩放。

自定义地图、分享地图与 Editor Play Test 只使用 Engine，不自动进入 Adventure Campaign。

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

Adventure 的目标不是复刻 Java ME 按键，而是恢复原版设计依赖的信息边界与流程：

- 首页优先营造原作怀旧感；
- 桌面也使用 portrait game viewport；
- 限制最小缩放，避免一次看完整张原版谜题地图；
- 先选章节，再选该章关卡；
- 章节以四章为一组：`1/5/9/.../37` 这些组首章初始开放；组首章通关后开放同组其余三章；
- 章节之间的进度彼此独立，章内仍按原顺序线性解锁；
- Adventure 不提供 Undo，避免外部 Campaign runtime 与 Engine world snapshot 产生不一致；
- 独立 Adventure Save；
- Bonus Coin / Golden Carrot / 永久道具跨关保存；
- 已领取全局奖励按地图位置记忆，不能无限刷；
- 原版 Bonus 60 秒由 Adventure 管理，并在成功打开金锁后开始，而不是进入地图立即开始。

## Explore

Explore 是现在的现代平铺选关体验：

- 40 章 / 480 个正式关全部开放；
- 章节平铺、一目了然；
- 难度、萝卜、特殊道具、场景、机关筛选；
- 随机一关、最近浏览；
- 自由缩放和 DEBUG；
- 可以直接在 Editor 中打开官方地图 clone。

Explore 的完成记录不影响 Adventure Save。

## 内容身份

原版 10 个 JAR 共 530 条 source record，去重后：

```text
480 个正式 Campaign map
5 个共享 Special Scene
= 485 个唯一 DAT map
```

玩家正式关卡 ID：

```text
1-1
1-2
1-3
1-bonus-1
...
40-10
```

Base / UP、DAT package、record index 只属于 archive provenance。内部 canonical identity 也不作为 URL。

## 难度

这里有两种不同难度数据：

1. **章节难度**：原版章节选择界面的 1～3 星，直接读取 DAT chapter metadata `packType`；
2. **关卡筛选难度**：历史 A～F 数据及其余正式关的估算值。

历史 A～F 不是章节星级：

- 288 个正式关能直接获得历史单关难度标签；
- 192 个正式关没有历史 A～F 标签；
- 对这 192 关，构建工具用已标注关卡特征做估算；
- 估算结果在 UI 中必须带 `≈`，不能伪装成原版事实。

## 现代化原则

现代化的是操作和可访问性，不是把原版设计的信息限制全部删除：

- 键盘、触摸、Swipe / Pinch；
- JSON 存档导入导出；
- Engine Debug / Tile Inspector；
- 可替换 AudioBackend；
- Explore 自由视野；
- Adventure 保留 portrait puzzle viewport。

## 明确不做

- 在网页里运行 Java ME 模拟器；
- 模拟数字键/软键 UI；
- 把 480 个正式关变成一个无章节语义的巨大列表；
- 在 Adventure 中允许通过横屏/全图缩放破坏原版谜题信息；
- 把原游戏重画成另一套视觉风格。
