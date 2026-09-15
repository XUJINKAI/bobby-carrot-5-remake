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
}
