import type { JsonValue } from "@bobby/model";
import type { EntityId } from "../entity/EntityInstance.js";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "./RuntimeAction.js";
import { RuntimeActionRegistry } from "./RuntimeActionRegistry.js";

export const DELAY_RUNTIME_ACTION = "delay";

const delayAction: RuntimeActionDefinition = {
  kind: DELAY_RUNTIME_ACTION,
  update({ action, time }) {
    const durationMs = numberState(action.state.durationMs);
    const elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    // 以最近的 World step 表示 ms 时长，避免改变 worldHz 后按“固定 tick 数”加减速。
    return elapsedMs + time.stepMs / 2 >= durationMs ? "complete" : "running";
  },
};

export function createBuiltinRuntimeActionRegistry(): RuntimeActionRegistry {
  const registry = new RuntimeActionRegistry();
  registry.register(delayAction);
  return registry;
}

export function createDelayRuntimeAction(
  durationMs: number,
  options: {
    ownerEntityId?: EntityId;
    blocksInput?: boolean;
    cameraTarget?: EntityId;
    reason?: string;
  } = {},
): RuntimeActionSpec {
  const state: Record<string, JsonValue> = {
    durationMs: Math.max(0, Number.isFinite(durationMs) ? durationMs : 0),
    elapsedMs: 0,
  };
  if (options.reason) state.reason = options.reason;
  return {
    kind: DELAY_RUNTIME_ACTION,
    ...(options.ownerEntityId !== undefined
      ? { ownerEntityId: options.ownerEntityId }
      : {}),
    ...(options.blocksInput !== undefined
      ? { blocksInput: options.blocksInput }
      : {}),
    ...(options.cameraTarget !== undefined
      ? { cameraTarget: options.cameraTarget }
      : {}),
    state,
  };
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
