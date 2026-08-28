import type { JsonValue } from "@bobby/model";
import type { WorldTick } from "../../time/WorldClock.js";
import type { WorldCommandApi } from "../behavior/CommandQueue.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityId } from "../entity/EntityInstance.js";

export type RuntimeActionId = number;
export type RuntimeActionState = Record<string, JsonValue>;

/** 创建一个跨多个 WorldTick 持续存在的 gameplay 过程。 */
export interface RuntimeActionSpec {
  kind: string;
  ownerEntityId?: EntityId;
  /** 活跃期间是否阻止玩家产生新的 gameplay movement。 */
  blocksInput?: boolean;
  /** 活跃期间建议 Camera 跟随的 Entity；只是 gameplay policy，不保存 Camera tween。 */
  cameraTarget?: EntityId;
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
