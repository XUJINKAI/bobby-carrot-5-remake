import type { LevelEntity } from "@bobby/model";
import {
  instantiateLevelEntity,
  instantiateSpawnSpec,
  type CellPosition,
  type EntityId,
  type EntityInstance,
  type EntitySpawnSpec,
} from "./EntityInstance.js";

export interface EntityStoreSnapshot {
  entities: EntityInstance[];
  nextEntityId: EntityId;
}

export interface EntityStoreMutationCheckpoint {
  readonly nextEntityId: EntityId;
  readonly entities: Map<EntityId, EntityInstance | null>;
}

/** 确定性 Entity identity 与实例状态存储。 */
export class EntityStore {
  private readonly entities = new Map<EntityId, EntityInstance>();
  private nextEntityId = 1;

  constructor(levelEntities: readonly LevelEntity[] = []) {
    for (const source of levelEntities) this.spawnLevelEntity(source);
  }

  all(): readonly EntityInstance[] {
    return [...this.entities.values()];
  }

  get(id: EntityId): EntityInstance | undefined {
    return this.entities.get(id);
  }

  require(id: EntityId): EntityInstance {
    const entity = this.entities.get(id);
    if (!entity) throw new Error(`未知 EntityId：${id}`);
    return entity;
  }

  spawnLevelEntity(source: LevelEntity): EntityInstance {
    const id = this.nextEntityId++;
    const entity = instantiateLevelEntity(id, source);
    this.entities.set(id, entity);
    return entity;
  }

  spawn(source: EntitySpawnSpec): EntityInstance {
    const id = this.nextEntityId++;
    const entity = instantiateSpawnSpec(id, source);
    this.entities.set(id, entity);
    return entity;
  }

  destroy(id: EntityId): boolean {
    return this.entities.delete(id);
  }

  move(id: EntityId, anchor: CellPosition): void {
    this.require(id).anchor = { ...anchor };
  }

  snapshot(): EntityStoreSnapshot {
    return {
      entities: structuredClone([...this.entities.values()]),
      nextEntityId: this.nextEntityId,
    };
  }

  restore(snapshot: EntityStoreSnapshot): void {
    this.entities.clear();
    for (const entity of structuredClone(snapshot.entities))
      this.entities.set(entity.id, entity);
    this.nextEntityId = snapshot.nextEntityId;
  }

  /**
   * Commit 正常路径只保存实际触碰的 Entity；失败恢复时再清理本次生成的 ID。
   * 这样事务原子性不会让每次移动都复制整张地图。
   */
  createMutationCheckpoint(): EntityStoreMutationCheckpoint {
    return {
      nextEntityId: this.nextEntityId,
      entities: new Map(),
    };
  }

  captureForMutation(
    checkpoint: EntityStoreMutationCheckpoint,
    id: EntityId,
  ): void {
    if (checkpoint.entities.has(id)) return;
    const entity = this.entities.get(id);
    checkpoint.entities.set(id, entity ? structuredClone(entity) : null);
  }

  restoreMutationCheckpoint(checkpoint: EntityStoreMutationCheckpoint): void {
    for (const id of [...this.entities.keys()]) {
      if (id >= checkpoint.nextEntityId) this.entities.delete(id);
    }
    for (const [id, entity] of checkpoint.entities) {
      if (entity) this.entities.set(id, structuredClone(entity));
      else this.entities.delete(id);
    }
    this.nextEntityId = checkpoint.nextEntityId;
  }
}
