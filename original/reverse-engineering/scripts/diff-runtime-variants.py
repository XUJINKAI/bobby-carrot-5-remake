#!/usr/bin/env python3
"""生成 UP02 与 UP09 Loader 的结构差异报告。

输入 JAR / 反编译基准只读；输出只写入 original/reverse-engineering/notes。
"""

import os
from pathlib import Path as _ScriptPath

os.chdir(_ScriptPath(__file__).resolve().parents[3])

from pathlib import Path
import difflib
import re
import subprocess
import zipfile

root = Path('tmp/original-reverse/variant-diff')
jars = {
    'up02': Path('original/official-hd/up02.jar'),
    'up09': Path('original/official-hd/up09.jar'),
}
signature = 'private final void e(int, int);'
LOCAL_OPS = r'(?:[a-z]load|[a-z]store|ret)'
BRANCH_OPS = r'(?:if\S*|goto(?:_w)?|jsr(?:_w)?)'

def split_methods(text):
    lines = text.splitlines()
    starts = []
    for i, line in enumerate(lines):
        if line.startswith('  ') and not line.startswith('    ') and line.rstrip().endswith(';'):
            starts.append(i)
    result = {}
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else len(lines)
        result[lines[start].strip()] = lines[start:end]
    return result

def normalize_structural(lines):
    out = []
    for raw in lines:
        line = re.sub(r'#\d+', '#', raw.rstrip())
        m = re.match(r'^(\s*)(-?\d+|default):\s+-?\d+\s*$', line)
        if m:
            out.append(f'{m.group(1)}{m.group(2)}: <target>')
            continue
        m = re.match(r'^\s*\d+:\s+(.*)$', line)
        if not m:
            out.append(line.strip() if line.strip() else '')
            continue
        instr = m.group(1)
        instr = re.sub(rf'^({LOCAL_OPS})_[0-3]\b', r'\1 <local>', instr)
        instr = re.sub(rf'^({LOCAL_OPS})\s+\d+\b', r'\1 <local>', instr)
        instr = re.sub(r'^iinc\s+\d+,', 'iinc <local>,', instr)
        instr = re.sub(rf'^({BRANCH_OPS})\s+-?\d+\b', r'\1 <target>', instr)
        out.append(instr)
    return out

normalized = {}
for label, jar in jars.items():
    out = root / label
    out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(jar) as z:
        (out / 'a.class').write_bytes(z.read('a.class'))
    javap = subprocess.check_output([
        'javap', '-classpath', str(out), '-c', '-p', '-s', 'a'
    ], text=True)
    methods = split_methods(javap)
    normalized[label] = normalize_structural(methods[signature])

diff = list(difflib.unified_diff(
    normalized['up02'], normalized['up09'],
    fromfile='up02-loader', tofile='up09-loader', lineterm=''
))

report = Path('original/reverse-engineering/notes/release-runtime-variant-diffs.md')
with report.open('w', encoding='utf-8') as f:
    f.write('# 原版 Runtime 真正结构差异\n\n')
    f.write('第一轮 layout diff 已证明 collision / Ice R 的分叉只是 local-variable slot 布局。第二层 structural fingerprint 后，UP02～UP09 只有 Loader 仍分成两组。本报告只保留 Loader 的 structural diff。\n\n')
    f.write('## Loader: UP02-family → UP09-family\n\n')
    if not diff:
        f.write('structural 归一化后无差异。\n')
    else:
        f.write('```diff\n')
        f.write('\n'.join(diff))
        f.write('\n```\n')

