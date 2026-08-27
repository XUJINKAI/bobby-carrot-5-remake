import { EntityTypeId } from "@bobby/model";
import { entityAtlasCell } from "../render/entity-art.js";
import type { EntityRegistry } from "../world/entity/EntityRegistry.js";
import { entityRegistry } from "../entities/registry.js";
import type { VisualDefinition } from "./VisualDefinition.js";
import { VisualRegistry } from "./VisualRegistry.js";

const CUSTOM_VISUAL_TYPES = new Set<string>([
  EntityTypeId.PUSH_GOAL,
  EntityTypeId.PORTAL,
  EntityTypeId.BOBBY,
]);

/** 默认 Visual：把 canonical Entity/Presence 解析到当前原版 atlas/custom renderer。 */
function defaultVisualDefinition(id: string): VisualDefinition {
  return {
    id,
    resolve(context) {
      const atlas = entityAtlasCell(context.entity, context.presence.role);
      if (atlas)
        return {
          layers: [
            {
              kind: "atlas",
              column: atlas.column,
              row: atlas.row,
            },
          ],
        };
      if (CUSTOM_VISUAL_TYPES.has(context.entity.type))
        return { layers: [{ kind: "custom", id: context.entity.type }] };
      return null;
    },
  };
}

export function createBuiltinVisualRegistry(
  entities: EntityRegistry = entityRegistry,
): VisualRegistry {
  const visuals = new VisualRegistry();
  const seen = new Set<string>();
  for (const definition of entities.all()) {
    const id = definition.presentation.visual ?? definition.type;
    if (seen.has(id)) continue;
    seen.add(id);
    visuals.register(defaultVisualDefinition(id));
  }
  return visuals;
}

export const visualRegistry = createBuiltinVisualRegistry();
