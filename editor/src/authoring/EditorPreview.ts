import {
  EntityStore,
  SpatialIndex,
  type EntityDefinition,
  type EntityId,
  type EntityPresence,
  type EntityRegistry,
} from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import type { EditorLevel, EntityRef } from "../level/types.js";

export interface EditorPresenceInspection {
  ref: EntityRef;
  entity: LevelEntity;
  definition: EntityDefinition;
  presence: EntityPresence;
}

export interface EditorCellInspection {
  x: number;
  y: number;
  presences: readonly EditorPresenceInspection[];
  top: EditorPresenceInspection | null;
}

/**
 * Editor 的 Entity/Cell 只读空间视图。
 * persisted EntityRef 与 runtime EntityId 的映射只存在于本 preview 实例。
 */
export class EditorPreview {
  readonly entities = new EntityStore();
  readonly spatial: SpatialIndex;
  private readonly refByEntityId = new Map<EntityId, EntityRef>();
  private readonly entityIdByRef = new Map<number, EntityId>();

  constructor(
    readonly level: EditorLevel,
    readonly registry: EntityRegistry,
  ) {
    level.entities.forEach((source, index) => {
      const entity = this.entities.spawn(source);
      const ref = { index };
      this.refByEntityId.set(entity.id, ref);
      this.entityIdByRef.set(index, entity.id);
    });
    this.spatial = new SpatialIndex(
      this.entities,
      registry,
      level.width,
      level.height,
    );
  }

  inspectCell(x: number, y: number): EditorCellInspection {
    const presences = this.spatial.presencesAt({ x, y }).map((presence) =>
      this.inspectPresence(presence),
    );
    return {
      x,
      y,
      presences,
      top: presences.at(-1) ?? null,
    };
  }

  presencesFor(ref: EntityRef): readonly EditorPresenceInspection[] {
    const entityId = this.entityIdByRef.get(ref.index);
    if (entityId === undefined) return [];
    return this.spatial
      .presencesForEntity(entityId)
      .map((presence) => this.inspectPresence(presence));
  }

  private inspectPresence(presence: EntityPresence): EditorPresenceInspection {
    const ref = this.refByEntityId.get(presence.entityId);
    if (!ref) throw new Error(`Editor Preview 缺少 EntityRef：${presence.entityId}`);
    const entity = this.level.entities[ref.index];
    if (!entity) throw new Error(`Editor Preview EntityRef 越界：${ref.index}`);
    return {
      ref,
      entity,
      definition: this.registry.require(entity.type),
      presence,
    };
  }
}
