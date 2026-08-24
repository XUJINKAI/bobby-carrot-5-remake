import { datSourceForObject, datSourceForTerrain } from "@bobby/dat";
import type { Game, TileInspection } from "@bobby/engine";

export function formatTileInspection(tile: TileInspection, game: Game): string {
  const world = game.world;
  const dynamic = tile.dynamicEntity;
  const formatDefinition = (
    label: string,
    definition: TileInspection["terrainDefinition"],
    source: ReturnType<typeof datSourceForTerrain>,
  ): string[] => {
    const lines = [
      `${label}: ${definition.id}`,
      `  presentation: ${definition.presentation.name} / ${definition.presentation.category}`,
      `  DAT: ${source?.datHexIds.join(", ") ?? "n/a"}${source ? ` [${source.confidence}]` : ""}`,
      `  traits: ${definition.traits.length ? definition.traits.join(", ") : "none"}`,
      "  behaviors:",
    ];
    if (!definition.behaviors.length) lines.push("    none");
    for (const behavior of definition.behaviors) {
      const config = behavior.config
        ? ` · ${Object.entries(behavior.config)
            .map(
              ([key, value]) =>
                `${key}=${Array.isArray(value) ? value.join("|") : String(value)}`,
            )
            .join(" · ")}`
        : "";
      lines.push(`    ${behavior.id}${config}`, `      ${behavior.summary}`);
    }
    return lines;
  };

  return [
    `Tile (${tile.x}, ${tile.y})`,
    ...formatDefinition(
      "Terrain",
      tile.terrainDefinition,
      datSourceForTerrain(tile.terrainType),
    ),
    "",
    ...formatDefinition(
      "Object",
      tile.objectDefinition,
      datSourceForObject(tile.objectType),
    ),
    "",
    dynamic ? `Dynamic: ${dynamic.type}` : "Dynamic: none",
    dynamic ? `  direction: ${dynamic.direction ?? "none"}` : "",
    dynamic ? `  rider: ${dynamic.rider} · settled: ${dynamic.settled}` : "",
    dynamic ? `  offsetPx: ${dynamic.offsetXpx}, ${dynamic.offsetYpx}` : "",
    `Flags: player=${tile.isPlayer} · start=${tile.isStart}`,
    "",
    `Bobby: (${world.player.x}, ${world.player.y}) · facing=${world.facing}`,
    `Forced: ${world.forcedKind ?? "none"} / ${world.forcedDirection ?? "none"}`,
    `Mower: ${world.ridingMower}`,
    `Objectives: ${world.objectiveRemaining}/${world.objectiveTotal}`,
    `Moves: ${world.state.moves}`,
    `Inventory: gas=${world.state.inventory.gas} kite=${world.state.inventory.kite} shovel=${world.state.inventory.shovel} beans=${world.state.inventory.beans}`,
  ]
    .filter(Boolean)
    .join("\n");
}
