import { EntityTypeId } from "@bobby/model";
import type { EntityDefinition } from "../../world/entity/EntityDefinition.js";

/**
 * Canonical runtime traits that used to be assembled by the Terrain/Object registry.
 * World stays generic: original content semantics belong on Entity Definitions.
 */
const REQUIRED_TRAITS = new Map<string, readonly string[]>([
  [EntityTypeId.EGG_NEST_FILLED, ["blocking"]],
  [EntityTypeId.WINDMILL_UP, ["blocking"]],
  [EntityTypeId.WINDMILL_DOWN, ["blocking"]],
  [EntityTypeId.WINDMILL_LEFT, ["blocking"]],
  [EntityTypeId.WINDMILL_RIGHT, ["blocking"]],
  [EntityTypeId.PLANK_CRUMBLING, ["blocking"]],
  [EntityTypeId.PLANK_FRAGMENT, ["blocking"]],
  [EntityTypeId.ICE_BLOCK, ["blocking"]],
  [EntityTypeId.COLOR_YELLOW_BLOCK, ["walkable"]],
  [EntityTypeId.COLOR_PINK_BLOCK, ["walkable"]],
]);

export function applyOriginalRuntimeSemantics(
  definitions: readonly EntityDefinition[],
): readonly EntityDefinition[] {
  return definitions.map((definition) => {
    const required = REQUIRED_TRAITS.get(definition.type);
    if (!required) return definition;
    const traits = [...new Set([...definition.traits, ...required])];
    if (
      traits.length === definition.traits.length &&
      traits.every((trait, index) => trait === definition.traits[index])
    ) {
      return definition;
    }
    return { ...definition, traits };
  });
}
