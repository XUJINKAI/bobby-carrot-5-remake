import type { Direction, EntityState } from "@bobby/model";
import type { BobbyInventoryState } from "../entities/player/BobbyState.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type {
  EconomyState,
  ProfileCapabilities,
} from "../world/GlobalState.js";

export interface GameplayActorState {
  id: EntityId;
  position: { x: number; y: number };
  facing: Direction;
  state?: EntityState;
}

/**
 * 外层 UI 可读取的 gameplay 状态。
 * player/facing/inventory 都只是 primary actor 的单人 UI 便利视图；
 * 多 actor 的真实状态始终存在 actors[].state / EntityStore。
 */
export interface GameplayState {
  status: "playing" | "won" | "dead";
  deathReason: string | null;
  moves: number;
  primaryActorId: EntityId;
  actors: readonly GameplayActorState[];
  player: { x: number; y: number };
  facing: Direction;
  inventory: Readonly<BobbyInventoryState>;
  economy: Readonly<EconomyState>;
  profile: Readonly<ProfileCapabilities>;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  canUndo: boolean;
  canRedo: boolean;
}
