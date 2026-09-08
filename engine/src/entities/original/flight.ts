import { MapEntityTypeId } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import {
  accrueActionDeadline,
  consumeActionDeadline,
} from "../../world/action/ActionDeadline.js";
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
  tileCell,
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
  update({ action, time, query }) {
    const actorId = action.ownerEntityId;
    if (actorId === undefined) return "complete";
    const actor = query.entity(actorId);
    if (!actor || !isBobbyFlying(actor.state)) return "complete";
    accrueActionDeadline(action, time);
    if (query.motionForEntity(actorId)?.status === "running") return "running";

    if (!consumeActionDeadline(action, DEFAULT_FLIGHT_CELL_MS, time.stepMs / 2))
      return "running";
    const direction = actor.direction;
    if (!direction) return "complete";
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
  onIntentResult({ action, result, query, commands }) {
    if (result.moved) return;
    const actorId = action.ownerEntityId;
    const actor = actorId === undefined ? undefined : query.entity(actorId);
    if (actor) {
      commands.emit({
        type: "flight-path-invalid",
        entityId: actor.id,
        x: actor.anchor.x,
        y: actor.anchor.y,
        reason: result.passage.reason,
      });
    }
    commands.cancelAction(action.id);
  },
  onCancel({ action, reason, query, commands }) {
    if (reason === "owner-destroyed") return;
    const actorId = action.ownerEntityId;
    const actor = actorId === undefined ? undefined : query.entity(actorId);
    if (actor)
      commands.setState(actor.id, patchBobbyFlight(actor.state, false));
  },
};

const whirlwindDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.WHIRLWIND,
  traits: ["flight-entry", "blocking"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Whirlwind" },
};

const whirlwindBase = originalModule(
  whirlwindDefinition,
  atlasVisual(whirlwindDefinition, tileCell(MapEntityTypeId.WHIRLWIND)),
  [{ behavior: whirlwindBehavior }],
);

export const whirlwind: EntityModule = {
  ...whirlwindBase,
  runtimeActions: [flightAction],
};

const landingDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.LANDING,
  traits: ["flight-landing"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Landing" },
};

export const landing: EntityModule = originalModule(
  landingDefinition,
  atlasVisual(landingDefinition, tileCell(MapEntityTypeId.LANDING)),
  [{ behavior: landingBehavior }],
);

function createFlightAction(ownerEntityId: EntityId): RuntimeActionSpec {
  return {
    kind: FLIGHT_ACTION,
    ownerEntityId,
    blocksInput: true,
    state: { elapsedMs: DEFAULT_FLIGHT_CELL_MS },
  };
}
