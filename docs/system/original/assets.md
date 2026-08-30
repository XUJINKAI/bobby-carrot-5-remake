# 原版视觉资产与关键帧

## 图集与角色资源

文档统一使用 `asset(row,column)`，从 1 开始。

- `ts.png`：16×16 静态 tile 图集。
- `ta.png`：15×4 动态 tile 图集。
- `b0.png`～`b3.png`：1×8，Bobby 左 / 右 / 上 / 下。
- `b4.png`：1×3，待机。
- `b5.png`：1×8，死亡。
- `b7.png`：2×4，割草机。
- `b8.png`：3×4，雪铲。
- `b9.png`：1×4，风筝。

`b6.png`、`bf.png`、`alarm.png`、`arrows.png` 的具体语义或帧布局尚未在这里固定，后续确认后补充。

## 动态 Tile 规则

环境动画约每 248ms 前进一个 phase。第 0 phase 使用 `ts.png` 静态格，随后才进入 `ta.png` 动画帧。

### Exit

```text
ts(10,7) --> ta(1,1) --> ta(1,2) --> ta(1,3)
```

仅在 Exit 已解锁时循环播放。

### Speed

```text
Up:    ts(12,6) --> ta(1,4) --> ta(2,1) --> ta(2,2)
Down:  ts(12,7) --> ta(2,3) --> ta(2,4) --> ta(3,1)
Left:  ts(12,8) --> ta(3,2) --> ta(3,3) --> ta(3,4)
Right: ts(12,9) --> ta(4,1) --> ta(4,2) --> ta(4,3)
```

### Windmill

```text
Up:    ts(14,1) --> ta(5,3) --> ta(5,4)
Down:  ts(14,2) --> ta(6,1) --> ta(6,2)
Left:  ts(14,3) --> ta(6,3) --> ta(6,4)
Right: ts(14,4) --> ta(7,1) --> ta(7,2)
```

### Tide

```text
Up:    ts(6,8)  --> ta(9,2)  --> ta(9,3)
Down:  ts(6,9)  --> ta(8,4)  --> ta(9,1)
Left:  ts(6,10) --> ta(10,2) --> ta(10,3)
Right: ts(6,11) --> ta(9,4)  --> ta(10,1)
```

### Water

```text
Water: ts(6,7) --> ta(10,4) --> ta(11,1) --> ta(11,2) --> ta(11,3) --> ta(11,4) --> ta(12,1) --> ta(12,2)
Variant 1: ts(6,12) --> ta(12,3) --> ta(12,4)
Variant 2: ts(6,13) --> ta(13,1) --> ta(13,2)
Variant 3: ts(6,14) --> ta(13,3) --> ta(13,4)
```

### Whirlwind / Bonus Coin

```text
Whirlwind: ts(16,5) --> ta(7,3) --> ta(7,4) --> ta(8,1) --> ta(8,2) --> ta(8,3)
Bonus Coin: ts(16,9) --> ta(4,4) --> ta(5,1) --> ta(5,2)
```

Bonus Coin 原版还有随机闪烁门控，不应简单永久循环。

## 关键静态状态

```text
Tide Switch:       Raised ts(11,6),  Pressed ts(11,7)
Speed Switch:      Raised ts(11,3),  Pressed ts(11,2)
Carousel Switch:   Raised ts(11,4),  Pressed ts(11,5)
Trap:              Active ts(11,16), Inactive ts(12,1)
Mirror 1..4:       ts(12,2)..ts(12,5)
Carousel 1..4:     ts(12,10)..ts(12,13)
Carousel Vertical: ts(12,14)
Carousel Horizontal: ts(12,15)
Yellow Switch:     Raised ts(12,16), Pressed ts(13,1)
Pink Switch:       Raised ts(13,2),  Pressed ts(13,3)
Yellow Block:      Raised ts(13,4),  Lowered ts(13,5)
Pink Block:        Raised ts(13,6),  Lowered ts(13,7)
Ice Block stages:  ts(15,4)..ts(15,7)
```

Wind Switch 四个 channel 分别占用 `ts(11,8)..ts(11,15)`，每个 channel 两格，对应 On / Off。
