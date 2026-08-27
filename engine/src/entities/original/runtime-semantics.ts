import { EntityTypeId } from "@bobby/model";
import type { EntityDefinition } from "../../world/entity/EntityDefinition.js";

/**
 * Canonical obstacle semantics that used to live in the Terrain/Object registry assembly.
 * Keep them on the final Entity Definition instead of teaching World about original IDs.
 */
const REQUIRED_BLOCKING = new Set<string>([
  EntityTypeId.EGG_NEST_FILLED,
  EntityTypeId.WINDMILL_UP,
  EntityTypeId.WINDMILL_DOWN,
  EntityTypeId.WINDMILL_LEFT,
  EntityTypeId.WINDMILL_RIGHT,
  EntityTypeId.PLANK_CRUMBLING,
  EntityTypeId.PLANK_FRAGMENT,
  EntityTypeId.ICE_BLOCK,
]);

export function applyOriginalRuntimeSemantics(
  definitions: readonly EntityDefinition[],
): readonly EntityDefinition[] {
  return definitions.map((definition) => {
    if (!REQUIRED_BLOCKING.has(definition.type)) return definition;
    if (definition.traits.includes("blocking")) return definition;
    return {
      ...definition,
      traits: [...definition.traits, "blocking"],
    };
  });
}
