import type { FactId, FactRegistry } from "../../mechanism/fact/FactRegistry.js";
import type { EntityDefinition } from "./EntityDefinition.js";
import type { EntityInstance } from "./EntityInstance.js";
import type { ResolvedFootprintCell } from "../spatial/Footprint.js";
import { readonlyView } from "../behavior/ReadonlyView.js";

/** Entity 与空间部位分别投影语义，避免整体属性被复制到每个格子。 */
export class EntityFactProjection {
  constructor(private readonly registry?: FactRegistry) {}

  entityFacts(
    entity: Readonly<EntityInstance>,
    definition: EntityDefinition,
  ): readonly FactId[] {
    return this.resolve([
      ...(definition.entityFacts ?? []),
      ...(definition.resolveEntityFacts?.({ entity: readonlyView(entity) }) ?? []),
    ]);
  }

  presenceFacts(
    entity: Readonly<EntityInstance>,
    definition: EntityDefinition,
    presence: Readonly<ResolvedFootprintCell>,
  ): readonly FactId[] {
    return this.resolve([
      ...definition.facts,
      ...(entity.instanceFacts ?? []),
      ...(presence.facts ?? []),
      ...(definition.resolvePresenceFacts?.({
        entity: readonlyView(entity),
        presence: readonlyView(presence),
      }) ?? []),
    ]);
  }

  private resolve(ids: readonly FactId[]): readonly FactId[] {
    const resolved = unique(ids);
    for (const id of resolved) this.registry?.require(id);
    return resolved;
  }
}

function unique(ids: readonly FactId[]): readonly FactId[] {
  return [...new Set(ids)];
}
