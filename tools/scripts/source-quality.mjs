import fs from 'node:fs';
import path from 'node:path';
import { root } from './util.mjs';

const SOURCE_ROOTS = ['model', 'dat', 'engine', 'adventure', 'editor', 'web', 'tools'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.css', '.html']);
const MAX_SOURCE_LINES = 1000;
const REVIEW_SOURCE_LINES = 800;
const OLD_PRODUCT_NAMES = [
  { pattern: /Bobby Carrot 5 Web/g, label: 'Bobby Carrot 5 Web' },
];

const errors = [];
const warnings = [];

for (const sourceRoot of SOURCE_ROOTS) {
  walk(path.join(root, sourceRoot), (file) => {
    if (!SOURCE_EXTENSIONS.has(path.extname(file))) return;

    const text = fs.readFileSync(file, 'utf8');
    const lineCount = countLines(text);
    const relative = path.relative(root, file);

    if (lineCount > MAX_SOURCE_LINES) {
      errors.push(`${relative}: ${lineCount} 行，超过 ${MAX_SOURCE_LINES} 行硬限制`);
    } else if (lineCount >= REVIEW_SOURCE_LINES) {
      warnings.push(`${relative}: ${lineCount} 行，建议检查是否需要按职责拆分`);
    }
  });
}

for (const file of markdownFiles()) {
  checkProductName(file);
}
checkProductName(path.join(root, 'web/index.html'));

for (const warning of warnings) {
  console.warn(`source-quality: warning: ${warning}`);
}

if (errors.length > 0) {
  throw new Error(`源码质量检查失败：\n- ${errors.join('\n- ')}`);
}

console.log('source-quality: OK — 源文件行数与产品命名检查通过。');

function countLines(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function markdownFiles() {
  const files = [path.join(root, 'README.md'), path.join(root, 'AGENTS.md')];
  walk(path.join(root, 'docs'), (file) => {
    if (path.extname(file) === '.md') files.push(file);
  });
  return files;
}

function checkProductName(file) {
  if (!fs.existsSync(file)) return;

  const text = fs.readFileSync(file, 'utf8');
  for (const { pattern, label } of OLD_PRODUCT_NAMES) {
    if (pattern.test(text)) {
      errors.push(`${path.relative(root, file)}: 仍包含旧产品名“${label}”`);
    }
    pattern.lastIndex = 0;
  }
}

function walk(directory, visitor) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'dist-src' || entry.name === 'node_modules') continue;

    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
