import { MapEntityTypeId, type Direction } from "@bobby/model";
import type {
  RuntimeActionDefinition,
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
const ORIGINAL_GAMEPLAY_STEP_MS = 31;

export const DEFAULT_FIREBALL_CELL_MS = 8 * ORIGINAL_GAMEPLAY_STEP_MS;

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
    accrueActionDeadline(action, time);
    if (query.motionForEntity(fireballId)?.status === "running")
      return "running";

    if (
      !consumeActionDeadline(
        action,
        DEFAULT_FIREBALL_CELL_MS,
        time.stepMs / 2,
      )
    )
      return "running";

    const direction = fireball.direction ?? "left";
    const target = addDirection(fireball.anchor, direction);
    if (
      !query.inBounds(target) ||
      !fireballCanTraverseTerrainAt(query, target) ||
      projectileBlockedAt(query, target)
    ) {
      destroyFireball(
        commands,
        fireballId,
        target.x,
        target.y,
        integerState(action.state.inputLockActionId),
      );
      return "complete";
    }

    const reflected = reflectedDirectionAt(query, target, direction);
    if (reflected === false) {
      destroyFireball(
        commands,
        fireballId,
        target.x,
        target.y,
        integerState(action.state.inputLockActionId),
      );
      return "complete";
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
            cadenceMs: DEFAULT_FIREBALL_CELL_MS,
          },
        },
      ],
    };
  },
  onIntentResult({ action, intent, result, query, commands }) {
    const fireballId = action.ownerEntityId;
    if (fireballId === undefined) return;
    if (!result.moved) {
      commands.cancelAction(action.id);
      destroyFireball(
        commands,
        fireballId,
        result.to.x,
        result.to.y,
        integerState(action.state.inputLockActionId),
      );
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
        Math.floor(Math.max(0, context.time?.nowMs ?? 0) / 124) % 2;
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
      elapsedMs: DEFAULT_FIREBALL_CELL_MS,
      ...(inputLockActionId === null ? {} : { inputLockActionId }),
    },
  };
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

function integerState(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
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
