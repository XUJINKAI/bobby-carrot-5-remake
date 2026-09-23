# 官方发行包、代码与资产谱系

本文记录 `original/official/` 普通版与 `original/official-hd/` 高清版 JAR 的可复现逆向事实，并区分逻辑、数据与视觉证据的推荐来源。高清发行序列的完整 entry/hash matrix 由：

```bash
node tools/cli.mjs original research
```

生成到 `tmp/release-research/release-matrix.json`。工具逐 entry 计算 SHA-256，并在本机存在 JDK 时对 `a.class`、`Bobby.class` 运行 `javap -c -p -s`。普通版与高清版的跨版本对照结论记录在本文，涉及具体事实时必须同时注明目录、release 和 entry。

> 原版逆向结果是证据，不是 Bobby Carrot 5 Remake runtime 必须逐字复刻的数据源。
>
> 地图、机关、资产、对话等内容是否进入 runtime，由各自产品/架构规则决定。逆向材料负责回答“原版是什么”，不自动成为运行时真值。

## 1. UP9 普通版与高清版

### 包结构与资源

两份 UP9 JAR 的基本身份如下：

| 项目 | 普通版 `original/official/up09.jar` | 高清版 `original/official-hd/up09.jar` |
| --- | --- | --- |
| 文件大小 | 287064 bytes | 453375 bytes |
| SHA-256 | `4ee71cec6a9fc2935fc912705214cbce9c97b4717fb6d768a034276da8bd19c4` | `5bff15a399780e541dcad1f858d9a9b303ee82e36c4d34fadbd6948cb3fa5d56` |
| ZIP entry 数 | 53 | 54 |
| Manifest | 与高清版逐字节一致 | 与普通版逐字节一致 |

两份包的内容对照结果：

- `00.dat`～`04.dat` 五个关卡 DAT 全部逐字节一致；地图与 archive metadata 不因清晰度版本改变。
- 14 个 MIDI 全部逐字节一致。
- 六个语言 DAT 均保持 123 条字符串和相同文件长度；只有索引 52 的 Credits 版本文字不同，普通版写 `V1.3.5`，高清版写 `V1.2.3`。
- 25 个 PNG 中，`alarm.png`、`icon.png`、`logo.png`、`numbers.png` 逐字节一致，其余 21 个不同。
- 高清图集通常将源像素放大为 1.5 倍，例如 `ts.png` 从 512×512 变为 768×768、`ta.png` 从 128×480 变为 192×720；部分 UI 与动画常量采用单独调整，不能统一按 1.5 倍推导。
- 高清版多出 `supplied by D@nilYcH.ini`，它是分发来源标记，不属于游戏逻辑或资产合同。

因此，DAT 与 MIDI 可以在 hash 相等的前提下任选一份作为读取来源；像素尺寸、裁切、HUD、动画和图集坐标必须以高清版为表现证据，并用普通版检查缩放关系。

### Class 对照

| Entry | 普通版 | 高清版 |
| --- | --- | --- |
| `a.class` | 86034 bytes；classfile 45.3；292 fields / 154 methods；SHA-256 `be422fff31a0ab9d557beed2a94157e6eded52a8f1e1ae55043d3a824cbdf2d6` | 66101 bytes；classfile 50.0；291 fields / 154 methods；SHA-256 `205ec33cf7c59b2438f36f9c12f7bddfc3ec8d6a46820e56ba4be7a54dd0d38b` |
| `Bobby.class` | 811 bytes；classfile 45.3；3 fields / 4 methods；SHA-256 `961846a46d81ef3d7023cde8588ff60bbbd061f93f2345e6f3f856f3f8332529` | 783 bytes；classfile 50.0；3 fields / 4 methods；SHA-256 `9b3ce737c0b4354c5efabfeb026fb1e4074bcbd353ab7365ce81ff64efce1c13` |

`Bobby.class` 的四个方法在消除常量池索引和方法排列影响后具有相同 bytecode 语义。`a.class` 的方法数量和字符串字面量集合相同，当前差异审计得到以下结论：

- 普通版通过 `java/lang/Class.getResourceAsStream` 读取四类资源；高清版对应调用改为 `javax/microedition/util/ContextHolder.getResourceAsStream`。后者是 J2ME Loader 使用的资源加载兼容入口，不是机关规则。
- 普通版多一个只赋值、不读取的混淆字段 `ap`；相关初始化 helper 在高清版少一个参数，没有发现运行行为依赖。
- 构造阶段的显示常量由普通版的 `16, 32, 32, 16, 16, 8, 8, 5, 5, 4, 4, 4` 变为高清版的 `20, 48, 48, 24, 24, 12, 12, 6, 6, 5, 5, 4`。差异对应源 Tile、Sprite、HUD 与绘制尺度，不构成统一倍率合同。
- 对差异数值常量的使用点扫描集中在绘制、动画和 presentation 方法；当前没有发现碰撞、机关、存档或 Campaign 规则差异。这一结论表示“尚未发现”，不能替代具体机制的方法级控制流核对和模拟器实测。

### 构建来源判断

普通版 UP9 的 class 与资源 ZIP 时间为 2009 年；高清版 PNG 时间为 2008 年，而两个 class 的时间为 2019 年。结合 classfile 50.0、`ContextHolder` 资源入口和额外分发标记，可以确认资料包中的高清 JAR 包含后期兼容转换与重新打包痕迹。

这个来源差异决定了证据用途：普通版更接近原始 CLDC/MIDP 程序的控制流与资源加载方式；高清版仍是项目采用的 48px 视觉和模拟器兼容运行的重要证据，但不能单独代表未经转换的原始 Java 实现。

## 2. 高清发行包矩阵结论

10 个 JAR 的联合内容共有 54 个文件 entry：

| 类别 | entry 数 | 十包完全同 hash | 存在版本差异 |
| --- | ---: | ---: | ---: |
| `.class` | 2 | 0 | 2 |
| PNG | 25 | 24 | 1 |
| MIDI | 14 | 14 | 0 |
| 关卡 DAT（`00.dat`～`04.dat`） | 5 | 1 | 4 |
| 语言 DAT（`DE/EN/FR/IT/PG/SP.dat`） | 6 | 0 | 6 |
| Manifest | 1 | 0 | 1 |
| 其它 | 1 | 1 | 0 |

关键事实：

- `00.dat` 十包字节完全一致。
- `01.dat`～`04.dat` 每个发行包都有独立内容，对应各自四章关卡。
- 六个语言 DAT 都有两个内容家族：Base 一套，UP1～UP9 共享另一套。
- Manifest 十包均不同，属于发行包元数据差异，不能用来推断 gameplay revision。

## 3. Java Engine 谱系

### `a.class`

高清版 `a.class` 在 Base、UP1～UP9 的 SHA-256 全部不同，因此至少存在 **10 个不同二进制构建**。

反汇编结构进一步说明这些差异并不等价于“十套完全不同的引擎”：

- Base：约 150 个方法、21139 条 bytecode instruction。
- UP1：约 153 个方法、21317 条 instruction。相比 Base 新增 3 个方法，并出现完整 RMS 重置确认流程，属于真实逻辑扩展。
- UP2：仍约 153 个方法，但增至约 23759 条 instruction；这是 Base→UP9 中最明显的代码家族边界。
- UP3～UP9：字段数和方法数保持稳定，instruction 总量只在约 23780～23812 间小幅波动；属于同一大代码家族内的逐发行包修订。

因此工程上应区分两个概念：

1. **binary build**：Base、UP1～UP9 共 10 个不同 `a.class` 二进制构建；
2. **semantic revision family**：Base、UP1、UP2+ 三个明显阶段，其中 UP2 是最大的结构变化点，UP2 之后仍有小规模逐包差异。

UP1～UP9 的 presentation 字符串分别带有 `EXTRA-LEVELPACK 1`～`EXTRA-LEVELPACK 9`，这是发行包身份/presentation 差异，不应误判为九套 gameplay 规则。

### `Bobby.class`

`Bobby.class` 只有两个 SHA-256 家族：

```text
Base + UP1
UP2 + UP3 + ... + UP9
```

但 `javap` 显示两组都只有相同的 MIDlet 壳层方法，`startApp`、`pauseApp`、`destroyApp` 的可见控制流一致。当前证据支持：这是 **classfile 编码/常量池布局变化**，没有发现独立 gameplay 逻辑变化。

所以 `Bobby.class` 的二进制 hash 分界可以作为发行构建谱系证据，但不能单独作为 Engine gameplay revision 的依据。

普通版 Base～UP9 始终使用 classfile 45.3，`a.class` 大小约 85～86 KB；高清版 Base、UP1 仍为 classfile 45.3，UP2～UP9 切换为 classfile 50.0 和约 66 KB 的兼容构建。这个分界与高清序列内部的 UP2+ 代码家族边界重合，但 classfile 或文件大小变化本身不能证明 gameplay 规则变化。

## 4. 逆向推荐基准

逆向采用按证据类别分工的双基准：

| 要回答的问题 | 第一基准 | 交叉检查 |
| --- | --- | --- |
| 碰撞、机关、移动时序、Campaign、RMS 存档 | `original/official/up09.jar` 普通版 | 高清版同方法、DAT 最小地图与模拟器实测 |
| 资源读取和原始 Java ME API 调用 | 普通版 | 高清版兼容入口 |
| 48px 图集、Sprite 裁切、HUD、绘制、动画尺度 | `original/official-hd/up09.jar` 高清版 | 普通版尺寸与帧关系 |
| 关卡 DAT、archive metadata、MIDI | 任一经 hash 校验相等的版本 | 另一版本逐 entry hash |
| Credits 和其它文字 | 对应版本的语言 DAT | 同索引跨版本比较 |

具体工作顺序：

1. 新的 gameplay 结论先定位普通版 UP9 的 `a.class` 控制流。
2. 在高清版同方法检查控制流和常量差异，区分兼容转换、presentation 调整与 gameplay 差异。
3. 属于显示效果的问题以高清版资源和绘制路径定值，并保留普通版比例作为交叉检查。
4. 仍有歧义时用同一最小 DAT 地图运行两版；若观察不一致，分别记录结果和 JAR hash，不把其中一版概括成“原版统一行为”。
5. 需要追查规则引入时间时，先沿普通版 UP9 → UP2 → UP1 → Base 检查，再用高清发行序列验证转换边界。

`original/reverse-engineering/decompiled/up09/` 和现有 `bytecode/up09/` 是从高清版生成的机械研究基准，已有结论仍按其明确证据成立。新的通用 gameplay 结论需补普通版方法级核对；presentation 结论继续以高清版为主。

## 5. PNG provenance

25 个 PNG 中只有 `title.png` 存在差异：

```text
Base / Forever
  size   13275
  sha256 642f2e019fa79c8d7b3b78f645a87d59bf93845a2dfb63f713f9993b9816d5fc

UP1 ～ UP9
  size   15847
  sha256 436904062f8c34f06349f662c3cceea4333995d85bb78694804dcc119884bd3f
```

其余 24 个 PNG 在十个 JAR 中逐字节一致。

Bobby Carrot 5 Remake 的 `title.png` 明确采用 **Forever/Base** 版本。由于其余 PNG 本来就是同一份字节，构建可以从 Base 读取共享 PNG；这只是已验证等价资产的具体 provenance，不代表 Base 是所有运行时内容的“主发行包”。

## 6. MIDI provenance

14 个 MIDI：

```text
alarm.mid
bonus.mid
cleared.mid
death.mid
fly.mid
ingame0.mid
ingame1.mid
ingame2.mid
mow.mid
sandman.mid
shop.mid
title.mid
train.mid
universe.mid
```

在十个 JAR 中全部逐字节一致。

运行时从 Base 读取这些 MIDI，是基于十包 hash 等价性选择一个稳定来源，而不是采用“最新包覆盖一切”的规则。

## 7. Runtime 资产来源规则

官方运行时资产的来源现在按语义类别声明：

```text
artwork
  default: Base
  title.png: Base（明确选择 Forever 标题图）

music
  default: Base
```

如果以后发现某个资产具有真正 release-specific 语义，应给该文件增加明确 override；不能把整个运行时资产来源重新绑定到某一个发行包。

BC5R 自制资产放在：

```text
assets/
```

该目录与：

```text
original/official/     普通版代码、数据与资源证据
original/official-hd/  高清视觉与兼容构建证据
tmp/assets/bc5/extracted/    官方 JAR 解包生成物
tmp/assets/bc5/decoded/      DAT 忠实解码数据
tmp/assets/bc5/adapted/      Engine-native 适配数据
```

保持来源边界。未来 Portal 等 Bobby Carrot 5 Remake 自制美术直接作为 Git 托管资源进入 `assets/`，不得伪装成官方 JAR 派生资产。

## 8. 如何复核

完整研究命令：

```bash
node tools/cli.mjs original research --output tmp/release-research
```

主要输出：

```text
tmp/release-research/release-matrix.json
tmp/release-research/javap/R*/a.txt
tmp/release-research/javap/R*/Bobby.txt
```

`release-matrix.json` 是逐 entry 的完整 SHA-256 matrix；`javap/` 是各二进制 revision 的可比较反汇编证据。研究输出属于临时生成物，不提交 Git；结论与长期规则以本文为单一可信源。
