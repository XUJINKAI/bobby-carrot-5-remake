import type {
  TileDefinition,
  TileDefinitionInspection,
} from "../definition-types.js";

export function inspectDefinition<T extends string>(
  definition: TileDefinition<T>,
): TileDefinitionInspection {
  return {
    id: definition.id,
    presentation: definition.presentation,
    traits: definition.traits,
    behaviors: definition.behaviors.map((behavior) => behavior.describe()),
    ...(definition.authoring ? { authoring: definition.authoring } : {}),
  };
}
