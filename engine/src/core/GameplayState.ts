import type { Direction } from "@bobby/model";
import type { BobbyInventoryState } from "../entities/player/BobbyState.js";
import type { EntityId } from "../world/entity/EntityInstance.js";

export interface GameplayActorState {
  id: EntityId;
  position: { x: number; y: number };
  facing: Direction;
  inventory: Readonly<BobbyInventoryState>;
  moveDurationMs: number;
}

/**
 * 外层 UI 可读取的 gameplay 状态。
 * primaryActorId/player/facing/inventory 都只是 primary actor 的单人 UI 便利视图；
 * 地图缺少 player 时 primaryActorId/player/facing 为 null，World 仍然可以正常展示。
 * 多 actor 的公开语义投影始终存在 actors[]；内部状态仍由 EntityStore 持有。
 */
export interface GameplayState {
  status: "playing" | "won" | "dead";
  deathReason: string | null;
  moves: number;
  primaryActorId: EntityId | null;
  actors: readonly GameplayActorState[];
  player: { x: number; y: number } | null;
  facing: Direction | null;
  inventory: Readonly<BobbyInventoryState>;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  canUndo: boolean;
  canRedo: boolean;
}
