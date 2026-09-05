import { EntityTypeId, type Direction, type JsonValue } from "@bobby/model";
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
import {
  CONTENT_STACK_ORDER,
  originalModule,
} from "./module.js";

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

    if (booleanState(action.state.pendingMove)) {
      const beforeX = integerState(action.state.beforeX);
      const beforeY = integerState(action.state.beforeY);
      if (
        fireball.anchor.x === beforeX &&
        fireball.anchor.y === beforeY
      ) {
        destroyFireball(commands, fireballId, fireball.anchor.x, fireball.anchor.y);
        return "complete";
      }
      action.state.pendingMove = false;
    }

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
    if (!query.inBounds(target) || projectileBlockedAt(query, target)) {
      destroyFireball(commands, fireballId, target.x, target.y);
      return "complete";
    }

    const reflected = reflectedDirectionAt(query, target, direction);
    if (reflected === false) {
      destroyFireball(commands, fireballId, target.x, target.y);
      return "complete";
    }
    meltIceAt(query, commands, target.x, target.y);
    if (reflected) commands.setDirection(fireballId, reflected);

    action.state.beforeX = fireball.anchor.x;
    action.state.beforeY = fireball.anchor.y;
    action.state.pendingMove = true;
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
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.FIREBALL,
  traits: ["projectile"],
  stackOrder: CONTENT_STACK_ORDER + 50,
  presentation: { name: "Dragon Fireball", renderPass: "effect" },
};

const base = originalModule(
  definition,
  {
    id: EntityTypeId.FIREBALL,
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
    state: { elapsedMs: DEFAULT_FIREBALL_CELL_MS, pendingMove: false },
  };
}

function projectileBlockedAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): boolean {
  return query.presencesAt(cell).some((presence) => {
    if (presence.traits.includes("dragon-fire-blocking")) return true;
    if (!presence.traits.includes("stateful-block")) return false;
    return query.entity(presence.entityId)?.state?.raised !== false;
  });
}

function meltIceAt(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  x: number,
  y: number,
): void {
  for (const presence of query.presencesAt({ x, y })) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== EntityTypeId.ICE_BLOCK) continue;
    commands.destroy(entity.id);
    commands.emit({ type: "ice-melted", entityId: entity.id, x, y });
  }
}

function reflectedDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  incoming: Direction,
): Direction | null | false {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== EntityTypeId.MIRROR) continue;
    const variant = Math.max(1, Math.min(4, integerState(entity.state?.variant)));
    const reflection: Partial<Record<Direction, Direction>> =
      variant === 1
        ? { left: "down", up: "right" }
        : variant === 2
          ? { right: "down", up: "left" }
          : variant === 3
            ? { left: "up", down: "right" }
            : { right: "up", down: "left" };
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

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function integerState(value: JsonValue | undefined): number {
  return Math.max(0, Math.floor(numberState(value)));
}

function booleanState(value: JsonValue | undefined): boolean {
  return value === true;
}
