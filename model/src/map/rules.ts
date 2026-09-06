export type WinCondition =
  | { type: "all"; conditions: WinCondition[] }
  | { type: "any"; conditions: WinCondition[] }
  | { type: "collect-all"; target: string }
  | { type: "fill-all"; target: string; filler: string }
  | { type: "reach"; target: string };

/** Global failure/constraint rules. These are not recursive win conditions. */
export type LevelLimit =
  | { type: "max-moves"; moves: number }
  | { type: "max-time-seconds"; seconds: number };

export interface LevelRules {
  win?: WinCondition;
  limits?: LevelLimit[];
}
