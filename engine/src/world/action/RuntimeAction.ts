import type { JsonValue } from "@bobby/model";
import type { WorldTick } from "../../time/WorldClock.js";
import type { WorldCommandApi } from "../behavior/CommandQueue.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityId } from "../entity/EntityInstance.js";

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

export type RuntimeActionResult = "running" | "complete";

export interface RuntimeActionDefinition {
  kind: string;
  update(context: RuntimeActionContext): RuntimeActionResult | void;
}

export interface RuntimeActionSchedulerSnapshot {
  nextId: number;
  actions: RuntimeActionInstance[];
}
