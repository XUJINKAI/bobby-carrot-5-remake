#!/usr/bin/env python3
"""使用 CFR 重建原版 Runtime 的机械反编译基准。"""

from __future__ import annotations

import argparse
import hashlib
import shutil
import subprocess
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
OFFICIAL_DIR = REPO_ROOT / "original" / "official-hd"
REVERSE_DIR = REPO_ROOT / "original" / "reverse-engineering"
DEFAULT_CFR = REPO_ROOT / "tmp" / "original-reverse" / "cfr-0.152.jar"
CFR_URL = "https://www.benf.org/other/cfr/cfr-0.152.jar"
DEFAULT_LABELS = ("up09",)
ALL_BASELINES = ("base", "up01", "up09")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="使用 CFR 0.152 重建只读官方 JAR 的反编译基准。",
    )
    parser.add_argument(
        "labels",
        nargs="*",
        default=list(DEFAULT_LABELS),
        help="要反编译的 JAR 标签，默认只处理 up09。",
    )
    parser.add_argument(
        "--all-baselines",
        action="store_true",
        help="处理 base、up01、up09 三套已维护基准。",
    )
    parser.add_argument(
        "--cfr",
        type=Path,
        default=DEFAULT_CFR,
        help="CFR jar 路径。",
    )
    parser.add_argument(
        "--download-cfr",
        action="store_true",
        help="指定路径不存在时下载固定版本 CFR 0.152。",
    )
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def prepare_cfr(path: Path, allow_download: bool) -> Path:
    path = path.resolve()
    if path.is_file():
        return path
    if not allow_download:
        raise SystemExit(
            f"CFR 不存在：{path}\n"
            "传入 --cfr，或使用 --download-cfr 下载固定版本。"
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(CFR_URL, path)
    return path


def validate_label(label: str) -> None:
    if not label or any(ch not in "abcdefghijklmnopqrstuvwxyz0123456789_-" for ch in label):
        raise SystemExit(f"非法 JAR 标签：{label!r}")


def decompile(label: str, cfr: Path) -> None:
    validate_label(label)
    jar = OFFICIAL_DIR / f"{label}.jar"
    if not jar.is_file():
        raise SystemExit(f"官方 JAR 不存在：{jar}")

    before = sha256(jar)
    output = REVERSE_DIR / "decompiled" / label
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    subprocess.run(
        [
            "java",
            "-jar",
            str(cfr),
            str(jar),
            "--outputdir",
            str(output),
            "--silent",
            "true",
        ],
        cwd=REPO_ROOT,
        check=True,
    )

    after = sha256(jar)
    if after != before:
        raise SystemExit(f"只读输入发生变化：{jar}")

    checksum = REVERSE_DIR / "decompiled" / f"{label}.jar.sha256"
    checksum.write_text(f"{before}  original/official-hd/{label}.jar\n", encoding="utf-8")
    print(f"{label}: {output.relative_to(REPO_ROOT)}")


def main() -> None:
    args = parse_args()
    labels = ALL_BASELINES if args.all_baselines else tuple(args.labels)
    cfr = prepare_cfr(args.cfr, args.download_cfr)
    for label in labels:
        decompile(label, cfr)


if __name__ == "__main__":
    main()
