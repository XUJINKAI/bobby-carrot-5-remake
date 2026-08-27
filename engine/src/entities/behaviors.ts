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
    commands.emit({ type: "death", entityId: self.entity.id, x: self.presence.cell.x, y: self.presence.cell.y });
  },
};

const mowable: Behavior = {
  id: "mowable",
  onTouch({ query, self, commands }) {
    if (!query.global().ridingMower) return;
    commands.destroy(self.entity.id);
    commands.emit({ type: "mow", entityId: self.entity.id, x: self.presence.cell.x, y: self.presence.cell.y });
  },
};

const shovelable: Behavior = {
  id: "shovelable",
  onTouch({ query, self, commands }) {
    if (!query.global().inventory.shovel) return;
    commands.destroy(self.entity.id);
    commands.emit({ type: "shovel", entityId: self.entity.id, x: self.presence.cell.x, y: self.presence.cell.y });
  },
};

const portal: Behavior = {
  id: "portal",
  onEnter({ query, actor, self, commands }) {
    const channel = self.entity.properties?.channel;
    const target = query.entitiesWithTrait("portal").find((entity) =>
      entity.id !== self.entity.id && entity.properties?.channel === channel,
    );
    if (!target) return;
    commands.move(actor.id, target.anchor.x, target.anchor.y);
    commands.emit({ type: "teleport", entityId: self.entity.id, x: target.anchor.x, y: target.anchor.y });
  },
};

export function createBuiltinBehaviorRegistry(): BehaviorRegistry {
  const registry = new BehaviorRegistry();
  registry.registerAll([collect, hazard, mowable, shovelable, portal]);
  registry.bindTrait("collectible", "collectible");
  registry.bindTrait("hazard", "hazard");
  registry.bindTrait("mowable", "mowable");
  registry.bindTrait("shovelable", "shovelable");
  registry.bindTrait("portal", "portal");
  return registry;
}

export const behaviorRegistry = createBuiltinBehaviorRegistry();
