import type { GameplayState } from "../core/GameplayState.js";
import type { WinConditionState, WorldEvent } from "../world/WorldTypes.js";
import type {
  ReplayActualFinalState,
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
    gameplay: Pick<GameplayState, "status" | "moves">,
    elapsedMs: number,
    winCondition: WinConditionState | null,
  ): ReplayActualFinalState {
    return {
      status: gameplay.status,
      moves: gameplay.moves,
      elapsedMs: Math.max(0, Math.round(elapsedMs)),
      counters: Object.fromEntries(
        [...this.counts].sort(([left], [right]) => left.localeCompare(right)),
      ),
      completedConditions: completedConditions(winCondition),
    };
  }
}

export interface ReplayVerificationStates {
  actual: ReplayFinalState;
  expected: ReplayFinalState;
}

/** 只投影文件声明的校验字段；经过的 World 时间始终只供记录。 */
export function replayVerificationStates(
  actual: ReplayActualFinalState,
  recorded: ReplayFinalState,
): ReplayVerificationStates {
  const expected = Object.fromEntries(
    Object.entries(recorded).filter(([key]) => key !== "elapsedMs"),
  ) as ReplayFinalState;
  const projected = Object.fromEntries(
    Object.keys(expected).map((key) => [
      key,
      actual[key as keyof ReplayActualFinalState],
    ]),
  ) as ReplayFinalState;
  return { actual: projected, expected };
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
