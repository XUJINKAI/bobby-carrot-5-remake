#!/usr/bin/env python3
"""生成 UP09 CFR 源码方法与字段索引。

输入 JAR / 反编译基准只读；输出只写入 original/reverse-engineering/notes。
"""

import os
from pathlib import Path as _ScriptPath

os.chdir(_ScriptPath(__file__).resolve().parents[3])

from pathlib import Path
import re

src_path = Path('original/reverse-engineering/decompiled/up09/a.java')
out_path = Path('original/reverse-engineering/notes/up09-symbol-index.md')
out_path.parent.mkdir(parents=True, exist_ok=True)
text = src_path.read_text(encoding='utf-8')
lines = text.splitlines()

method_re = re.compile(r'^\s*(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?[^=;]+\([^;]*\)\s*(?:throws\s+[^\{]+)?\{\s*$')
methods = []
for i, line in enumerate(lines, 1):
    if method_re.match(line):
        methods.append((i, line.strip()))

symbols = [
    'cu', 'cv', 'dH', 'dI',
    'bC', 'bD', 'bE', 'bF',
    'ar', 'as', 'ap', 'aq', 'aw', 'ay',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
    'aN', 'aO', 'aT', 'aW', 'aX', 'aY', 'aZ',
    'az', 'bc', 'bh', 'bi', 'bj', 'bk', 'bl', 'bm', 'bn', 'bo',
    'cX', 'cY', 'cZ', 'cC', 'cD', 'cU', 'cV', 'cW',
    'cB', 'cE', 'cF', 'cG', 'cH', 'cI', 'cJ',
    'da', 'db', 'dc', 'dd',
    'cK', 'cL', 'cM', 'cN', 'cO', 'cP', 'cQ', 'cR', 'cS', 'cT',
    'do', 'dh', 'di', 'dj', 'dk',
    'dr', 'dl', 'dm', 'dn',
    'ds', 'dp', 'dq', 'dt', 'du', 'dv',
    'aF', 'aG', 'aH', 'aI', 'aJ', 'aK', 'aL', 'aM', 'aP', 'aQ', 'aR', 'aS', 'aU', 'aV',
]
occurrences = {}
for sym in symbols:
    pat = re.compile(rf'\bthis\.{re.escape(sym)}\b')
    hits = []
    for i, line in enumerate(lines, 1):
        if pat.search(line):
            hits.append((i, line.strip()))
    occurrences[sym] = hits[:120]

with out_path.open('w', encoding='utf-8') as f:
    f.write('# UP9 `a.java` 符号索引\n\n')
    f.write('本文件由机械脚本从 CFR 反编译基准生成，用于给语义化整理提供稳定行号入口。行号对应 `decompiled/up09/a.java`。\n\n')
    f.write('## 方法入口\n\n')
    for line_no, sig in methods:
        f.write(f'- L{line_no}: `{sig}`\n')
    f.write('\n## 重点字段出现位置\n')
    for sym, hits in occurrences.items():
        f.write(f'\n### `{sym}`\n\n')
        for line_no, line in hits:
            escaped = line.replace('`', '\\`')
            f.write(f'- L{line_no}: `{escaped}`\n')
