export type WinCondition =
  | { type: "all"; conditions: WinCondition[] }
  | { type: "any"; conditions: WinCondition[] }
  | { type: "collect-all"; target: string }
  | { type: "fill-all"; target: string; filler: string }
  | { type: "reach"; target: string };

/** 全局失败与约束规则；不属于递归 win condition。 */
export type LevelLimit =
  | { type: "max-moves"; moves: number }
  | { type: "max-time-seconds"; seconds: number };

export interface LevelRules {
  win?: WinCondition;
  limits?: LevelLimit[];
}
