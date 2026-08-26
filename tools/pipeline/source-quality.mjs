import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { root } from "../lib/fs.mjs";

const SOURCE_ROOTS = [
  "model",
  "dat",
  "engine",
  "adventure",
  "editor",
  "web",
  "tools",
];
const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".js",
  ".mjs",
  ".css",
  ".html",
  ".vue",
]);
const SCRIPT_EXTENSIONS = new Set([".ts", ".js", ".mjs"]);
const MAX_SOURCE_LINES = 1000;
const REVIEW_SOURCE_LINES = 800;

const errors = [];
const warnings = [];

for (const sourceRoot of SOURCE_ROOTS) {
  walk(path.join(root, sourceRoot), (file) => {
    if (!SOURCE_EXTENSIONS.has(path.extname(file))) return;

    const text = fs.readFileSync(file, "utf8");
    const lineCount = countLines(text);
    const relative = path.relative(root, file);

    if (lineCount > MAX_SOURCE_LINES) {
      errors.push(
        `${relative}: ${lineCount} 行，超过 ${MAX_SOURCE_LINES} 行硬限制`,
      );
    } else if (lineCount >= REVIEW_SOURCE_LINES) {
      warnings.push(`${relative}: ${lineCount} 行，建议检查是否需要按职责拆分`);
    }

    if (SCRIPT_EXTENSIONS.has(path.extname(file))) {
      checkCompactCode(file, text, relative);
    }
  });
}

for (const warning of warnings) {
  console.warn(`source-quality: warning: ${warning}`);
}

if (errors.length > 0) {
  throw new Error(`源码质量检查失败：\n- ${errors.join("\n- ")}`);
}

console.log("source-quality: OK — 源文件行数与代码排版检查通过。");

function countLines(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function checkCompactCode(file, text, relative) {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS,
  );

  visit(sourceFile);

  function visit(node) {
    if (ts.isBlock(node)) {
      checkBlock(node);
    }

    ts.forEachChild(node, visit);
  }

  function checkBlock(block) {
    const startLine = lineOf(block.getStart(sourceFile));
    const endLine = lineOf(block.getEnd());

    if (block.statements.length > 0 && startLine === endLine) {
      errors.push(`${relative}:${startLine}: 非空代码块不得压缩在同一行`);
      return;
    }

    for (let index = 1; index < block.statements.length; index += 1) {
      const previous = block.statements[index - 1];
      const current = block.statements[index];
      const previousEndLine = lineOf(previous.getEnd());
      const currentStartLine = lineOf(current.getStart(sourceFile));

      if (previousEndLine === currentStartLine) {
        errors.push(
          `${relative}:${currentStartLine}: 同一代码块中的多个语句不得共用一行`,
        );
      }
    }
  }

  function lineOf(position) {
    return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
  }
}

function walk(directory, visitor) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "dist" ||
      entry.name === "dist-src" ||
      entry.name === "dist-vite" ||
      entry.name === "node_modules"
    )
      continue;

    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
