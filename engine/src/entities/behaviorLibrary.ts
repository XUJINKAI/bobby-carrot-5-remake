import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../world/behavior/Behavior.js";
import { RuntimeEntityTypeId } from "./runtime-types.js";
import {
  bobbyMountId,
  patchBobbyInventory,
  readBobbyInventory,
} from "./player/BobbyState.js";

export const collectBehavior: Behavior = {
  id: "collectible",
  onEnter({ actor, self, query, commands }) {
    if (isRidingMower(actor.state, query)) return;
    commands.destroy(self.entity.id);
    if (self.entity.type === MapEntityTypeId.GOLDEN_CARROT) {
      commands.setGlobal("successfulGoalInteractions", [
        ...new Set([
          ...query.global().successfulGoalInteractions,
          MapEntityTypeId.GOLDEN_CARROT,
        ]),
      ]);
    }
    commands.emit({
      type: `collect-${self.entity.type}`,
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

export const pickupBehavior: Behavior = {
  id: "pickup",
  onEnter({ actor, self, query, commands }) {
    if (isRidingMower(actor.state, query)) return;
    const inventory = readBobbyInventory(actor.state);
    switch (self.entity.type) {
      case MapEntityTypeId.GAS:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { gas: true }),
        );
        break;
      case MapEntityTypeId.KITE:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { kite: true }),
        );
        break;
      case MapEntityTypeId.BEAN:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { beans: inventory.beans + 1 }),
        );
        break;
      case MapEntityTypeId.LOCK_KEY:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, {
            lockKeys: inventory.lockKeys + 1,
          }),
        );
        commands.destroy(self.entity.id);
        commands.spawn({
          type: MapEntityTypeId.SHOP_EMPTY,
          x: self.entity.anchor.x,
          y: self.entity.anchor.y,
        });
        commands.emit({
          type: `collect-${self.entity.type}`,
          entityId: self.entity.id,
          x: self.presence.cell.x,
          y: self.presence.cell.y,
        });
        return;
      case MapEntityTypeId.SHOVEL_PICKUP:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { shovel: true }),
        );
        commands.destroy(self.entity.id);
        commands.spawn({
          type: RuntimeEntityTypeId.SHOVEL_CLEARED_GROUND,
          x: self.entity.anchor.x,
          y: self.entity.anchor.y,
        });
        commands.emit({
          type: `collect-${self.entity.type}`,
          entityId: self.entity.id,
          x: self.presence.cell.x,
          y: self.presence.cell.y,
        });
        return;
      default:
        return;
    }
    commands.destroy(self.entity.id);
    commands.emit({
      type: `collect-${self.entity.type}`,
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

export const hazardBehavior: Behavior = {
  id: "hazard",
  onEnter({ actor, self, query, commands }) {
    if (self.entity.state?.active === false) return;
    if (isRidingMower(actor.state, query)) return;
    commands.downActor(actor.id, "An actor entered a hazard.");
  },
};

export const mowableBehavior: Behavior = {
  id: "mowable",
  resolveEntry({ actor, query }) {
    if (!isRidingMower(actor.state, query)) return;
    return { result: "pass", reason: "mower-will-clear" };
  },
  onArrive({ actor, self, query, commands }) {
    if (!isRidingMower(actor.state, query)) return;
    commands.destroy(self.entity.id);
    commands.emit({
      type: "mow",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

export function isRidingMower(
  state: Parameters<typeof bobbyMountId>[0],
  query: Parameters<NonNullable<Behavior["onEnter"]>>[0]["query"],
): boolean {
  const mountId = bobbyMountId(state);
  return mountId !== null && query.entity(mountId)?.type === MapEntityTypeId.MOWER;
}

export const statefulBlockBehavior: Behavior = {
  id: "stateful-block",
  canEnter({ self }) {
    return self.entity.state?.raised === false
      ? { passable: true, reason: "block-lowered" }
      : { passable: false, reason: "block-raised" };
  },
};

export const requiresUnmountedReachBehavior: Behavior = {
  id: "requires-unmounted-reach",
  canReach({ actor }) {
    return bobbyMountId(actor.state) === null
      ? { passable: true, reason: "actor-unmounted" }
      : { passable: false, reason: "actor-mounted" };
  },
};
