import type { Direction } from "../ids.js";
import type { BobbyActorState } from "../../actors/types.js";
import type { Point } from "../../world/RuntimeState.js";

/** 移动 pipeline 唯一写入 Bobby 位置、朝向和主动步数的阶段。 */
export function commitActorMovement(
  state: BobbyActorState,
  to: Point,
  direction: Direction,
  forced: boolean,
): void {
  state.player = to;
  state.facing = direction;
  state.moves += forced ? 0 : 1;
}
