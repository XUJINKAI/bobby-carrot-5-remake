import type { LevelMap } from "../../data/types.js";
import type { RuntimeState } from "../../world/RuntimeState.js";
import { createMaxMovesRule } from "./max-moves.js";
import type { ActiveLevelRule } from "./types.js";
import { isWinConditionSatisfied } from "./win-condition.js";

export type PostMoveOutcome =
  | { type: "death"; reason: string }
  | { type: "complete" }
  | null;

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
): PostMoveOutcome {
  for (const rule of rules) {
    const reason = rule.afterMove({ state, forced });
    if (reason) return { type: "death", reason };
  }
  const condition = state.winCondition;
  if (condition && isWinConditionSatisfied(condition, state))
    return { type: "complete" };
  return null;
}
