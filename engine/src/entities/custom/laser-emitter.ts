import { MapEntityTypeId, type Direction } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../../world/entity/EntityInstance.js";
import type { EntityPresence } from "../../world/spatial/EntityPresence.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";

interface LaserRayQuery {
  inBounds(cell: CellPosition): boolean;
  presencesAt(cell: CellPosition): readonly EntityPresence[];
  entity(id: EntityId): Readonly<EntityInstance> | undefined;
}

interface LaserRaySegment {
  cell: CellPosition;
  terminal: boolean;
}

const laserEmitterBehavior: Behavior = {
  id: "laser-emitter",
  onInitialize({ self, query, commands }) {
    replaceOwnedBeam(query, commands, self.entity);
  },
  onTick({ self, query, commands }) {
    replaceOwnedBeam(query, commands, self.entity);
    const ray = traceLaserRay(
      query,
      self.entity.anchor,
      self.entity.direction ?? "right",
    );
    const actorIds = new Set<number>();
    for (const segment of ray) {
      for (const presence of query.presencesAt(segment.cell)) {
        if (presence.facts.includes("player")) actorIds.add(presence.entityId);
      }
    }
    for (const actorId of [...actorIds].sort((left, right) => left - right))
      commands.downActor(actorId, "laser-beam");
  },
  onDestroy({ self, query, commands }) {
    for (const beam of ownedBeamEntities(query, self.entity.id))
      commands.destroy(beam.id);
  },
};

const laserBeamHazard: Behavior = {
  id: "laser-beam-hazard",
  onEnter({ actor, query, commands }) {
    if (!query.entityHasFact(actor.id, "player")) return;
    commands.downActor(actor.id, "laser-beam");
  },
};

export const laserEmitter: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.LASER_EMITTER,
    presenceFacts: ["blocking", "pushable"],
    properties: [
      {
        key: "direction",
        kind: "enum",
        label: "方向",
        default: "right",
        options: ["up", "right", "down", "left"].map((value) => ({ value })),
      },
    ],
    presentation: { name: "Laser Emitter" },
  },
  behaviorBindings: [{ behavior: laserEmitterBehavior }],
  visual: {
    id: MapEntityTypeId.LASER_EMITTER,
    resolve: ({ entity }) => {
      const direction = entity.direction ?? "right";
      return {
        layers: [
          {
            kind: "canvas",
            draw: (context, x, y, size) =>
              drawLaserEmitter(context, x, y, size, direction),
          },
          {
            kind: "canvas",
            renderPass: "world-effect",
            draw: (context, x, y, size) =>
              drawLaserLine(context, x, y, size, direction, true, false),
          },
        ],
      };
    },
  },
});

export const laserBeam: EntityModule = defineEntityModule({
  definition: {
    type: RuntimeEntityTypeId.LASER_BEAM,
    presenceFacts: [],
    state: [
      { key: "sourceId", kind: "number", label: "激光源", default: 0 },
      { key: "terminal", kind: "boolean", label: "末端", default: false },
    ],
    presentation: { name: "Laser Beam", renderPass: "world-effect" },
  },
  behaviorBindings: [{ behavior: laserBeamHazard }],
  visual: {
    id: RuntimeEntityTypeId.LASER_BEAM,
    renderPass: "world-effect",
    resolve: ({ entity }) => ({
      layers: [{
        kind: "canvas",
        draw: (context, x, y, size) =>
          drawLaserLine(
            context,
            x,
            y,
            size,
            entity.direction ?? "right",
            false,
            entity.state?.terminal === true,
          ),
      }],
    }),
  },
});

export function traceLaserRay(
  query: LaserRayQuery,
  origin: CellPosition,
  direction: Direction,
): readonly LaserRaySegment[] {
  const vector = directionVector(direction);
  const segments: LaserRaySegment[] = [];
  let cell = { x: origin.x + vector.x, y: origin.y + vector.y };
  while (query.inBounds(cell)) {
    const terminal = laserStopsAt(query, cell);
    segments.push({ cell, terminal });
    if (terminal) break;
    cell = { x: cell.x + vector.x, y: cell.y + vector.y };
  }
  return segments;
}

function replaceOwnedBeam(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  emitter: Readonly<EntityInstance>,
): void {
  const direction = emitter.direction ?? "right";
  const ray = traceLaserRay(query, emitter.anchor, direction);
  const current = ownedBeamEntities(query, emitter.id);
  if (beamMatches(current, ray, direction)) return;
  for (const beam of current) commands.destroy(beam.id);
  for (const segment of ray) {
    commands.spawn({
      type: RuntimeEntityTypeId.LASER_BEAM,
      x: segment.cell.x,
      y: segment.cell.y,
      direction,
      state: { sourceId: emitter.id, terminal: segment.terminal },
    });
  }
}

function ownedBeamEntities(
  query: WorldQueryApi,
  sourceId: EntityId,
): readonly Readonly<EntityInstance>[] {
  return query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  }).filter((entity) => entity.state?.sourceId === sourceId);
}

function beamMatches(
  beams: readonly Readonly<EntityInstance>[],
  ray: readonly LaserRaySegment[],
  direction: Direction,
): boolean {
  if (beams.length !== ray.length) return false;
  const byCell = new Map(beams.map((beam) => [cellKey(beam.anchor), beam]));
  return ray.every((segment) => {
    const beam = byCell.get(cellKey(segment.cell));
    return beam?.direction === direction &&
      beam.state?.terminal === segment.terminal;
  });
}

function laserStopsAt(query: LaserRayQuery, cell: CellPosition): boolean {
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    if (!entity || entity.type === RuntimeEntityTypeId.LASER_BEAM) return false;
    if (
      entity.type === MapEntityTypeId.EXIT ||
      entity.type === MapEntityTypeId.MIRROR
    ) return true;
    return presence.facts.includes("blocking");
  });
}

function cellKey(cell: CellPosition): string {
  return `${cell.x},${cell.y}`;
}

function directionVector(direction: Direction): CellPosition {
  return {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  }[direction];
}

function drawLaserEmitter(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: Direction,
): void {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const vector = directionVector(direction);
  context.save();
  context.fillStyle = "#26313b";
  context.strokeStyle = "#0c1116";
  context.lineWidth = Math.max(1, size * 0.05);
  context.beginPath();
  context.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = "#e84a4a";
  context.lineWidth = Math.max(3, size * 0.16);
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.lineTo(
    centerX + vector.x * size * 0.32,
    centerY + vector.y * size * 0.32,
  );
  context.stroke();
  context.restore();
}

function drawLaserLine(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: Direction,
  source: boolean,
  terminal: boolean,
): void {
  const vector = directionVector(direction);
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const startFactor = source ? 0 : -0.5;
  const endFactor = terminal ? 0 : 0.5;
  const startX = centerX + vector.x * size * startFactor;
  const startY = centerY + vector.y * size * startFactor;
  const endX = centerX + vector.x * size * endFactor;
  const endY = centerY + vector.y * size * endFactor;
  context.save();
  context.strokeStyle = "rgba(255,45,45,.35)";
  context.lineWidth = Math.max(5, size * 0.18);
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
  context.strokeStyle = "#ffefef";
  context.lineWidth = Math.max(1, size * 0.045);
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
  context.restore();
}
