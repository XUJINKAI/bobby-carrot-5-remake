import type { MovementPlanningContext } from "../../world/movement/MovementPlan.js";
import type { MovementPolicy } from "../../world/movement/MovementPlan.js";
import type { EntityPresence } from "../../world/spatial/EntityPresence.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import { hasBobbyBridgeAt, isOriginalTerrainType } from "../original/terrain-semantics.js";
import { bobbyMountId } from "./BobbyState.js";

/** 完整木板和豆茎上段覆盖下层地形的交互，独立对象仍按自身规则执行。 */
export function bobbyTerrainBridgePolicy(
  context: MovementPlanningContext,
): MovementPolicy {
  if (bobbyMountId(context.actor.state) !== null)
    return { allowUnwalkable: false };

  const targetBridged = hasBobbyBridgeAt(context.query, context.to);
  const sourceBridged = hasBobbyBridgeAt(context.query, context.from);
  return {
    allowUnwalkable: targetBridged,
    bypassTargetEntityIds: targetBridged
      ? coveredTerrainIds(context.query, context.target)
      : [],
    bypassSourceLifecycleEntityIds: sourceBridged
      ? coveredTerrainIds(context.query, context.source)
      : [],
  };
}

function coveredTerrainIds(
  query: WorldQueryApi,
  stack: readonly EntityPresence[],
): number[] {
  return stack
    .filter((presence) => {
      const type = query.entity(presence.entityId)?.type;
      return type !== undefined && isOriginalTerrainType(type);
    })
    .map((presence) => presence.entityId);
}
