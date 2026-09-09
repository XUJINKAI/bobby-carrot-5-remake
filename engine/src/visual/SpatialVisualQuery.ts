import type { EntityStore } from "../world/entity/EntityStore.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../world/entity/EntityInstance.js";
import type { SpatialIndex } from "../world/spatial/SpatialIndex.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import type { VisualQuery } from "./VisualDefinition.js";

/** EntityStore + SpatialIndex 的只读 VisualQuery 适配器。 */
export class SpatialVisualQuery implements VisualQuery {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
  ) {}

  inBounds(cell: CellPosition): boolean {
    return this.spatial.inBounds(cell);
  }

  presencesAt(cell: CellPosition): readonly EntityPresence[] {
    return this.spatial.presencesAt(cell);
  }

  entity(id: EntityId): Readonly<EntityInstance> | undefined {
    return this.entities.get(id);
  }

  entitiesWithTrait(trait: string): readonly Readonly<EntityInstance>[] {
    return this.spatial.entityIdsWithTrait(trait)
      .map((id) => this.entities.require(id));
  }
}
