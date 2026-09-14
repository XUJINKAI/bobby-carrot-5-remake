import type { MovementPlanningContext } from "../../world/movement/MovementPlan.js";
import type { MovementPolicy } from "../../world/movement/MovementPlan.js";
import { hasBobbyBridgeAt, isOriginalTerrainType } from "../original/terrain-semantics.js";
import { bobbyMountId } from "./BobbyState.js";

/** 完整木板和豆茎上段只替普通 Bobby 跨越地形，其它对象仍执行进入规则。 */
export function bobbyTerrainBridgePolicy(
  context: MovementPlanningContext,
): MovementPolicy {
  if (bobbyMountId(context.actor.state) !== null ||
    !hasBobbyBridgeAt(context.query, context.to))
    return { allowUnwalkable: false };
  return {
    allowUnwalkable: true,
    bypassTargetEntityIds: context.target
      .filter((presence) => {
        const type = context.query.entity(presence.entityId)?.type;
        return type !== undefined && isOriginalTerrainType(type);
      })
      .map((presence) => presence.entityId),
  };
}
