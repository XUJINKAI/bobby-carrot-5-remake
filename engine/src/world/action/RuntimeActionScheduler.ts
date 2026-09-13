import type { WorldTick } from "../../time/WorldClock.js";
import type { WorldCommandApi } from "../behavior/CommandQueue.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { WorldIntent } from "../movement/WorldIntent.js";
import type { MoveResult } from "../WorldTypes.js";
import type {
  RuntimeActionCancelReason,
  RuntimeActionId,
  RuntimeActionIntentRequest,
  RuntimeActionIntentObservation,
  RuntimeActionInputDisposition,
  RuntimeActionInstance,
  RuntimeActionSchedulerSnapshot,
  RuntimeActionSpec,
} from "./RuntimeAction.js";
import type { RuntimeActionRegistry } from "./RuntimeActionRegistry.js";

/** 固定顺序、单线程推进 RuntimeAction；并发是 gameplay 语义，不是 Promise 并发。 */
export class RuntimeActionScheduler {
  private readonly actions = new Map<RuntimeActionId, RuntimeActionInstance>();
  /** complete + intents 后停止 update，只等待已发出的权威结果结算。 */
  private readonly settling = new Map<RuntimeActionId, number>();
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

  cancel(
    id: RuntimeActionId,
    context?: {
      query: WorldQueryApi;
      commands: WorldCommandApi;
      reason: RuntimeActionCancelReason;
    },
  ): boolean {
    const action = this.actions.get(id);
    if (!action) return false;
    if (context)
      this.registry.require(action.kind).onCancel?.({
        action,
        reason: context.reason,
        query: context.query,
        commands: context.commands,
      });
    this.settling.delete(id);
    this.actions.delete(id);
    return true;
  }

  cancelOwnedBy(
    entityId: EntityId,
    context?: {
      query: WorldQueryApi;
      commands: WorldCommandApi;
      reason: RuntimeActionCancelReason;
    },
  ): RuntimeActionId[] {
    const ids = [...this.actions.values()]
      .filter((action) => action.ownerEntityId === entityId)
      .map((action) => action.id)
      .sort((a, b) => a - b);
    return ids.filter((id) => this.cancel(id, context));
  }

  /** Input lock prevents movement, not observation by the gameplay process that owns the lock. */
  observeIntents(
    intents: readonly WorldIntent[],
    query: WorldQueryApi,
  ): RuntimeActionInputDisposition {
    return this.observeIntentsWithEffects(intents, query).disposition;
  }

  observeIntentsWithEffects(
    intents: readonly WorldIntent[],
    query: WorldQueryApi,
  ): RuntimeActionIntentObservation {
    let disposition: RuntimeActionInputDisposition = "retry";
    let stateChanged = false;
    const ids = [...this.actions.keys()].sort((a, b) => a - b);
    for (const id of ids) {
      if (this.settling.has(id)) continue;
      const action = this.actions.get(id);
      if (!action) continue;
      const definition = this.registry.require(action.kind);
      if (!definition.onIntent) continue;
      const stateBefore = JSON.stringify(action.state);
      for (const intent of intents) {
        const current = definition.onIntent({ action, intent, query });
        if (current === "consumed") disposition = "consumed";
      }
      if (JSON.stringify(action.state) !== stateBefore) stateChanged = true;
    }
    return { disposition, stateChanged };
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
      .filter((id) => (eligible?.has(id) ?? true) && !this.settling.has(id))
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
      const intents =
        typeof result === "object" && result?.intents ? result.intents : [];
      if (intents.length > 0)
        requests.push(
          ...intents.map((intent) => ({
            actionId: id,
            intent: structuredClone(intent),
          })),
        );
      if (status !== "complete") continue;
      if (intents.length > 0) this.settling.set(id, intents.length);
      else this.actions.delete(id);
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
      const pendingResults = this.settling.get(request.actionId);
      if (pendingResults === undefined) return;
      if (pendingResults > 1) {
        this.settling.set(request.actionId, pendingResults - 1);
        return;
      }
      this.settling.delete(request.actionId);
      this.actions.delete(request.actionId);
    });
  }

  snapshot(): RuntimeActionSchedulerSnapshot {
    return {
      nextId: this.nextIdValue,
      actions: this.active.map((action) => structuredClone(action)),
      settling: [...this.settling.entries()]
        .sort(([left], [right]) => left - right)
        .map(([actionId, pendingResults]) => ({ actionId, pendingResults })),
    };
  }

  restore(snapshot: RuntimeActionSchedulerSnapshot): void {
    this.actions.clear();
    this.settling.clear();
    this.nextIdValue = Math.max(1, Math.floor(snapshot.nextId));
    for (const action of snapshot.actions)
      this.actions.set(action.id, structuredClone(action));
    for (const settlement of snapshot.settling ?? []) {
      if (!this.actions.has(settlement.actionId)) continue;
      const pendingResults = Math.max(0, Math.floor(settlement.pendingResults));
      if (pendingResults > 0)
        this.settling.set(settlement.actionId, pendingResults);
    }
  }

  clear(): void {
    this.actions.clear();
    this.settling.clear();
    this.nextIdValue = 1;
  }
}
