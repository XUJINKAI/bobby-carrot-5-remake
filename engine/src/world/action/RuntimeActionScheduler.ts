import type { WorldTick } from "../../time/WorldClock.js";
import type { WorldCommandApi } from "../behavior/CommandQueue.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { WorldIntent } from "../movement/WorldIntent.js";
import type {
  RuntimeActionId,
  RuntimeActionInstance,
  RuntimeActionSchedulerSnapshot,
  RuntimeActionSpec,
} from "./RuntimeAction.js";
import type { RuntimeActionRegistry } from "./RuntimeActionRegistry.js";

/** 固定顺序、单线程推进 RuntimeAction；并发是 gameplay 语义，不是 Promise 并发。 */
export class RuntimeActionScheduler {
  private readonly actions = new Map<RuntimeActionId, RuntimeActionInstance>();
  private nextIdValue = 1;

  constructor(private readonly registry: RuntimeActionRegistry) {}

  get active(): readonly RuntimeActionInstance[] {
    return [...this.actions.values()]
      .sort((a, b) => a.id - b.id)
      .map((action) => structuredClone(action));
  }

  get inputBlocked(): boolean {
    return [...this.actions.values()].some(
      (action) => action.blocksInput === true || action.focus !== undefined,
    );
  }

  /** 第一个声明 focus 的活跃 Action 获得镜头；顺序按稳定 action id。 */
  get cameraTarget(): EntityId | null {
    for (const action of [...this.actions.values()].sort((a, b) => a.id - b.id)) {
      if (action.focus) return action.focus.entityId;
    }
    return null;
  }

  start(spec: RuntimeActionSpec): RuntimeActionId {
    this.registry.require(spec.kind);
    const id = this.nextIdValue;
    this.nextIdValue += 1;
    this.actions.set(id, {
      id,
      kind: spec.kind,
      ...(spec.ownerEntityId !== undefined
        ? { ownerEntityId: spec.ownerEntityId }
        : {}),
      ...(spec.blocksInput !== undefined ? { blocksInput: spec.blocksInput } : {}),
      ...(spec.focus ? { focus: structuredClone(spec.focus) } : {}),
      state: structuredClone(spec.state ?? {}),
    });
    return id;
  }

  cancel(id: RuntimeActionId): void {
    this.actions.delete(id);
  }

  cancelOwnedBy(entityId: EntityId): void {
    for (const action of this.actions.values()) {
      if (action.ownerEntityId === entityId) this.actions.delete(action.id);
    }
  }

  /** Input lock prevents movement, not observation by the gameplay process that owns the lock. */
  observeIntents(intents: readonly WorldIntent[], query: WorldQueryApi): void {
    const ids = [...this.actions.keys()].sort((a, b) => a - b);
    for (const id of ids) {
      const action = this.actions.get(id);
      if (!action) continue;
      const definition = this.registry.require(action.kind);
      if (!definition.onIntent) continue;
      for (const intent of intents)
        definition.onIntent({ action, intent, query });
    }
  }

  update(
    time: WorldTick,
    query: WorldQueryApi,
    commands: WorldCommandApi,
  ): WorldIntent[] {
    const intents: WorldIntent[] = [];
    const ids = [...this.actions.keys()].sort((a, b) => a - b);
    for (const id of ids) {
      const action = this.actions.get(id);
      if (!action) continue;
      const result = this.registry.require(action.kind).update({
        action,
        time,
        query,
        commands,
      });
      const status = typeof result === "string" ? result : result?.status;
      if (typeof result === "object" && result?.intents)
        intents.push(...result.intents.map((intent) => structuredClone(intent)));
      if (status === "complete") this.actions.delete(id);
    }
    return intents;
  }

  snapshot(): RuntimeActionSchedulerSnapshot {
    return {
      nextId: this.nextIdValue,
      actions: this.active.map((action) => structuredClone(action)),
    };
  }

  restore(snapshot: RuntimeActionSchedulerSnapshot): void {
    this.actions.clear();
    this.nextIdValue = Math.max(1, Math.floor(snapshot.nextId));
    for (const action of snapshot.actions)
      this.actions.set(action.id, structuredClone(action));
  }

  clear(): void {
    this.actions.clear();
    this.nextIdValue = 1;
  }
}
