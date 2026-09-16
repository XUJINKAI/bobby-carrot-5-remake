import { MapEntityTypeId } from "@bobby/model";
import type { WorldQueryApi } from "../../../world/behavior/WorldQueryApi.js";
import type { GoalDefinition } from "../../../world/outcome/GoalRegistry.js";

function targetCells(query: WorldQueryApi): { x: number; y: number }[] {
  const cells = new Map<string, { x: number; y: number }>();
  for (const goal of query.entitiesMatching({ kind: "type", value: MapEntityTypeId.PUSH_GOAL })) {
    for (const presence of query.presencesForEntity(goal.id)) {
      cells.set(`${presence.cell.x},${presence.cell.y}`, presence.cell);
    }
  }
  return [...cells.values()];
}

export const pushGoal: GoalDefinition = {
  type: "push-goal",
  available(query) {
    return targetCells(query).length > 0 && query.entitiesWithFact("pushable").length > 0;
  },
  evaluate({ query }) {
    const cells = targetCells(query);
    const remaining = cells.filter((cell) =>
      !query.hasSelectorAt(cell, { kind: "fact", value: "pushable" })
    ).length;
    return { completed: cells.length > 0 && remaining === 0, remaining };
  },
};
