import {
  EntityTypeId,
  type Direction,
  type JsonValue,
} from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import {
  accrueActionDeadline,
  consumeActionDeadline,
  primeDeadlineForHandoff,
} from "../../world/action/ActionDeadline.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type { EntityModule } from "../EntityModule.js";
import type { EntityModuleDefinition } from "../EntityModule.js";
import { ORIGINAL_BOBBY_LOCOMOTION_TIMING } from "../player/BobbyLocomotion.js";
import {
  patchBobbySpeedBoost,
  readBobbySpeedBoost,
} from "../player/BobbyState.js";
import {
  atlasVisual,
  directionCell,
  tileCell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const SPEED_RUN_ACTION = "speed-run";

/** 原版 Speed 恒为普通 Bobby 的两倍速度。 */
export const DEFAULT_SPEED_FULL_CADENCE_MS = Math.round(
  ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs * 0.5,
);
export const DEFAULT_SPEED_CONTINUATION_CELLS = 3;

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
        primeDeadlineForHandoff(
          incomingCadence(movement?.cause),
          movement?.motion,
        ),
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
      action.state.sawSameDirectionCurrentCell = true;
    return "retry";
  },

  onIntentResult({ action, result, commands }) {
    const ownerEntityId = action.ownerEntityId;
    if (ownerEntityId === undefined) return;
    if (result.moved) {
      action.state.pendingMove = true;
      return;
    }
    commands.emit({ type: "speed-impact", entityId: ownerEntityId });
    commands.cancelAction(action.id);
  },

  onCancel({ action, reason, query, commands }) {
    if (reason === "owner-destroyed") return;
    const ownerEntityId = action.ownerEntityId;
    const owner = ownerEntityId === undefined
      ? undefined
      : query.entity(ownerEntityId);
    if (owner)
      commands.setState(
        owner.id,
        patchBobbySpeedBoost(owner.state, null),
      );
  },

  update({ action, time, query, commands }) {
    const ownerEntityId = action.ownerEntityId;
    if (ownerEntityId === undefined) return "complete";
    const owner = query.entity(ownerEntityId);
    if (!owner) return "complete";

    const waitMs = positiveNumberState(action.state.waitMs);
    accrueActionDeadline(action, time);
    if (query.motionForEntity(ownerEntityId)?.status === "running")
      return "running";
    if (!consumeActionDeadline(action, waitMs, time.stepMs / 2))
      return "running";

    if (booleanState(action.state.pendingMove)) {
      const beltDirection = speedDirectionAt(query, owner.anchor);
      if (beltDirection) {
        action.state.direction = beltDirection;
        action.state.continuation = DEFAULT_SPEED_CONTINUATION_CELLS;
      } else {
        const continuation = booleanState(
          action.state.sawSameDirectionCurrentCell,
        )
          ? DEFAULT_SPEED_CONTINUATION_CELLS
          : Math.max(0, integerState(action.state.continuation) - 1);
        action.state.continuation = continuation;
      }
      action.state.sawSameDirectionCurrentCell = false;
      action.state.pendingMove = false;
      if (integerState(action.state.continuation) <= 0) {
        commands.setState(
          ownerEntityId,
          patchBobbySpeedBoost(owner.state, null),
        );
        return "complete";
      }
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
      action.state.sawSameDirectionCurrentCell = false;
      action.state.continuation = DEFAULT_SPEED_CONTINUATION_CELLS;
    }

    const cadenceMs = DEFAULT_SPEED_FULL_CADENCE_MS;
    commands.setState(
      ownerEntityId,
      patchBobbySpeedBoost(owner.state, { direction, phase: "full" }),
    );
    action.state.direction = direction;
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
      tileCell(EntityTypeId.SPEED, { fields: { direction: "up" } }),
      tileCell(EntityTypeId.SPEED, { fields: { direction: "down" } }),
      tileCell(EntityTypeId.SPEED, { fields: { direction: "left" } }),
      tileCell(EntityTypeId.SPEED, { fields: { direction: "right" } }),
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
  initialElapsedMs: number,
): RuntimeActionSpec {
  return {
    kind: SPEED_RUN_ACTION,
    ownerEntityId,
    blocksInput: true,
    state: {
      direction,
      continuation: DEFAULT_SPEED_CONTINUATION_CELLS,
      sawSameDirectionCurrentCell: false,
      pendingMove: false,
      elapsedMs: initialElapsedMs,
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

function integerState(value: JsonValue | undefined): number {
  return Math.max(0, Math.floor(numberState(value)));
}

function positiveNumberState(value: JsonValue | undefined): number {
  const number = numberState(value);
  return number > 0 ? number : 0;
}
