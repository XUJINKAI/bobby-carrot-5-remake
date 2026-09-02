import type { CellInspection, Game } from "@bobby/engine";

export function formatTileInspection(
  cell: CellInspection,
  game: Game,
): string {
  const state = game.state;
  const primary = state.actors.find(
    (actor) => actor.id === state.primaryActorId,
  );
  const lines = [`Cell (${cell.cell.x}, ${cell.cell.y})`];
  if (cell.presences.length === 0) {
    lines.push("Stack: implicit Void");
  } else {
    lines.push("Stack:");
    for (const presence of cell.presences) {
      lines.push(
        `  [${presence.stackOrder}]: ${presence.type}#${presence.entityId}${presence.role ? `:${presence.role}` : ""}`,
        `    traits: ${presence.traits.length ? presence.traits.join(", ") : "none"}`,
      );
      if (presence.state) {
        lines.push(`    state: ${JSON.stringify(presence.state)}`);
      }
    }
  }
  lines.push(
    `Top: ${cell.topPresence ? `${cell.topPresence.type}#${cell.topPresence.entityId}` : "void"}`,
    `Actors here: ${cell.actorIds.length ? cell.actorIds.join(", ") : "none"}`,
    "",
    `Primary Bobby #${state.primaryActorId}: (${state.player.x}, ${state.player.y}) · facing=${state.facing}`,
    `Bobby state: ${JSON.stringify(primary?.state ?? {})}`,
    `Win: ${JSON.stringify(game.winState)}`,
    `Moves: ${state.moves}`,
    `Inventory: gas=${state.inventory.gas} kite=${state.inventory.kite} shovel=${state.inventory.shovel} beans=${state.inventory.beans} temporaryKey=${state.inventory.temporaryKey}`,
  );
  return lines.join("\n");
}
