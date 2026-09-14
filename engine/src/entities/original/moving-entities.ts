import {
  MapEntityTypeId,
  type Direction,
  type EntityType,
  type JsonValue,
} from "@bobby/model";
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
import {
  atlasVisual,
  tileCell,
  originalModule,
} from "./module.js";

const MOVING_ENTITY_ACTION = "moving-entity";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;

export const DEFAULT_MOVING_ENTITY_CELL_MS = 16 * ORIGINAL_GAMEPLAY_STEP_MS;
export const DEFAULT_WATERFALL_CELL_MS = 8 * ORIGINAL_GAMEPLAY_STEP_MS;
export const LEAF_SUPPORT_HEIGHT_PX = 12;

/** Leaf / Cloud 携带同格玩家，但步行进入不建立驾驶关系。 */
const movingPlatformBehavior: Behavior = {
  id: "moving-platform-support",
  planMovement({ actor, query, to }) {
    return {
      passage: "unrestricted",
      lifecycle: { source: [], target: [] },
      companions: playersAt(query, actor.anchor).map((passenger) => ({
        entityId: passenger.id,
        to,
        cause: { type: "carry" as const, carrierId: actor.id },
        updateDirection: false,
      })),
      reason: "moving-platform-passage",
    };
  },
  canEnter({ actor, self, query }) {
    if (!query.entityHasFact(actor.id, "player"))
      return { passable: false, reason: "moving-entity-collision" };

    const moving =
      self.entity.state?.moving === true ||
      query.motionForEntity(self.entity.id)?.status === "running";
    return moving
      ? { passable: false, reason: "moving-entity-in-motion" }
      : { passable: true, reason: "moving-platform-support" };
  },
  canLeave({ actor, query }) {
    return query.entityHasFact(actor.id, "player")
      ? { passable: true, reason: "leave-moving-platform-support" }
      : undefined;
  },
  onArrive({ actor, self, direction, movement, query, commands }) {
    if (
      !direction ||
      !query.entityHasFact(actor.id, "player") ||
      self.entity.type !== MapEntityTypeId.LEAF ||
      self.entity.state?.moving === true ||
      query.motionForEntity(self.entity.id)?.status === "running"
    )
      return;

    const tideDirection = tideDirectionAt(query, self.entity.anchor);
    if (tideDirection === oppositeDirection(direction)) return;

    // 潮流只禁止逆流启动；首格保留 Bobby 的进入方向，后续再尝试随流。
    commands.setState(self.entity.id, {
      ...self.entity.state,
      moving: true,
      runtimeStarted: true,
    });
    commands.setDirection(self.entity.id, direction);
    const cadenceMs = query.hasSelectorAt(self.entity.anchor, {
      kind: "type",
      value: MapEntityTypeId.WATERFALL,
    })
      ? DEFAULT_WATERFALL_CELL_MS
      : DEFAULT_MOVING_ENTITY_CELL_MS;
    commands.startAction(
      createMovingEntityAction(
        self.entity.id,
        primeDeadlineForHandoff(cadenceMs, movement?.motion),
        tideDirection !== null ? direction : null,
      ),
    );
  },
  onTick({ self, query, commands }) {
    if (self.entity.state?.runtimeStarted === true ||
      !hasAutomaticCurrent(query, self.entity))
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
      coLocatedPlayerIsMoving(query, entity)
    )
      return "running";

    if (isCloud(entity.type) && isMatchingCloudParking(query, entity))
      return stopMovingEntity(entity, commands, false);

    const launchDirection = directionState(action.state.launchDirection);
    const route = nextRoute(query, entity, launchDirection);
    if (!route)
      return stopMovingEntity(entity, commands, hasAutomaticCurrent(query, entity));

    if (!consumeActionDeadline(action, route.cadenceMs, time.stepMs / 2))
      return "running";
    if (launchDirection !== null) delete action.state.launchDirection;
    if (entity.direction !== route.direction)
      commands.setDirection(entityId, route.direction);
    commands.setState(entityId, { ...entity.state, moving: true });
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
  onIntentResult({ action, result, query, commands }) {
    if (result.moved) return;
    const entityId = action.ownerEntityId;
    const entity = entityId === undefined ? undefined : query.entity(entityId);
    if (!entity) return;
    stopMovingEntity(entity, commands);
    if (!hasAutomaticCurrent(query, entity)) commands.cancelAction(action.id);
  },
  onCancel({ action, reason, query, commands }) {
    const entityId = action.ownerEntityId;
    const entity = entityId === undefined ? undefined : query.entity(entityId);
    if (entity && reason !== "owner-destroyed")
      stopMovingEntity(entity, commands);
  },
};

export const leaf = movingEntityModule(
  MapEntityTypeId.LEAF,
  "Leaf",
  true,
);

const cloudDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.CLOUD,
  facts: [
    "moving-platform",
    "walkable",
    "blocking",
  ],
  state: [
    {
      key: "color",
      kind: "enum",
      label: "颜色",
      default: "red",
      options: [{ value: "red" }, { value: "purple" }, { value: "green" }],
    },
    { key: "moving", kind: "boolean", label: "移动中", default: false },
  ],
  presentation: { name: "Cloud" },
};

export const cloud: EntityModule = originalModule(
  cloudDefinition,
  atlasVisual(cloudDefinition, (context) =>
    tileCell(MapEntityTypeId.CLOUD, {
      fields: { color: cloudColor(context.entity.state?.color) },
    }),
  ),
  [{ behavior: movingPlatformBehavior }],
);

const cloudParkingDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.CLOUD_PARKING,
  facts: [],
  presentation: { name: "Cloud Parking" },
};

export const cloudParking: EntityModule = originalModule(
  cloudParkingDefinition,
  atlasVisual(cloudParkingDefinition, (context) =>
    tileCell(MapEntityTypeId.CLOUD_PARKING, {
      fields: { color: cloudColor(context.entity.state?.color) },
    }),
  ),
);

function movingEntityModule(
  type: EntityType,
  name: string,
  ownsAction = false,
): EntityModule {
  const definition: EntityModuleDefinition = {
    type,
    facts: [
      "moving-platform",
      "walkable",
      "blocking",
    ],
    state: [
      { key: "moving", kind: "boolean", label: "移动中", default: false },
    ],
    presentation: { name },
  };
  const visual = {
    ...atlasVisual(definition, tileCell(type)),
    ...(type === MapEntityTypeId.LEAF
      ? { supportHeightPx: LEAF_SUPPORT_HEIGHT_PX }
      : {}),
  };
  const module = originalModule(
    definition,
    visual,
    [{ behavior: movingPlatformBehavior }],
  );
  return ownsAction ? { ...module, runtimeActions: [movingEntityAction] } : module;
}

function createMovingEntityAction(
  ownerEntityId: EntityId,
  initialElapsedMs: number,
  launchDirection: Direction | null = null,
): RuntimeActionSpec {
  return {
    kind: MOVING_ENTITY_ACTION,
    ownerEntityId,
    state: {
      elapsedMs: initialElapsedMs,
      ...(launchDirection !== null ? { launchDirection } : {}),
    },
  };
}

function nextRoute(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  launchDirection: Direction | null = null,
): { direction: Direction; cadenceMs: number } | null {
  const initial = directionState(entity.direction) ?? "right";
  const candidates = isCloud(entity.type)
    ? [
        ...activeWindDirectionsAt(
          query,
          entity.anchor,
          entity.state?.moving === true ? initial : null,
        ),
        ...(entity.state?.moving === true ? [initial] : []),
      ]
    : [launchDirection ?? leafDirectionAt(query, entity.anchor, initial), initial];
  const direction = candidates.find((candidate) =>
    canEnterMovingDomain(query, entity, addDirection(entity.anchor, candidate), candidate)
  );
  if (!direction) return null;
  return {
    direction,
    cadenceMs:
      entity.type === MapEntityTypeId.LEAF &&
      query.hasSelectorAt(entity.anchor, { kind: "type", value: MapEntityTypeId.WATERFALL })
        ? DEFAULT_WATERFALL_CELL_MS
        : DEFAULT_MOVING_ENTITY_CELL_MS,
  };
}

function leafDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  fallback: Direction,
): Direction {
  return tideDirectionAt(query, cell) ??
    (query.hasSelectorAt(cell, { kind: "type", value: MapEntityTypeId.WATERFALL }) ? "down" : fallback);
}

function hasAutomaticCurrent(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): boolean {
  return isCloud(entity.type) ||
    query.hasSelectorAt(entity.anchor, { kind: "type", value: MapEntityTypeId.TIDE }) ||
    query.hasSelectorAt(entity.anchor, { kind: "type", value: MapEntityTypeId.WATERFALL });
}

function tideDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): Direction | null {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== MapEntityTypeId.TIDE) continue;
    return directionState(entity.direction) ?? null;
  }
  return null;
}

function canEnterMovingDomain(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  target: { x: number; y: number },
  direction: Direction,
): boolean {
  if (!query.inBounds(target)) return false;
  const domainFact = entity.type === MapEntityTypeId.LEAF ? "water" : "sky";
  if (!query.hasFactAt(target, domainFact)) return false;
  if (movingSupportOccupiedAt(query, entity, target, direction)) return false;

  if (entity.type === MapEntityTypeId.LEAF) {
    for (const presence of query.presencesAt(target)) {
      const tide = query.entity(presence.entityId);
      if (
        tide?.type === MapEntityTypeId.TIDE &&
        tide.direction === oppositeDirection(direction)
      )
        return false;
    }
    return !(
      direction === "up" &&
      query.hasSelectorAt(target, {
        kind: "type",
        value: MapEntityTypeId.WATERFALL,
      })
    );
  }

  return !windAppliesAt(query, target, oppositeDirection(direction));
}

function movingSupportOccupiedAt(
  query: WorldQueryApi,
  mover: Readonly<EntityInstance>,
  target: { x: number; y: number },
  direction: Direction,
): boolean {
  return query.presencesAt(target).some((presence) => {
    if (presence.entityId === mover.id) return false;
    const occupant = query.entity(presence.entityId);
    if (!occupant) return false;
    if (
      occupant.type === MapEntityTypeId.PLANK ||
      occupant.type === MapEntityTypeId.ICE_BLOCK ||
      occupant.type === MapEntityTypeId.CRUMBLY_ROCK ||
      occupant.type === MapEntityTypeId.FENCE
    )
      return true;
    if (occupant.type === MapEntityTypeId.CLOUD || occupant.type === MapEntityTypeId.LEAF)
      return occupant.direction !== direction || occupant.state?.moving !== true;
    return false;
  });
}

function activeWindDirectionsAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  currentDirection: Direction | null,
): Direction[] {
  const directions: readonly Direction[] = ["up", "down", "left", "right"];
  return directions.filter((direction) =>
    direction !== currentDirection && windAppliesAt(query, cell, direction)
  );
}

function windAppliesAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  direction: Direction,
): boolean {
  if (!windEnabled(query, direction)) return false;
  const windmill = windmillFor(query, direction);
  return windmill !== undefined && insideWindRange(cell, windmill.anchor, direction);
}

function windEnabled(query: WorldQueryApi, direction: Direction): boolean {
  return query.entitiesMatching({ kind: "type", value: MapEntityTypeId.WIND_SWITCH }).some(
    (entity) =>
      entity.type === MapEntityTypeId.WIND_SWITCH &&
      entity.direction === direction &&
      entity.state?.active === true,
  );
}

function windmillFor(
  query: WorldQueryApi,
  direction: Direction,
): Readonly<EntityInstance> | undefined {
  return query.entitiesMatching({ kind: "type", value: MapEntityTypeId.WINDMILL }).find(
    (entity) =>
      entity.type === MapEntityTypeId.WINDMILL &&
      entity.direction === direction,
  );
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
  const color = cloudColor(cloud.state?.color);
  return query.presencesAt(cloud.anchor).some((presence) => {
    const parking = query.entity(presence.entityId);
    return parking?.type === MapEntityTypeId.CLOUD_PARKING &&
      cloudColor(parking.state?.color) === color;
  });
}

function playersAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): readonly EntityInstance[] {
  return query.entitiesWithFact("player").filter(
    (actor) => actor.anchor.x === cell.x && actor.anchor.y === cell.y,
  );
}

function coLocatedPlayerIsMoving(
  query: WorldQueryApi,
  platform: Readonly<EntityInstance>,
): boolean {
  return playersAt(query, platform.anchor).some(
    (actor) => query.motionForEntity(actor.id)?.status === "running",
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
  return type === MapEntityTypeId.CLOUD;
}

function cloudColor(value: JsonValue | undefined): "red" | "purple" | "green" {
  return value === "purple" || value === "green" ? value : "red";
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
