import type { GameplayState } from "../core/GameplayState.js";
import type { WinConditionState, WorldEvent } from "../world/WorldTypes.js";
import type {
  ReplayCompletedCondition,
  ReplayFinalState,
} from "./ReplayFormat.js";

export class ReplayEventCounter {
  private readonly counts = new Map<string, number>();

  record(events: readonly WorldEvent[]): void {
    for (const event of events) {
      if (!event.type.startsWith("collect-") && !event.type.startsWith("fill-"))
        continue;
      this.counts.set(event.type, (this.counts.get(event.type) ?? 0) + 1);
    }
  }

  finalState(
    gameplay: Pick<GameplayState, "status">,
    winCondition: WinConditionState | null,
  ): ReplayFinalState {
    return {
      status: gameplay.status,
      counters: Object.fromEntries(
        [...this.counts].sort(([left], [right]) => left.localeCompare(right)),
      ),
      completedConditions: completedConditions(winCondition),
    };
  }
}

function completedConditions(
  condition: WinConditionState | null,
): ReplayCompletedCondition[] {
  if (!condition) return [];
  if (condition.type === "all" || condition.type === "any")
    return condition.conditions.flatMap(completedConditions);
  if (!condition.completed) return [];
  if (condition.type === "fill-all") {
    return [{
      type: condition.type,
      target: condition.target,
      filler: condition.filler,
    }];
  }
  return [{ type: condition.type, target: condition.target }];
}
