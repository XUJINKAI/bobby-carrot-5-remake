# 关卡浏览与身份

## 三种身份

正式内容明确区分：

1. **archive identity**：Base / UP、DAT 包、source record；用于 provenance 和原版 JAR patch；
2. **campaign/public ID**：玩家可见，连续 1～40 章；
3. **canonical ID**：内部去重 identity，用于内容和工具链定位。

例如：

```text
archive:   up09 / pack 04 / source level 10
public:    40-10
canonical: internal only
```

新 UI、分享链接和自定义关卡 API 使用玩家语义或自定义地图身份；Base/UP 与 canonical ID 保持为内部 provenance。

## 正式 Campaign 编排

每章有 12 个连续流程节点：

```text
1
2
3
bonus-1
4
5
6
bonus-2
7
8
9
10
```

所以第一章玩家 ID 是：

```text
1-1
1-2
1-3
1-bonus-1
1-4
1-5
1-6
1-bonus-2
1-7
1-8
1-9
1-10
```

直到 `40-10`。

## 原版内容数量

10 个 JAR 共 530 条 source record。重复内容去重后：

```text
480 个正式 Campaign map
5 个共享 Special Scene
= 485 个唯一 DAT map
```

5 个 Special Scene 分别是 Beaver Shop、Cloud 9、Dream Machine、Dreamland Reward、Campaign Intro。

## 章节难度

原版章节选择界面的 1～3 星难度直接来自每章 DAT metadata 的 `packType`。这是章节级原始数据。

Explore 的关卡级“简单/中等/困难”等筛选使用单关难度数据，与章节星级分别维护。

## Explore / 自由选关

浏览层级直接按连续章节：

```text
Chapter 1
Chapter 2
...
Chapter 40
```

Explore 模式：
- 全 480 个正式 Campaign map 开放；
- 使用独立的自由浏览进度；
- 支持筛选和随机；
- 完成记录服务自由浏览体验；
- 允许 DEBUG、自由缩放和 Editor 跳转。

## Adventure / 原版冒险

Adventure 使用同一批官方 LevelMap，并增加：
- 章内线性解锁；
- 原版章节选择 UI 语义；
- Adventure Save；
- 全局经济、永久升级、一次性奖励；
- portrait viewport 限制；
- 特殊场景与 Campaign event。

Explore 与 Adventure 分别维护进度。
