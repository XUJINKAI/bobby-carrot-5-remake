export const GOAL_TYPES = [
  "carrot",
  "egg",
  "exit",
  "push-goal",
  "golden-carrot",
] as const;

export type GoalType = (typeof GOAL_TYPES)[number];

export type WinCondition =
  | { type: "all"; conditions: WinCondition[] }
  | { type: "any"; conditions: WinCondition[] }
  | { type: GoalType };

/** 全局失败与约束规则；不属于递归 win condition。 */
export type LevelLimit =
  | { type: "max-moves"; moves: number }
  | { type: "max-time-seconds"; seconds: number };

export interface LevelRules {
  win?: WinCondition;
  limits?: LevelLimit[];
}
