import { EntityTypeId, type EntityType } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";

function colorSwitchBehavior(
  id: string,
  switchType: EntityType,
  blockType: EntityType,
): Behavior {
  return {
    id,
    onEnter({ actor, query, commands }) {
      if (!query.entityHasTrait(actor.id, "player")) return;

      for (const entity of query.entitiesWithTrait("switch")) {
        if (entity.type !== switchType) continue;
        commands.setState(entity.id, {
          ...entity.state,
          pressed: entity.state?.pressed !== true,
        });
      }

      for (const entity of query.entitiesWithTrait("stateful-block")) {
        if (entity.type !== blockType) continue;
        commands.setState(entity.id, {
          ...entity.state,
          // Undefined follows the definition default (raised), so the first
          // toggle lowers the block just like the original raw-tile swap.
          raised: entity.state?.raised === false,
        });
      }
    },
  };
}

export const yellowColorSwitchBehavior = colorSwitchBehavior(
  "yellow-color-switch-global-toggle",
  EntityTypeId.COLOR_YELLOW_SWITCH,
  EntityTypeId.COLOR_YELLOW_BLOCK,
);

export const pinkColorSwitchBehavior = colorSwitchBehavior(
  "pink-color-switch-global-toggle",
  EntityTypeId.COLOR_PINK_SWITCH,
  EntityTypeId.COLOR_PINK_BLOCK,
);
