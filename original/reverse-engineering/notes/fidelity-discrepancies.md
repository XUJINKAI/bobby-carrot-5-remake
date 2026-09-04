# 原版语义与当前实现差异

本文件只记录已经由原版 `a.class` 控制流与当前仓库实现交叉确认出的差异候选。这里先保存证据，不在逆向阶段直接修改 Engine / DAT Adapter。

## Gameplay step 时基不能直接按当前 World 16Hz 等同

### 原版运行时事实

UP9 `a.run()` 的外层循环把整轮 wall-clock 节拍控制在约 `62ms`，但每个外层循环会调用 **两次** `a.b()`：

```text
advanceRuntimeState()
repaint / serviceRepaints（按需）
advanceRuntimeState()
sleep until outer cycle ~= 62ms
```

当 `x==1` 时，每次 `a.b()` 都会推进 gameplay 的 `H()/P()/S()/V()/...`，所以稳定状态下一个原版 gameplay step 平均约为：

```text
62ms / 2 ~= 31ms
~= 32.26 gameplay steps / second
```

这也是为什么 class 中：

- 普通 Bobby：48px / 3px = 16 step ≈ 496ms / 格；
- Speed：48px / 6px = 8 step ≈ 248ms / 格；
- Bean：16 step ≈ 496ms / 生长格；
- Plank / Ice melt / Dragon prep：6 step ≈ 186ms / 阶段。

### 当前仓库状态

`engine/src/time/EngineTiming.ts` 当前：

```ts
export const DEFAULT_WORLD_HZ = 16;
```

而且 Engine 的设计说明明确允许 gameplay duration 用 ms 表达，因此 **16Hz 本身不一定必须修改**。

真正的问题是：不能再把“1 个原版 gameplay step”直接翻译成“1 个 Engine World tick”。如果某机制把原版 `6 / 16 / 32 / 64 step` 常量直接照搬为 World tick 数，在 16Hz 下时长会整体变成原版约两倍。

### 当前结论

后续 Engine fidelity 修复有两条可行路线：

1. World 仍保持 16Hz，但所有原版 step 常量先按约 `31ms/step` 转为 ms / RuntimeAction elapsed time；
2. 或将需要原版逐 step 顺序的 subsystem 设计为更高频固定步进。

优先推荐第一种，因为当前 Engine 已经把 World cadence 与以 ms 表达的时长解耦。

但需要特别注意：midpoint interaction、moving-entity pixel collision、camera focus countdown 等不仅有“总时长”，还有**逐 step 执行顺序**；这些不能只通过把最终 duration 调成相同毫秒数来近似。

## Speed 衰减状态机与原版实现不一致

### 原版运行时事实

`a.M()` 与 `a.N()` 直接确认：

- 进入 `0xB5..0xB8` Speed tile 后，按 tile 方向设置 Bobby 朝向，并把 `aN=3`；
- `aN > 0` 时，每次 movement step 都沿当前方向自动前进；
- `a.N()` 在整个 `aN > 0` 期间固定使用 `6px/gameplay step`，48px 一格恒为 8 step；
- 离开 Speed 后，如果对应的同向 held flag 仍为 true，则每跨一格把 `aN` 重新续为 3；
- 没有同向 held input 时，每跨一格 `aN` 减 1，因此离板后连续快速移动 3 格后结束；
- 撞停时立即 `aN=0`，并触发 8-step camera shake；
- 原版没有 `full -> normal -> slow` 的速度衰减阶段。

原版续速判断只读取当前运动方向对应的 held flag；并没有记录“本格是否曾经按过异方向”来取消同向续速。

### 当前仓库状态

`engine/src/entities/original/speed.ts` 当前实现：

- 定义 `full / normal / slow` 三个 phase；
- cadence 分别约为普通移动的 `0.5x / 1x / 1.2x`；
- 离板后未满足 sustain 条件时依次经历 normal、slow 后结束；
- full 格中如果同时观察到同方向和异方向输入，会判定为不能继续 full。

### 当前结论

这部分已经不是“需要继续真机微调”的节奏差异，而是原版 class 控制流与当前 BC5R 状态机结构不同。

进入 Engine 修复阶段时应优先把 Speed 改为：

```text
speed tile -> continuation=3
while continuation > 0
    每格恒定 fast cadence
    same-direction held -> continuation=3
    otherwise -> continuation--
collision -> continuation=0
```

并删除依赖 `normal/slow` phase 的 gameplay 语义；视觉表现若需要额外效果，应留在 Presentation 层。

## Ice 状态机、cadence 与 Bobby 帧和当前实现不一致

### 原版运行时事实

`a.M()` / `a.J()` / `a.O()` 直接确认：

- Ice raw terrain 为 `0x94`；
- Bobby 跨过 Ice midpoint 时 `bn=true` 且 `av=1`；
- 每个新的 movement cycle 开始时先清 `bn=false`；
- 如果**当前格**仍是 Ice，`M()` 先按 Bobby 当前方向尝试自动前进一步；
- 前方能走时，本次 move 不读取新的方向选择，继续直线滑行并再次置 `bn=true`；
- 前方走不通时才结束自动滑行并回到普通输入分支；
- Ice 自身没有独立 `350ms` cadence：未开 Speed Shoes 时仍是普通 `3px/gameplay step`，48px 一格约 16 gameplay step；开 Speed Shoes 后才是 `6px/gameplay step`；
- `bn=true` 时 `O()` 强制 `av=1`，renderer 直接使用 `av*48` 取帧，因此固定的是方向人物图中的 zero-based frame 1，即 sprite sheet 第 2 格；
- class 中没有“离开 Ice 时专门播放 sprite 第 8 格”的状态分支。

### 当前仓库状态

`engine/src/entities/original/ice.ts` 当前：

- 在 Ice `onEnter` 时启动一个 `createDelayedMoveRuntimeAction`；
- `DEFAULT_ICE_SLIDE_CADENCE_MS = 350`；
- forced move 与原版“下一 movement cycle 先从当前 Ice 格尝试续滑”的生命周期不同；
- cadence 也不是从原版 3px/6px 像素推进导出的值。

`docs/system/original/player.md` 此前还写过“滑冰固定第 7 帧、离开播放第 8 帧”，也与 class 的 `av=1` 直接索引不一致，已在逆向分支修正。

### 当前结论

Ice 和 Speed 一样已经可以从原版 class 直接恢复，不应继续把 `350ms` 作为人工 fidelity 参数。后续 Engine 修复应基于：

```text
current terrain == Ice
    try same direction
    success -> slide this cell
    blocked -> ordinary input
```

同时让实际 move cadence 继承 Bobby 当前 speed-shoes/fast-motion 状态。

## Tide 四方向 DAT 映射与原版运行时相反

### 原版运行时事实

`a.P()` 的 Leaf routing 与 moving-entity grid-pass helper 共同确认：

| raw | 原版流向 | 证据 |
|---:|---|---|
| `0x57` | Down | Leaf 到达后强制 `direction=3`；逆向 Up 进入被拒绝。 |
| `0x58` | Up | Leaf 到达后强制 `direction=2`；逆向 Down 进入被拒绝。 |
| `0x59` | Right | Leaf 到达后强制 `direction=1`；逆向 Left 进入被拒绝。 |
| `0x5A` | Left | Leaf 到达后强制 `direction=0`；逆向 Right 进入被拒绝。 |

该映射也与 `docs/system/original/mechanics.md` 的 atlas 坐标一致。

### 当前仓库状态

`tools/original/dat/mapping.mjs` 当前定义为：

- `0x57 -> TIDE_UP`
- `0x58 -> TIDE_DOWN`
- `0x59 -> TIDE_LEFT`
- `0x5A -> TIDE_RIGHT`

四个方向全部与原版 runtime 相反。

### 当前结论

这是已经能够由 bytecode 行为直接判定的 DAT semantic mapping 差异。进入修复阶段时应同步检查：

- `tools/original/dat/mapping.mjs`
- `EntityTypeId` / Tide state 的方向转换
- Editor palette / visual resolver
- Engine Tide 行为测试

避免只改 Adapter 后让 Engine 内部方向再次翻转一次。

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
