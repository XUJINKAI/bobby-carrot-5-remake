import type { GlobalState } from "../GlobalState.js";
import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { SpatialIndex } from "../spatial/SpatialIndex.js";

export interface CellQuery { x: number; y: number; }

/** Behavior 可见的只读 World 查询面。 */
export class WorldQueryApi {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
    private readonly registry: EntityRegistry,
    private readonly globalState: () => Readonly<GlobalState>,
  ) {}

  inBounds(cell: CellQuery): boolean { return this.spatial.inBounds(cell); }
  entity(id: EntityId): Readonly<EntityInstance> | undefined { return this.entities.get(id); }
  definition(entityId: EntityId) {
    const entity = this.entities.get(entityId);
    return entity ? this.registry.require(entity.type) : undefined;
  }
  presencesAt(cell: CellQuery): readonly EntityPresence[] { return this.spatial.presencesAt(cell); }
  topPresenceAt(cell: CellQuery): EntityPresence | undefined { return this.spatial.topPresenceAt(cell); }
  presencesForEntity(entityId: EntityId): readonly EntityPresence[] { return this.spatial.presencesForEntity(entityId); }
  hasTraitAt(cell: CellQuery, trait: EntityTrait): boolean { return this.spatial.hasTraitAt(cell, trait); }
  global(): Readonly<GlobalState> { return this.globalState(); }

  entityHasTrait(entityId: EntityId, trait: EntityTrait): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;
    const definition = this.registry.require(entity.type);
    return definition.traits.includes(trait) || entity.instanceTraits?.includes(trait) === true ||
      this.spatial.presencesForEntity(entityId).some((presence) => presence.traits.includes(trait));
  }

  entitiesWithTrait(trait: EntityTrait): readonly EntityInstance[] {
    return this.entities.all().filter((entity) => this.entityHasTrait(entity.id, trait));
  }
}
