import type { Direction } from "../ids.js";
import type { Point, RuntimeState } from "../../world/RuntimeState.js";

/** 移动 pipeline 唯一写入 Bobby 位置、朝向和主动步数的阶段。 */
export function commitPlayerMovement(
  state: RuntimeState,
  to: Point,
  direction: Direction,
  forced: boolean,
): void {
  state.player = to;
  state.facing = direction;
  state.moves += forced ? 0 : 1;
}
