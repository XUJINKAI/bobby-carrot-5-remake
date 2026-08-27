import type { Direction, WinCondition } from "@bobby/model";
import type { CellPosition } from "./entity/EntityInstance.js";

export interface InventoryState {
  gas: boolean;
  kite: boolean;
  shovel: boolean;
  beans: number;
}

export interface ProfileCapabilities {
  superKey: boolean;
  temporaryKey: boolean;
  speedShoes: boolean;
}

export type ObjectiveMode = "carrot" | "nest" | "generic";
export type ForcedKind = "speed" | "ice" | "flight" | "leaf" | "mower-exit";

export interface ForcedMovement {
  kind: ForcedKind;
  direction: Direction;
}

export interface BeanstalkGrowth {
  entityId: number;
  stage: number;
  ticksUntilGrowth: number;
}

/** 非空间 gameplay 状态。Entity 位置、方向、实例 state 均由 EntityStore 持有。 */
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
  beanstalkGrowth: BeanstalkGrowth[];
}

export function createGlobalState(
  profile: Partial<ProfileCapabilities> = {},
  winCondition?: WinCondition,
): GlobalState {
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
    beanstalkGrowth: [],
  };
}
