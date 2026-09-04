# 原版音频使用

UP9 JAR 中共有 14 个 MIDI：

```text
alarm
bonus
cleared
death
fly
ingame0
ingame1
ingame2
mow
sandman
shop
title
train
universe
```

现代项目的 OGG 风格切换属于 BC5R 产品实现；本页只记录原版 UP9 如何选择这些曲目。

## 普通关 soundtrack resolver

普通 release 关没有 `level -> fixed BGM` 表，也不会从 DAT 地图读取音乐字段。原版统一调用 `a.I()`：

1. Bobby 正在驾驶 Mower 时固定返回 `mow.mid`；
2. 普通 release 关读取持久 `H`（Current Music）；
3. `H=0..D[4]` 时固定播放 `ingameH.mid`；
4. `H=-1`（菜单显示 `AUTO`）时，每次 resolver 调用从 `ingame0..D[4]` 等概率随机选择；
5. 新存档 `H=0`，只有 `ingame0.mid`；每购买一次 Extra Music，`D[4]` 增加 1，并把 `H` 切到新曲目。

因此地图、archive 和 record slot 都不决定普通关 BGM。

## Gameplay 与特殊场景覆盖

| 场景 / 事件 | 曲目 | 播放方式 |
|---|---|---|
| 普通 release 关 | `ingame0..2` | 循环；由 Current Music / AUTO 解析 |
| 驾驶 Mower | `mow` | 循环 |
| Timed Bonus，Lock 尚未打开 | `shop` | 循环 |
| Timed Bonus，Lock 打开并启动倒计时 | `bonus` | 循环 |
| Beaver Shop | `shop` | 循环 |
| Cloud 9 | `sandman` | 循环 |
| Dream Machine | `shop` | 循环 |
| Dreamland Reward / Welcome | `sandman` | 循环 |
| Night Train | `train` | 循环 |
| Magic Code | `universe` | 循环 |
| Flight reward | `fly` | 循环 |
| Title | `title` | 循环 |
| 普通 / Golden Carrot 结果 | `cleared` | 单次 |
| 普通死亡 | `death` | 单次 |
| Timed Bonus 超时 | `alarm` | 单次 |

原版只有一个 J2ME MIDI `Player` 管线。循环曲请求同一路径时不重启；切曲会先 stop/deallocate/close 当前 Player。没有发现独立的音效播放管线。

## Sound Test

购买 Beaver Shop 的 Stereo System（`D[3]`）后，主菜单出现 Sound Test。10 个项目与实际曲目按以下顺序固定映射：

| String ID / 菜单名 | MIDI |
|---|---|
| `a[7]` INGAME 1 | `ingame0` |
| `a[8]` INGAME 2 | `ingame1` |
| `a[9]` INGAME 3 | `ingame2` |
| `a[12]` LAWNMOWER | `mow` |
| `a[13]` SANDMAN | `sandman` |
| `a[14]` BEAVER | `shop` |
| `a[15]` UNIVERSE | `universe` |
| `a[16]` GOLDEN CARROT | `fly` |
| `a[10]` BONUS LEVEL | `bonus` |
| `a[11]` LEVEL COMPLETE | `cleared` |

## 音量

持久音量 `bt` 为 1～5 档，新存档默认 3。传给 J2ME `VolumeControl.setLevel()` 的请求值为：

| 档位 | 请求值 |
|---:|---:|
| 1 | 5 |
| 2 | 35 |
| 3 | 65 |
| 4 | 95 |
| 5 | 125 |

`125` 是 class 的请求参数；设备实现可能接受或 clamp，静态字节码无法判断最终输出增益。
