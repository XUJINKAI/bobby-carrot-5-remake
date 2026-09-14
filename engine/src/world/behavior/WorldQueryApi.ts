import type { GlobalState } from "../GlobalState.js";
import type { FactId, FactRegistry } from "../../fact/FactRegistry.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { SpatialIndex } from "../spatial/SpatialIndex.js";
import type { EntitySelector } from "../spatial/EntitySelector.js";
import type { WorldMotion, WorldMotionStore } from "../movement/WorldMotion.js";
import { readonlyView } from "./ReadonlyView.js";

export interface CellQuery {
  x: number;
  y: number;
}

export class WorldQueryApi {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
    private readonly globalState: () => Readonly<GlobalState>,
    private readonly facts: FactRegistry,
    private readonly motions?: WorldMotionStore,
  ) {}

  inBounds(cell: CellQuery): boolean {
    return this.spatial.inBounds(cell);
  }

  entity(id: EntityId): Readonly<EntityInstance> | undefined {
    const entity = this.entities.get(id);
    return entity ? readonlyView(entity) : undefined;
  }

  presencesAt(cell: CellQuery): readonly EntityPresence[] {
    return readonlyView(this.spatial.presencesAt(cell));
  }

  topPresenceAt(cell: CellQuery): EntityPresence | undefined {
    const presence = this.spatial.topPresenceAt(cell);
    return presence ? readonlyView(presence) : undefined;
  }

  presencesForEntity(entityId: EntityId): readonly EntityPresence[] {
    return readonlyView(this.spatial.presencesForEntity(entityId));
  }

  entityFacts(entityId: EntityId): readonly string[] {
    return readonlyView(this.spatial.factsForEntity(entityId));
  }

  presenceHasFact(presence: EntityPresence, fact: string): boolean {
    this.facts.require(fact);
    return presence.facts.includes(fact);
  }

  presenceMatchesSelector(
    presence: EntityPresence,
    selector: EntitySelector,
  ): boolean {
    return this.spatial.presenceMatchesSelector(presence, selector);
  }

  hasSelectorAt(cell: CellQuery, selector: EntitySelector): boolean {
    return this.spatial.presencesAt(cell).some((presence) =>
      this.spatial.presenceMatchesSelector(presence, selector)
    );
  }

  hasFactAt(cell: CellQuery, fact: FactId): boolean {
    this.facts.require(fact);
    return this.spatial.hasFactAt(cell, fact);
  }

  global(): Readonly<GlobalState> {
    return readonlyView(this.globalState());
  }

  motionForEntity(entityId: EntityId): Readonly<WorldMotion> | undefined {
    const motion = this.motions?.forEntity(entityId);
    return motion ? readonlyView(motion) : undefined;
  }

  entityHasFact(entityId: EntityId, fact: FactId): boolean {
    this.facts.require(fact);
    return this.spatial.entityHasFact(entityId, fact);
  }

  entitiesWithFact(fact: FactId): readonly EntityInstance[] {
    this.facts.require(fact);
    return this.entitiesMatching({ kind: "fact", value: fact });
  }

  entitiesMatching(selector: EntitySelector): readonly EntityInstance[] {
    return readonlyView(this.spatial.entityIdsMatching(selector)
      .map((id) => this.entities.require(id)));
  }

  entityCountMatching(selector: EntitySelector): number {
    return this.spatial.entityCountMatching(selector);
  }
}
