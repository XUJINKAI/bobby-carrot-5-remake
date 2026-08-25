import type { ActiveLevelRule } from "./types.js";

export function createMaxMovesRule(maxMoves: number): ActiveLevelRule {
  return {
    afterMove({ state, forced }) {
      return !forced && state.moves > maxMoves
        ? `超过最大步数 ${maxMoves}`
        : null;
    },
  };
}
