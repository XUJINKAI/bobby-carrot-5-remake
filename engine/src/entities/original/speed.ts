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
      intent.actorId !== action.ownerEntityId ||
      phaseState(action.state.phase) !== "full"
    )
      return;

    const owner = query.entity(intent.actorId);
    if (!owner) return;
    const currentDirection =
      speedDirectionAt(query, owner.anchor) ?? directionState(action.state.direction);
    if (!currentDirection) return;
    const previousDirection = directionState(action.state.direction);
    if (previousDirection !== currentDirection) {
      action.state.direction = currentDirection;
      action.state.sustainCurrentFullCell = false;
    }
    if (intent.direction === currentDirection)
      action.state.sustainCurrentFullCell = true;
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
      // 没变，说明撞停；无需再等完整 motion cadence 才解除 boost。
      if (owner.anchor.x === beforeX && owner.anchor.y === beforeY) {
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
        const oldDirection = directionState(action.state.direction);
        action.state.direction = beltDirection;
        action.state.phase = "full";
        // Speed surface 本身保持全速；板上的输入不能预存给离板后的第一格。
        action.state.sustainCurrentFullCell = false;
        if (oldDirection !== beltDirection)
          action.state.sustainCurrentFullCell = false;
      } else if (previousPhase === "full") {
        // sustain 只代表“刚完成的这一格 full 期间是否观察到同方向输入”。
        // 每格结算只消费一次，下一格必须重新观察，否则立即进入衰减。
        const sustainNextFull = booleanState(
          action.state.sustainCurrentFullCell,
        );
        action.state.sustainCurrentFullCell = false;
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
      action.state.sustainCurrentFullCell = false;
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
      sustainCurrentFullCell: false,
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
