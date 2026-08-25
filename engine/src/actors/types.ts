import type { Direction } from "../mechanics/ids.js";

export interface ActorPosition {
  x: number;
  y: number;
}

export interface ActorState {
  position: ActorPosition;
  facing: Direction;
  dead: boolean;
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
export interface BobbyActorState extends ActorState {
  /** 单 Bobby 公开 snapshot 的兼容字段，与 position 同步。 */
  player: ActorPosition;
  inventory: InventoryState;
  profile: ProfileCapabilities;
  ridingMower: boolean;
  moves: number;
}
