import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../lib/fs.mjs";
import { convertXsbBoard, isXsbBoardLine } from "./sokoban-xsb.mjs";

const sourceFile = path.join(root, "tools/custom/LOMA.txt");
const outputDirectory = path.join(root, "custom-maps/loma-pushbox");
const expectedAuthorCounts = new Map([
  ["Aymeric du Peloux", 11], ["François Marques", 10], ["David Skinner", 30],
  ["Sven Egevad", 10], ["Victor Kindermans", 10], ["Michael Steins", 10],
  ["Frantisek Pokorny", 10], ["Arpad Fekete", 10], ["Roger Delaporte", 10],
  ["Jordi Domenech", 6], ["Jorge Gloria", 10], ["Marti Homs", 10],
]);

export function parseLoma(text) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const levels = [];
  let index = 0;
  while (index < lines.length) {
    while (index < lines.length && !isXsbBoardLine(lines[index])) index += 1;
    if (index >= lines.length) break;
    const board = [];
    while (index < lines.length && isXsbBoardLine(lines[index])) board.push(lines[index++]);
    let author = "";
    let title = "";
    let comment = "";
    while (index < lines.length && lines[index].trim()) {
      const line = lines[index];
      const authorMatch = /^Author\s*:\s*(.+?)\s*$/.exec(line);
      const titleMatch = /^Title\s*:\s*(.+?)\s*$/.exec(line);
      const commentMatch = /^Comment\s*:\s*(.+?)\s*$/.exec(line);
      if (authorMatch) author = authorMatch[1];
      else if (titleMatch) title = titleMatch[1];
      else if (commentMatch) comment = commentMatch[1];
      else throw new Error(`LOMA metadata 无法识别：${line}`);
      index += 1;
    }
    const match = /^LOMA(\d{2})-(\d{2})$/.exec(title);
    if (!match) throw new Error(`LOMA title 无效：${title || "<missing>"}`);
    if (!author) throw new Error(`${title}: 缺少 Author`);
    const id = `${match[1]}-${match[2]}`;
    levels.push({ id, chapter: match[1], author, comment, board, level: convertXsbBoard(board, title, { expectedBoxes: 3 }) });
  }
  validateCollection(levels);
  return levels;
}

export function writeLomaMaps(text) {
  const levels = parseLoma(text);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  for (const entry of levels) {
    const directory = path.join(outputDirectory, entry.chapter);
    fs.mkdirSync(directory, { recursive: true });
    const document = {
      schemaVersion: 1,
      meta: { name: entry.id, author: entry.author, ...(entry.comment ? { description: entry.comment } : {}) },
      ...entry.level,
    };
    fs.writeFileSync(path.join(directory, `${entry.id}.json`), `${JSON.stringify(document, null, 2)}\n`);
  }
  return levels;
}

function validateCollection(levels) {
  if (levels.length !== 137) throw new Error(`LOMA 必须包含 137 张地图，实际 ${levels.length}`);
  const ids = new Set();
  const chapters = new Set();
  const authorCounts = new Map();
  for (const level of levels) {
    if (ids.has(level.id)) throw new Error(`LOMA map ID 重复：${level.id}`);
    ids.add(level.id);
    chapters.add(level.chapter);
    authorCounts.set(level.author, (authorCounts.get(level.author) ?? 0) + 1);
  }
  const expectedChapters = Array.from({ length: 10 }, (_, index) => String(index + 1).padStart(2, "0"));
  if (JSON.stringify([...chapters].sort()) !== JSON.stringify(expectedChapters))
    throw new Error(`LOMA pattern 分组错误：${[...chapters].sort().join(", ")}`);
  for (const [author, expected] of expectedAuthorCounts) {
    const actual = authorCounts.get(author) ?? 0;
    if (actual !== expected) throw new Error(`LOMA 作者 ${author} 应有 ${expected} 张，实际 ${actual}`);
  }
  if (authorCounts.size !== expectedAuthorCounts.size) throw new Error(`LOMA 出现未知作者：${[...authorCounts.keys()].join(", ")}`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const levels = writeLomaMaps(fs.readFileSync(sourceFile, "utf8"));
  console.log(`构建 LOMA Pushbox：${levels.length} 张地图 / 10 个 Pattern。`);
}
