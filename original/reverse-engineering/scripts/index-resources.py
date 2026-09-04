#!/usr/bin/env python3
"""重建 UP09 语言、音乐与 class hardcoded text 报告。"""

from __future__ import annotations

import ast
import io
import re
import struct
import zipfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
REVERSE_DIR = REPO_ROOT / "original" / "reverse-engineering"
JAR_PATH = REPO_ROOT / "original" / "official-hd" / "up09.jar"
SOURCE_PATH = REVERSE_DIR / "decompiled" / "up09" / "a.java"
NOTES_DIR = REVERSE_DIR / "notes"
LOCALES = ("EN", "DE", "FR", "IT", "SP", "PG")
TICK = chr(96)


def read_u2(stream: io.BytesIO) -> int:
    raw = stream.read(2)
    if len(raw) != 2:
        raise EOFError("读取 unsigned short 时提前结束")
    return int.from_bytes(raw, "big")


def decode_modified_utf8(raw: bytes) -> str:
    """解码 DataInputStream.readUTF 使用的 Java Modified UTF-8。"""
    units: list[int] = []
    index = 0
    while index < len(raw):
        first = raw[index]
        index += 1
        if first & 0x80 == 0:
            units.append(first)
            continue
        if first & 0xE0 == 0xC0:
            if index >= len(raw):
                raise ValueError("截断的 Modified UTF-8 双字节序列")
            second = raw[index]
            index += 1
            if second & 0xC0 != 0x80:
                raise ValueError("非法 Modified UTF-8 continuation byte")
            units.append(((first & 0x1F) << 6) | (second & 0x3F))
            continue
        if first & 0xF0 == 0xE0:
            if index + 1 >= len(raw):
                raise ValueError("截断的 Modified UTF-8 三字节序列")
            second = raw[index]
            third = raw[index + 1]
            index += 2
            if second & 0xC0 != 0x80 or third & 0xC0 != 0x80:
                raise ValueError("非法 Modified UTF-8 continuation byte")
            units.append(
                ((first & 0x0F) << 12)
                | ((second & 0x3F) << 6)
                | (third & 0x3F)
            )
            continue
        raise ValueError(f"非法 Modified UTF-8 lead byte：0x{first:02X}")

    utf16 = b"".join(struct.pack(">H", unit) for unit in units)
    return utf16.decode("utf-16-be", errors="surrogatepass")


def read_java_utf(stream: io.BytesIO) -> str:
    byte_count = read_u2(stream)
    raw = stream.read(byte_count)
    if len(raw) != byte_count:
        raise EOFError("读取 Java UTF 字符串时提前结束")
    return decode_modified_utf8(raw)


def read_language(data: bytes) -> list[str]:
    stream = io.BytesIO(data)
    count = read_u2(stream)
    values = [read_java_utf(stream) for _ in range(count)]
    if stream.read(1):
        raise ValueError("语言资源末尾存在未解析数据")
    return values


def build_source_context(
    lines: list[str],
) -> tuple[dict[int, str], dict[int, list[tuple[int, str, str]]]]:
    method_at_line: dict[int, str] = {}
    current = "<field-initializer>"
    method_decl = re.compile(
        r"^\s*(?:public|private|protected).*?\([^;]*\)\s*\{\s*$"
    )
    for number, line in enumerate(lines, 1):
        if method_decl.match(line):
            current = line.strip().removesuffix("{").strip()
        method_at_line[number] = current

    usage: dict[int, list[tuple[int, str, str]]] = {}
    literal_ref = re.compile(r"\bthis\.a\[(\d+)\]")
    for number, line in enumerate(lines, 1):
        for match in literal_ref.finditer(line):
            index = int(match.group(1))
            usage.setdefault(index, []).append(
                (number, method_at_line[number], line.strip())
            )
    return method_at_line, usage


def escape_inline(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace(TICK, "\\" + TICK)
        .replace("|", "\\|")
        .replace("\t", "\\t")
        .replace("\r", "\\r")
        .replace("\n", "\\n")
    )


def write_language_catalog(
    english: list[str],
    usage: dict[int, list[tuple[int, str, str]]],
) -> None:
    output = NOTES_DIR / "up09-language-catalog.md"
    with output.open("w", encoding="utf-8") as report:
        report.write("# UP9 Language Catalog\n\n")
        report.write(
            "从 EN.dat 机械读取全部字符串，并索引 a.class 反编译代码中的直接 "
            "a[index] 使用位置。这是原版资源研究基准，不属于项目原创授权范围。\n\n"
        )
        report.write(f"字符串总数：**{len(english)}**。\n\n")
        for index, value in enumerate(english):
            report.write(f"## {TICK}a[{index}]{TICK}\n\n")
            report.write(f"原文：{TICK}{escape_inline(value)}{TICK}\n\n")
            hits = usage.get(index, [])
            if not hits:
                report.write(
                    "直接使用：未在 CFR 源码中发现常量下标引用"
                    "（可能经变量索引/数组复制间接使用）。\n\n"
                )
                continue
            report.write("直接使用：\n\n")
            for line_number, method, source in hits:
                report.write(
                    f"- L{line_number} · {TICK}{escape_inline(method)}{TICK}"
                    f" · {TICK}{escape_inline(source)}{TICK}\n"
                )
            report.write("\n")


def write_music_index(
    jar_names: list[str],
    lines: list[str],
    method_at_line: dict[int, str],
) -> None:
    resources = sorted(
        name for name in jar_names if name.lower().endswith((".mid", ".midi"))
    )
    midi_literal = re.compile(r'"([^"]+\.(?:mid|midi))"', re.IGNORECASE)
    usages: list[tuple[str, int, str, str]] = []
    for line_number, line in enumerate(lines, 1):
        for match in midi_literal.finditer(line):
            usages.append(
                (match.group(1), line_number, method_at_line[line_number], line.strip())
            )

    output = NOTES_DIR / "up09-music-index.md"
    with output.open("w", encoding="utf-8") as report:
        report.write("# UP9 Music Resource Index\n\n")
        report.write(
            "机械列出 JAR 中 MIDI 资源，以及 a.java 中所有直接 MIDI 字符串引用。\n\n"
        )
        report.write("## JAR MIDI resources\n\n")
        for resource in resources:
            report.write(f"- {TICK}{escape_inline(resource)}{TICK}\n")
        report.write("\n## Direct runtime usages\n\n")
        for resource, line_number, method, source in usages:
            report.write(
                f"- {TICK}{escape_inline(resource)}{TICK} · L{line_number}"
                f" · {TICK}{escape_inline(method)}{TICK}\n"
            )
            report.write(f"  - {TICK}{escape_inline(source)}{TICK}\n")


def classify_literal(value: str) -> str:
    upper = value.upper()
    if value == "Decompilation failed":
        return "decompiler-synthetic"
    if value.startswith("/") or re.search(r"\.(?:MID|PNG|DAT)$", upper):
        return "resource"
    if value in ("audio/midi", "", "0", "-", "###", "##"):
        return "format/runtime"
    if "DEUTSCH=DE;" in value:
        return "language-menu-table"
    if any(
        token in upper
        for token in ("DO YOU ", "CHEAT!", "FORMAT THE RMS", "ERROR", "HTTP://", "WWW.")
    ):
        return "user-facing/hardcoded"
    if len(value) >= 12 and (" " in value or "?" in value or "!" in value):
        return "possible-user-facing"
    return "other"


def collect_literals(
    lines: list[str],
    method_at_line: dict[int, str],
) -> list[tuple[int, str, str, str]]:
    literal_re = re.compile(r'"(?:\\.|[^"\\])*"')
    found: list[tuple[int, str, str, str]] = []
    for line_number, line in enumerate(lines, 1):
        for match in literal_re.finditer(line):
            raw = match.group(0)
            try:
                value = ast.literal_eval(raw)
            except Exception:
                value = raw[1:-1]
            found.append(
                (
                    line_number,
                    method_at_line[line_number],
                    classify_literal(value),
                    value,
                )
            )
    return found


def write_text_audit(
    locale_values: dict[str, list[str]],
    literals: list[tuple[int, str, str, str]],
) -> None:
    output = NOTES_DIR / "up09-text-audit.md"
    english_count = len(locale_values["EN"])
    with output.open("w", encoding="utf-8") as report:
        report.write("# UP9 Text Audit\n\n")
        report.write(
            "审计 EN/DE/FR/IT/SP/PG.dat 与 a.class 中直接硬编码的字符串，"
            "补足仅查看 EN.dat 会漏掉的文字。\n\n"
        )
        report.write("## Locale resource shape\n\n")
        report.write("| locale | string count | IDs match EN 0..122 |\n")
        report.write("|---|---:|---|\n")
        for locale in LOCALES:
            count = len(locale_values[locale])
            matches = count == english_count == 123
            report.write(f"| {locale} | {count} | {'yes' if matches else 'no'} |\n")

        report.write(
            "\n结论：semantic string ID 以 EN 名称命名，但同一 ID 可直接索引其它五个"
            "原版 locale。完整原文仍留在只读 JAR；本报告不重复提交六份完整翻译正文。\n\n"
        )
        report.write("## User-facing strings hardcoded in class\n\n")
        for line_number, method, category, value in literals:
            if category not in ("user-facing/hardcoded", "possible-user-facing"):
                continue
            report.write(
                f"- L{line_number} · **{category}**"
                f" · {TICK}{escape_inline(method)}{TICK}\n"
            )
            report.write(f"  - {TICK}{escape_inline(value)}{TICK}\n")

        report.write(
            "\nDecompilation failed 被标为 decompiler-synthetic，"
            "是 CFR 伪源码，不属于原版可见文本。\n\n"
        )
        report.write("## All class string literals by category\n\n")
        for line_number, method, category, value in literals:
            report.write(
                f"- L{line_number} · {TICK}{category}{TICK}"
                f" · {TICK}{escape_inline(value)}{TICK}"
                f" · {TICK}{escape_inline(method)}{TICK}\n"
            )


def main() -> None:
    if not JAR_PATH.is_file():
        raise SystemExit(f"官方 JAR 不存在：{JAR_PATH}")
    if not SOURCE_PATH.is_file():
        raise SystemExit(f"CFR 基准不存在：{SOURCE_PATH}")

    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    lines = SOURCE_PATH.read_text(encoding="utf-8").splitlines()
    method_at_line, usage = build_source_context(lines)

    with zipfile.ZipFile(JAR_PATH) as archive:
        locale_values = {
            locale: read_language(archive.read(f"{locale}.dat"))
            for locale in LOCALES
        }
        jar_names = archive.namelist()

    write_language_catalog(locale_values["EN"], usage)
    write_music_index(jar_names, lines, method_at_line)
    write_text_audit(locale_values, collect_literals(lines, method_at_line))

    counts = ", ".join(
        f"{locale}={len(locale_values[locale])}" for locale in LOCALES
    )
    print(f"资源索引完成：{counts}")


if __name__ == "__main__":
    main()
