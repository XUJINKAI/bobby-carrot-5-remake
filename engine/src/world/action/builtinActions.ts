import type { Direction, JsonValue } from "@bobby/model";
import type { EntityId } from "../entity/EntityInstance.js";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "./RuntimeAction.js";
import { RuntimeActionRegistry } from "./RuntimeActionRegistry.js";

export const DELAY_RUNTIME_ACTION = "delay";
export const DELAYED_MOVE_RUNTIME_ACTION = "delayed-move";

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

const delayedMoveAction: RuntimeActionDefinition = {
  kind: DELAYED_MOVE_RUNTIME_ACTION,
  update({ action, time, query }) {
    const ownerEntityId = action.ownerEntityId;
    if (ownerEntityId === undefined || !query.entity(ownerEntityId))
      return "complete";

    const durationMs = numberState(action.state.durationMs);
    const elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs + time.stepMs / 2 < durationMs) return "running";

    const direction = directionState(action.state.direction);
    if (!direction) return "complete";
    const mechanism = stringState(action.state.mechanism);
    const sourceEntityId = positiveIntegerState(action.state.sourceEntityId);
    return {
      status: "complete",
      intents: [
        {
          type: "move",
          actorId: ownerEntityId,
          direction,
          cause: {
            type: "forced",
            ...(sourceEntityId !== null ? { sourceEntityId } : {}),
            ...(mechanism ? { mechanism } : {}),
            cadenceMs: durationMs,
          },
        },
      ],
    };
  },
};

export function createBuiltinRuntimeActionRegistry(): RuntimeActionRegistry {
  const registry = new RuntimeActionRegistry();
  registry.register(delayAction);
  registry.register(delayedMoveAction);
  return registry;
}

export function createDelayRuntimeAction(
  durationMs: number,
  options: {
    ownerEntityId?: EntityId;
    blocksInput?: boolean;
    focus?: { entityId: EntityId };
    reason?: string;
  } = {},
): RuntimeActionSpec {
  const state: Record<string, JsonValue> = {
    durationMs: safeDuration(durationMs),
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
    ...(options.focus ? { focus: structuredClone(options.focus) } : {}),
    state,
  };
}

export function createDelayedMoveRuntimeAction(
  ownerEntityId: EntityId,
  direction: Direction,
  durationMs: number,
  options: {
    mechanism?: string;
    sourceEntityId?: EntityId;
    blocksInput?: boolean;
    focus?: { entityId: EntityId };
  } = {},
): RuntimeActionSpec {
  const state: Record<string, JsonValue> = {
    direction,
    durationMs: safeDuration(durationMs),
    elapsedMs: 0,
  };
  if (options.mechanism) state.mechanism = options.mechanism;
  if (options.sourceEntityId !== undefined)
    state.sourceEntityId = options.sourceEntityId;
  return {
    kind: DELAYED_MOVE_RUNTIME_ACTION,
    ownerEntityId,
    blocksInput: options.blocksInput ?? true,
    ...(options.focus ? { focus: structuredClone(options.focus) } : {}),
    state,
  };
}

function safeDuration(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringState(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function positiveIntegerState(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function directionState(value: JsonValue | undefined): Direction | null {
  return value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
    ? value
    : null;
}
