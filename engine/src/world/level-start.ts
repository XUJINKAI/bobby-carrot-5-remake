import type { LevelMap } from "@bobby/model";
import { terrainHasTrait } from "../mechanics/definitions.js";
import type { Point } from "./RuntimeState.js";

export function resolveLevelPlayerStart(level: LevelMap): Point {
  const terrainStarts: Point[] = [];
  for (let y = 0; y < level.height; y += 1)
    for (let x = 0; x < level.width; x += 1) {
      const terrain = level.terrain[y]?.[x];
      if (terrain && terrainHasTrait(terrain, "start"))
        terrainStarts.push({ x, y });
    }

  const explicit = level.playerStart;
  const sourceCount = terrainStarts.length + (explicit ? 1 : 0);
  if (sourceCount !== 1)
    throw new Error(
      `地图必须且只能定义一个 Bobby 初始位置：playerStart=${explicit ? 1 : 0}，start terrain=${terrainStarts.length}`,
    );

  const start = explicit ?? terrainStarts[0]!;
  if (
    !Number.isInteger(start.x) ||
    !Number.isInteger(start.y) ||
    start.x < 0 ||
    start.y < 0 ||
    start.x >= level.width ||
    start.y >= level.height
  )
    throw new Error(
      `Bobby 初始位置越界：(${String(start.x)}, ${String(start.y)}) / ${level.width}x${level.height}`,
    );

  const terrain = level.terrain[start.y]?.[start.x];
  if (!terrain || !terrainHasTrait(terrain, "walkable"))
    throw new Error(
      `Bobby 初始位置必须位于可步行 terrain：(${start.x}, ${start.y})`,
    );

  return { x: start.x, y: start.y };
}
