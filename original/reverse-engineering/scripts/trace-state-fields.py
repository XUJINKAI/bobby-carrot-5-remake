#!/usr/bin/env python3
"""生成 UP09 混淆字段的引用上下文报告。

输入 JAR / 反编译基准只读；输出只写入 original/reverse-engineering/notes。
"""

import os
from pathlib import Path as _ScriptPath

os.chdir(_ScriptPath(__file__).resolve().parents[3])

from pathlib import Path
import re

src = Path('original/reverse-engineering/decompiled/up09/a.java')
lines = src.read_text(encoding='utf-8').splitlines()
out = Path('original/reverse-engineering/notes/state-traces')
out.mkdir(parents=True, exist_ok=True)

symbols = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'an', 'bU', 'bV', 'bW',
    'bn', 'bh', 'bi', 'bj', 'bk', 'bl', 'bm', 'bo',
    'cV', 'cW', 'cX', 'cY', 'cZ',
    'aN', 'aO', 'aT', 'bc', 'bd', 'be', 'bf', 'bg',
    'de', 'df', 'dg', 'dO', 'dP', 'dQ', 'eB', 'eg',
    'ac', 'ad', 'ae', 'bA', 'bB', 'bw', 'bx', 'by', 'bz',
    'cf', 'cg', 'ch'
]

for symbol in symbols:
    pattern = re.compile(rf'\bthis\.{re.escape(symbol)}\b')
    chunks = []
    for i, line in enumerate(lines):
        if not pattern.search(line):
            continue
        start = max(0, i - 4)
        end = min(len(lines), i + 5)
        chunks.append((i + 1, lines[start:end]))

    with (out / f'{symbol}.md').open('w', encoding='utf-8') as f:
        f.write(f'# `a.{symbol}` 引用上下文\n\n')
        f.write('机械摘录自 `decompiled/up09/a.java`，仅用于逆向定位，不代表语义命名。\n\n')
        for line_no, chunk in chunks:
            f.write(f'## L{line_no}\n\n```java\n')
            f.write('\n'.join(chunk))
            f.write('\n```\n\n')

