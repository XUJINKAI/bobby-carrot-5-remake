import type { Behavior } from "../world/behavior/Behavior.js";
import type { EntityDefinition } from "../world/entity/EntityDefinition.js";
import type { EntityBehaviorBinding } from "./EntityModule.js";

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

const TRAIT_BEHAVIORS: Readonly<Record<string, Behavior>> = {
  collectible: collect,
  hazard,
  mowable,
  shovelable,
  water: waterRequiresOverlay,
  "stateful-block": statefulBlock,
  portal,
};

/** EntityModule 组装时把 trait 语义解析为具体 Behavior + trait binding。 */
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
