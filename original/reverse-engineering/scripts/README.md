# UP09 逆向脚本

这些脚本用于重建已经提交的机械反编译、bytecode 与索引报告。它们读取
`original/official-hd/*.jar`，只写入 `original/reverse-engineering/` 和
`tmp/original-reverse/`，不会创建 commit 或 push 分支。

所有命令都从仓库根目录执行：

```sh
python3 original/reverse-engineering/scripts/decompile-runtime.py --download-cfr
python3 original/reverse-engineering/scripts/extract-bytecode.py
python3 original/reverse-engineering/scripts/build-source-index.py
python3 original/reverse-engineering/scripts/trace-state-fields.py
python3 original/reverse-engineering/scripts/index-resources.py
```

版本代际报告只有在需要复核 Base / UP01 / UP02～UP09 差异时运行：

```sh
python3 original/reverse-engineering/scripts/index-legacy-methods.py
python3 original/reverse-engineering/scripts/fingerprint-releases.py
python3 original/reverse-engineering/scripts/diff-runtime-variants.py
```

## 依赖与输出

| 脚本 | 依赖 | 主要输出 |
|---|---|---|
| `decompile-runtime.py` | Python 3、Java、CFR 0.152 | `decompiled/up09/`；可选 Base / UP01 |
| `extract-bytecode.py` | Python 3、JDK `javap` | `bytecode/up09/*.txt` 与关键方法切片 |
| `build-source-index.py` | Python 3、CFR 基准 | `notes/up09-symbol-index.md` |
| `trace-state-fields.py` | Python 3、CFR 基准 | `notes/state-traces/*.md` |
| `index-resources.py` | Python 3、UP09 JAR、CFR 基准 | 完整语言、MIDI、hardcoded text 三份报告 |
| `index-legacy-methods.py` | Python 3、JDK `javap` | `notes/legacy-method-index.md` |
| `fingerprint-releases.py` | Python 3、JDK `javap` | `notes/release-runtime-fingerprints.md` |
| `diff-runtime-variants.py` | Python 3、JDK `javap` | `notes/release-runtime-variant-diffs.md` |

`decompile-runtime.py` 默认只重建 UP09。使用 `--all-baselines` 才会额外处理
Base 与 UP01。CFR 可通过 `--cfr <path>` 显式提供；`--download-cfr` 只把固定的
0.152 版本下载到 `tmp/original-reverse/`。

## 边界

1. 官方 JAR 始终作为只读输入；反编译脚本会比较处理前后的 SHA-256。
2. 脚本只生成机械报告，不修改 `semantic/`。语义命名仍需结合 bytecode、Help 和
   runtime 控制流人工审查。
3. `up09-language-catalog.md` 保存完整英文索引；其余五种语言只校验 123-ID
   同构结构，不重复提交完整翻译正文。
4. 生成结果发生变化时，先审查 diff，再由调用者决定是否提交。
