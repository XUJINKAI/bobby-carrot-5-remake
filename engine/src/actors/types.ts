import type { Direction } from "../mechanics/ids.js";

export interface ActorPosition {
  x: number;
  y: number;
}

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

/** 当前唯一可控制 Actor 的状态合同；字段名保持 Runtime snapshot 兼容。 */
export interface BobbyActorState {
  player: ActorPosition;
  facing: Direction;
  dead: boolean;
  inventory: InventoryState;
  profile: ProfileCapabilities;
  ridingMower: boolean;
  moves: number;
}
