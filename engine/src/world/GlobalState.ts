import type { Direction, WinCondition } from "@bobby/model";
import type { CellPosition } from "./entity/EntityInstance.js";

export interface InventoryState { gas: boolean; kite: boolean; shovel: boolean; beans: number; }
export interface ProfileCapabilities { superKey: boolean; temporaryKey: boolean; speedShoes: boolean; }
export type ObjectiveMode = "carrot" | "egg" | "generic";
export type ForcedKind = "speed" | "ice" | "tide" | "flight" | "leaf" | "mower-exit";
export interface ForcedMovement { kind: ForcedKind; direction: Direction; }

/** 非空间 gameplay 状态。空间身份与实例 state 只存在于 EntityStore。 */
export interface GlobalState {
  dead: boolean;
  completed: boolean;
  deathReason: string | null;
  moves: number;
  inventory: InventoryState;
  profile: ProfileCapabilities;
  ridingMower: boolean;
  objectiveMode: ObjectiveMode;
  objectiveRemaining: number;
  objectiveTotal: number;
  winCondition?: WinCondition;
  forced: ForcedMovement | null;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  fireTrail: CellPosition[];
  warnings: string[];
  logicRemainderMs: number;
}

export function createGlobalState(profile: Partial<ProfileCapabilities> = {}, winCondition?: WinCondition): GlobalState {
  return {
    dead: false,
    completed: false,
    deathReason: null,
    moves: 0,
    inventory: { gas: false, kite: false, shovel: false, beans: 0 },
    profile: {
      superKey: profile.superKey ?? false,
      temporaryKey: profile.temporaryKey ?? false,
      speedShoes: profile.speedShoes ?? false,
    },
    ridingMower: false,
    objectiveMode: "generic",
    objectiveRemaining: 0,
    objectiveTotal: 0,
    ...(winCondition ? { winCondition: structuredClone(winCondition) } : {}),
    forced: null,
    bonusCoinsInLevel: 0,
    goldenCarrotsInLevel: 0,
    fireTrail: [],
    warnings: [],
    logicRemainderMs: 0,
  };
}
