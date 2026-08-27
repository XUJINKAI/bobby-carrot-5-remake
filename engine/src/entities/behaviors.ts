import { BehaviorRegistry } from "../world/behavior/BehaviorRegistry.js";
import type { Behavior } from "../world/behavior/Behavior.js";

const collect: Behavior = {
  id: "collectible",
  onEnter({ self, commands }) {
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
  onEnter({ self, commands }) {
    if (self.entity.state?.active === false) return;
    commands.setGlobal("dead", true);
    commands.setGlobal("deathReason", "Bobby entered a hazard.");
    commands.emit({
      type: "death",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const mowable: Behavior = {
  id: "mowable",
  onTouch({ query, self, commands }) {
    if (!query.global().ridingMower) return;
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
  onTouch({ query, self, commands }) {
    if (!query.global().inventory.shovel) return;
    commands.destroy(self.entity.id);
    commands.emit({
      type: "shovel",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

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

const portal: Behavior = {
  id: "portal",
  onEnter({ query, actor, self, commands }) {
    const channel = self.entity.properties?.channel;
    const target = query.entitiesWithTrait("portal").find(
      (entity) =>
        entity.id !== self.entity.id && entity.properties?.channel === channel,
    );
    if (!target) return;
    commands.move(actor.id, target.anchor.x, target.anchor.y);
    commands.emit({
      type: "teleport",
      entityId: self.entity.id,
      x: target.anchor.x,
      y: target.anchor.y,
    });
  },
};

export function createBuiltinBehaviorRegistry(): BehaviorRegistry {
  const registry = new BehaviorRegistry();
  registry.registerAll([
    collect,
    hazard,
    mowable,
    shovelable,
    waterRequiresOverlay,
    statefulBlock,
    portal,
  ]);
  registry.bindTrait("collectible", "collectible");
  registry.bindTrait("hazard", "hazard");
  registry.bindTrait("mowable", "mowable");
  registry.bindTrait("shovelable", "shovelable");
  registry.bindTrait("water", "water-requires-overlay");
  registry.bindTrait("stateful-block", "stateful-block");
  registry.bindTrait("portal", "portal");
  return registry;
}

export const behaviorRegistry = createBuiltinBehaviorRegistry();
