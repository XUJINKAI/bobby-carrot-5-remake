import { type Direction } from "@bobby/model";
import { resolveEnergyPropagationAt } from "../energy/EnergyPropagation.js";
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
import { ORIGINAL_GAMEPLAY_IMAGE_IDS } from "../../image/OriginalGameplayImages.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  FIREBALL_MOVEMENT,
  resolveActionMovementCadenceMs,
} from "../movement/MovementCadence.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import {
  originalModule,
} from "./module.js";
import { meltIceBlocksAt } from "./ice-block.js";

const FIREBALL_ACTION = "dragon-fireball";

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
        FIREBALL_MOVEMENT.terminalMs,
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
    const propagation = resolveEnergyPropagationAt(query, target, direction);
    if (propagation.kind === "blocked") {
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
            cadenceMs: resolveActionMovementCadenceMs(
              action,
              FIREBALL_MOVEMENT,
              time.stepMs,
            ),
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
    const propagation = resolveEnergyPropagationAt(
      query,
      result.to,
      intent.direction,
    );
    if (propagation.kind === "reflected") {
      commands.setDirection(fireballId, propagation.direction);
    }
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
            FIREBALL_MOVEMENT.frameMs,
        ) % 2;
      return {
        layers: [{
          kind: "image",
          asset: ORIGINAL_GAMEPLAY_IMAGE_IDS.dragonFireball,
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
    focus: { entityIds: [ownerEntityId] },
    state: {
      cadenceCarryMs: 0,
      ...(inputLockActionId === null ? {} : { inputLockActionId }),
    },
  };
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
    data: { durationMs: FIREBALL_MOVEMENT.terminalMs },
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
