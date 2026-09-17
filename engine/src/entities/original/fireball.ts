import { MapEntityTypeId, type Direction } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionInstance,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import {
  accrueActionDeadline,
  consumeActionDeadline,
} from "../../world/action/ActionDeadline.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import {
  originalModule,
} from "./module.js";
import { meltIceBlocksAt } from "./ice-block.js";
import { fireballCanTraverseTerrainAt } from "./terrain-semantics.js";

const FIREBALL_ACTION = "dragon-fireball";

export interface FireballTiming {
  /** 火球通过一个完整格子的墙钟时间。 */
  readonly cellMs: number;
  /** `hud.png` 两张火球素材中每一帧的显示时间。 */
  readonly frameMs: number;
  /** 火球在障碍边界前完成半格收尾所需的时间。 */
  readonly terminalMs: number;
}

/** 同距离原版实测校准；运行时只消费毫秒，不依赖 World 或 Presentation 帧率。 */
export const ORIGINAL_FIREBALL_TIMING: FireballTiming = {
  cellMs: 208,
  frameMs: 104,
  terminalMs: 104,
};

const runFireball: Behavior = {
  id: "run-dragon-fireball",
  planMovement() {
    return {
      passage: "unrestricted",
      updateDirection: false,
      lifecycle: { source: [], target: [] },
      reason: "projectile-passage",
    };
  },
  onTick({ self, commands }) {
    if (self.entity.state?.runtimeStarted === true) return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      runtimeStarted: true,
    });
    commands.startAction(createFireballAction(
      self.entity.id,
      integerState(self.entity.state?.inputLockActionId),
    ));
  },
};

const fireballAction: RuntimeActionDefinition = {
  kind: FIREBALL_ACTION,
  update({ action, time, query, commands }) {
    const fireballId = action.ownerEntityId;
    if (fireballId === undefined) return "complete";
    const fireball = query.entity(fireballId);
    if (!fireball) return "complete";

    if (action.state.phase === "terminating") {
      accrueActionDeadline(action, time);
      if (!consumeActionDeadline(
        action,
        ORIGINAL_FIREBALL_TIMING.terminalMs,
        0,
      )) return "running";
      const direction = fireball.direction ?? "left";
      const impact = halfCellAhead(fireball.anchor, direction);
      destroyFireball(
        commands,
        fireballId,
        impact.x,
        impact.y,
        integerState(action.state.inputLockActionId),
      );
      return "complete";
    }

    if (query.motionForEntity(fireballId)?.status === "running")
      return "running";

    const direction = fireball.direction ?? "left";
    const target = addDirection(fireball.anchor, direction);
    if (
      !query.inBounds(target) ||
      !fireballCanTraverseTerrainAt(query, target) ||
      projectileBlockedAt(query, target)
    ) {
      beginFireballTermination(action, commands, fireball);
      return "running";
    }

    const reflected = reflectedDirectionAt(query, target, direction);
    if (reflected === false) {
      beginFireballTermination(action, commands, fireball);
      return "running";
    }
    return {
      status: "running",
      intents: [
        {
          type: "move",
          actorId: fireballId,
          direction,
          cause: {
            type: "forced",
            mechanism: "fireball",
            cadenceMs: nextFireballCellDuration(action, time.stepMs),
          },
        },
      ],
    };
  },
  onIntentResult({ action, intent, result, query, commands }) {
    const fireballId = action.ownerEntityId;
    if (fireballId === undefined) return;
    if (!result.moved) {
      const fireball = query.entity(fireballId);
      if (fireball) beginFireballTermination(action, commands, fireball);
      return;
    }
    meltIceBlocksAt(query, commands, result.to);
    const reflected = reflectedDirectionAt(
      query,
      result.to,
      intent.direction,
    );
    if (reflected) commands.setDirection(fireballId, reflected);
  },
};

const definition: EntityModuleDefinition = {
  type: RuntimeEntityTypeId.FIREBALL,
  presenceFacts: [],
  presentation: { name: "Dragon Fireball", renderPass: "effect" },
};

const base = originalModule(
  definition,
  {
    id: RuntimeEntityTypeId.FIREBALL,
    renderPass: "effect",
    resolve(context) {
      const frame =
        Math.floor(
          Math.max(0, context.time?.nowMs ?? 0) /
            ORIGINAL_FIREBALL_TIMING.frameMs,
        ) % 2;
      return {
        layers: [{
          kind: "image",
          asset: "dragon-fireball",
          sourceX: frame === 0 ? 282 : 310,
          sourceY: 0,
          frameWidth: 28,
          frameHeight: 28,
          anchor: "center",
        }],
      };
    },
  },
  [{ behavior: runFireball }],
);

export const fireball: EntityModule = {
  ...base,
  runtimeActions: [fireballAction],
};

function createFireballAction(
  ownerEntityId: EntityId,
  inputLockActionId: number | null,
): RuntimeActionSpec {
  return {
    kind: FIREBALL_ACTION,
    ownerEntityId,
    focus: { entityId: ownerEntityId },
    state: {
      cadenceCarryMs: 0,
      ...(inputLockActionId === null ? {} : { inputLockActionId }),
    },
  };
}

/**
 * WorldMotion 只能在固定 World tick 边界结束。把每格舍入误差带到下一格，能让
 * 长距离平均速度保持配置的毫秒值，而不是每格都向上取整后持续变慢。
 */
function nextFireballCellDuration(
  action: RuntimeActionInstance,
  stepMs: number,
): number {
  const safeStepMs = Number.isFinite(stepMs) && stepMs > 0 ? stepMs : 1;
  const carryMs = finiteState(action.state.cadenceCarryMs);
  const targetMs = ORIGINAL_FIREBALL_TIMING.cellMs + carryMs;
  const ticks = Math.max(1, Math.round(targetMs / safeStepMs));
  const quantizedMs = ticks * safeStepMs;
  action.state.cadenceCarryMs = targetMs - quantizedMs;
  // 浮点乘加可能让 N 个 step 比 N * stepMs 小极少量，留出微秒级余量避免多等一拍。
  return Math.max(Number.EPSILON, quantizedMs - 0.001);
}

function projectileBlockedAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): boolean {
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    if (entity?.type === MapEntityTypeId.CRUMBLY_ROCK) return true;
    if (entity?.type === MapEntityTypeId.DRAGON && presence.role !== "tail")
      return true;
    if (entity?.type !== MapEntityTypeId.COLOR_BLOCK) return false;
    return entity?.state?.raised !== false;
  });
}

function reflectedDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  incoming: Direction,
): Direction | null | false {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== MapEntityTypeId.MIRROR) continue;
    const reflection: Partial<Record<Direction, Direction>> =
      entity.state?.variant === "left-bottom"
        ? { right: "down", up: "left" }
        : entity.state?.variant === "right-top"
          ? { left: "up", down: "right" }
          : entity.state?.variant === "left-top"
            ? { right: "up", down: "left" }
            : { left: "down", up: "right" };
    return reflection[incoming] ?? false;
  }
  return null;
}

function destroyFireball(
  commands: WorldCommandApi,
  entityId: EntityId,
  x: number,
  y: number,
  inputLockActionId: number | null,
): void {
  commands.destroy(entityId);
  if (inputLockActionId !== null)
    commands.cancelAction(inputLockActionId);
  commands.emit({ type: "fireball-impact", entityId, x, y });
}

function beginFireballTermination(
  action: RuntimeActionInstance,
  commands: WorldCommandApi,
  fireball: {
    id: EntityId;
    anchor: { x: number; y: number };
    direction?: Direction;
  },
): void {
  if (action.state.phase === "terminating") return;
  const direction = fireball.direction ?? "left";
  action.state.phase = "terminating";
  action.state.elapsedMs = 0;
  commands.emit({
    type: "fireball-termination-started",
    entityId: fireball.id,
    x: fireball.anchor.x,
    y: fireball.anchor.y,
    direction,
    data: { durationMs: ORIGINAL_FIREBALL_TIMING.terminalMs },
  });
}

function integerState(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function finiteState(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function addDirection(
  cell: { x: number; y: number },
  direction: Direction,
): { x: number; y: number } {
  if (direction === "up") return { x: cell.x, y: cell.y - 1 };
  if (direction === "down") return { x: cell.x, y: cell.y + 1 };
  if (direction === "left") return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}

function halfCellAhead(
  cell: { x: number; y: number },
  direction: Direction,
): { x: number; y: number } {
  if (direction === "up") return { x: cell.x, y: cell.y - 0.5 };
  if (direction === "down") return { x: cell.x, y: cell.y + 0.5 };
  if (direction === "left") return { x: cell.x - 0.5, y: cell.y };
  return { x: cell.x + 0.5, y: cell.y };
}
