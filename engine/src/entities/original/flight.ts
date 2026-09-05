import { EntityTypeId, type JsonValue } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { ORIGINAL_BOBBY_LOCOMOTION_TIMING } from "../player/BobbyLocomotion.js";
import {
  bobbyMountId,
  isBobbyFlying,
  patchBobbyFlight,
  readBobbyInventory,
} from "../player/BobbyState.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const FLIGHT_ACTION = "kite-flight";
export const DEFAULT_FLIGHT_CELL_MS = ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs;

const whirlwindBehavior: Behavior = {
  id: "kite-takeoff",
  canEnter({ actor, query }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      isBobbyFlying(actor.state)
    )
      return { passable: false, reason: "whirlwind-collision" };
    return readBobbyInventory(actor.state).kite
      ? { passable: true, reason: "kite-takeoff" }
      : { passable: false, reason: "whirlwind-needs-kite" };
  },
  onTouch({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      readBobbyInventory(actor.state).kite
    )
      return;
    commands.emit({
      type: "missing-item",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
      data: { item: "kite" },
    });
  },
  onEnter({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      isBobbyFlying(actor.state) ||
      !readBobbyInventory(actor.state).kite
    )
      return;
    commands.setState(actor.id, patchBobbyFlight(actor.state, false, "takeoff"));
    commands.emit({
      type: "kite-takeoff-started",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
  onArrive({ actor, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      actor.state?.flightTransition !== "takeoff"
    )
      return;
    commands.setState(actor.id, patchBobbyFlight(actor.state, true));
    commands.startAction(createFlightAction(actor.id));
    commands.emit({ type: "kite-airborne", entityId: actor.id });
  },
};

const landingBehavior: Behavior = {
  id: "kite-landing",
  onEnter({ actor, self, commands }) {
    if (!isBobbyFlying(actor.state)) return;
    commands.setState(actor.id, patchBobbyFlight(actor.state, true, "landing"));
    commands.emit({
      type: "kite-landing-started",
      entityId: actor.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
  onArrive({ actor, commands }) {
    if (
      !isBobbyFlying(actor.state) ||
      actor.state?.flightTransition !== "landing"
    )
      return;
    commands.setState(actor.id, patchBobbyFlight(actor.state, false));
    commands.emit({ type: "kite-landed", entityId: actor.id });
  },
};

const flightAction: RuntimeActionDefinition = {
  kind: FLIGHT_ACTION,
  update({ action, time, query, commands }) {
    const actorId = action.ownerEntityId;
    if (actorId === undefined) return "complete";
    const actor = query.entity(actorId);
    if (!actor || !isBobbyFlying(actor.state)) return "complete";
    if (query.motionForEntity(actorId)?.status === "running") return "running";

    if (booleanState(action.state.pendingMove)) {
      const beforeX = integerState(action.state.beforeX);
      const beforeY = integerState(action.state.beforeY);
      if (actor.anchor.x === beforeX && actor.anchor.y === beforeY) {
        commands.emit({
          type: "flight-path-invalid",
          entityId: actor.id,
          x: actor.anchor.x,
          y: actor.anchor.y,
          reason: "map-edge",
        });
        return "complete";
      }
      action.state.pendingMove = false;
    }

    const elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs + time.stepMs / 2 < DEFAULT_FLIGHT_CELL_MS)
      return "running";
    const direction = actor.direction;
    if (!direction) return "complete";
    action.state.elapsedMs = Math.max(0, elapsedMs - DEFAULT_FLIGHT_CELL_MS);
    action.state.beforeX = actor.anchor.x;
    action.state.beforeY = actor.anchor.y;
    action.state.pendingMove = true;
    return {
      status: "running",
      intents: [
        {
          type: "move",
          actorId,
          direction,
          cause: {
            type: "forced",
            mechanism: "flight",
            cadenceMs: DEFAULT_FLIGHT_CELL_MS,
          },
        },
      ],
    };
  },
};

const whirlwindDefinition: EntityModuleDefinition = {
  type: EntityTypeId.WHIRLWIND,
  traits: ["flight-entry", "blocking"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Whirlwind" },
};

const whirlwindBase = originalModule(
  whirlwindDefinition,
  atlasVisual(whirlwindDefinition, objectCell(43)),
  [{ behavior: whirlwindBehavior }],
);

export const whirlwind: EntityModule = {
  ...whirlwindBase,
  runtimeActions: [flightAction],
};

const landingDefinition: EntityModuleDefinition = {
  type: EntityTypeId.LANDING,
  traits: ["flight-landing"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Landing" },
};

export const landing: EntityModule = originalModule(
  landingDefinition,
  atlasVisual(landingDefinition, objectCell(44)),
  [{ behavior: landingBehavior }],
);

function createFlightAction(ownerEntityId: EntityId): RuntimeActionSpec {
  return {
    kind: FLIGHT_ACTION,
    ownerEntityId,
    blocksInput: true,
    state: { elapsedMs: 0, pendingMove: false },
  };
}

function booleanState(value: JsonValue | undefined): boolean {
  return value === true;
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function integerState(value: JsonValue | undefined): number {
  return Math.floor(numberState(value));
}
