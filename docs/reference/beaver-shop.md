# Beaver Shop 原版行为

本文记录 Bobby Carrot 5 原版 Beaver Shop 的商品、价格、对话和持久效果。
事实来源为 Base / UP9 `a.class`、`00.dat`、`EN.dat` 与 RMS 读写路径；这些第三方
内容的权利边界见根目录 `THIRD_PARTY_ASSETS.md`。

## 商店地图

Beaver Shop 是共享 `00.dat` 的第 1 条地图记录，尺寸为 25×20。地图共有 8 个商品格，
对应 7 类商品；`EXTRA MUSIC` 有两个商品格。

| Cell `(x, y)` | Terrain | 商品 |
| --- | --- | --- |
| `(19, 4)` | `0x9A` | `STEREO SYSTEM` |
| `(21, 4)` | `0x9B` | `EXTRA MUSIC` 第一份 |
| `(19, 6)` | `0x9B` | `EXTRA MUSIC` 第二份 |
| `(21, 6)` | `0x99` | `SUPER KEY` |
| `(6, 9)` | `0x9C` | `SPEED SHOES` |
| `(9, 9)` | `0x9D` | `COIN RADAR` |
| `(6, 11)` | `0x97` | `TICKET: DREAM MACHINE` |
| `(9, 11)` | `0x98` | `TICKET: CLOUD 9` |

成功购买后，当前商品格变为 `0x9E`，对应持久槽 `D[index]` 增加 1，并立即写入
`BC5Data`。重新加载商店时，原版根据 `D[0..6]` 恢复未购买商品；目标数量依次是
`1, 1, 1, 1, 2, 1, 1`。

## 商品与效果

价格数组按 `0x97..0x9D` 顺序固定为：

```text
5, 10, 30, 20, 10, 25, 10
```

买齐 8 个商品格共需 120 枚 Bonus Coin。

| 持久槽 | 商品 | 单价 | `EN.dat` 介绍 | 已确认的运行效果 |
| --- | --- | ---: | --- | --- |
| `D[0]` | `TICKET: DREAM MACHINE` | 5 | 可以反复乘 Night Train 前往 Dream Machine，原文称那里有新的冒险 | Night Train 菜单永久增加 `DREAM MACHINE`。UP9 中触碰机器后进入“不支持关卡下载”提示，没有可下载关卡 |
| `D[1]` | `TICKET: CLOUD 9` | 10 | 可以反复乘 Night Train 前往 Cloud 9，并在那里取得 Magic Code | Night Train 菜单永久增加 `CLOUD 9`；可消耗 Golden Carrot 生成并保存 Magic Code |
| `D[2]` | `SUPER KEY` | 30 | 可以打开游戏中的所有 Lock，在 Bonus Round 也有效 | 永久满足 Lock 通行条件；Timed Bonus 不需要购买一次性钥匙，打开带计时参数的 Lock 后仍正常启动倒计时 |
| `D[3]` | `STEREO SYSTEM` | 20 | 主菜单增加 Sound Test，可以随时听游戏音乐 | 主菜单永久增加 `SOUND TEST`，提供 10 个固定曲目入口 |
| `D[4]` | `EXTRA MUSIC` | 10 | 为普通游戏增加音乐 | 可购买两次，依次解锁 `ingame1.mid` 和 `ingame2.mid`；每次购买后选择新曲目。菜单可在 `AUTO` 与当前已解锁曲目间循环 |
| `D[5]` | `SPEED SHOES` | 25 | Bobby 穿上后跑得更快 | 解锁持久 `ON/OFF` 开关。开启后普通移动由 3 px/step、16 step/格变为 6 px/step、8 step/格 |
| `D[6]` | `COIN RADAR` | 10 | 藏在 Tall Grass 下的 Bonus Coin 会短暂闪现 | 解锁持久 `ON/OFF` 开关。开启后每个 gameplay step 随机抽取当前相机视口内一个位置；命中 Tall Grass 下的 Bonus Coin 时，在该位置闪烁 32 step |

Sound Test 实际列出 `ingame0..2`、`mow`、`sandman`、`shop`、`universe`、
`fly`、`bonus`、`cleared` 共 10 首。`title`、`train`、`death`、`alarm` 不在菜单中。

Cloud 9 每次生成 Magic Code 最多消耗 100 根 Golden Carrot，生成结果进入最近 5 条
历史。Dream Machine 在 UP9 中最终显示 `EN.dat a[111]`，说明当前版本不支持 level
download，并建议查询 extra level pack。

## 购买流程

1. Bobby 到达 `0x97..0x9D` 商品格的 movement midpoint。
2. 原版使用 `a[82 + index]` 作为商品名、`a[91 + index]` 作为介绍。
3. 余额足够时追加 `a[99]`：`WOULD YOU LIKE TO BUY THIS ITEM?`，提供
   `YES / NO`。
4. 余额不足时追加 `a[98]`：`UNFORTUNATELY YOU CANNOT AFFORD THIS ITEM RIGHT NOW.`，
   只提供 `OK`。
5. 确认后从全局 Bonus Coin `I` 扣款，商品格变为 `0x9E`，更新 `D[index]` 并保存。

## Beaver 对话

触碰 Beaver Body 时，商店欢迎语由 `a[100] + I + a[101]` 拼接：

```text
WELCOME!

TO BUY AN ITEM ALL YOU HAVE TO DO IS TOUCH IT. YOU CURRENTLY HAVE <I> BONUS COINS.
```

`I` 是当前全局 Bonus Coin 数量。商品介绍由商品格触发，不由 Beaver Body 触发。

Timed Bonus 中的 Beaver 使用另一组分支：

- 已持有 `SUPER KEY`：说明永久钥匙可用，让 Bobby 去取得 Golden Carrot；
- 没有永久钥匙且至少有 3 枚 Bonus Coin：询问是否花 3 枚购买一次性钥匙；
- 不足 3 枚：允许通过 `PLEASE!` 免费取得一次性钥匙；
- 已持有一次性钥匙或计时已经开始：催促 Bobby 去取得 Golden Carrot。

一次性钥匙只存在于当前关卡运行状态；`SUPER KEY`、商品购买次数、Speed Shoes / Coin
Radar 开关和当前普通关音乐选择都写入 RMS。

## 证据位置

- `original/reverse-engineering/decompiled/up09/a.java`
  - `bu`：7 类商品价格；
  - `J()`：商品格与名称、介绍、购买提示的拼接；
  - `a(boolean)`：扣款、商品格替换、`D[index]` 更新和保存；
  - `ae()`：各商品的原始目标数量，包含两份 `EXTRA MUSIC`；
  - `F()`、`M()`、`N()`：Coin Radar 与 Speed Shoes 的运行效果。
- `original/reverse-engineering/notes/up09-language-catalog.md`：`EN.dat a[82..119]`
  的原文与直接使用点。
- `original/reverse-engineering/semantic/ShopUpgrades.java`、`NightTrain.java`、
  `SoundTest.java`、`CoinRadar.java`、`PersistentSaveFormat.java`：按领域整理的语义重建。

Base 至 UP9 的 `EN.dat a[82..119]` 内容一致；Base、UP1、UP9 可读反编译中的价格数组
也一致。
