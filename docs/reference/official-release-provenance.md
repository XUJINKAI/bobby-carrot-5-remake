# 官方发行包、代码与资产谱系

本文记录 `original/official-hd/` 中 10 个官方 HD JAR 的可复现逆向事实。完整 entry/hash matrix 由：

```bash
node tools/cli.mjs original research
```

生成到 `tmp/release-research/release-matrix.json`。工具逐 entry 计算 SHA-256，并在本机存在 JDK 时对 `a.class`、`Bobby.class` 运行 `javap -c -p -s`。

> 原版逆向结果是证据，不是 Bobby Carrot 5 Remake runtime 必须逐字复刻的数据源。
>
> 地图、机关、资产、对话等内容是否进入 runtime，由各自产品/架构规则决定。逆向材料负责回答“原版是什么”，不自动成为运行时真值。

## 1. 发行包矩阵结论

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

## 2. Java Engine 谱系

### `a.class`

`a.class` 在 Base、UP1～UP9 的 SHA-256 全部不同，因此至少存在 **10 个不同二进制构建**。

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

## 3. PNG provenance

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

## 4. MIDI provenance

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

## 5. Runtime 资产来源规则

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
original/official-hd/  官方原始证据
original/extracted/    官方 JAR 解包生成物
original/decoded/      DAT 忠实解码数据
original/adapted/      Engine-native 适配数据
```

保持来源边界。未来 Portal 等 Bobby Carrot 5 Remake 自制美术直接作为 Git 托管资源进入 `assets/`，不得伪装成官方 JAR 派生资产。

## 6. 如何复核

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
