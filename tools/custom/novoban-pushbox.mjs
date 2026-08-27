import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../lib/fs.mjs";
import { convertXsbBoard, isXsbBoardLine } from "./sokoban-xsb.mjs";

const sourceFile = path.join(root, "tools/custom/NOVOBAN.txt");
const outputDirectory = path.join(root, "custom-maps/novoban-pushbox");
const author = "François Marques";

export function parseNovoban(text) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  if (!text.includes(`Copyright: ${author}`))
    throw new Error(`NOVOBAN.txt 缺少 Copyright: ${author}`);
  const levels = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !isXsbBoardLine(lines[index])) index += 1;
    if (index >= lines.length) break;
    const boardStart = index;
    const board = [];
    while (index < lines.length && isXsbBoardLine(lines[index])) {
      board.push(lines[index]);
      index += 1;
    }
    const title = titleBeforeBoard(lines, boardStart);
    const id = String(levels.length + 1).padStart(2, "0");
    levels.push({
      id,
      title,
      author,
      board,
      level: convertXsbBoard(board, `Novoban ${id} · ${title}`),
    });
  }

  validateCollection(levels);
  return levels;
}

export function writeNovobanMaps(text) {
  const levels = parseNovoban(text);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const entry of levels) {
    const document = {
      schemaVersion: 1,
      name: `${entry.id} · ${entry.title}`,
      author: entry.author,
      description: "",
      ...entry.level,
    };
    fs.writeFileSync(
      path.join(outputDirectory, `${entry.id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
    );
  }
  return levels;
}

function titleBeforeBoard(lines, boardStart) {
  for (let index = boardStart - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();
    if (!line) continue;
    const match = /^;\s*(.+?)\s*$/.exec(line);
    if (!match) throw new Error(`Novoban 地图前缺少标题注释：${line}`);
    const title = match[1].trim();
    if (!title || title === "Novoban" || title.includes("Copyright:"))
      throw new Error(`Novoban 地图标题无效：${title || "<missing>"}`);
    return title;
  }
  throw new Error("Novoban 第一张地图缺少标题注释");
}

function validateCollection(levels) {
  if (levels.length !== 50)
    throw new Error(`Novoban 必须包含 50 张地图，实际 ${levels.length}`);
  if (levels[0]?.title !== "Be ban 10" || levels.at(-1)?.title !== "For ban 5")
    throw new Error("Novoban 地图顺序与源文件不一致");
  const titles = new Set(levels.map((level) => level.title));
  if (titles.size !== levels.length)
    throw new Error("Novoban 出现重复地图标题");
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const levels = writeNovobanMaps(fs.readFileSync(sourceFile, "utf8"));
  console.log(`构建 Novoban Pushbox：${levels.length} 张地图。`);
}
