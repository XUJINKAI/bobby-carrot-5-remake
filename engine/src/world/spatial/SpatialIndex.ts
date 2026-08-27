import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../entity/EntityInstance.js";
import { SINGLE_CELL_FOOTPRINT } from "./Footprint.js";
import type { EntityPresence } from "./EntityPresence.js";
import { stackBandOrder } from "./StackBand.js";

function cellKey(cell: CellPosition): string {
  return `${cell.x},${cell.y}`;
}

/** 根据 EntityDefinition footprint 派生并索引所有 Cell Presence。 */
export class SpatialIndex {
  private readonly cells = new Map<string, EntityPresence[]>();
  private readonly entityCells = new Map<EntityId, string[]>();

  constructor(
    private readonly entities: EntityStore,
    private readonly registry: EntityRegistry,
    private readonly width: number,
    private readonly height: number,
  ) {
    this.rebuildAll();
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
    return this.cells.get(cellKey(cell)) ?? [];
  }

  presencesForEntity(entityId: EntityId): readonly EntityPresence[] {
    const result: EntityPresence[] = [];
    for (const key of this.entityCells.get(entityId) ?? []) {
      const presence = (this.cells.get(key) ?? []).find(
        (candidate) => candidate.entityId === entityId,
      );
      if (presence) result.push(presence);
    }
    return result;
  }

  topPresenceAt(cell: CellPosition): EntityPresence | undefined {
    return this.presencesAt(cell).at(-1);
  }

  hasTraitAt(cell: CellPosition, trait: EntityTrait): boolean {
    return this.presencesAt(cell).some((presence) =>
      presence.traits.includes(trait),
    );
  }

  addEntity(entity: EntityInstance): void {
    this.indexEntity(entity);
  }

  removeEntity(entityId: EntityId): void {
    for (const key of this.entityCells.get(entityId) ?? []) {
      const remaining = (this.cells.get(key) ?? []).filter(
        (presence) => presence.entityId !== entityId,
      );
      if (remaining.length > 0) this.cells.set(key, remaining);
      else this.cells.delete(key);
    }
    this.entityCells.delete(entityId);
  }

  moveEntity(entityId: EntityId, anchor: CellPosition): void {
    this.removeEntity(entityId);
    this.entities.move(entityId, anchor);
    this.indexEntity(this.entities.require(entityId));
  }

  rebuildEntity(entityId: EntityId): void {
    this.removeEntity(entityId);
    this.indexEntity(this.entities.require(entityId));
  }

  rebuildAll(): void {
    this.cells.clear();
    this.entityCells.clear();
    for (const entity of this.entities.all()) this.indexEntity(entity);
  }

  private indexEntity(entity: EntityInstance): void {
    const definition = this.registry.require(entity.type);
    const footprint = definition.footprint ?? SINGLE_CELL_FOOTPRINT;
    const keys: string[] = [];

    for (const part of footprint.parts) {
      const cell = {
        x: entity.anchor.x + part.dx,
        y: entity.anchor.y + part.dy,
      };
      if (!this.inBounds(cell)) continue;

      const traits = [
        ...new Set([
          ...definition.traits,
          ...(entity.instanceTraits ?? []),
          ...(part.traits ?? []),
        ]),
      ];
      const presence: EntityPresence = {
        entityId: entity.id,
        cell,
        ...(part.role ? { role: part.role } : {}),
        traits,
        stackBand: part.stackBand ?? definition.stackBand,
        stackOrder: part.stackOrder ?? definition.stackOrder ?? 0,
      };
      const key = cellKey(cell);
      const stack = this.cells.get(key) ?? [];
      stack.push(presence);
      stack.sort(comparePresence);
      this.cells.set(key, stack);
      keys.push(key);
    }

    this.entityCells.set(entity.id, keys);
  }
}

function comparePresence(a: EntityPresence, b: EntityPresence): number {
  return (
    stackBandOrder(a.stackBand) - stackBandOrder(b.stackBand) ||
    a.stackOrder - b.stackOrder ||
    a.entityId - b.entityId
  );
}
