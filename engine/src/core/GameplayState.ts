import type { Direction } from "@bobby/model";
import type {
  ForcedKind,
  InventoryState,
  ObjectiveMode,
  ProfileCapabilities,
} from "../world/GlobalState.js";

/** 外层 UI 可读取的稳定 gameplay 状态；不暴露 World 容器与索引实现。 */
export interface GameplayState {
  status: "playing" | "won" | "dead";
  deathReason: string | null;
  moves: number;
  player: { x: number; y: number };
  facing: Direction;
  inventory: Readonly<InventoryState>;
  profile: Readonly<ProfileCapabilities>;
  ridingMower: boolean;
  objective: {
    mode: ObjectiveMode;
    remaining: number;
    total: number;
  };
  forced: {
    kind: ForcedKind;
    direction: Direction;
  } | null;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  canUndo: boolean;
  canRedo: boolean;
  timedChallengeRemainingMs: number | null;
}
