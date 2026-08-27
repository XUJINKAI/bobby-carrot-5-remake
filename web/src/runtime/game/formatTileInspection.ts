import type { CellInspection, Game } from "@bobby/engine";

export function formatTileInspection(
  cell: CellInspection,
  game: Game,
): string {
  const world = game.world;
  const lines = [`Cell (${cell.cell.x}, ${cell.cell.y})`];
  if (cell.presences.length === 0) {
    lines.push("Stack: implicit Void");
  } else {
    lines.push("Stack:");
    for (const presence of cell.presences) {
      const definition = world.definition(presence.entityId);
      lines.push(
        `  ${presence.stackBand}: ${presence.type}#${presence.entityId}${presence.role ? `:${presence.role}` : ""}`,
        `    name: ${definition.presentation.name}`,
        `    traits: ${presence.traits.length ? presence.traits.join(", ") : "none"}`,
        `    behaviors: ${definition.behaviors?.length ? definition.behaviors.join(", ") : "none"}`,
      );
      if (presence.state) {
        lines.push(`    state: ${JSON.stringify(presence.state)}`);
      }
    }
  }
  lines.push(
    `Top: ${cell.topPresence ? `${cell.topPresence.type}#${cell.topPresence.entityId}` : "void"}`,
    `Player here: ${cell.playerHere}`,
    "",
    `Bobby: (${world.player.x}, ${world.player.y}) · facing=${world.facing}`,
    `Forced: ${world.forcedKind ?? "none"} / ${world.forcedDirection ?? "none"}`,
    `Mower: ${world.ridingMower}`,
    `Objectives: ${world.state.objectiveRemaining}/${world.state.objectiveTotal}`,
    `Moves: ${world.state.moves}`,
    `Inventory: gas=${world.state.inventory.gas} kite=${world.state.inventory.kite} shovel=${world.state.inventory.shovel} beans=${world.state.inventory.beans}`,
  );
  return lines.join("\n");
}
