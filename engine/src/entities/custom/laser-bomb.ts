import { MapEntityTypeId, type EntityType } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
} from "../../world/entity/EntityInstance.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";

const destructibleTypes: ReadonlySet<EntityType> = new Set([
  MapEntityTypeId.PUSHABLE_STONE,
  MapEntityTypeId.LASER_MIRROR,
  MapEntityTypeId.LASER_EMITTER,
  MapEntityTypeId.LASER_BOMB,
]);

export const laserBomb: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.LASER_BOMB,
    presenceFacts: ["blocking", "pushable"],
    presentation: { name: "Laser Bomb" },
  },
  visual: {
    id: MapEntityTypeId.LASER_BOMB,
    resolve: () => ({
      layers: [{ kind: "canvas", draw: drawLaserBomb }],
    }),
  },
});

/**
 * 汇总一组被光束直接命中的炸弹产生的完整连锁爆炸目标。
 * 调度器统一提交结果，避免每颗炸弹重复追踪全部光路。
 */
export function laserExplosionTargetIds(
  query: WorldQueryApi,
  directlyHitBombIds: ReadonlySet<EntityId>,
): ReadonlySet<EntityId> {
  const pending = [...directlyHitBombIds].sort((left, right) => left - right);
  const visitedBombs = new Set<EntityId>();
  const destroyed = new Set<EntityId>();
  for (let pendingIndex = 0; pendingIndex < pending.length; pendingIndex += 1) {
    const currentId = pending[pendingIndex]!;
    if (visitedBombs.has(currentId)) continue;
    visitedBombs.add(currentId);
    const bomb = query.entity(currentId);
    if (bomb?.type !== MapEntityTypeId.LASER_BOMB) continue;
    for (const cell of explosionCells(bomb.anchor)) {
      for (const presence of query.presencesAt(cell)) {
        const entity = query.entity(presence.entityId);
        if (!entity || !destructibleTypes.has(entity.type)) continue;
        destroyed.add(entity.id);
        if (entity.type === MapEntityTypeId.LASER_BOMB) {
          pending.push(entity.id);
        }
      }
    }
  }
  return destroyed;
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

function drawLaserBomb(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const centerX = x + size / 2;
  const centerY = y + size * 0.57;
  const radius = size * 0.28;
  context.save();
  context.fillStyle = "#24282c";
  context.strokeStyle = "#0e1114";
  context.lineWidth = Math.max(1, size * 0.05);
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = "#d6a85e";
  context.lineWidth = Math.max(2, size * 0.055);
  context.beginPath();
  context.moveTo(centerX + size * 0.1, centerY - radius * 0.8);
  context.quadraticCurveTo(
    centerX + size * 0.2,
    y + size * 0.12,
    centerX + size * 0.32,
    y + size * 0.17,
  );
  context.stroke();
  context.fillStyle = "#ff7043";
  context.beginPath();
  context.arc(centerX + size * 0.34, y + size * 0.16, size * 0.055, 0, Math.PI * 2);
  context.fill();
  context.restore();
}
