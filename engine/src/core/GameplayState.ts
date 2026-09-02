import type { Direction, EntityState } from "@bobby/model";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type {
  EconomyState,
  ForcedKind,
  InventoryState,
  ProfileCapabilities,
} from "../world/GlobalState.js";

export interface GameplayActorState {
  id: EntityId;
  position: { x: number; y: number };
  facing: Direction;
  state?: EntityState;
}

/** 外层 UI 可读取的 gameplay 状态。player/facing 是 primary actor 的便利视图。 */
export interface GameplayState {
  status: "playing" | "won" | "dead";
  deathReason: string | null;
  moves: number;
  primaryActorId: EntityId;
  actors: readonly GameplayActorState[];
  player: { x: number; y: number };
  facing: Direction;
  inventory: Readonly<InventoryState>;
  economy: Readonly<EconomyState>;
  profile: Readonly<ProfileCapabilities>;
  ridingMower: boolean;
  forced: {
    kind: ForcedKind;
    direction: Direction;
  } | null;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  canUndo: boolean;
  canRedo: boolean;
}
