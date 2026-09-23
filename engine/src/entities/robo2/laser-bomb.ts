import { MapEntityTypeId, type EntityType } from "@bobby/model";
import { ROBO2_GAMEPLAY_IMAGE_IDS } from "../../image/Robo2GameplayImages.js";
import type { TransientVisualDefinition } from "../../visual/VisualDefinition.js";
import type {
  RuntimeActionDefinition,
} from "../../world/action/RuntimeAction.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
} from "../../world/entity/EntityInstance.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import {
  beginLaserCannonDestruction,
  flashSegmentsFromBeams,
  groupLaserBeamsBySource,
} from "./laser-cannon-destruction.js";

const destructibleTypes: ReadonlySet<EntityType> = new Set([
  MapEntityTypeId.LASER_STONE,
  MapEntityTypeId.LASER_MIRROR,
  MapEntityTypeId.LASER_CANNON,
  MapEntityTypeId.LASER_BOMB,
]);
const LASER_BOMB_SCHEDULER_ACTION = "laser-bomb-scheduler";

export const LASER_BOMB_IGNITION_FRAME_MS = 180;
export const LASER_BOMB_EXPLOSION_FRAME_MS = 120;
export const LASER_BOMB_EXPLOSION_DURATION_MS =
  6 * LASER_BOMB_EXPLOSION_FRAME_MS;
export const LASER_BOMB_IGNITION_DURATION_MS =
  6 * LASER_BOMB_IGNITION_FRAME_MS;

export interface LaserExplosion {
  bombId: EntityId;
  center: CellPosition;
  cells: readonly CellPosition[];
  actorIds: readonly EntityId[];
  targetIds: ReadonlySet<EntityId>;
  chainedBombIds: readonly EntityId[];
}

const laserBombIgnitionVisual: TransientVisualDefinition = {
  id: "laser-bomb-ignition",
  eventType: "laser-bomb-ignition-started",
  durationMs: LASER_BOMB_IGNITION_DURATION_MS,
  renderPass: "effect",
  resolve({ progress }) {
    return {
      layers: [{
        kind: "image",
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.bombExplosion,
        frameWidth: 14,
        frameHeight: 14,
        frameRows: 6,
        frameProgress: progress,
        sourceTileSize: 12,
        anchor: "center",
      }],
    };
  },
};

const laserBombExplosionVisual: TransientVisualDefinition = {
  id: "laser-bomb-explosion",
  eventType: "laser-bomb-exploded",
  durationMs: LASER_BOMB_EXPLOSION_DURATION_MS,
  renderPass: "effect",
  resolve({ event, progress }) {
    const cells = explosionOffsetsFromEvent(event.data?.cells);
    return {
      layers: cells.map((cell) => ({
        kind: "image" as const,
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
        frameWidth: 14,
        frameHeight: 12,
        frameRows: 6,
        frameProgress: progress,
        sourceTileSize: 12,
        anchor: "center" as const,
        offsetX: cell.x * 12,
        offsetY: cell.y * 12,
      })),
    };
  },
};

const laserBombSchedulerAction: RuntimeActionDefinition = {
  kind: LASER_BOMB_SCHEDULER_ACTION,
  update({ time, query, commands }) {
    const armedBombs = query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.LASER_BOMB,
    })
      .filter((bomb) => bomb.state?.armed === true)
      .sort((left, right) => compareEntityIds(left.id, right.id));
    const detonatingBombIds: EntityId[] = [];
    for (const bomb of armedBombs) {
      const elapsedMs = finiteNumber(bomb.state?.ignitionElapsedMs) +
        time.stepMs;
      if (elapsedMs < LASER_BOMB_IGNITION_DURATION_MS) {
        commands.setState(bomb.id, {
          ...bomb.state,
          ignitionElapsedMs: elapsedMs,
        });
      } else {
        detonatingBombIds.push(bomb.id);
      }
    }

    const claimedBombIds = new Set(armedBombs.map((bomb) => bomb.id));
    const downedActorIds = new Set<EntityId>();
    const destroyedTargetIds = new Set<EntityId>();
    for (const bombId of detonatingBombIds.sort(compareEntityIds)) {
      const chainedBombIds = detonateLaserBomb(
        query,
        commands,
        bombId,
        destroyedTargetIds,
        downedActorIds,
      ) ?? [];
      for (const chainedBombId of chainedBombIds) {
        if (claimedBombIds.has(chainedBombId)) continue;
        const chainedBomb = query.entity(chainedBombId);
        if (chainedBomb?.type !== MapEntityTypeId.LASER_BOMB) continue;
        claimedBombIds.add(chainedBombId);
        commands.setState(chainedBombId, {
          ...chainedBomb.state,
          armed: true,
          ignitionElapsedMs: 0,
        });
        emitLaserBombIgnition(query, commands, chainedBombId);
      }
    }
    return "running";
  },
};

export const laserBomb: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.LASER_BOMB,
    presenceFacts: ["blocking", "pushable"],
    state: [
      {
        key: "armed",
        kind: "boolean",
        label: "等待连锁引爆",
        default: false,
      },
      {
        key: "ignitionElapsedMs",
        kind: "number",
        label: "起爆计时",
        default: 0,
      },
    ],
    presentation: { name: "Laser Bomb" },
  },
  visual: {
    id: MapEntityTypeId.LASER_BOMB,
    resolve: () => ({
      layers: [{
        kind: "image",
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.bomb,
        sourceTileSize: 12,
        anchor: "top-left",
      }],
    }),
  },
  transientVisuals: [laserBombIgnitionVisual, laserBombExplosionVisual],
  runtimeActions: [laserBombSchedulerAction],
});

export function startLaserBombScheduler(commands: WorldCommandApi): void {
  commands.startAction({ kind: LASER_BOMB_SCHEDULER_ACTION });
}

export function armLaserBombs(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  bombIds: readonly EntityId[],
): void {
  for (const bombId of [...bombIds].sort(compareEntityIds)) {
    const bomb = query.entity(bombId);
    if (
      bomb?.type !== MapEntityTypeId.LASER_BOMB ||
      bomb.state?.armed === true
    ) {
      continue;
    }
    commands.setState(bomb.id, {
      ...bomb.state,
      armed: true,
      ignitionElapsedMs: 0,
    });
    emitLaserBombIgnition(query, commands, bomb.id);
  }
}

/**
 * 解析一颗炸弹当前所在位置的十字爆炸。连锁炸弹只进入后续队列，
 * 不在本次结算中提前销毁。
 */
export function resolveLaserExplosion(
  query: WorldQueryApi,
  bombId: EntityId,
): LaserExplosion | null {
  const bomb = query.entity(bombId);
  if (bomb?.type !== MapEntityTypeId.LASER_BOMB) return null;
  const cells = explosionCells(bomb.anchor).filter((cell) =>
    query.inBounds(cell) && !explosionBlockedAt(query, cell, bomb.id)
  );
  const actors = new Set<EntityId>();
  const destroyed = new Set<EntityId>();
  const chainedBombs = new Set<EntityId>();
  for (const cell of cells) {
    for (const presence of query.presencesAt(cell)) {
      const entity = query.entity(presence.entityId);
      if (!entity || entity.id === bomb.id) {
        continue;
      }
      if (query.entityHasFact(entity.id, "player")) actors.add(entity.id);
      if (!destructibleTypes.has(entity.type)) continue;
      if (entity.type === MapEntityTypeId.LASER_BOMB) {
        chainedBombs.add(entity.id);
      } else {
        destroyed.add(entity.id);
      }
    }
  }
  return {
    bombId: bomb.id,
    center: bomb.anchor,
    cells,
    actorIds: [...actors].sort(compareEntityIds),
    targetIds: destroyed,
    chainedBombIds: [...chainedBombs].sort((left, right) => left - right),
  };
}

function explosionCells(center: CellPosition): readonly CellPosition[] {
  return [
    center,
    { x: center.x, y: center.y - 1 },
    { x: center.x + 1, y: center.y },
    { x: center.x, y: center.y + 1 },
    { x: center.x - 1, y: center.y },
  ];
}

function explosionBlockedAt(
  query: WorldQueryApi,
  cell: CellPosition,
  sourceBombId: EntityId,
): boolean {
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    if (!entity || entity.id === sourceBombId) return false;
    if (destructibleTypes.has(entity.type)) return false;
    if (query.entityHasFact(entity.id, "player")) return false;
    return entity.type === MapEntityTypeId.STUMP ||
      presence.facts.includes("blocking");
  });
}

function explosionOffsetsFromEvent(value: unknown): readonly CellPosition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((cell) => {
    if (!cell || typeof cell !== "object") return [];
    const candidate = cell as Record<string, unknown>;
    return Number.isInteger(candidate.x) && Number.isInteger(candidate.y)
      ? [{ x: candidate.x as number, y: candidate.y as number }]
      : [];
  });
}

function detonateLaserBomb(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  bombId: EntityId,
  destroyedTargetIds: Set<EntityId>,
  downedActorIds: Set<EntityId>,
): readonly EntityId[] | null {
  const explosion = resolveLaserExplosion(query, bombId);
  if (!explosion) return null;
  commands.emit({
    type: "laser-bomb-exploded",
    entityId: explosion.bombId,
    x: explosion.center.x,
    y: explosion.center.y,
    data: {
      cells: explosion.cells.map((cell) => ({
        x: cell.x - explosion.center.x,
        y: cell.y - explosion.center.y,
      })),
    },
  });
  commands.destroy(explosion.bombId);
  for (const actorId of explosion.actorIds) {
    if (downedActorIds.has(actorId)) continue;
    downedActorIds.add(actorId);
    commands.downActor(actorId, "laser-bomb-explosion");
  }
  const beamsBySource = groupLaserBeamsBySource(query);
  for (const targetId of [...explosion.targetIds].sort(compareEntityIds)) {
    if (destroyedTargetIds.has(targetId)) continue;
    const target = query.entity(targetId);
    if (!target) continue;
    destroyedTargetIds.add(targetId);
    if (target.type === MapEntityTypeId.LASER_CANNON) {
      const beams = beamsBySource.get(target.id) ?? [];
      beginLaserCannonDestruction(
        commands,
        target,
        beams,
        flashSegmentsFromBeams(beams),
      );
    } else {
      commands.destroy(target.id);
    }
  }
  return explosion.chainedBombIds;
}

function emitLaserBombIgnition(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  bombId: EntityId,
): void {
  const bomb = query.entity(bombId);
  if (bomb?.type !== MapEntityTypeId.LASER_BOMB) return;
  commands.emit({
    type: "laser-bomb-ignition-started",
    entityId: bomb.id,
    x: bomb.anchor.x,
    y: bomb.anchor.y,
  });
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function compareEntityIds(left: EntityId, right: EntityId): number {
  return left - right;
}
