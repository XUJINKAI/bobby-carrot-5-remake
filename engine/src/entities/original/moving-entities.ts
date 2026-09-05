import { EntityTypeId, type Direction, type EntityType, type JsonValue } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import {
  accrueActionDeadline,
  consumeActionDeadline,
  primeDeadlineForHandoff,
} from "../../world/action/ActionDeadline.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityId, EntityInstance } from "../../world/entity/EntityInstance.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId, patchBobbyMount } from "../player/BobbyState.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const MOVING_ENTITY_ACTION = "moving-entity";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;

export const DEFAULT_MOVING_ENTITY_CELL_MS = 16 * ORIGINAL_GAMEPLAY_STEP_MS;
export const DEFAULT_WATERFALL_CELL_MS = 8 * ORIGINAL_GAMEPLAY_STEP_MS;

const vehicleBehavior: Behavior = {
  id: "moving-entity-vehicle",
  canEnter({ actor, self, query }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return { passable: false, reason: "moving-entity-collision" };
    const moving =
      self.entity.state?.moving === true ||
      query.motionForEntity(self.entity.id)?.status === "running";
    return moving
      ? { passable: false, reason: "moving-entity-in-motion" }
      : { passable: true, reason: "mount-stopped-moving-entity" };
  },
  canLeave({ actor, self, query }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
    return bobbyMountId(actor.state) === self.entity.id
      ? { passable: true, reason: "dismount-moving-entity" }
      : undefined;
  },
  onEnter({ actor, self, direction, movement, query, commands }) {
    if (
      !direction ||
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null ||
      self.entity.state?.moving === true ||
      query.motionForEntity(self.entity.id)?.status === "running"
    )
      return;
    commands.setState(actor.id, patchBobbyMount(actor.state, self.entity.id));
    if (self.entity.type !== EntityTypeId.LEAF) return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      moving: true,
      runtimeStarted: true,
    });
    commands.setDirection(self.entity.id, direction);
    const cadenceMs = query.hasTraitAt(self.entity.anchor, "waterfall")
      ? DEFAULT_WATERFALL_CELL_MS
      : DEFAULT_MOVING_ENTITY_CELL_MS;
    commands.startAction(
      createMovingEntityAction(
        self.entity.id,
        primeDeadlineForHandoff(cadenceMs, movement?.motion),
      ),
    );
  },
  onLeave({ actor, self, query, commands }) {
    if (
      query.entityHasTrait(actor.id, "player") &&
      bobbyMountId(actor.state) === self.entity.id
    )
      commands.setState(actor.id, patchBobbyMount(actor.state, null));
  },
  onTick({ self, commands }) {
    if (!isCloud(self.entity.type) || self.entity.state?.runtimeStarted === true)
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      moving: false,
      runtimeStarted: true,
    });
    commands.startAction(
      createMovingEntityAction(self.entity.id, DEFAULT_MOVING_ENTITY_CELL_MS),
    );
  },
};

const movingEntityAction: RuntimeActionDefinition = {
  kind: MOVING_ENTITY_ACTION,
  update({ action, time, query, commands }) {
    const entityId = action.ownerEntityId;
    if (entityId === undefined) return "complete";
    const entity = query.entity(entityId);
    if (!entity) return "complete";
    accrueActionDeadline(action, time);
    if (
      query.motionForEntity(entityId)?.status === "running" ||
      mountedPassengerIsMoving(query, entityId)
    )
      return "running";

    if (booleanState(action.state.pendingMove)) {
      const beforeX = integerState(action.state.beforeX);
      const beforeY = integerState(action.state.beforeY);
      if (entity.anchor.x === beforeX && entity.anchor.y === beforeY)
        return stopMovingEntity(entity, commands, isCloud(entity.type));
      action.state.pendingMove = false;
    }

    if (isCloud(entity.type) && isMatchingCloudParking(query, entity))
      return stopMovingEntity(entity, commands, false);

    const route = nextRoute(query, entity);
    if (!route) return stopMovingEntity(entity, commands, isCloud(entity.type));

    if (!consumeActionDeadline(action, route.cadenceMs, time.stepMs / 2))
      return "running";

    if (entity.direction !== route.direction)
      commands.setDirection(entityId, route.direction);
    commands.setState(entityId, { ...entity.state, moving: true });
    action.state.beforeX = entity.anchor.x;
    action.state.beforeY = entity.anchor.y;
    action.state.pendingMove = true;
    return {
      status: "running",
      intents: [
        {
          type: "move",
          actorId: entityId,
          direction: route.direction,
          cause: {
            type: "forced",
            mechanism: isCloud(entity.type) ? "cloud" : "leaf",
            cadenceMs: route.cadenceMs,
          },
        },
      ],
    };
  },
};

export const leaf = movingEntityModule(
  EntityTypeId.LEAF,
  "Leaf",
  35,
  true,
);
export const cloudRed = movingEntityModule(EntityTypeId.CLOUD_RED, "Red Cloud", 23);
export const cloudPurple = movingEntityModule(
  EntityTypeId.CLOUD_PURPLE,
  "Purple Cloud",
  24,
);
export const cloudGreen = movingEntityModule(
  EntityTypeId.CLOUD_GREEN,
  "Green Cloud",
  25,
);

function movingEntityModule(
  type: EntityType,
  name: string,
  atlasIndex: number,
  ownsAction = false,
): EntityModule {
  const definition: EntityModuleDefinition = {
    type,
    traits: [
      "vehicle",
      "moving-platform",
      "terrain-overlay",
      "walkable",
      "blocking",
      isCloud(type) ? "cloud" : "leaf",
    ],
    stackOrder: CONTENT_STACK_ORDER,
    state: [
      { key: "moving", kind: "boolean", label: "移动中", default: false },
    ],
    presentation: { name },
  };
  const module = originalModule(
    definition,
    atlasVisual(definition, objectCell(atlasIndex)),
    [{ behavior: vehicleBehavior }],
  );
  return ownsAction ? { ...module, runtimeActions: [movingEntityAction] } : module;
}

function createMovingEntityAction(
  ownerEntityId: EntityId,
  initialElapsedMs: number,
): RuntimeActionSpec {
  return {
    kind: MOVING_ENTITY_ACTION,
    ownerEntityId,
    state: {
      elapsedMs: initialElapsedMs,
      pendingMove: false,
    },
  };
}

function nextRoute(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): { direction: Direction; cadenceMs: number } | null {
  const initial = directionState(entity.direction) ?? "right";
  const direction = isCloud(entity.type)
    ? forcedWindAt(
        query,
        entity.anchor,
        entity.state?.moving === true ? initial : null,
      ) ??
      (entity.state?.moving === true ? initial : null)
    : leafDirectionAt(query, entity.anchor, initial);
  if (!direction) return null;
  const target = addDirection(entity.anchor, direction);
  if (!canEnterMovingDomain(query, entity, target, direction)) return null;
  return {
    direction,
    cadenceMs:
      entity.type === EntityTypeId.LEAF &&
      query.hasTraitAt(entity.anchor, "waterfall")
        ? DEFAULT_WATERFALL_CELL_MS
        : DEFAULT_MOVING_ENTITY_CELL_MS,
  };
}

function leafDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  fallback: Direction,
): Direction {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type === EntityTypeId.TIDE) return entity.direction ?? fallback;
  }
  return query.hasTraitAt(cell, "waterfall") ? "down" : fallback;
}

function canEnterMovingDomain(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  target: { x: number; y: number },
  direction: Direction,
): boolean {
  if (!query.inBounds(target)) return false;
  if (
    query.presencesAt(target).some(
      (presence) =>
        presence.entityId !== entity.id &&
        presence.traits.includes("moving-platform"),
    )
  )
    return false;
  if (entity.type === EntityTypeId.LEAF) {
    if (!query.hasTraitAt(target, "water")) return false;
    for (const presence of query.presencesAt(target)) {
      const tide = query.entity(presence.entityId);
      if (
        tide?.type === EntityTypeId.TIDE &&
        tide.direction === oppositeDirection(direction)
      )
        return false;
    }
    return !(direction === "up" && query.hasTraitAt(target, "waterfall"));
  }
  if (!query.hasTraitAt(target, "cloud-space")) return false;
  const opposingWind = forcedWindAt(query, target, direction);
  return opposingWind !== oppositeDirection(direction);
}

function forcedWindAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  currentDirection: Direction | null,
): Direction | null {
  const directions: readonly Direction[] = ["up", "down", "left", "right"];
  for (let channel = 0; channel < directions.length; channel += 1) {
    const direction = directions[channel]!;
    if (direction === currentDirection || !windEnabled(query, channel)) continue;
    const windmill = windmillFor(query, direction);
    if (windmill && insideWindRange(cell, windmill.anchor, direction))
      return direction;
  }
  return null;
}

function windEnabled(query: WorldQueryApi, channel: number): boolean {
  return query.entitiesWithTrait("switch").some(
    (entity) =>
      entity.type === EntityTypeId.WIND_SWITCH &&
      integerState(entity.properties?.channel) === channel &&
      entity.state?.active === true,
  );
}

function windmillFor(
  query: WorldQueryApi,
  direction: Direction,
): Readonly<EntityInstance> | undefined {
  const type = {
    up: EntityTypeId.WINDMILL_UP,
    down: EntityTypeId.WINDMILL_DOWN,
    left: EntityTypeId.WINDMILL_LEFT,
    right: EntityTypeId.WINDMILL_RIGHT,
  }[direction];
  return query.entitiesWithTrait("windmill").find((entity) => entity.type === type);
}

function insideWindRange(
  cell: { x: number; y: number },
  windmill: { x: number; y: number },
  direction: Direction,
): boolean {
  if (direction === "up")
    return cell.x === windmill.x && cell.y >= windmill.y - 3 && cell.y < windmill.y;
  if (direction === "down")
    return cell.x === windmill.x && cell.y > windmill.y && cell.y <= windmill.y + 3;
  if (direction === "left")
    return cell.y === windmill.y && cell.x >= windmill.x - 3 && cell.x < windmill.x;
  return cell.y === windmill.y && cell.x > windmill.x && cell.x <= windmill.x + 3;
}

function isMatchingCloudParking(
  query: WorldQueryApi,
  cloud: Readonly<EntityInstance>,
): boolean {
  const parking =
    cloud.type === EntityTypeId.CLOUD_RED
      ? EntityTypeId.CLOUD_GRID_RED
      : cloud.type === EntityTypeId.CLOUD_PURPLE
        ? EntityTypeId.CLOUD_GRID_PURPLE
        : cloud.type === EntityTypeId.CLOUD_GREEN
          ? EntityTypeId.CLOUD_GRID_GREEN
          : undefined;
  return parking !== undefined && query.presencesAt(cloud.anchor).some(
    (presence) => query.entity(presence.entityId)?.type === parking,
  );
}

function mountedPassengerIsMoving(
  query: WorldQueryApi,
  vehicleId: EntityId,
): boolean {
  return query.entitiesWithTrait("player").some(
    (actor) =>
      bobbyMountId(actor.state) === vehicleId &&
      query.motionForEntity(actor.id)?.status === "running",
  );
}

function stopMovingEntity(
  entity: Readonly<EntityInstance>,
  commands: WorldCommandApi,
  keepAction = false,
) {
  if (entity.state?.moving === true)
    commands.setState(entity.id, { ...entity.state, moving: false });
  return keepAction ? "running" as const : "complete" as const;
}

function isCloud(type: EntityType): boolean {
  return type === EntityTypeId.CLOUD_RED ||
    type === EntityTypeId.CLOUD_PURPLE ||
    type === EntityTypeId.CLOUD_GREEN;
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

function oppositeDirection(direction: Direction): Direction {
  return { up: "down", down: "up", left: "right", right: "left" }[
    direction
  ] as Direction;
}

function directionState(value: JsonValue | undefined): Direction | null {
  return value === "up" || value === "down" || value === "left" || value === "right"
    ? value
    : null;
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
