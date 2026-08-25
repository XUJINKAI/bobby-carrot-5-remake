import type { LevelMap } from "../../data/types.js";
import type { RuntimeState } from "../../world/RuntimeState.js";
import { createMaxMovesRule } from "./max-moves.js";
import type { ActiveLevelRule } from "./types.js";

export function createActiveLevelRules(level: LevelMap): ActiveLevelRule[] {
  const rules: ActiveLevelRule[] = [];
  const maxMoves = level.rules?.maxMoves;
  if (Number.isInteger(maxMoves) && maxMoves !== undefined && maxMoves > 0)
    rules.push(createMaxMovesRule(maxMoves));
  return rules;
}

export function evaluateRulesAfterMove(
  rules: readonly ActiveLevelRule[],
  state: RuntimeState,
  forced: boolean,
): string | null {
  for (const rule of rules) {
    const reason = rule.afterMove({ state, forced });
    if (reason) return reason;
  }
  return null;
}
