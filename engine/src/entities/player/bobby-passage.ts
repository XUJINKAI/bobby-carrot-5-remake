import type { MovementPlanningContext } from "../../world/movement/MovementPlan.js";
import { hasBobbyBridgeAt } from "../original/terrain-semantics.js";
import { bobbyMountId } from "./BobbyState.js";

/** 完整木板和豆茎上段只替普通 Bobby 跨越地形，其它对象仍执行进入规则。 */
export function bobbyCanCrossUnwalkable(
  context: MovementPlanningContext,
): boolean {
  if (bobbyMountId(context.actor.state) !== null) return false;
  return hasBobbyBridgeAt(context.query, context.to);
}
