import type { JsonValue } from "@bobby/model";
import type { WorldTick } from "../../time/WorldClock.js";
import type { WorldCommandApi } from "../behavior/CommandQueue.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { WorldIntent } from "../movement/WorldIntent.js";

export type RuntimeActionId = number;
export type RuntimeActionState = Record<string, JsonValue>;

export interface RuntimeActionFocus {
  entityId: EntityId;
}

/** 创建一个跨多个 WorldTick 持续存在的 gameplay 过程。 */
export interface RuntimeActionSpec {
  kind: string;
  ownerEntityId?: EntityId;
  /** 普通 gameplay lock；无需改变镜头。 */
  blocksInput?: boolean;
  /** 原版规则：Action 获取镜头焦点时，controlled input 必然同时被锁定。 */
  focus?: RuntimeActionFocus;
  state?: RuntimeActionState;
}

/** RuntimeAction 是 gameplay state，可进入 World snapshot；不是 Promise，也不是表现动画。 */
export interface RuntimeActionInstance extends RuntimeActionSpec {
  id: RuntimeActionId;
  state: RuntimeActionState;
}

export interface RuntimeActionContext {
  readonly action: RuntimeActionInstance;
  readonly time: WorldTick;
  readonly query: WorldQueryApi;
  readonly commands: WorldCommandApi;
}

/**
 * gameplay lock 期间的 controlled intent 仍可被 Action 观察，例如 Speed 逐格判断
 * 当前 full 格是否收到正确输入。这里只允许修改 Action 自己的 snapshot state。
 */
export interface RuntimeActionIntentContext {
  readonly action: RuntimeActionInstance;
  readonly intent: WorldIntent;
  readonly query: WorldQueryApi;
}

/**
 * retry: gameplay 暂忙，本次 held input 可以在后续 WorldTick 继续尝试/观察。
 * consumed: gameplay 明确吞掉本次输入，同一 held direction 不应在 Action 结束后补执行。
 */
export type RuntimeActionInputDisposition = "retry" | "consumed";

export type RuntimeActionStatus = "running" | "complete";

/**
 * Action 可以在 WorldTick 中请求 semantic intent；真正的 passage / collision /
 * enter-leave hooks 仍由 World resolver 执行，Action 不能用 commands.move 绕过规则。
 */
export interface RuntimeActionUpdate {
  status: RuntimeActionStatus;
  intents?: WorldIntent[];
}

export type RuntimeActionResult = RuntimeActionStatus | RuntimeActionUpdate;

export interface RuntimeActionDefinition {
  kind: string;
  update(context: RuntimeActionContext): RuntimeActionResult | void;
  onIntent?(
    context: RuntimeActionIntentContext,
  ): RuntimeActionInputDisposition | void;
}

export interface RuntimeActionSchedulerSnapshot {
  nextId: number;
  actions: RuntimeActionInstance[];
}
