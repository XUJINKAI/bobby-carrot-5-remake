# 原版语义与当前实现差异

本文件只记录已经由原版 `a.class` 控制流与当前仓库实现交叉确认出的差异候选。这里先保存证据，不在逆向阶段直接修改 Engine / DAT Adapter。

## Carousel Switch / Tide Switch 状态命名疑似反转

### 原版运行时事实

`a.J()` 的到达格结算中：

- `0xA2` 才会调用 Speed 全局翻转 `c(0)`；
- `0xA4` 才会调用 Carousel 全局旋转 `L()`；
- `0xA6` 才会调用 Tide 全局翻转 `c(1)`；
- 对应的另一状态 `0xA1 / 0xA3 / 0xA5` 不触发这些动作。

因此按 gameplay 语义，可以无歧义地称：

| 机制 | 不触发状态 | 可触发状态 |
|---|---:|---:|
| Speed Switch | `0xA1` | `0xA2` |
| Carousel Switch | `0xA3` | `0xA4` |
| Tide Switch | `0xA5` | `0xA6` |

每次触发后，原版全图转换又会交换这一对状态。

### 当前仓库状态

`tools/original/dat/mapping.mjs`：

- Speed：`A1=pressed`, `A2=raised`；
- Carousel：`A3=raised`, `A4=pressed`；
- Tide：`A5=raised`, `A6=pressed`。

Engine visual resolver 与这份映射一致：

- Speed `pressed=true` 使用 `A1`；
- Carousel `pressed=true` 使用 `A4`；
- Tide `pressed=true` 使用 `A6`。

而 `docs/system/original/mechanics.md` 对 Carousel / Tide 的视觉记录与原版触发语义一致：触发前是 Raised，触发后是 Pressed。

### 当前结论

原版 byte 层面已经确认的是 **triggerable / latched** 区别；`0xA4` 与 `0xA6` 是可触发状态。

在进入 Engine 修复阶段前，应再用原版画面或 `ts.png` 视觉确认 Raised / Pressed 的人类命名。若文档视觉记录成立，则当前 DAT Adapter 与 Engine 的 Carousel/Tide `pressed` 状态均反转。
