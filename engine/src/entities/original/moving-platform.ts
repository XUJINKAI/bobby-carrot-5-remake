import {
  MapEntityTypeId,
  type Direction,
  type EntityType,
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
import type {
  EntityId,
  EntityInstance,
  EntityState,
} from "../../world/entity/EntityInstance.js";
import { createMovingPlatformSupportBehavior } from "../behaviors/moving-platform-support.js";
import {
  CLOUD_MOVEMENT,
  resolveActionMovementCadenceMs,
} from "../movement/MovementCadence.js";
import {
  consumeWindFocusPending,
  isMatchingCloudParking,
  nextCloudRoute,
} from "./cloud-movement.js";
import {
  hasLeafAutomaticCurrent,
  leafRouteAwaitsMovingSupportSettlement,
  leafMovementFor,
  nextLeafRoute,
  tideDirectionAt,
} from "./leaf-movement.js";
import { oppositeDirection } from "./moving-platform-collision.js";

const MOVING_ENTITY_ACTION = "moving-entity";
export const MOVING_PLATFORM_SUPPORT_HEIGHT_PX = 12;

/** 原版 Leaf / Cloud 在通用承载规则之上共用同一移动 Action 生命周期。 */
export const movingPlatformBehavior: Behavior = createMovingPlatformSupportBehavior({
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
    const actionActive = self.entity.state?.movingActionActive === true;
    const movementCadence = leafMovementFor(query, self.entity, direction);
    const launchDeadlineMs = primeDeadlineForHandoff(
      movementCadence.cellMs,
      movement?.motion,
    );
    commands.setState(self.entity.id, {
      ...self.entity.state,
      moving: true,
      runtimeStarted: true,
      movingActionActive: true,
      launchDirection: direction,
      ...(actionActive ? { launchDeadlineMs } : {}),
    });
    commands.setDirection(self.entity.id, direction);
    if (actionActive) return;
    commands.startAction(
      createMovingEntityAction(
        self.entity.id,
        launchDeadlineMs,
      ),
    );
  },
  onTick({ self, query, commands }) {
    if (
      self.entity.state?.runtimeStarted === true ||
      !hasAutomaticCurrent(query, self.entity)
    )
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      moving: false,
      runtimeStarted: true,
      movingActionActive: true,
    });
    commands.startAction(
      createMovingEntityAction(
        self.entity.id,
        initialMovementMs(query, self.entity),
      ),
    );
  },
});

export const movingEntityAction: RuntimeActionDefinition = {
  kind: MOVING_ENTITY_ACTION,
  update({ action, time, query, commands }) {
    const entityId = action.ownerEntityId;
    if (entityId === undefined) return "complete";
    const entity = query.entity(entityId);
    if (!entity) return "complete";
    const launchDeadlineMs = finiteStateNumber(
      entity.state?.launchDeadlineMs,
    );
    if (launchDeadlineMs !== null) {
      // 堵塞的 Tide 会保留 Action；Bobby 抵达时必须以交接点重置
      // deadline，不能把之前等待障碍的时间带入新方向。
      action.state.elapsedMs = launchDeadlineMs;
      commands.setState(
        entityId,
        withoutLaunchDeadline(entity.state),
      );
    }
    accrueActionDeadline(action, time);
    if (
      query.motionForEntity(entityId)?.status === "running" ||
      coLocatedPlayerIsMoving(query, entity)
    )
      return "running";

    if (isCloud(entity.type) && isMatchingCloudParking(query, entity))
      return stopMovingEntity(entity, commands, false);

    const route = isCloud(entity.type)
      ? nextCloudRoute(query, entity)
      : nextLeafRoute(
          query,
          entity,
          directionState(entity.state?.launchDirection),
        );
    if (!route) {
      if (
        !isCloud(entity.type) &&
        leafRouteAwaitsMovingSupportSettlement(
          query,
          entity,
          directionState(entity.state?.launchDirection),
        )
      )
        return "running";
      return stopMovingEntity(
        entity,
        commands,
        hasAutomaticCurrent(query, entity),
      );
    }

    if (!consumeActionDeadline(action, route.movement.cellMs, time.stepMs / 2))
      return "running";
    if (entity.direction !== route.direction)
      commands.setDirection(entityId, route.direction);
    const windFocusHandoff = "windFocusHandoff" in route &&
      route.windFocusHandoff;
    commands.setState(entityId, {
      ...withoutLaunchHandoff(entity.state),
      moving: true,
      movingActionActive: true,
      ...(windFocusHandoff ? { windFocusHandoff: route.direction } : {}),
    });
    if (windFocusHandoff)
      consumeWindFocusPending(query, commands, route.direction);
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
            cadenceMs: resolveActionMovementCadenceMs(
              action,
              route.movement,
              time.stepMs,
            ),
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
    const keepAction = hasAutomaticCurrent(query, entity);
    stopMovingEntity(entity, commands, keepAction);
    if (!keepAction) commands.cancelAction(action.id);
  },
  onCancel({ action, reason, query, commands }) {
    const entityId = action.ownerEntityId;
    const entity = entityId === undefined ? undefined : query.entity(entityId);
    if (entity && reason !== "owner-destroyed")
      stopMovingEntity(entity, commands);
  },
};

function createMovingEntityAction(
  ownerEntityId: EntityId,
  initialElapsedMs: number,
): RuntimeActionSpec {
  return {
    kind: MOVING_ENTITY_ACTION,
    ownerEntityId,
    state: {
      elapsedMs: initialElapsedMs,
      cadenceCarryMs: 0,
    },
  };
}

function initialMovementMs(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): number {
  return isCloud(entity.type)
    ? CLOUD_MOVEMENT.cellMs
    : leafMovementFor(query, entity, "down").cellMs;
}

function hasAutomaticCurrent(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): boolean {
  return isCloud(entity.type) || hasLeafAutomaticCurrent(query, entity);
}

function coLocatedPlayerIsMoving(
  query: WorldQueryApi,
  platform: Readonly<EntityInstance>,
): boolean {
  return query.entitiesWithFact("player").some(
    (actor) =>
      actor.anchor.x === platform.anchor.x &&
      actor.anchor.y === platform.anchor.y &&
      query.motionForEntity(actor.id)?.status === "running",
  );
}

function stopMovingEntity(
  entity: Readonly<EntityInstance>,
  commands: WorldCommandApi,
  keepAction = false,
) {
  if (
    entity.state?.moving === true ||
    entity.state?.movingActionActive !== keepAction ||
    (!keepAction && entity.state?.launchDirection !== undefined)
  )
    commands.setState(entity.id, {
      ...(keepAction
        ? withoutLaunchDeadline(entity.state)
        : withoutLaunchHandoff(entity.state)),
      moving: false,
      movingActionActive: keepAction,
    });
  return keepAction ? "running" as const : "complete" as const;
}

function withoutLaunchHandoff(
  state: Readonly<EntityState> | undefined,
): EntityState {
  const next = withoutLaunchDeadline(state);
  delete next.launchDirection;
  return next;
}

function withoutLaunchDeadline(
  state: Readonly<EntityState> | undefined,
): EntityState {
  const next = { ...(state ?? {}) };
  delete next.launchDeadlineMs;
  return next;
}

function isCloud(type: EntityType): boolean {
  return type === MapEntityTypeId.CLOUD;
}

function directionState(value: unknown): Direction | null {
  return value === "up" ||
      value === "down" ||
      value === "left" ||
      value === "right"
    ? value
    : null;
}

function finiteStateNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}
