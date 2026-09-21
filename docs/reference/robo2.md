# Robo 2 格式与机关事实

本文记录 HeroCraft 2004 年 J2ME 游戏 **Robo 2: Saving Eny** 的关卡格式与机关事实，供自定义地图转换和 Engine 实现使用。Robo 2 的 JAR、关卡与美术不属于本项目许可证的授权范围。

## 研究输入

当前研究输入由用户放在 `tmp/`，不作为仓库输入提交：

```text
Robo 2 (2004)(HeroCraft)(v1.0)(a1).jar
SHA-256 089499b7d5bbd3438ec970ac4ec42ff9e71b92a79824881bb2583b608b042be3
MIDlet-Version 1.0
MIDlet-Vendor HeroCraft
```

JAR 包含 `data/0`～`data/24` 共 25 张内置地图。JAR 帮助文字提到 30 个迷宫和可下载关卡集，但这两个信息不能改变当前包实际包含 25 条记录的事实。

## 关卡记录

每条 `data/<index>` 使用以下结构：

```text
u8 width
u8 height
u8 theme
u4 cells[width * height]
```

格子按行优先排列；每字节先存高半字节，再存低半字节。奇数格地图最后一个低半字节是 `0` padding。记录长度严格为 `3 + ceil(width * height / 2)`。

`theme` 取值为 `0..3`，分别选择 JAR 中四套 `level1`～`level4` 地貌。它属于来源格式的视觉主题，转换到 `LevelMap` 时应映射为语义 Surface，不进入 Engine gameplay 字段。

| code | 来源含义 | 当前语义计划 |
| --- | --- | --- |
| `0x0` | 可通行地面 | Surface |
| `0x1` | 墙 | 阻挡 Surface |
| `0x2` | 终点 | `exit` |
| `0x3` | Stone | `pushable-stone` |
| `0x4` | Bomb | `laser-bomb` |
| `0x5` | `mirrorL` | `laser-mirror` variant |
| `0x6` | `mirrorR` | `laser-mirror` variant |
| `0x7` | `laserDown` | `laser-emitter` / `down` |
| `0x8` | `laserUp` | `laser-emitter` / `up` |
| `0x9` | `laserLeft` | `laser-emitter` / `left` |
| `0xA` | `laserRight` | `laser-emitter` / `right` |
| `0xB` | Robo 起点 | `bobby` |

映射依据是 `b.class` 构造器与静态素材初始化。实现位于 `tools/custom/robo2/format.mjs`；Robo 2 byte 与语义 Entity 的转换只能位于该来源工具边界。

## 已确认 gameplay

下列事实来自 JAR 帮助文字与 v1.0 a1 字节码：

- Robo 进入激光路径会死亡；墙、Stone 与终点阻断激光。
- Stone、Bomb、Mirror 与 Laser Cannon 都能沿玩家移动方向推动一格，后方必须是空地。
- 四向炮产生持续直线激光；对象移动或爆炸后重新计算光路。
- 两种 Mirror 都从双面反射，按各自对角线把四种入射方向转成九十度方向。
- 激光命中 Laser Cannon 时摧毁目标炮；若目标炮正对来源炮，来源炮同时摧毁。
- 激光命中 Bomb 会引爆它。
- Bomb 摧毁中心及上、下、左、右相邻格中的 Stone、Mirror、Laser Cannon 与 Bomb；对角格不受影响。
- Bomb 可以连锁引爆；爆炸清除对象后重新计算光路。
- 墙和终点不被 Bomb 摧毁。

对应字节码位置：

- `a.a(int): boolean`：玩家移动与四类可推动对象；
- `c.try(): void`、`c.a(int,int,int,int): void`：光路生成、镜面反射和炮台命中；
- `c.int(): void`、`b.if(int,int): void`：Bomb 十字范围、连锁与对象摧毁。

## 待校准表现

首轮 Engine 实现只以确认过的网格事实决定解法。以下表现参数仍需模拟器实测：

- 推动、炮台摧毁和 Bomb 引爆的墙钟时长；
- 爆炸帧与 gameplay mutation 的精确对应时点；
- 原版光束的闪烁和颜色节奏；
- 四套主题的视觉对应关系。

这些项目不得根据 Sprite 帧数反推 gameplay 时间。
