import { MapEntityTypeId, type EntityType } from "@bobby/model";
import { ROBO2_GAMEPLAY_IMAGE_IDS } from "../../image/Robo2GameplayImages.js";
import type { TransientVisualDefinition } from "../../visual/VisualDefinition.js";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
} from "../../world/entity/EntityInstance.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import {
  destroyLaserEmitter,
  flashSegmentsFromBeams,
  groupLaserBeamsBySource,
} from "./laser-emitter-destruction.js";

const destructibleTypes: ReadonlySet<EntityType> = new Set([
  MapEntityTypeId.LASER_STONE,
  MapEntityTypeId.LASER_MIRROR,
  MapEntityTypeId.LASER_EMITTER,
  MapEntityTypeId.LASER_BOMB,
]);
const LASER_BOMB_CHAIN_ACTION = "laser-bomb-chain";

export const LASER_BOMB_EXPLOSION_FRAME_MS = 100;
export const LASER_BOMB_EXPLOSION_DURATION_MS =
  6 * LASER_BOMB_EXPLOSION_FRAME_MS;

export interface LaserExplosion {
  bombId: EntityId;
  center: CellPosition;
  cells: readonly CellPosition[];
  targetIds: ReadonlySet<EntityId>;
  chainedBombIds: readonly EntityId[];
}

const laserBombExplosionVisual: TransientVisualDefinition = {
  id: "laser-bomb-explosion",
  eventType: "laser-bomb-exploded",
  durationMs: LASER_BOMB_EXPLOSION_DURATION_MS,
  renderPass: "effect",
  resolve({ event, progress }) {
    const cells = explosionOffsetsFromEvent(event.data?.cells);
    return {
      layers: cells.map((cell) => {
        const center = cell.x === 0 && cell.y === 0;
        return {
          kind: "image" as const,
          asset: center
            ? ROBO2_GAMEPLAY_IMAGE_IDS.bombExplosion
            : ROBO2_GAMEPLAY_IMAGE_IDS.explosion,
          frameWidth: 14,
          frameHeight: center ? 14 : 12,
          frameRows: 6,
          frameProgress: progress,
          sourceTileSize: 12,
          anchor: "center" as const,
          offsetX: cell.x * 12,
          offsetY: cell.y * 12,
        };
      }),
    };
  },
};

const laserBombChainAction: RuntimeActionDefinition = {
  kind: LASER_BOMB_CHAIN_ACTION,
  update({ action, time, query, commands }) {
    const queue = entityIdList(action.state.queue);
    const seen = new Set(entityIdList(action.state.seen));
    let elapsedMs = finiteNumber(action.state.elapsedMs) + time.stepMs;
    if (
      action.state.started === true &&
      elapsedMs + time.stepMs / 2 < LASER_BOMB_EXPLOSION_DURATION_MS
    ) {
      action.state.elapsedMs = elapsedMs;
      return "running";
    }
    if (action.state.started === true) {
      elapsedMs = Math.max(0, elapsedMs - LASER_BOMB_EXPLOSION_DURATION_MS);
    } else {
      elapsedMs = 0;
    }

    while (queue.length > 0) {
      const bombId = queue.shift()!;
      const chainedBombIds = detonateLaserBomb(query, commands, bombId);
      if (chainedBombIds === null) continue;
      for (const chainedBombId of chainedBombIds) {
        if (seen.has(chainedBombId)) continue;
        const chainedBomb = query.entity(chainedBombId);
        if (chainedBomb?.type !== MapEntityTypeId.LASER_BOMB) continue;
        seen.add(chainedBombId);
        queue.push(chainedBombId);
        commands.setState(chainedBombId, {
          ...chainedBomb.state,
          armed: true,
        });
      }
      action.state.queue = queue;
      action.state.seen = [...seen].sort(compareEntityIds);
      action.state.elapsedMs = elapsedMs;
      action.state.started = true;
      return queue.length > 0 ? "running" : "complete";
    }
    return "complete";
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
  transientVisuals: [laserBombExplosionVisual],
  runtimeActions: [laserBombChainAction],
});

export function armLaserBombChain(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  systemId: EntityId,
  bombIds: readonly EntityId[],
): void {
  const armedBombIds: EntityId[] = [];
  for (const bombId of [...bombIds].sort(compareEntityIds)) {
    const bomb = query.entity(bombId);
    if (
      bomb?.type !== MapEntityTypeId.LASER_BOMB ||
      bomb.state?.armed === true
    ) {
      continue;
    }
    armedBombIds.push(bomb.id);
    commands.setState(bomb.id, { ...bomb.state, armed: true });
  }
  if (armedBombIds.length > 0) {
    commands.startAction(createLaserBombChainAction(systemId, armedBombIds));
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
  const destroyed = new Set<EntityId>();
  const chainedBombs = new Set<EntityId>();
  for (const cell of cells) {
    for (const presence of query.presencesAt(cell)) {
      const entity = query.entity(presence.entityId);
      if (!entity || entity.id === bomb.id || !destructibleTypes.has(entity.type)) {
        continue;
      }
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
  const beamsBySource = groupLaserBeamsBySource(query);
  for (const targetId of [...explosion.targetIds].sort(compareEntityIds)) {
    const target = query.entity(targetId);
    if (!target) continue;
    if (target.type === MapEntityTypeId.LASER_EMITTER) {
      const beams = beamsBySource.get(target.id) ?? [];
      destroyLaserEmitter(
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

function createLaserBombChainAction(
  systemId: EntityId,
  bombIds: readonly EntityId[],
): RuntimeActionSpec {
  return {
    kind: LASER_BOMB_CHAIN_ACTION,
    ownerEntityId: systemId,
    state: {
      queue: [...bombIds],
      seen: [...bombIds],
      elapsedMs: 0,
      started: false,
    },
  };
}

function entityIdList(value: unknown): EntityId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is EntityId =>
    typeof item === "number" && Number.isInteger(item) && item > 0
  );
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function compareEntityIds(left: EntityId, right: EntityId): number {
  return left - right;
}
