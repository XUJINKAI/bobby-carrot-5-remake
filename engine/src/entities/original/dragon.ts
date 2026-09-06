import { EntityTypeId } from "@bobby/model";
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
import {
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const DRAGON_ATTACK_ACTION = "dragon-attack";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;

export const DEFAULT_DRAGON_WINDUP_MS = 18 * ORIGINAL_GAMEPLAY_STEP_MS;

const triggerDragon: Behavior = {
  id: "trigger-dragon-attack",
  onEnter({ actor, self, query, commands }) {
    if (
      self.presence.role !== "tail" ||
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      self.entity.state?.attacking === true
    )
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      attacking: true,
    });
    commands.startAction(createDragonAttackAction(self.entity.id));
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
    const dragonId = action.ownerEntityId;
    if (dragonId === undefined) return "complete";
    const dragon = query.entity(dragonId);
    if (!dragon) return "complete";
    const elapsedMs = Number(action.state.elapsedMs ?? 0) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs < DEFAULT_DRAGON_WINDUP_MS) return "running";

    const head = query
      .presencesForEntity(dragonId)
      .find((presence) => presence.role === "head");
    if (head) {
      commands.spawn({
        type: EntityTypeId.FIREBALL,
        x: head.cell.x,
        y: head.cell.y,
        direction: dragon.direction ?? "left",
      });
      commands.emit({
        type: "dragon-fireball-spawned",
        entityId: dragonId,
        x: head.cell.x,
        y: head.cell.y,
        direction: dragon.direction ?? "left",
      });
    }
    commands.setState(dragonId, { ...dragon.state, attacking: false });
    return "complete";
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.DRAGON,
  traits: ["dragon"],
  stackOrder: CONTENT_STACK_ORDER,
  footprint: {
    byDirection: {
      left: [
        {
          dx: -1,
          dy: 0,
          role: "head",
          traits: ["blocking"],
        },
        {
          dx: 0,
          dy: 0,
          role: "body",
          traits: ["blocking"],
        },
        {
          dx: 1,
          dy: 0,
          role: "tail",
          traits: ["walkable", "dragon-trigger"],
        },
      ],
      right: [
        {
          dx: 1,
          dy: 0,
          role: "head",
          traits: ["blocking"],
        },
        {
          dx: 0,
          dy: 0,
          role: "body",
          traits: ["blocking"],
        },
        {
          dx: -1,
          dy: 0,
          role: "tail",
          traits: ["walkable", "dragon-trigger"],
        },
      ],
    },
  },
  presentation: { name: "Dragon" },
};

const visual: VisualDefinition = {
  id: EntityTypeId.DRAGON,
  resolve(context) {
    const atlas =
      context.presence.role === "body"
        ? objectCell(15)
        : context.presence.role === "tail"
          ? objectCell(16)
          : objectCell(14);
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

const base = originalModule(definition, visual, [
  { behavior: triggerDragon },
]);

export const dragon: EntityModule = {
  ...base,
  runtimeActions: [dragonAttackAction],
};

function createDragonAttackAction(ownerEntityId: number): RuntimeActionSpec {
  return {
    kind: DRAGON_ATTACK_ACTION,
    ownerEntityId,
    state: { elapsedMs: 0 },
  };
}
