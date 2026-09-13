import type { GlobalState } from "../GlobalState.js";
import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { SpatialIndex } from "../spatial/SpatialIndex.js";
import type { WorldMotion, WorldMotionStore } from "../movement/WorldMotion.js";

export interface CellQuery {
  x: number;
  y: number;
}

export class WorldQueryApi {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
    private readonly registry: EntityRegistry,
    private readonly globalState: () => Readonly<GlobalState>,
    private readonly motions?: WorldMotionStore,
  ) {}

  inBounds(cell: CellQuery): boolean {
    return this.spatial.inBounds(cell);
  }

  entity(id: EntityId): Readonly<EntityInstance> | undefined {
    return this.entities.get(id);
  }

  definition(entityId: EntityId) {
    const entity = this.entities.get(entityId);
    return entity ? this.registry.require(entity.type) : undefined;
  }

  presencesAt(cell: CellQuery): readonly EntityPresence[] {
    return this.spatial.presencesAt(cell);
  }

  topPresenceAt(cell: CellQuery): EntityPresence | undefined {
    return this.spatial.topPresenceAt(cell);
  }

  presencesForEntity(entityId: EntityId): readonly EntityPresence[] {
    return this.spatial.presencesForEntity(entityId);
  }

  entityFacts(entityId: EntityId): readonly string[] {
    return this.spatial.factsForEntity(entityId);
  }

  entityHasFact(entityId: EntityId, fact: string): boolean {
    return this.spatial.entityHasFact(entityId, fact);
  }

  presenceHasFact(presence: EntityPresence, fact: string): boolean {
    return presence.facts.includes(fact);
  }

  presenceMatchesSelector(
    presence: EntityPresence,
    selector: string,
  ): boolean {
    return this.spatial.presenceMatchesSelector(presence, selector);
  }

  hasTraitAt(cell: CellQuery, trait: EntityTrait): boolean {
    return this.spatial.hasTraitAt(cell, trait);
  }

  global(): Readonly<GlobalState> {
    return this.globalState();
  }

  motionForEntity(entityId: EntityId): Readonly<WorldMotion> | undefined {
    return this.motions?.forEntity(entityId);
  }

  entityHasTrait(entityId: EntityId, trait: EntityTrait): boolean {
    return this.spatial.entityHasFact(entityId, trait);
  }

  entitiesWithTrait(trait: EntityTrait): readonly EntityInstance[] {
    return this.spatial.entityIdsWithTrait(trait)
      .map((id) => this.entities.require(id));
  }
}
