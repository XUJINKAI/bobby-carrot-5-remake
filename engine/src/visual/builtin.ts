import { EntityTypeId } from "@bobby/model";
import {
  entityAtlasCell,
  originalObjectAtlasCell,
} from "../render/entity-art.js";
import { entityRegistry } from "../entities/registry.js";
import type { EntityRegistry } from "../world/entity/EntityRegistry.js";
import {
  cardinalConnectionMask,
  resolveCardinalTopology,
  type AutoConnectShape,
} from "./AutoConnect.js";
import type { VisualDefinition } from "./VisualDefinition.js";
import { VisualRegistry } from "./VisualRegistry.js";

const CUSTOM_VISUAL_TYPES = new Set<string>([
  EntityTypeId.PUSH_GOAL,
  EntityTypeId.PORTAL,
  EntityTypeId.BOBBY,
]);

const FENCE_ART_INDEX: Record<AutoConnectShape, number> = {
  isolated: 48,
  end: 49,
  straight: 50,
  corner: 51,
  tee: 52,
  cross: 53,
};

function fenceVisualDefinition(): VisualDefinition {
  return {
    id: EntityTypeId.FENCE,
    resolve(context) {
      const mask = cardinalConnectionMask(
        context,
        (_entity, presence) =>
          presence.traits.includes("fence") || presence.traits.includes("gate"),
      );
      const topology = resolveCardinalTopology(mask);
      const atlas = originalObjectAtlasCell(FENCE_ART_INDEX[topology.shape]);
      return {
        layers: [
          {
            kind: "atlas",
            column: atlas.column,
            row: atlas.row,
            rotate: topology.rotation,
          },
        ],
      };
    },
  };
}

/** 默认 Visual：把 canonical Entity/Presence 解析到当前原版 atlas/custom renderer。 */
function defaultVisualDefinition(id: string): VisualDefinition {
  return {
    id,
    resolve(context) {
      const atlas = entityAtlasCell(context.entity, context.presence.role);
      if (atlas) {
        return {
          layers: [
            {
              kind: "atlas",
              column: atlas.column,
              row: atlas.row,
            },
          ],
        };
      }
      if (CUSTOM_VISUAL_TYPES.has(context.entity.type)) {
        return { layers: [{ kind: "custom", id: context.entity.type }] };
      }
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
    visuals.register(
      definition.type === EntityTypeId.FENCE
        ? fenceVisualDefinition()
        : defaultVisualDefinition(id),
    );
  }
  return visuals;
}

export const visualRegistry = createBuiltinVisualRegistry();
