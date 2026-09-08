import {
  EntityStore,
  SpatialIndex,
  type EntityCatalog,
  type EntityCatalogEntry,
  type EntityId,
  type EntityPresence,
} from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import { editorCatalogEntry } from "../definitions/entities.js";
import type { EditorMap, EntityRef } from "../level/types.js";

export interface EditorPresenceInspection {
  ref: EntityRef;
  entity: LevelEntity;
  definition: EntityCatalogEntry;
  presence: EntityPresence;
}

export interface EditorCellInspection {
  x: number;
  y: number;
  presences: readonly EditorPresenceInspection[];
  top: EditorPresenceInspection | null;
}

/** Editor 的 Entity/Cell 只读空间视图，只依赖 Engine 通用 Entity/Spatial API。 */
export class EditorPreview {
  readonly entities: EntityStore;
  readonly spatial: SpatialIndex;
  private readonly refByEntityId = new Map<EntityId, EntityRef>();
  private readonly entityIdByRef = new Map<number, EntityId>();

  constructor(
    readonly level: EditorMap,
    readonly catalog: EntityCatalog,
  ) {
    this.entities = new EntityStore(level.entities);
    const runtimeEntities = this.entities.all();
    level.entities.forEach((_source, index) => {
      const entity = runtimeEntities[index];
      if (!entity)
        throw new Error(`Editor Preview 无法实例化 Entity：${index}`);
      const ref = { index };
      this.refByEntityId.set(entity.id, ref);
      this.entityIdByRef.set(index, entity.id);
    });
    this.spatial = new SpatialIndex(
      this.entities,
      catalog.entities,
      level.width,
      level.height,
    );
  }

  inspectCell(x: number, y: number): EditorCellInspection {
    const presences = this.spatial
      .presencesAt({ x, y })
      .map((presence) => this.inspectPresence(presence));
    return { x, y, presences, top: presences.at(-1) ?? null };
  }

  presencesFor(ref: EntityRef): readonly EditorPresenceInspection[] {
    const entityId = this.entityIdByRef.get(ref.index);
    if (entityId === undefined) return [];
    return this.spatial
      .presencesForEntity(entityId)
      .map((presence) => this.inspectPresence(presence));
  }

  private inspectPresence(
    presence: EntityPresence,
  ): EditorPresenceInspection {
    const ref = this.refByEntityId.get(presence.entityId);
    if (!ref)
      throw new Error(`Editor Preview 缺少 EntityRef：${presence.entityId}`);
    const entity = this.level.entities[ref.index];
    if (!entity)
      throw new Error(`Editor Preview EntityRef 越界：${ref.index}`);
    return {
      ref,
      entity,
      definition: editorCatalogEntry(this.catalog, entity),
      presence,
    };
  }
}
