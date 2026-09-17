import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { VisualDefinition } from "../../visual/VisualDefinition.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import {
  tileAnimationCell,
  tileCell,
  originalModule,
} from "./module.js";

const DRAGON_ATTACK_ACTION = "dragon-attack";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;

export const DRAGON_ATTACK_FRAME_MS = 6 * ORIGINAL_GAMEPLAY_STEP_MS;
export const DEFAULT_DRAGON_WINDUP_MS = 3 * DRAGON_ATTACK_FRAME_MS;

const triggerDragon: Behavior = {
  id: "trigger-dragon-attack",
  onEnter({ actor, self, query, commands }) {
    if (
      self.presence.role !== "tail" ||
      !query.entityHasFact(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      self.entity.state?.attacking === true
    )
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      attacking: true,
    });
    commands.startAction(createDragonAttackAction(self.entity.id, actor.id));
    commands.emit({
      type: "dragon-attack-started",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const dragonAttackAction: RuntimeActionDefinition = {
  kind: DRAGON_ATTACK_ACTION,
  update({ action, time, query, commands }) {
    const dragonId = integerState(action.state.dragonId);
    if (dragonId === null) return "complete";
    const dragon = query.entity(dragonId);
    if (!dragon) return "complete";
    if (action.state.fireballSpawned === true) {
      const fireballExists = query.entitiesMatching({
        kind: "type",
        value: RuntimeEntityTypeId.FIREBALL,
      }).some((entity) => entity.state?.inputLockActionId === action.id);
      return fireballExists ? "running" : "complete";
    }
    const elapsedMs = Number(action.state.elapsedMs ?? 0) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs < DRAGON_ATTACK_FRAME_MS) return "running";
    if (elapsedMs < 2 * DRAGON_ATTACK_FRAME_MS) {
      commands.setState(dragonId, { ...dragon.state, attackFrame: 1 });
      return "running";
    }
    if (elapsedMs < DEFAULT_DRAGON_WINDUP_MS) {
      commands.setState(dragonId, { ...dragon.state, attackFrame: 2 });
      return "running";
    }

    const head = query
      .presencesForEntity(dragonId)
      .find((presence) => presence.role === "head");
    if (head) {
      commands.spawn({
        type: RuntimeEntityTypeId.FIREBALL,
        x: head.cell.x,
        y: head.cell.y,
        direction: dragon.direction ?? "left",
        state: { inputLockActionId: action.id },
      });
      commands.emit({
        type: "dragon-fireball-spawned",
        entityId: dragonId,
        x: head.cell.x,
        y: head.cell.y,
        direction: dragon.direction ?? "left",
      });
    }
    commands.setState(dragonId, {
      ...dragon.state,
      attacking: false,
      attackFrame: 0,
    });
    action.state.fireballSpawned = true;
    return "running";
  },
  onCancel({ action, query, commands }) {
    const dragonId = integerState(action.state.dragonId);
    if (dragonId === null) return;
    const dragon = query.entity(dragonId);
    if (dragon?.type !== MapEntityTypeId.DRAGON) return;
    commands.setState(dragon.id, {
      ...dragon.state,
      attacking: false,
      attackFrame: 0,
    });
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.DRAGON,
  presenceFacts: [],
  footprint: {
    byDirection: {
      left: [
        {
          dx: -1,
          dy: 0,
          role: "head",
          presenceFacts: ["blocking", "vertical-occupant"],
        },
        {
          dx: 0,
          dy: 0,
          role: "body",
          presenceFacts: ["blocking", "vertical-occupant"],
        },
        {
          dx: 1,
          dy: 0,
          role: "tail",
          presenceFacts: ["vertical-occupant", "walkable"],
        },
      ],
      right: [
        {
          dx: 1,
          dy: 0,
          role: "head",
          presenceFacts: ["blocking", "vertical-occupant"],
        },
        {
          dx: 0,
          dy: 0,
          role: "body",
          presenceFacts: ["blocking", "vertical-occupant"],
        },
        {
          dx: -1,
          dy: 0,
          role: "tail",
          presenceFacts: ["vertical-occupant", "walkable"],
        },
      ],
    },
  },
  presentation: { name: "Dragon" },
};

const visual: VisualDefinition = {
  id: MapEntityTypeId.DRAGON,
  resolve(context) {
    const atlas = dragonAtlasCell(
      context.presence.role,
      context.entity.state?.attackFrame,
    );
    return {
      layers: [
        {
          kind: "atlas",
          column: atlas.column,
          row: atlas.row,
          ...(context.entity.direction === "right" ? { flipX: true } : {}),
        },
      ],
    };
  },
};

function dragonAtlasCell(role: string | undefined, attackFrame: unknown) {
  if (role === "body") return tileCell(MapEntityTypeId.DRAGON, { role: "body" });
  if (role === "tail") return tileCell(MapEntityTypeId.DRAGON, { role: "tail" });
  if (attackFrame === 1)
    return tileAnimationCell(MapEntityTypeId.DRAGON, "fire", 1, { role: "head" });
  if (attackFrame === 2)
    return tileAnimationCell(MapEntityTypeId.DRAGON, "fire", 2, { role: "head" });
  return tileCell(MapEntityTypeId.DRAGON, { role: "head" });
}

const base = originalModule(definition, visual, [
  { behavior: triggerDragon },
]);

export const dragon: EntityModule = {
  ...base,
  runtimeActions: [dragonAttackAction],
};

function createDragonAttackAction(
  dragonId: number,
  actorId: number,
): RuntimeActionSpec {
  return {
    kind: DRAGON_ATTACK_ACTION,
    ownerEntityId: actorId,
    blocksInput: true,
    state: { dragonId, elapsedMs: 0, fireballSpawned: false },
  };
}

function integerState(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
