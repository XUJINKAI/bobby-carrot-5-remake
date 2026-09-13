import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../world/behavior/Behavior.js";
import type { EntityBehaviorBinding } from "./EntityModule.js";
import { RuntimeEntityTypeId } from "./runtime-types.js";
import {
  bobbyMountId,
  patchBobbyInventory,
  readBobbyInventory,
} from "./player/BobbyState.js";

const collect: Behavior = {
  id: "collectible",
  canEnter({ actor, self, query }) {
    if (!isRidingMower(actor.state, query)) return;
    if (query.hasFactAt(self.presence.cell, "hidden-objective"))
      return { passable: true, reason: "objective-hidden-under-grass" };
    if (self.entity.type === MapEntityTypeId.CARROT)
      return { passable: false, reason: "mower-cannot-collect-carrot" };
  },
  onEnter({ actor, self, query, commands }) {
    if (isRidingMower(actor.state, query)) return;
    commands.destroy(self.entity.id);
    if (self.entity.type === MapEntityTypeId.CARROT) {
      commands.spawn({
        type: RuntimeEntityTypeId.CONSUMED_CARROT,
        x: self.entity.anchor.x,
        y: self.entity.anchor.y,
      });
    }
    commands.emit({
      type: `collect-${self.entity.type}`,
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const pickup: Behavior = {
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

const hazard: Behavior = {
  id: "hazard",
  onEnter({ actor, self, query, commands }) {
    if (self.entity.state?.active === false) return;
    if (isRidingMower(actor.state, query)) return;
    commands.downActor(actor.id, "An actor entered a hazard.");
  },
};

const mowable: Behavior = {
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

const shovelable: Behavior = {
  id: "shovelable",
  resolveEntry({ actor, self, query, commands }) {
    if (isRidingMower(actor.state, query)) return;
    if (!readBobbyInventory(actor.state).shovel) return;
    commands.destroy(self.entity.id);
    commands.emit({
      type: "shovel",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
    return { result: "clear-and-pass", reason: "shovel-clear" };
  },
  onTouch({ actor, self, query, commands }) {
    if (
      !query.entityHasFact(actor.id, "player") ||
      isRidingMower(actor.state, query) ||
      readBobbyInventory(actor.state).shovel
    )
      return;
    commands.emit({
      type: "missing-item",
      actorId: actor.id,
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { item: "shovel" },
    });
  },
};

const mowerConditionalOverlay: Behavior = {
  id: "mower-conditional-overlay",
  canEnter({ actor, self, query }) {
    if (!isRidingMower(actor.state, query)) return;
    const underlyingWalkable = query
      .presencesAt(self.presence.cell)
      .some(
        (presence) =>
          presence.entityId !== self.entity.id &&
          presence.layer === "surface" &&
          presence.facts.includes("walkable"),
      );
    return underlyingWalkable
      ? { passable: true, reason: "mower-over-overlay-on-ground" }
      : { passable: false, reason: "mower-cannot-use-overlay-bridge" };
  },
};

function isRidingMower(
  state: Parameters<typeof bobbyMountId>[0],
  query: Parameters<NonNullable<Behavior["onEnter"]>>[0]["query"],
): boolean {
  const mountId = bobbyMountId(state);
  return mountId !== null && query.entity(mountId)?.type === MapEntityTypeId.MOWER;
}

const statefulBlock: Behavior = {
  id: "stateful-block",
  canEnter({ self }) {
    return self.entity.state?.raised === false
      ? { passable: true, reason: "block-lowered" }
      : { passable: false, reason: "block-raised" };
  },
};

const requiresUnmountedReach: Behavior = {
  id: "requires-unmounted-reach",
  canReach({ actor }) {
    return bobbyMountId(actor.state) === null
      ? { passable: true, reason: "actor-unmounted" }
      : { passable: false, reason: "actor-mounted" };
  },
};

/** 对象特例的组合由稳定 type 明确声明，不由 Fact 自动安装 Behavior。 */
const OBJECT_BEHAVIORS: Readonly<Record<string, readonly Behavior[]>> = {
  [MapEntityTypeId.EXIT]: [requiresUnmountedReach],
  [MapEntityTypeId.SHOVEL_PICKUP]: [pickup],
  [MapEntityTypeId.TRAP]: [hazard],
  [MapEntityTypeId.COLOR_BLOCK]: [statefulBlock],
  [MapEntityTypeId.SNOW]: [shovelable],
  [MapEntityTypeId.HIGH_GRASS]: [mowable],
  [MapEntityTypeId.CARROT]: [collect],
  [MapEntityTypeId.GOLDEN_CARROT]: [collect],
  [MapEntityTypeId.BONUS_COIN]: [collect],
  [MapEntityTypeId.BEANSTALK]: [mowerConditionalOverlay],
  "beanstalk-mid": [mowerConditionalOverlay],
  [MapEntityTypeId.BEAN]: [pickup],
  [MapEntityTypeId.GAS]: [pickup],
  [MapEntityTypeId.KITE]: [pickup],
  [MapEntityTypeId.LOCK_KEY]: [pickup],
};

export function objectBehaviorBindingsForType(
  type: string,
): readonly EntityBehaviorBinding[] {
  return (OBJECT_BEHAVIORS[type] ?? []).map((behavior) => ({ behavior }));
}
