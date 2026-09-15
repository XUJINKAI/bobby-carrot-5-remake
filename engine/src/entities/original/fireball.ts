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
    commands.startAction(createFireballAction(self.entity.id));
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
      destroyFireball(commands, fireballId, target.x, target.y);
      return "complete";
    }

    const reflected = reflectedDirectionAt(query, target, direction);
    if (reflected === false) {
      destroyFireball(commands, fireballId, target.x, target.y);
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
    if (intent.type !== "move") return;
    const fireballId = action.ownerEntityId;
    if (fireballId === undefined) return;
    if (!result.moved) {
      commands.cancelAction(action.id);
      destroyFireball(commands, fireballId, result.to.x, result.to.y);
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
      const pulse = (context.time?.frame ?? 0) % 8 < 4 ? 1 : 0.78;
      return {
        layers: [
          {
            kind: "canvas",
            draw(canvas, x, y, size) {
              const centerX = x + size / 2;
              const centerY = y + size / 2;
              canvas.save();
              canvas.globalAlpha = pulse;
              canvas.fillStyle = "#ff5a1f";
              canvas.beginPath();
              canvas.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
              canvas.fill();
              canvas.fillStyle = "#ffd166";
              canvas.beginPath();
              canvas.arc(centerX, centerY, size * 0.1, 0, Math.PI * 2);
              canvas.fill();
              canvas.restore();
            },
          },
        ],
      };
    },
  },
  [{ behavior: runFireball }],
);

export const fireball: EntityModule = {
  ...base,
  runtimeActions: [fireballAction],
};

function createFireballAction(ownerEntityId: EntityId): RuntimeActionSpec {
  return {
    kind: FIREBALL_ACTION,
    ownerEntityId,
    focus: { entityId: ownerEntityId },
    state: { elapsedMs: DEFAULT_FIREBALL_CELL_MS },
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
): void {
  commands.destroy(entityId);
  commands.emit({ type: "fireball-impact", entityId, x, y });
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
