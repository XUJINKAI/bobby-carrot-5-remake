import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "./EntityPresence.js";
import type { EntitySelector } from "./EntitySelector.js";

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
    presences: readonly EntityPresence[],
    entityFacts: readonly string[] = [],
  ): void {
    this.remove(entity.id);
    const facts = new Set([
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

  countMatching(selector: EntitySelector): number {
    return this.matching(selector).length;
  }

  matching(selector: EntitySelector): EntityId[] {
    switch (selector.kind) {
      case "type":
        return ordered(this.types.get(selector.value) ?? []);
      case "fact":
        return ordered(this.facts.get(selector.value) ?? []);
      case "type-or-fact":
        return ordered(new Set([
          ...(this.types.get(selector.value) ?? []),
          ...(this.facts.get(selector.value) ?? []),
        ]));
      case "any":
        return ordered(new Set(selector.selectors.flatMap((item) =>
          this.matching(item)
        )));
    }
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
