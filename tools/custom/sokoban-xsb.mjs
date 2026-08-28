export const SOKOBAN_WIN_RULE = {
  type: "fill-all",
  target: "push-goal",
  filler: "pushable",
};

export function convertXsbBoard(board, title = "Sokoban", options = {}) {
  const rows = board.map((row) => row.replace(/\s+$/g, ""));
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  if (!Number.isInteger(width) || width <= 0 || height <= 0)
    throw new Error(`${title}: 空地图`);

  const grid = rows.map((row) => row.padEnd(width, " ").split(""));
  const exterior = findExteriorSpaces(grid, width, height);
  const entities = [];
  let player = null;
  let boxes = 0;
  let goals = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const symbol = grid[y][x];
      if (symbol === "#" || (symbol === " " && exterior.has(key(x, y))))
        continue;

      if (symbol === " ") entities.push(floor(x, y));
      else if (symbol === ".") {
        entities.push(goal(x, y));
        goals += 1;
      } else if (symbol === "@") {
        entities.push(floor(x, y));
        player = assignPlayer(player, x, y, title);
      } else if (symbol === "+") {
        entities.push(goal(x, y));
        player = assignPlayer(player, x, y, title);
        goals += 1;
      } else if (symbol === "$") {
        entities.push(floor(x, y), pushableRock(x, y));
        boxes += 1;
      } else if (symbol === "*") {
        entities.push(goal(x, y), pushableRock(x, y));
        boxes += 1;
        goals += 1;
      } else {
        throw new Error(`${title}: 不支持的 XSB 字符 ${JSON.stringify(symbol)}`);
      }
    }
  }

  if (!player) throw new Error(`${title}: 缺少玩家起点`);
  if (boxes !== goals)
    throw new Error(`${title}: 箱子与目标数量不一致：${boxes} / ${goals}`);
  if (boxes <= 0) throw new Error(`${title}: 至少需要 1 个箱子和目标`);
  if (options.expectedBoxes !== undefined && boxes !== options.expectedBoxes)
    throw new Error(`${title}: 应有 ${options.expectedBoxes} 个箱子，实际 ${boxes}`);

  entities.push({ type: "bobby", ...player, direction: "down" });

  return {
    width,
    height,
    entities,
    rules: { win: { ...SOKOBAN_WIN_RULE } },
  };
}

export function isXsbBoardLine(line) {
  return /^[ #.$@*+]+$/.test(line) && /[#.$@*+]/.test(line);
}

export function countPushGoals(level) {
  return level.entities.filter((entity) => entity.type === "push-goal").length;
}

function assignPlayer(current, x, y, title) {
  if (current)
    throw new Error(
      `${title}: 必须恰好有 1 个玩家起点，至少发现 (${current.x}, ${current.y}) 与 (${x}, ${y})`,
    );
  return { x, y };
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

function floor(x, y) {
  return { type: "ground-c", x, y };
}

function goal(x, y) {
  return { type: "push-goal", x, y };
}

function pushableRock(x, y) {
  return { type: "crumbly-rock", x, y, traits: ["pushable"] };
}

function key(x, y) {
  return `${x},${y}`;
}
