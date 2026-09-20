import {
  MapEntityTypeId,
  type Direction,
  type JsonValue,
} from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import {
  CAMERA_FOLLOW_STEP_MS,
  cameraFollowTravelDurationMs,
} from "../../render/Camera.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  tileCell,
  originalModule,
} from "./module.js";

const WIND_SWITCH_DIRECTIONS: readonly Direction[] = [
  "up",
  "down",
  "left",
  "right",
];
const WIND_CAMERA_FOCUS_ACTION = "wind-camera-focus";
export const WIND_CAMERA_FOCUS_STEPS = 64;
export const WIND_CAMERA_FOCUS_DURATION_MS =
  WIND_CAMERA_FOCUS_STEPS * CAMERA_FOLLOW_STEP_MS;
const ORIGINAL_TILE_SIZE = 48;

const windCameraFocusAction: RuntimeActionDefinition = {
  kind: WIND_CAMERA_FOCUS_ACTION,
  update({ action, time, query, commands }) {
    const direction = directionState(action.state.direction);
    if (!direction) return "complete";
    const handoffClouds = query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.CLOUD,
    }).filter((entity) => entity.state?.windFocusHandoff === direction);
    const handoffCloud = handoffClouds[0];
    if (handoffCloud) {
      action.focus = { entityId: handoffCloud.id };
      action.state.phase = "hold";
      action.state.elapsedHoldMs = 0;
      for (const cloud of handoffClouds)
        commands.setState(cloud.id, withoutWindFocusHandoff(cloud.state));
      return "running";
    }
    if (action.state.phase !== "hold") {
      const remainingTravelMs = numberState(action.state.remainingTravelMs) - time.stepMs;
      if (remainingTravelMs > time.stepMs / 2) {
        action.state.remainingTravelMs = remainingTravelMs;
        return "running";
      }
      action.state.phase = "hold";
      action.state.elapsedHoldMs = 0;
      for (const entity of query.entitiesMatching({
        kind: "type",
        value: MapEntityTypeId.WIND_SWITCH,
      })) {
        if (entity.direction !== direction || entity.state?.active !== true) continue;
        commands.setState(entity.id, {
          ...entity.state,
          windPending: false,
          windFocusPending: true,
        });
      }
      return "running";
    }

    const elapsedHoldMs = numberState(action.state.elapsedHoldMs) + time.stepMs;
    action.state.elapsedHoldMs = elapsedHoldMs;
    if (elapsedHoldMs + time.stepMs / 2 >= WIND_CAMERA_FOCUS_DURATION_MS) {
      clearWindFocusPending(query, commands, direction);
      return "complete";
    }
    return "running";
  },
};

const toggleWindDirection: Behavior = {
  id: "wind-switch-direction-toggle",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasFact(actor.id, "player")) return;
    const direction = self.entity.direction;
    if (!direction) return;
    const active = self.entity.state?.active !== true;
    const windmill = active
      ? query.entitiesMatching({
          kind: "type",
          value: MapEntityTypeId.WINDMILL,
        }).find((entity) => entity.direction === direction)
      : undefined;

    for (const entity of query.entitiesMatching({ kind: "type", value: MapEntityTypeId.WIND_SWITCH })) {
      if (entity.type !== MapEntityTypeId.WIND_SWITCH) continue;
      if (entity.direction !== direction) continue;
      commands.setState(entity.id, {
        ...entity.state,
        active,
        windPending: active && windmill !== undefined,
        windFocusPending: false,
      });
    }
    if (windmill) {
      commands.startAction(createWindCameraFocus(
        windmill.id,
        direction,
        windmill.anchor.x - actor.anchor.x,
        windmill.anchor.y - actor.anchor.y,
      ));
    }
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.WIND_SWITCH,
  presenceFacts: ["walkable"],
  state: activeState(false),
  presentation: { name: "Wind Switch" },
};

const base = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const direction: Direction = WIND_SWITCH_DIRECTIONS.includes(
      context.entity.direction as (typeof WIND_SWITCH_DIRECTIONS)[number],
    )
      ? context.entity.direction as Direction
      : "up";
    const active = context.entity.state?.active === true;
    return tileCell(MapEntityTypeId.WIND_SWITCH, {
      fields: { direction, active },
    });
  }),
  [{ behavior: toggleWindDirection }],
);

export const windSwitch: EntityModule = {
  ...base,
  runtimeActions: [windCameraFocusAction],
};

function createWindCameraFocus(
  windmillId: number,
  direction: Direction,
  deltaXCells: number,
  deltaYCells: number,
): RuntimeActionSpec {
  return {
    kind: WIND_CAMERA_FOCUS_ACTION,
    ownerEntityId: windmillId,
    focus: { entityId: windmillId },
    state: {
      direction,
      phase: "travel",
      remainingTravelMs: cameraFollowTravelDurationMs(
        deltaXCells * ORIGINAL_TILE_SIZE,
        deltaYCells * ORIGINAL_TILE_SIZE,
      ),
    },
  };
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function directionState(value: JsonValue | undefined): Direction | null {
  return WIND_SWITCH_DIRECTIONS.includes(value as Direction)
    ? value as Direction
    : null;
}

function withoutWindFocusHandoff(
  state: Readonly<Record<string, JsonValue>> | undefined,
): Record<string, JsonValue> {
  const { windFocusHandoff: _windFocusHandoff, ...remaining } = state ?? {};
  return remaining;
}

function clearWindFocusPending(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  direction: Direction,
): void {
  for (const entity of query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  })) {
    if (entity.direction !== direction || entity.state?.windFocusPending !== true) continue;
    commands.setState(entity.id, {
      ...entity.state,
      windFocusPending: false,
    });
  }
}
