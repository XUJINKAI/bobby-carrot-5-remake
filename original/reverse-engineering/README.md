# 原版 Runtime 逆向工作区

本目录用于从 `original/official-hd/` 中只读的官方 JAR 建立可审查、可追溯的原版运行逻辑研究基准。

## 目录

- `decompiled/up09/`：CFR 0.152 对稳定代 `up09.jar` 的直接反编译结果。UP02～UP09 的核心 Runtime 已由 structural bytecode fingerprint 确认一致，因此该目录作为 UP02～UP09 的主反编译基准。
- `decompiled/up01/`：UP01 legacy generation 的机械反编译基准。
- `decompiled/base/`：Base 1.0.3 legacy generation 的机械反编译基准。
- `bytecode/`：`javap` 字节码基准与关键方法切片；反编译器无法可靠结构化时回退到这里。
- `semantic/`：逐步整理、重命名和拆解后的语义化研究代码。该层必须能够追溯到 `decompiled/` / `bytecode/` 中的原始类、字段和方法。
- `notes/`：逆向索引、命名映射、版本指纹、证据和未确认项。

## Runtime generation 边界

方法级 structural fingerprint 已确认：UP02～UP09 的主循环、玩家移动、碰撞、midpoint、Cloud/Leaf、Dragon、Ice、Bean 与 Loader 等已追踪核心方法语义结构一致。Base 与 UP01 则分别属于更早的 runtime generation，需要单独审计。

## 原则

1. `original/official-hd/` 永远只读。
2. `decompiled/` 只保存机械反编译结果，不手工美化或改名。
3. `semantic/` 才进行语义命名、职责拆分和控制流整理。
4. 每个语义结论记录原始 class / method / field 依据，并区分“已由字节码确认”“由运行实测确认”“推断”。
5. 本目录来自原版第三方程序的逆向研究产物，不属于项目自身 `LICENSE` 的原创授权范围；权利边界见根目录 `THIRD_PARTY_ASSETS.md`。
