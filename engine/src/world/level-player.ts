import type { LevelMap } from "@bobby/model";
import type { EntityRegistry } from "./entity/EntityRegistry.js";

/**
 * 解析唯一 player Entity。Start surface 不参与出生语义。
 */
export function resolveLevelPlayerIndex(
  level: LevelMap,
  registry: EntityRegistry,
): number {
  const players: number[] = [];
  for (let index = 0; index < level.entities.length; index += 1) {
    const entity = level.entities[index]!;
    const definition = registry.require(entity.type);
    if (
      definition.traits.includes("player") ||
      entity.traits?.includes("player") === true
    )
      players.push(index);
  }
  if (players.length !== 1)
    throw new Error(`地图必须且只能包含一个 player Entity，当前为 ${players.length} 个`);
  const index = players[0]!;
  const player = level.entities[index]!;
  if (
    !Number.isInteger(player.x) ||
    !Number.isInteger(player.y) ||
    player.x < 0 ||
    player.y < 0 ||
    player.x >= level.width ||
    player.y >= level.height
  )
    throw new Error(
      `player Entity 越界：(${String(player.x)}, ${String(player.y)}) / ${level.width}x${level.height}`,
    );
  return index;
}
