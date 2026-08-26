import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../lib/fs.mjs";

const sourceFile = path.join(root, "tools/custom/LOMA.txt");
const outputDirectory = path.join(root, "custom-maps/loma-pushbox");
const expectedAuthorCounts = new Map([
  ["Aymeric du Peloux", 11],
  ["François Marques", 10],
  ["David Skinner", 30],
  ["Sven Egevad", 10],
  ["Victor Kindermans", 10],
  ["Michael Steins", 10],
  ["Frantisek Pokorny", 10],
  ["Arpad Fekete", 10],
  ["Roger Delaporte", 10],
  ["Jordi Domenech", 6],
  ["Jorge Gloria", 10],
  ["Marti Homs", 10],
]);

export function parseLoma(text) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const levels = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !isBoardLine(lines[index])) index += 1;
    if (index >= lines.length) break;

    const board = [];
    while (index < lines.length && isBoardLine(lines[index])) {
      board.push(lines[index]);
      index += 1;
    }

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
    levels.push({
      id,
      chapter: match[1],
      author,
      comment,
      board,
      level: convertBoard(board, title),
    });
  }

  validateCollection(levels);
  return levels;
}

export function convertBoard(board, title = "LOMA") {
  const rows = board.map((row) => row.replace(/\s+$/g, ""));
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  if (!Number.isInteger(width) || width <= 0 || height <= 0)
    throw new Error(`${title}: 空地图`);

  const grid = rows.map((row) => row.padEnd(width, " ").split(""));
  const exterior = findExteriorSpaces(grid, width, height);
  const terrain = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "background-variant-1"),
  );
  const objects = [];
  let starts = 0;
  let boxes = 0;
  let goals = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const symbol = grid[y][x];
      if (symbol === "+")
        throw new Error(`${title}: LOMA 规则不允许 Sokoban 位于 target 上`);
      if (symbol === "#" || (symbol === " " && exterior.has(key(x, y))))
        continue;
      if (symbol === " ") terrain[y][x] = "ground-c";
      else if (symbol === ".") {
        terrain[y][x] = "custom:push-goal";
        goals += 1;
      } else if (symbol === "@") {
        terrain[y][x] = "start";
        starts += 1;
      } else if (symbol === "$") {
        terrain[y][x] = "ground-c";
        objects.push(pushableRock(x, y));
        boxes += 1;
      } else if (symbol === "*") {
        terrain[y][x] = "custom:push-goal";
        objects.push(pushableRock(x, y));
        boxes += 1;
        goals += 1;
      } else {
        throw new Error(`${title}: 不支持的 XSB 字符 ${JSON.stringify(symbol)}`);
      }
    }
  }

  if (starts !== 1) throw new Error(`${title}: 必须恰好有 1 个起点，实际 ${starts}`);
  if (boxes !== 3) throw new Error(`${title}: 必须恰好有 3 个箱子，实际 ${boxes}`);
  if (goals !== 3) throw new Error(`${title}: 必须恰好有 3 个目标，实际 ${goals}`);

  return {
    width,
    height,
    terrain,
    objects,
    rules: {
      win: {
        type: "fill-all",
        terrainTrait: "push-goal",
        objectTrait: "pushable",
      },
    },
  };
}

export function writeLomaMaps(text) {
  const levels = parseLoma(text);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const entry of levels) {
    const document = {
      schemaVersion: 1,
      name: entry.id,
      author: entry.author,
      description: entry.comment,
      chapter: entry.chapter,
      ...entry.level,
    };
    fs.writeFileSync(
      path.join(outputDirectory, `${entry.id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
    );
  }
  return levels;
}

function validateCollection(levels) {
  if (levels.length !== 137)
    throw new Error(`LOMA 必须包含 137 张地图，实际 ${levels.length}`);
  const ids = new Set();
  const chapters = new Set();
  const authorCounts = new Map();
  for (const level of levels) {
    if (ids.has(level.id)) throw new Error(`LOMA map ID 重复：${level.id}`);
    ids.add(level.id);
    chapters.add(level.chapter);
    authorCounts.set(level.author, (authorCounts.get(level.author) ?? 0) + 1);
  }
  const expectedChapters = Array.from({ length: 10 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );
  if (JSON.stringify([...chapters].sort()) !== JSON.stringify(expectedChapters))
    throw new Error(`LOMA pattern 分组错误：${[...chapters].sort().join(", ")}`);
  for (const [author, expected] of expectedAuthorCounts) {
    const actual = authorCounts.get(author) ?? 0;
    if (actual !== expected)
      throw new Error(`LOMA 作者 ${author} 应有 ${expected} 张，实际 ${actual}`);
  }
  if (authorCounts.size !== expectedAuthorCounts.size)
    throw new Error(`LOMA 出现未知作者：${[...authorCounts.keys()].join(", ")}`);
}

function findExteriorSpaces(grid, width, height) {
  const exterior = new Set();
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (grid[y][x] !== " ") return;
    const coordinate = key(x, y);
    if (exterior.has(coordinate)) return;
    exterior.add(coordinate);
    queue.push([x, y]);
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  for (let index = 0; index < queue.length; index += 1) {
    const [x, y] = queue[index];
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
  return exterior;
}

function pushableRock(x, y) {
  return { type: "crumbly-rock", x, y, traits: ["pushable"] };
}

function isBoardLine(line) {
  return /^[ #.$@*+]+$/.test(line) && /[#.$@*+]/.test(line);
}

function key(x, y) {
  return `${x},${y}`;
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const levels = writeLomaMaps(fs.readFileSync(sourceFile, "utf8"));
  console.log(`构建 LOMA Pushbox：${levels.length} 张地图 / 10 个 Pattern。`);
}
