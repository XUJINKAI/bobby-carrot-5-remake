import type { RuntimeState } from "../../world/RuntimeState.js";

export interface LevelRuleAfterMoveContext {
  state: RuntimeState;
  forced: boolean;
}

export interface ActiveLevelRule {
  afterMove(context: LevelRuleAfterMoveContext): string | null;
}
