import { convertXsbBoard, isXsbBoardLine } from "../pushbox/xsb.mjs";

const author = "François Marques";

export function parseNovoban(text) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  if (!text.includes(`Copyright: ${author}`)) throw new Error(`NOVOBAN.txt 缺少 Copyright: ${author}`);
  const levels = [];
  let index = 0;
  while (index < lines.length) {
    while (index < lines.length && !isXsbBoardLine(lines[index])) index += 1;
    if (index >= lines.length) break;
    const boardStart = index;
    const board = [];
    while (index < lines.length && isXsbBoardLine(lines[index])) board.push(lines[index++]);
    const title = titleBeforeBoard(lines, boardStart);
    const id = String(levels.length + 1).padStart(2, "0");
    levels.push({
      id,
      title,
      author,
      board,
      level: convertXsbBoard(board, `Novoban ${id} · ${title}`, {
        mapKey: `novoban-pushbox/${id}`,
      }),
    });
  }
  validateCollection(levels);
  return levels;
}

function titleBeforeBoard(lines, boardStart) {
  for (let index = boardStart - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();
    if (!line) continue;
    const match = /^;\s*(.+?)\s*$/.exec(line);
    if (!match) throw new Error(`Novoban 地图前缺少标题注释：${line}`);
    const title = match[1].trim();
    if (!title || title === "Novoban" || title.includes("Copyright:")) throw new Error(`Novoban 地图标题无效：${title || "<missing>"}`);
    return title;
  }
  throw new Error("Novoban 第一张地图缺少标题注释");
}

function validateCollection(levels) {
  if (levels.length !== 50) throw new Error(`Novoban 必须包含 50 张地图，实际 ${levels.length}`);
  if (levels[0]?.title !== "Be ban 10" || levels.at(-1)?.title !== "For ban 5") throw new Error("Novoban 地图顺序与源文件不一致");
  if (new Set(levels.map((level) => level.title)).size !== levels.length) throw new Error("Novoban 出现重复地图标题");
}
