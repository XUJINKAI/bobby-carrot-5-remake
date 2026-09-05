import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../world/behavior/Behavior.js";
import { dialogTraitBehavior } from "../world/dialog/DialogBehavior.js";
import type { EntityDefinition } from "../world/entity/EntityDefinition.js";
import type { EntityBehaviorBinding } from "./EntityModule.js";
import {
  bobbyMountId,
  patchBobbyInventory,
  readBobbyInventory,
} from "./player/BobbyState.js";

const collect: Behavior = {
  id: "collectible",
  canEnter({ actor, self, query }) {
    if (!isRidingMower(actor.state, query)) return;
    if (query.hasTraitAt(self.presence.cell, "hidden-objective"))
      return { passable: true, reason: "objective-hidden-under-grass" };
    if (self.entity.type === EntityTypeId.CARROT)
      return { passable: false, reason: "mower-cannot-collect-carrot" };
  },
  onEnter({ actor, self, query, commands }) {
    if (isRidingMower(actor.state, query)) return;
    const economy = query.global().economy;
    if (self.entity.type === EntityTypeId.BONUS_COIN) {
      commands.setGlobal("economy", {
        ...economy,
        bonusCoins: economy.bonusCoins + 1,
      });
    } else if (self.entity.type === EntityTypeId.GOLDEN_CARROT) {
      commands.setGlobal("economy", {
        ...economy,
        goldenCarrots: economy.goldenCarrots + 1,
      });
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

const pickup: Behavior = {
  id: "pickup",
  onEnter({ actor, self, query, commands }) {
    if (isRidingMower(actor.state, query)) return;
    const inventory = readBobbyInventory(actor.state);
    switch (self.entity.type) {
      case EntityTypeId.GAS:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { gas: true }),
        );
        break;
      case EntityTypeId.KITE:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { kite: true }),
        );
        break;
      case EntityTypeId.BEAN:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { beans: inventory.beans + 1 }),
        );
        break;
      case EntityTypeId.SHOVEL_PICKUP:
        commands.setState(
          actor.id,
          patchBobbyInventory(actor.state, { shovel: true }),
        );
        commands.destroy(self.entity.id);
        commands.spawn({
          type: EntityTypeId.SHOVEL_CLEARED_GROUND,
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
          presence.traits.includes("walkable"),
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
  return mountId !== null && query.entityHasTrait(mountId, "mower");
}

const waterRequiresOverlay: Behavior = {
  id: "water-requires-overlay",
  canEnter({ query, self }) {
    const supported = query
      .presencesAt(self.presence.cell)
      .some(
        (presence) =>
          presence.entityId !== self.entity.id &&
          presence.traits.includes("terrain-overlay"),
      );
    return supported
      ? { passable: true, reason: "water-overlay" }
      : { passable: false, reason: "water-requires-overlay" };
  },
};

const statefulBlock: Behavior = {
  id: "stateful-block",
  canEnter({ self }) {
    return self.entity.state?.raised === false
      ? { passable: true, reason: "block-lowered" }
      : { passable: false, reason: "block-raised" };
  },
};

const TRAIT_BEHAVIORS: Readonly<Record<string, Behavior>> = {
  collectible: collect,
  dialog: dialogTraitBehavior,
  hazard,
  mowable,
  "mower-conditional-overlay": mowerConditionalOverlay,
  pickup,
  shovelable,
  water: waterRequiresOverlay,
  "stateful-block": statefulBlock,
};

/** Shared trait behaviors only. Entity-specific behaviors stay beside their EntityModule. */
export function behaviorBindingsForDefinition(
  definition: EntityDefinition,
): readonly EntityBehaviorBinding[] {
  const bindings: EntityBehaviorBinding[] = [];
  const seen = new Set<string>();
  for (const trait of definition.traits) {
    const behavior = TRAIT_BEHAVIORS[trait];
    if (!behavior || seen.has(`${trait}:${behavior.id}`)) continue;
    seen.add(`${trait}:${behavior.id}`);
    bindings.push({ trait, behavior });
  }
  return bindings;
}
