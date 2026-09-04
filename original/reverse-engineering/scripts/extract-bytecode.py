#!/usr/bin/env python3
"""生成 UP09 javap 基准与关键方法切片。"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import zipfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
REVERSE_DIR = REPO_ROOT / "original" / "reverse-engineering"
OFFICIAL_DIR = REPO_ROOT / "original" / "official-hd"

TARGET_METHODS = {
    "load-level-e-int-int": "private final void e(int, int);",
    "gameplay-H": "private final boolean H();",
    "player-movement-M": "private final boolean M();",
    "pixel-motion-N": "private final void N();",
    "player-collision-a-int-int-boolean": "private final boolean a(int, int, boolean);",
    "moving-entity-grid-pass-a-int-int-int-byte": "private final boolean a(int, int, int, byte);",
    "moving-entity-pixel-collision-a-int-int-int-int": "private final boolean a(int, int, int, int);",
    "moving-entities-P": "private final void P();",
    "arrival-J": "private final void J();",
    "fireball-Q": "private final void Q();",
    "ice-melting-R": "private final void R();",
    "bean-growth-S": "private final void S();",
    "snow-T": "private final void T();",
    "butterfly-U": "private final void U();",
    "ambient-V": "private final void V();",
    "menu-action-ak": "private final boolean ak();",
    "runtime-b": "public final boolean b();",
    "main-loop-run": "public void run();",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="从官方 JAR 生成 javap 研究基准。")
    parser.add_argument("--label", default="up09", help="输入 JAR 标签，默认 up09。")
    return parser.parse_args()


def javap(class_dir: Path, class_name: str) -> str:
    return subprocess.check_output(
        ["javap", "-classpath", str(class_dir), "-c", "-p", "-s", class_name],
        cwd=REPO_ROOT,
        text=True,
    )


def split_method(text: str, signature: str) -> str:
    lines = text.splitlines()
    try:
        start = next(i for i, line in enumerate(lines) if line.strip() == signature)
    except StopIteration as error:
        raise SystemExit(f"javap 中找不到方法：{signature}") from error

    method_starts = [
        i
        for i, line in enumerate(lines)
        if line.startswith("  ")
        and not line.startswith("    ")
        and line.rstrip().endswith(";")
    ]
    end = next((i for i in method_starts if i > start), len(lines))
    return "\n".join(lines[start:end]).rstrip() + "\n"


def main() -> None:
    args = parse_args()
    if any(ch not in "abcdefghijklmnopqrstuvwxyz0123456789_-" for ch in args.label):
        raise SystemExit(f"非法 JAR 标签：{args.label!r}")

    jar = OFFICIAL_DIR / f"{args.label}.jar"
    if not jar.is_file():
        raise SystemExit(f"官方 JAR 不存在：{jar}")

    work = REPO_ROOT / "tmp" / "original-reverse" / "javap" / args.label
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)

    with zipfile.ZipFile(jar) as archive:
        for name in ("Bobby.class", "a.class"):
            (work / name).write_bytes(archive.read(name))

    output = REVERSE_DIR / "bytecode" / args.label
    methods = output / "methods"
    methods.mkdir(parents=True, exist_ok=True)

    bobby_text = javap(work, "Bobby")
    runtime_text = javap(work, "a")
    (output / "Bobby.javap.txt").write_text(bobby_text, encoding="utf-8")
    (output / "a.javap.txt").write_text(runtime_text, encoding="utf-8")

    if args.label == "up09":
        for filename, signature in TARGET_METHODS.items():
            (methods / f"{filename}.javap.txt").write_text(
                split_method(runtime_text, signature),
                encoding="utf-8",
            )

    print(output.relative_to(REPO_ROOT))


if __name__ == "__main__":
    main()
