import type { TileDefinition, TileTrait } from "../definition-types.js";

export function definitionHasTrait<T extends string>(
  definition: TileDefinition<T>,
  trait: TileTrait,
): boolean {
  return definition.traits.includes(trait);
}
