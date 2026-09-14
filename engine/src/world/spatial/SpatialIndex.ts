import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../entity/EntityInstance.js";
import type { EntityPresence } from "./EntityPresence.js";
import { resolveFootprintCells } from "./Footprint.js";
import { EntitySelectorIndex } from "./EntitySelectorIndex.js";
import type { EntitySelector } from "./EntitySelector.js";
import { EntityFactProjection } from "../entity/EntityFactProjection.js";
import type { FactId, FactRegistry } from "../../fact/FactRegistry.js";

export class SpatialIndex {
  private readonly cells = new Map<string, EntityPresence[]>();
  private readonly byEntity = new Map<EntityId, EntityPresence[]>();
  private readonly entityFacts = new Map<EntityId, readonly FactId[]>();
  private readonly selectors = new EntitySelectorIndex();
  private readonly factProjection: EntityFactProjection;

  constructor(
    private readonly entities: EntityStore,
    private readonly registry: EntityRegistry,
    readonly width: number,
    readonly height: number,
    facts: FactRegistry,
  ) {
    this.factProjection = new EntityFactProjection(facts);
    this.rebuild();
  }

  inBounds(cell: CellPosition): boolean {
    return (
      cell.x >= 0 &&
      cell.y >= 0 &&
      cell.x < this.width &&
      cell.y < this.height
    );
  }

  presencesAt(cell: CellPosition): readonly EntityPresence[] {
    return this.cells.get(key(cell)) ?? [];
  }

  topPresenceAt(cell: CellPosition): EntityPresence | undefined {
    return this.presencesAt(cell).at(-1);
  }

  presencesForEntity(entityId: EntityId): readonly EntityPresence[] {
    return this.byEntity.get(entityId) ?? [];
  }

  factsForEntity(entityId: EntityId): readonly FactId[] {
    return this.entityFacts.get(entityId) ?? [];
  }

  hasEntityFact(entityId: EntityId, fact: FactId): boolean {
    return this.factsForEntity(entityId).includes(fact);
  }

  entityHasFact(entityId: EntityId, fact: FactId): boolean {
    return this.hasEntityFact(entityId, fact) ||
      this.presencesForEntity(entityId).some((presence) =>
        presence.facts.includes(fact),
      );
  }

  presenceMatchesSelector(
    presence: EntityPresence,
    selector: EntitySelector,
  ): boolean {
    const entity = this.entities.require(presence.entityId);
    switch (selector.kind) {
      case "type":
        return entity.type === selector.value;
      case "fact":
        return this.hasEntityFact(entity.id, selector.value) ||
          presence.facts.includes(selector.value);
      case "any":
        return selector.selectors.some((item) =>
          this.presenceMatchesSelector(presence, item)
        );
    }
  }

  hasFactAt(cell: CellPosition, fact: FactId): boolean {
    return this.presencesAt(cell).some((presence) =>
      presence.facts.includes(fact),
    );
  }

  entityIdsWithFact(fact: FactId): readonly EntityId[] {
    return this.selectors.withFact(fact);
  }

  entityIdsMatching(selector: EntitySelector): readonly EntityId[] {
    return this.selectors.matching(selector);
  }

  entityIdsOfType(type: string): readonly EntityId[] {
    return this.selectors.ofType(type);
  }

  entityCountWithFact(fact: FactId): number {
    return this.selectors.countWithFact(fact);
  }

  entityCountMatching(selector: EntitySelector): number {
    return this.selectors.countMatching(selector);
  }

  moveEntity(entityId: EntityId, anchor: CellPosition): void {
    const entity = this.entities.require(entityId);
    this.removeEntity(entityId);
    entity.anchor = { ...anchor };
    this.addEntity(entity);
  }

  rebuildEntity(entityId: EntityId): void {
    const entity = this.entities.require(entityId);
    this.removeEntity(entityId);
    this.addEntity(entity);
  }

  rebuild(): void {
    this.cells.clear();
    this.byEntity.clear();
    this.entityFacts.clear();
    this.selectors.clear();
    for (const entity of this.entities.all()) this.addEntity(entity);
  }

  addEntity(entity: EntityInstance): void {
    const definition = this.registry.require(entity.type);
    const resolved = resolveFootprintCells(entity, definition.footprint);
    const entityFacts = this.factProjection.entityFacts(entity, definition);
    const presences: EntityPresence[] = [];
    const baseStackOrder = entity.stackOrder ?? definition.stackOrder ?? 0;
    const layer = definition.layer ?? "object";
    resolved.forEach((part, index) => {
      const cell = { x: part.x, y: part.y };
      if (!this.inBounds(cell)) {
        throw new Error(
          `Entity ${entity.type}#${entity.id} footprint 超出地图：${cell.x},${cell.y}`,
        );
      }
      const facts = this.factProjection.presenceFacts(entity, definition, part);
      const presence: EntityPresence = Object.freeze({
        entityId: entity.id,
        cell: Object.freeze(cell),
        layer,
        ...(part.role ? { role: part.role } : {}),
        facts: Object.freeze([...facts]),
        stackOrder: part.stackOrder ?? baseStackOrder + index,
      });
      presences.push(presence);
      const list = this.cells.get(key(cell)) ?? [];
      list.push(presence);
      list.sort(comparePresence);
      this.cells.set(key(cell), list);
    });
    this.byEntity.set(entity.id, presences);
    this.entityFacts.set(entity.id, entityFacts);
    this.selectors.add(entity, presences, entityFacts);
  }

  removeEntity(entityId: EntityId): void {
    const presences = this.byEntity.get(entityId) ?? [];
    for (const presence of presences) {
      const cellKey = key(presence.cell);
      const next = (this.cells.get(cellKey) ?? []).filter(
        (item) => item.entityId !== entityId,
      );
      if (next.length > 0) this.cells.set(cellKey, next);
      else this.cells.delete(cellKey);
    }
    this.byEntity.delete(entityId);
    this.entityFacts.delete(entityId);
    this.selectors.remove(entityId);
  }
}

function key(cell: CellPosition): string {
  return `${cell.x},${cell.y}`;
}

function comparePresence(a: EntityPresence, b: EntityPresence): number {
  return a.stackOrder - b.stackOrder || a.entityId - b.entityId;
}
