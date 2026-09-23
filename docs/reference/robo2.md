# Robo 2 格式与机关事实

本文记录 HeroCraft 2004 年 J2ME 游戏 **Robo 2: Saving Eny** 的关卡格式与机关事实，供自定义地图转换和 Engine 实现使用。Robo 2 的 JAR、关卡与美术不属于本项目许可证的授权范围。

## 研究输入

当前研究与构建输入固定保存在：

```text
tools/custom/robo2/robo2.jar
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

格子按列优先排列，即 `index = x * height + y`；每字节先存高半字节，再存低半字节。奇数格地图最后一个低半字节是 `0` padding。记录长度严格为 `3 + ceil(width * height / 2)`。转换工具在解码边界把它规范化为 `LevelMap` 使用的行优先 Entity 坐标。

`theme` 取值为 `0..3`，分别选择 JAR 中四套 `level1`～`level4` 地貌。它属于来源格式的视觉主题，转换到 `LevelMap` 时应映射为语义 Surface，不进入 Engine gameplay 字段。

| code | 来源含义 | 语义映射 |
| --- | --- | --- |
| `0x0` | 可通行地面 | Surface |
| `0x1` | 墙 | `stump` 阻挡 Surface |
| `0x2` | 终点 | `exit` |
| `0x3` | Stone | `laser-stone` |
| `0x4` | Bomb | `laser-bomb` |
| `0x5` | `mirrorL` | `laser-mirror` / `backslash` |
| `0x6` | `mirrorR` | `laser-mirror` / `slash` |
| `0x7` | `laserDown` | `laser-cannon` / `down` |
| `0x8` | `laserRight` | `laser-cannon` / `right` |
| `0x9` | `laserUp` | `laser-cannon` / `up` |
| `0xA` | `laserLeft` | `laser-cannon` / `left` |
| `0xB` | Robo 起点 | `bobby` |

方向映射以实际 gameplay 字节码为准：`b.<init>(byte,int,int)` 把 `0x7..0xA` 保存为方向索引 `0..3`；`c.try()` 将这四个索引依次转换为 `(0,+1)`、`(+1,0)`、`(0,-1)`、`(-1,0)`，即下、右、上、左。JAR 的静态素材数组顺序也按这个方向索引重排，不能直接按常量池中的文件名出现顺序解释 tile code。

镜面映射由 `b.<init>(byte,int,int)` 与 `c.a(int,int,int,int)` 共同确认。`0x5` 使用 `mirrorL.png` 并保存镜面索引 `0`，把入射向量 `(dx,dy)` 变为 `(dy,dx)`，对应左上/右下的 `backslash`（`\`）；`0x6` 使用 `mirrorR.png` 并保存索引 `1`，把入射向量变为 `(-dy,-dx)`，对应左下/右上的 `slash`（`/`）。两条分支都接受四种入射方向，因此两种镜面都是双面反射。

记录解码位于 `tools/custom/robo2/format.mjs`，语义转换位于 `tools/custom/robo2/convert.mjs`；Robo 2 byte 与语义 Entity 的转换只能位于该来源工具边界。

来源主题按 `0..3` 对应太空、冰雪、遗迹、森林。转换使用兔子波比5重制版的语义 Surface，并将来源 theme `0/1` 合并为同一套雪地视觉：

| theme | 关卡 | 可通行地面 | 阻挡墙面 |
| --- | --- | --- | --- |
| `0` | 19～25 | `snow-cloud / ts-8-16` | `snowy-rock` |
| `1` | 13～18 | `snow-cloud / ts-8-16` | `snowy-rock` |
| `2` | 7～12 | `sand` | `cactus / small / round` 等概率稳定选取 |
| `3` | 1～6 | `grass / ts-10-1` | `stump` |

多形态墙面使用固定 seed、地图 ID、类别和坐标计算确定性结果；同一来源地图每次生成得到相同视觉。四类墙面在对应来源关卡中都保持不可通行。

使用已确认的 JAR 生成 25 张语义地图：

```sh
node tools/custom/robo2/generate.mjs
```

同一 JAR 中的激光机关原图可以独立提取：

```sh
node tools/custom/robo2/extract.mjs
```

提取器发布 Engine 使用的十张机关原图：四张炮台图、两张 8×12 双面镜、12×12 的待机炸弹、10×12 的 Stone，以及 `bombExplode.png` 与 `explosion.png` 两张六帧爆炸序列。双面镜、炸弹与 Stone 以 Robo 2 的 12px 原始格尺寸和左上角锚点缩放；四张 14px 炮台图以 14px 为基准居中缩放到单格范围。爆炸序列按中心和相邻格分别居中绘制。构建结果写入被 Git 忽略的 `assets/art/robo2/`。

生成器校验 JAR SHA-256，输出固定为被 Git 忽略的 `custom-maps/robo2/01.json`～`25.json`。`npm run assets`、`npm test` 与 `npm run verify` 都会先从该 JAR 重建地图，再进入统一的 custom collection 构建流程。输出包含 `LevelMap` 语义、展示 metadata、终点胜利规则与显式的 `music: "robo2/menu"`，不携带 JAR 路径、record 编号或 archive hash。

## 已确认 gameplay

下列事实来自 JAR 帮助文字与 v1.0 a1 字节码：

- Robo 进入激光路径会死亡；转换后的 Stump、Stone 与终点在格子边界阻断激光。
- Stone、Bomb、Mirror 与 Laser Cannon 都能沿玩家移动方向推动一格，后方必须是空地。
- 四向炮产生持续直线激光；对象移动或爆炸后重新计算光路。
- 两种 Mirror 都从双面反射，按各自对角线把四种入射方向转成九十度方向。
- 激光命中 Laser Cannon 时摧毁目标炮；若目标炮正对来源炮，来源炮同时摧毁。
- Bomb 在格子边界阻断激光，同一直线排列时只有最靠近激光炮的一颗会被直接命中。
- 分别被不同光路直接命中的 Bomb 各自开始起爆；后续 Bomb 只能在前一颗爆炸清除光路或触发相邻连锁后开始起爆。
- Bomb 先播放中心起爆过程；该阶段不产生十字范围伤害，随后才结算并播放十字爆炸。
- Bomb 摧毁中心及上、下、左、右相邻格中的 Stone、Mirror 与 Laser Cannon，并击倒范围内的 Bobby；Bobby 所在格仍显示爆炸。对角格不受影响，不可摧毁的障碍会截断对应方向的爆炸。
- 直线串联的相邻 Bomb 逐颗引爆；多条独立起爆链可以同时推进。连锁播放期间 Robo 仍可移动，每次爆炸清除对象后重新计算光路。
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

这些项目不得根据 Sprite 帧数反推 gameplay 时间。
