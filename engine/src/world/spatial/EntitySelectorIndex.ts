import type { EntityDefinition } from "../entity/EntityDefinition.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "./EntityPresence.js";

/** 与空间 Presence 同步维护语义索引；多格 Fact 按 Entity 去重。 */
export class EntitySelectorIndex {
  private readonly facts = new Map<string, Set<EntityId>>();
  private readonly types = new Map<string, Set<EntityId>>();
  private readonly entries = new Map<EntityId, { type: string; facts: Set<string> }>();

  clear(): void {
    this.facts.clear();
    this.types.clear();
    this.entries.clear();
  }

  add(
    entity: EntityInstance,
    definition: EntityDefinition,
    presences: readonly EntityPresence[],
    entityFacts: readonly string[] = [],
  ): void {
    this.remove(entity.id);
    const facts = new Set([
      ...definition.facts,
      ...(entity.instanceFacts ?? []),
      ...entityFacts,
      ...presences.flatMap((presence) => [...presence.facts]),
    ]);
    this.entries.set(entity.id, { type: entity.type, facts });
    addTo(this.types, entity.type, entity.id);
    for (const fact of facts) addTo(this.facts, fact, entity.id);
  }

  remove(id: EntityId): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    removeFrom(this.types, entry.type, id);
    for (const fact of entry.facts) removeFrom(this.facts, fact, id);
    this.entries.delete(id);
  }

  withFact(fact: string): EntityId[] {
    return ordered(this.facts.get(fact) ?? []);
  }

  ofType(type: string): EntityId[] {
    return ordered(this.types.get(type) ?? []);
  }

  countWithFact(fact: string): number {
    return this.facts.get(fact)?.size ?? 0;
  }

  countMatching(selector: string): number {
    const types = this.types.get(selector);
    const facts = this.facts.get(selector);
    if (!types) return facts?.size ?? 0;
    if (!facts) return types.size;
    // 联合 selector 按 Entity 去重；计数只检查较小集合的交集。
    const smaller = types.size <= facts.size ? types : facts;
    const larger = smaller === types ? facts : types;
    let count = types.size + facts.size;
    for (const id of smaller) {
      if (larger.has(id)) count -= 1;
    }
    return count;
  }

  matching(selector: string): EntityId[] {
    return ordered(new Set([
      ...(this.types.get(selector) ?? []),
      ...(this.facts.get(selector) ?? []),
    ]));
  }
}

function ordered(ids: Iterable<EntityId>): EntityId[] {
  // 移动会重新插入索引；查询仍保持确定性 identity 顺序，尤其是多玩家默认目标。
  return [...ids].sort((a, b) => a - b);
}

function addTo(index: Map<string, Set<EntityId>>, key: string, id: EntityId): void {
  const ids = index.get(key) ?? new Set<EntityId>();
  ids.add(id);
  index.set(key, ids);
}

function removeFrom(index: Map<string, Set<EntityId>>, key: string, id: EntityId): void {
  const ids = index.get(key);
  ids?.delete(id);
  if (ids?.size === 0) index.delete(key);
}
