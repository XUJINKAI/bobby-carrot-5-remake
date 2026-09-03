# 原版 Runtime 逆向工作区

本目录用于从 `original/official-hd/` 中只读的官方 JAR 建立可审查、可追溯的原版运行逻辑研究基准。

## 目录

- `decompiled/up09/`：CFR 0.152 对 `up09.jar` 的直接反编译结果。保留混淆名称，作为后续语义整理的只读基准。
- `semantic/`：逐步整理、重命名和拆解后的语义化研究代码。该层必须能够追溯到 `decompiled/` 中的原始类、字段和方法。
- `notes/`：逆向索引、命名映射、证据和未确认项。

## 原则

1. `original/official-hd/` 永远只读。
2. `decompiled/` 只保存机械反编译结果，不手工美化或改名。
3. `semantic/` 才进行语义命名、职责拆分和控制流整理。
4. 每个语义结论记录原始 class / method / field 依据，并区分“已由字节码确认”“由运行实测确认”“推断”。
5. 本目录来自原版第三方程序的逆向研究产物，不属于项目自身 `LICENSE` 的原创授权范围；权利边界见根目录 `THIRD_PARTY_ASSETS.md`。
