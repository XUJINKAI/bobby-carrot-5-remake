import type { WorldTick } from "../../time/WorldClock.js";
import type { WorldCommandApi } from "../behavior/CommandQueue.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { WorldIntent } from "../movement/WorldIntent.js";
import type { MoveResult } from "../WorldTypes.js";
import type {
  RuntimeActionId,
  RuntimeActionIntentRequest,
  RuntimeActionInputDisposition,
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

  /** owner-scoped lock 只阻塞对应 actor；无 owner 或 focus 仍是 world-level lock。 */
  isInputBlockedFor(entityId: EntityId): boolean {
    return [...this.actions.values()].some((action) => {
      if (action.focus !== undefined) return true;
      if (action.blocksInput !== true) return false;
      return action.ownerEntityId === undefined || action.ownerEntityId === entityId;
    });
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
  observeIntents(
    intents: readonly WorldIntent[],
    query: WorldQueryApi,
  ): RuntimeActionInputDisposition {
    let disposition: RuntimeActionInputDisposition = "retry";
    const ids = [...this.actions.keys()].sort((a, b) => a - b);
    for (const id of ids) {
      const action = this.actions.get(id);
      if (!action) continue;
      const definition = this.registry.require(action.kind);
      if (!definition.onIntent) continue;
      for (const intent of intents) {
        const current = definition.onIntent({ action, intent, query });
        if (current === "consumed") disposition = "consumed";
      }
    }
    return disposition;
  }

  update(
    time: WorldTick,
    query: WorldQueryApi,
    commands: WorldCommandApi,
    eligibleIds?: readonly RuntimeActionId[],
  ): RuntimeActionIntentRequest[] {
    const requests: RuntimeActionIntentRequest[] = [];
    const eligible = eligibleIds ? new Set(eligibleIds) : null;
    const ids = [...this.actions.keys()]
      .filter((id) => eligible?.has(id) ?? true)
      .sort((a, b) => a - b);
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
        requests.push(
          ...result.intents.map((intent) => ({
            actionId: id,
            intent: structuredClone(intent),
          })),
        );
      if (status === "complete") this.actions.delete(id);
    }
    return requests;
  }

  resolveIntentResults(
    requests: readonly RuntimeActionIntentRequest[],
    results: readonly MoveResult[],
    query: WorldQueryApi,
    commands: WorldCommandApi,
  ): void {
    if (requests.length !== results.length)
      throw new Error("RuntimeAction intent 与 MoveResult 数量不一致");
    requests.forEach((request, index) => {
      const action = this.actions.get(request.actionId);
      if (!action) return;
      const definition = this.registry.require(action.kind);
      definition.onIntentResult?.({
        action,
        intent: structuredClone(request.intent),
        result: structuredClone(results[index]!),
        query,
        commands,
      });
    });
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
