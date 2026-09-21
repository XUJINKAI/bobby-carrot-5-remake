import { MapEntityTypeId, type EntityType } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
} from "../../world/entity/EntityInstance.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import {
  destroyLaserEmitter,
  traceLaserRay,
} from "./laser-emitter.js";

const destructibleTypes: ReadonlySet<EntityType> = new Set([
  MapEntityTypeId.PUSHABLE_STONE,
  MapEntityTypeId.LASER_MIRROR,
  MapEntityTypeId.LASER_EMITTER,
  MapEntityTypeId.LASER_BOMB,
]);

const laserBombBehavior: Behavior = {
  id: "laser-bomb",
  onTick({ self, query, commands }) {
    const directlyHit = directlyHitBombIds(query);
    if (!directlyHit.has(self.entity.id)) return;
    const connected = connectedBombIds(query, self.entity.id);
    const owner = [...connected]
      .filter((entityId) => directlyHit.has(entityId))
      .sort((left, right) => left - right)[0];
    if (owner !== self.entity.id) return;
    detonateLaserBomb(query, commands, self.entity.id);
  },
};

export const laserBomb: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.LASER_BOMB,
    presenceFacts: ["blocking", "pushable"],
    presentation: { name: "Laser Bomb" },
  },
  behaviorBindings: [{ behavior: laserBombBehavior }],
  visual: {
    id: MapEntityTypeId.LASER_BOMB,
    resolve: () => ({
      layers: [{ kind: "canvas", draw: drawLaserBomb }],
    }),
  },
});

export function detonateLaserBomb(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  bombId: EntityId,
): void {
  const pending = [bombId];
  const visitedBombs = new Set<EntityId>();
  const destroyed = new Set<EntityId>();
  while (pending.length > 0) {
    const currentId = pending.shift();
    if (currentId === undefined || visitedBombs.has(currentId)) continue;
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

  for (const entityId of [...destroyed].sort((left, right) => left - right)) {
    const entity = query.entity(entityId);
    if (entity?.type === MapEntityTypeId.LASER_EMITTER) {
      destroyLaserEmitter(query, commands, entityId);
    } else {
      commands.destroy(entityId);
    }
  }
}

function directlyHitBombIds(query: WorldQueryApi): ReadonlySet<EntityId> {
  const result = new Set<EntityId>();
  for (const emitter of query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_EMITTER,
  })) {
    const ray = traceLaserRay(
      query,
      emitter.anchor,
      emitter.direction ?? "right",
    );
    for (const segment of ray) {
      for (const presence of query.presencesAt(segment.cell)) {
        const entity = query.entity(presence.entityId);
        if (entity?.type === MapEntityTypeId.LASER_BOMB) {
          result.add(entity.id);
        }
      }
    }
  }
  return result;
}

function connectedBombIds(
  query: WorldQueryApi,
  startId: EntityId,
): ReadonlySet<EntityId> {
  const pending = [startId];
  const result = new Set<EntityId>();
  while (pending.length > 0) {
    const currentId = pending.shift();
    if (currentId === undefined || result.has(currentId)) continue;
    const bomb = query.entity(currentId);
    if (bomb?.type !== MapEntityTypeId.LASER_BOMB) continue;
    result.add(currentId);
    for (const cell of explosionCells(bomb.anchor).slice(1)) {
      for (const presence of query.presencesAt(cell)) {
        const entity = query.entity(presence.entityId);
        if (entity?.type === MapEntityTypeId.LASER_BOMB) {
          pending.push(entity.id);
        }
      }
    }
  }
  return result;
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
