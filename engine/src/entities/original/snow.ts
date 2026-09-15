import { MapEntityTypeId, type Direction, type JsonValue } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import { bobbyMountId, readBobbyInventory } from "../player/BobbyState.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import { staticEntity, tileCell } from "./module.js";

const SHOVEL_ACTION = "shovel-snow";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;
export const SHOVEL_ACTION_DURATION_MS = 32 * ORIGINAL_GAMEPLAY_STEP_MS;

const shovelSnow: Behavior = {
  id: "shovel-snow",
  onTouch({ actor, self, direction, query, commands }) {
    if (!query.entityHasFact(actor.id, "player") ||
      bobbyMountId(actor.state) !== null)
      return;
    if (!readBobbyInventory(actor.state).shovel) {
      commands.emit({
        type: "missing-item",
        actorId: actor.id,
        entityId: self.entity.id,
        x: self.presence.cell.x,
        y: self.presence.cell.y,
        data: { item: "shovel" },
      });
      return;
    }
    if (!direction) return;
    commands.startAction(createShovelAction(
      actor.id,
      self.entity.id,
      actor.anchor.x,
      actor.anchor.y,
      direction,
    ));
    commands.setDirection(actor.id, direction);
    commands.emit({
      type: "shovel-started",
      actorId: actor.id,
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      direction,
      data: { durationMs: SHOVEL_ACTION_DURATION_MS },
    });
  },
};

const shovelAction: RuntimeActionDefinition = {
  kind: SHOVEL_ACTION,
  onIntent({ action, intent }) {
    if (intent.type === "move" &&
      intent.cause.type === "player-input" &&
      intent.actorId === action.ownerEntityId)
      return "consumed";
  },
  update({ action, time, query, commands }) {
    const actorId = action.ownerEntityId;
    const actor = actorId === undefined ? undefined : query.entity(actorId);
    const snowId = integerState(action.state.snowId);
    const snow = snowId === null ? undefined : query.entity(snowId);
    const originX = integerState(action.state.originX);
    const originY = integerState(action.state.originY);
    const direction = directionState(action.state.direction);
    if (!actor || !snow || originX === null || originY === null ||
      !direction || actor.anchor.x !== originX || actor.anchor.y !== originY ||
      snow.type !== MapEntityTypeId.SNOW ||
      !readBobbyInventory(actor.state).shovel ||
      bobbyMountId(actor.state) !== null)
      return "complete";

    const target = adjacentCell(originX, originY, direction);
    if (snow.anchor.x !== target.x || snow.anchor.y !== target.y)
      return "complete";
    const elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs + time.stepMs / 2 < SHOVEL_ACTION_DURATION_MS)
      return "running";

    commands.destroy(snow.id);
    if (!hasWalkableGround(query, target.x, target.y))
      commands.spawn({
        type: RuntimeEntityTypeId.SHOVEL_CLEARED_GROUND,
        x: target.x,
        y: target.y,
      });
    commands.emit({
      type: "shovel",
      actorId: actor.id,
      entityId: snow.id,
      x: target.x,
      y: target.y,
      direction,
    });
    return {
      status: "complete",
      intents: [{
        type: "move",
        actorId: actor.id,
        direction,
        cause: { type: "forced", mechanism: "shovel" },
      }],
    };
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.SNOW,
  presenceFacts: ["blocking", "contact-cover"],
  presentation: { name: "Snow" },
};

const base = staticEntity(
  definition,
  tileCell(MapEntityTypeId.SNOW),
  [{ behavior: shovelSnow }],
);

export const snow: EntityModule = {
  ...base,
  runtimeActions: [shovelAction],
};

function createShovelAction(
  actorId: number,
  snowId: number,
  originX: number,
  originY: number,
  direction: Direction,
): RuntimeActionSpec {
  return {
    kind: SHOVEL_ACTION,
    ownerEntityId: actorId,
    blocksInput: true,
    state: { snowId, originX, originY, direction, elapsedMs: 0 },
  };
}

function adjacentCell(x: number, y: number, direction: Direction) {
  switch (direction) {
    case "up":
      return { x, y: y - 1 };
    case "down":
      return { x, y: y + 1 };
    case "left":
      return { x: x - 1, y };
    case "right":
      return { x: x + 1, y };
  }
}

function hasWalkableGround(query: WorldQueryApi, x: number, y: number): boolean {
  return query.allPresencesAt({ x, y }).some((presence) =>
    presence.facts.includes("walkable"),
  );
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function integerState(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function directionState(value: JsonValue | undefined): Direction | null {
  return value === "up" || value === "down" ||
    value === "left" || value === "right" ? value : null;
}
