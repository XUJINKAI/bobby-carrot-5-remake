import {
  EntityTypeId,
  type Direction,
  type JsonValue,
} from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type { EntityModule } from "../EntityModule.js";
import type { EntityModuleDefinition } from "../EntityModule.js";
import { ORIGINAL_BOBBY_LOCOMOTION_TIMING } from "../player/BobbyLocomotion.js";
import {
  patchBobbySpeedBoost,
  readBobbySpeedBoost,
  type BobbySpeedPhase,
} from "../player/BobbyState.js";
import {
  atlasVisual,
  cell,
  directionCell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const SPEED_RUN_ACTION = "speed-run";

/** 原版实测相对节奏；独立常量便于后续继续对照真机微调。 */
export const DEFAULT_SPEED_FULL_CADENCE_MS = Math.round(
  ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs * 0.5,
);
export const DEFAULT_SPEED_NORMAL_CADENCE_MS =
  ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs;
export const DEFAULT_SPEED_SLOW_CADENCE_MS = Math.round(
  ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs * 1.2,
);

const speedBoost: Behavior = {
  id: "speed-boost",
  onEnter({ actor, self, direction, movement, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
    // 同一 Speed run 穿过连续 Speed 时由现有 Action 接管方向，不重复启动。
    if (readBobbySpeedBoost(actor.state)) return;
    const beltDirection = self.entity.direction ?? direction;
    if (!beltDirection) return;
    commands.startAction(
      createSpeedRunRuntimeAction(
        actor.id,
        beltDirection,
        incomingCadence(movement?.cause),
      ),
    );
  },
};

const speedRunAction: RuntimeActionDefinition = {
  kind: SPEED_RUN_ACTION,

  onIntent({ action, intent, query }) {
    if (
      intent.type !== "move" ||
      intent.cause.type !== "player-input" ||
      intent.actorId !== action.ownerEntityId
    )
      return;

    const phase = phaseState(action.state.phase);
    if (phase === "normal" || phase === "slow") {
      // 衰减的第二、三格完全不吃控制；输入由 gameplay 明确吞掉，
      // 不能在 Speed Action 结束后作为 held retry 补走一格。
      return "consumed";
    }
    if (phase !== "full") return;

    const owner = query.entity(intent.actorId);
    if (!owner) return;
    const beltDirection = speedDirectionAt(query, owner.anchor);
    if (beltDirection) {
      // 板上的输入不属于离板 full 格的判定窗口；持续按住时 input 会继续 retry，
      // 真正进入离板 full 格之后才开始记录。
      return "retry";
    }

    const currentDirection = directionState(action.state.direction);
    if (!currentDirection) return;
    if (intent.direction === currentDirection)
      action.state.sawSameDirectionCurrentFullCell = true;
    else action.state.sawOtherDirectionCurrentFullCell = true;
    return "retry";
  },

  update({ action, time, query, commands }) {
    const ownerEntityId = action.ownerEntityId;
    if (ownerEntityId === undefined) return "complete";
    const owner = query.entity(ownerEntityId);
    if (!owner) return "complete";

    if (booleanState(action.state.pendingMove)) {
      const beforeX = numberState(action.state.beforeX);
      const beforeY = numberState(action.state.beforeY);
      // World resolver 已在发出 intent 的同一 tick 给出结果。下一 tick若位置
      // 没变，说明 Speed 强制移动撞停。
      if (owner.anchor.x === beforeX && owner.anchor.y === beforeY) {
        commands.emit({ type: "speed-impact", entityId: ownerEntityId });
        commands.setState(
          ownerEntityId,
          patchBobbySpeedBoost(owner.state, null),
        );
        return "complete";
      }
    }

    const waitMs = positiveNumberState(action.state.waitMs);
    const elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs + time.stepMs / 2 < waitMs) return "running";
    action.state.elapsedMs = 0;

    if (booleanState(action.state.pendingMove)) {
      const previousPhase = phaseState(action.state.movePhase) ?? "full";
      const beltDirection = speedDirectionAt(query, owner.anchor);
      if (beltDirection) {
        action.state.direction = beltDirection;
        action.state.phase = "full";
        clearFullCellInput(action.state);
      } else if (previousPhase === "full") {
        // 每一个 full 格都有独立判定窗口：必须“只按过同方向”。
        // 没输入、只按异方向、同向和异向都按过，都会进入衰减。
        const sustainNextFull =
          booleanState(action.state.sawSameDirectionCurrentFullCell) &&
          !booleanState(action.state.sawOtherDirectionCurrentFullCell);
        clearFullCellInput(action.state);
        action.state.phase = sustainNextFull ? "full" : "normal";
      } else if (previousPhase === "normal") {
        action.state.phase = "slow";
      } else {
        commands.setState(
          ownerEntityId,
          patchBobbySpeedBoost(owner.state, null),
        );
        return "complete";
      }
      action.state.pendingMove = false;
    }

    const beltDirection = speedDirectionAt(query, owner.anchor);
    const previousDirection = directionState(action.state.direction);
    const direction = beltDirection ?? previousDirection;
    if (!direction) {
      commands.setState(
        ownerEntityId,
        patchBobbySpeedBoost(owner.state, null),
      );
      return "complete";
    }
    if (beltDirection) {
      // 只从离板后的当前 full 格开始记录续速输入。
      clearFullCellInput(action.state);
      if (previousDirection !== beltDirection) {
        action.state.direction = beltDirection;
        action.state.phase = "full";
      }
    }

    const phase = beltDirection
      ? "full"
      : (phaseState(action.state.phase) ?? "full");
    const cadenceMs = cadenceForPhase(phase);
    commands.setState(
      ownerEntityId,
      patchBobbySpeedBoost(owner.state, { direction, phase }),
    );
    action.state.direction = direction;
    action.state.phase = phase;
    action.state.movePhase = phase;
    action.state.beforeX = owner.anchor.x;
    action.state.beforeY = owner.anchor.y;
    action.state.pendingMove = true;
    action.state.waitMs = cadenceMs;

    return {
      status: "running",
      intents: [
        {
          type: "move",
          actorId: ownerEntityId,
          direction,
          cause: {
            type: "forced",
            mechanism: "speed",
            cadenceMs,
          },
        },
      ],
    };
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.SPEED,
  traits: ["walkable", "forced-movement"],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Speed" },
};

const base = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    directionCell(
      context.entity.direction,
      cell(5, 11),
      cell(6, 11),
      cell(7, 11),
      cell(8, 11),
    ),
  ),
  [{ behavior: speedBoost }],
);

export const speed: EntityModule = {
  ...base,
  runtimeActions: [speedRunAction],
};

function createSpeedRunRuntimeAction(
  ownerEntityId: EntityId,
  direction: Direction,
  initialWaitMs: number,
): RuntimeActionSpec {
  return {
    kind: SPEED_RUN_ACTION,
    ownerEntityId,
    blocksInput: true,
    state: {
      direction,
      phase: "full",
      sawSameDirectionCurrentFullCell: false,
      sawOtherDirectionCurrentFullCell: false,
      pendingMove: false,
      elapsedMs: 0,
      waitMs: initialWaitMs,
    },
  };
}

function incomingCadence(
  cause: { type: string; cadenceMs?: number } | undefined,
): number {
  return cause?.type === "forced" &&
    cause.cadenceMs !== undefined &&
    Number.isFinite(cause.cadenceMs) &&
    cause.cadenceMs > 0
    ? cause.cadenceMs
    : ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs;
}

function speedDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): Direction | null {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== EntityTypeId.SPEED) continue;
    return entity.direction ?? "right";
  }
  return null;
}

function cadenceForPhase(phase: BobbySpeedPhase): number {
  if (phase === "full") return DEFAULT_SPEED_FULL_CADENCE_MS;
  if (phase === "normal") return DEFAULT_SPEED_NORMAL_CADENCE_MS;
  return DEFAULT_SPEED_SLOW_CADENCE_MS;
}

function clearFullCellInput(state: Record<string, JsonValue>): void {
  state.sawSameDirectionCurrentFullCell = false;
  state.sawOtherDirectionCurrentFullCell = false;
}

function phaseState(value: JsonValue | undefined): BobbySpeedPhase | null {
  return value === "full" || value === "normal" || value === "slow"
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

function booleanState(value: JsonValue | undefined): boolean {
  return value === true;
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function positiveNumberState(value: JsonValue | undefined): number {
  const number = numberState(value);
  return number > 0 ? number : 0;
}
