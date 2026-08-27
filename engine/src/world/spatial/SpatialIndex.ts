import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type { CellPosition, EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "./EntityPresence.js";
import { footprintCell, SINGLE_CELL_FOOTPRINT } from "./Footprint.js";
import { stackBandRank } from "./StackBand.js";

export class SpatialIndex {
  private readonly cells = new Map<string, EntityPresence[]>();
  private readonly byEntity = new Map<EntityId, EntityPresence[]>();

  constructor(
    private readonly entities: EntityStore,
    private readonly registry: EntityRegistry,
    readonly width: number,
    readonly height: number,
  ) {
    this.rebuild();
  }

  inBounds(cell: CellPosition): boolean {
    return cell.x >= 0 && cell.y >= 0 && cell.x < this.width && cell.y < this.height;
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

  hasTraitAt(cell: CellPosition, trait: EntityTrait): boolean {
    return this.presencesAt(cell).some((presence) => presence.traits.includes(trait));
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
    for (const entity of this.entities.all()) this.addEntity(entity);
  }

  addEntity(entity: EntityInstance): void {
    const definition = this.registry.require(entity.type);
    const footprint = definition.footprint ?? SINGLE_CELL_FOOTPRINT;
    const presences: EntityPresence[] = [];
    footprint.parts.forEach((part, index) => {
      const cell = footprintCell(entity, footprint, part);
      if (!this.inBounds(cell))
        throw new Error(`Entity ${entity.type}#${entity.id} footprint 超出地图：${cell.x},${cell.y}`);
      const traits = [...new Set([
        ...definition.traits,
        ...(entity.instanceTraits ?? []),
        ...(part.traits ?? []),
      ])];
      const presence: EntityPresence = {
        entityId: entity.id,
        cell,
        ...(part.role ? { role: part.role } : {}),
        traits,
        stackBand: part.stackBand ?? definition.stackBand,
        stackOrder: part.stackOrder ?? index,
      };
      presences.push(presence);
      const list = this.cells.get(key(cell)) ?? [];
      list.push(presence);
      list.sort(comparePresence);
      this.cells.set(key(cell), list);
    });
    this.byEntity.set(entity.id, presences);
  }

  removeEntity(entityId: EntityId): void {
    const presences = this.byEntity.get(entityId) ?? [];
    for (const presence of presences) {
      const cellKey = key(presence.cell);
      const next = (this.cells.get(cellKey) ?? []).filter((item) => item.entityId !== entityId);
      if (next.length) this.cells.set(cellKey, next);
      else this.cells.delete(cellKey);
    }
    this.byEntity.delete(entityId);
  }
}

function key(cell: CellPosition): string {
  return `${cell.x},${cell.y}`;
}

function comparePresence(a: EntityPresence, b: EntityPresence): number {
  return (
    stackBandRank(a.stackBand) - stackBandRank(b.stackBand) ||
    a.stackOrder - b.stackOrder ||
    a.entityId - b.entityId
  );
}
