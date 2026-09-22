import { MapEntityTypeId, type Direction } from "@bobby/model";
import { ROBO2_GAMEPLAY_IMAGE_IDS } from "../../image/Robo2GameplayImages.js";
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
import { laserExplosionTargetIds } from "./laser-bomb.js";
import { reflectedLaserDirection } from "./laser-mirror.js";

interface LaserRayQuery {
  inBounds(cell: CellPosition): boolean;
  presencesAt(cell: CellPosition): readonly EntityPresence[];
  entity(id: EntityId): Readonly<EntityInstance> | undefined;
}

interface LaserRaySegment {
  cell: CellPosition;
  direction: Direction;
  outgoingDirection?: Direction;
  terminal: boolean;
}

const laserEmitterBehavior: Behavior = {
  id: "laser-emitter",
  onInitialize({ self, query, commands }) {
    const emitters = laserEmitters(query);
    if (emitters[0]?.id !== self.entity.id) return;
    for (const emitter of emitters) {
      replaceOwnedBeam(commands, emitter, [], traceEmitterRay(query, emitter));
    }
    commands.spawn({
      type: RuntimeEntityTypeId.LASER_SYSTEM,
      x: self.entity.anchor.x,
      y: self.entity.anchor.y,
    });
  },
};

const laserSystemBehavior: Behavior = {
  id: "laser-system",
  onTick({ self, query, commands }) {
    updateLaserSystem(query, commands, self.entity);
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
            kind: "image",
            asset: ROBO2_GAMEPLAY_IMAGE_IDS.emitter[direction],
            sourceTileSize: 12,
            anchor: "top-left",
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
      {
        key: "outgoingDirection",
        kind: "enum",
        label: "反射方向",
        options: ["up", "right", "down", "left"].map((value) => ({ value })),
      },
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
            directionState(entity.state?.outgoingDirection),
          ),
      }],
    }),
  },
});

/** 每个 World 唯一的激光调度 Entity，集中计算光路、命中与爆炸。 */
export const laserSystem: EntityModule = defineEntityModule({
  definition: {
    type: RuntimeEntityTypeId.LASER_SYSTEM,
    presenceFacts: [],
    state: [
      {
        key: "topologySignature",
        kind: "string",
        label: "光路拓扑签名",
        default: "",
      },
    ],
    presentation: { name: "Laser System" },
  },
  visual: {
    id: RuntimeEntityTypeId.LASER_SYSTEM,
    resolve: () => null,
  },
  behaviorBindings: [{ behavior: laserSystemBehavior }],
});

export function traceLaserRay(
  query: LaserRayQuery,
  origin: CellPosition,
  direction: Direction,
): readonly LaserRaySegment[] {
  const segments: LaserRaySegment[] = [];
  const visited = new Set<string>();
  let currentDirection = direction;
  let vector = directionVector(currentDirection);
  let cell = { x: origin.x + vector.x, y: origin.y + vector.y };
  while (query.inBounds(cell)) {
    const visitKey = `${cellKey(cell)}:${currentDirection}`;
    if (visited.has(visitKey)) break;
    visited.add(visitKey);
    const outgoingDirection = reflectedDirectionAt(
      query,
      cell,
      currentDirection,
    );
    const terminal = outgoingDirection
      ? false
      : laserStopsAt(query, cell);
    segments.push({
      cell,
      direction: currentDirection,
      ...(outgoingDirection ? { outgoingDirection } : {}),
      terminal,
    });
    if (outgoingDirection) {
      currentDirection = outgoingDirection;
      vector = directionVector(currentDirection);
    }
    if (terminal) break;
    cell = { x: cell.x + vector.x, y: cell.y + vector.y };
  }
  return segments;
}

function updateLaserSystem(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  system: Readonly<EntityInstance>,
): void {
  const topologySignature = laserTopologySignature(query);
  if (system.state?.topologySignature === topologySignature) return;

  const emitters = laserEmitters(query);
  const rays = new Map<EntityId, readonly LaserRaySegment[]>();
  const hitEmitters = new Set<EntityId>();
  const hitBombs = new Set<EntityId>();
  for (const emitter of emitters) {
    const ray = traceEmitterRay(query, emitter);
    rays.set(emitter.id, ray);
    collectLaserTargets(query, ray, hitEmitters, hitBombs);
  }

  const explosionTargets = laserExplosionTargetIds(query, hitBombs);
  const destroyedEmitters = new Set(hitEmitters);
  for (const entityId of explosionTargets) {
    if (query.entity(entityId)?.type === MapEntityTypeId.LASER_EMITTER) {
      destroyedEmitters.add(entityId);
    }
  }

  const beamsBySource = groupBeamEntities(query);
  for (const entityId of [...explosionTargets].sort(compareEntityIds)) {
    if (destroyedEmitters.has(entityId)) continue;
    commands.destroy(entityId);
  }
  for (const emitterId of [...destroyedEmitters].sort(compareEntityIds)) {
    destroyLaserEmitter(commands, emitterId, beamsBySource.get(emitterId) ?? []);
  }

  for (const emitter of emitters) {
    if (destroyedEmitters.has(emitter.id)) continue;
    const ray = rays.get(emitter.id) ?? [];
    const changed = replaceOwnedBeam(
      commands,
      emitter,
      beamsBySource.get(emitter.id) ?? [],
      ray,
    );
    if (changed) downActorsInRay(query, commands, ray);
  }
  commands.setState(system.id, { topologySignature });
}

function laserTopologySignature(query: WorldQueryApi): string {
  const entities = query.entitiesMatching({
    kind: "any",
    selectors: [
      { kind: "fact", value: "blocking" },
      { kind: "type", value: MapEntityTypeId.EXIT },
      { kind: "type", value: MapEntityTypeId.MIRROR },
      { kind: "type", value: MapEntityTypeId.LASER_MIRROR },
    ],
  });
  return entities.map((entity) => [
    entity.id,
    entity.type,
    entity.anchor.x,
    entity.anchor.y,
    entity.type === MapEntityTypeId.LASER_EMITTER
      ? entity.direction ?? "right"
      : "",
    entity.type === MapEntityTypeId.LASER_MIRROR
      ? entity.state?.variant ?? "slash"
      : "",
  ].join(":"))
    .join("|");
}

function laserEmitters(
  query: WorldQueryApi,
): readonly Readonly<EntityInstance>[] {
  return query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_EMITTER,
  });
}

function traceEmitterRay(
  query: LaserRayQuery,
  emitter: Readonly<EntityInstance>,
): readonly LaserRaySegment[] {
  return traceLaserRay(
    query,
    emitter.anchor,
    emitter.direction ?? "right",
  );
}

function collectLaserTargets(
  query: WorldQueryApi,
  ray: readonly LaserRaySegment[],
  hitEmitters: Set<EntityId>,
  hitBombs: Set<EntityId>,
): void {
  for (const segment of ray) {
    for (const presence of query.presencesAt(segment.cell)) {
      const entity = query.entity(presence.entityId);
      if (entity?.type === MapEntityTypeId.LASER_EMITTER) {
        hitEmitters.add(entity.id);
      } else if (entity?.type === MapEntityTypeId.LASER_BOMB) {
        hitBombs.add(entity.id);
      }
    }
  }
}

function groupBeamEntities(
  query: WorldQueryApi,
): ReadonlyMap<EntityId, readonly Readonly<EntityInstance>[]> {
  const result = new Map<EntityId, Readonly<EntityInstance>[]>();
  for (const beam of laserBeamEntities(query)) {
    const sourceId = beam.state?.sourceId;
    if (typeof sourceId !== "number") continue;
    const group = result.get(sourceId) ?? [];
    group.push(beam);
    result.set(sourceId, group);
  }
  return result;
}

function destroyLaserEmitter(
  commands: WorldCommandApi,
  emitterId: EntityId,
  beams: readonly Readonly<EntityInstance>[],
): void {
  for (const beam of beams) commands.destroy(beam.id);
  commands.destroy(emitterId);
}

function replaceOwnedBeam(
  commands: WorldCommandApi,
  emitter: Readonly<EntityInstance>,
  current: readonly Readonly<EntityInstance>[],
  ray: readonly LaserRaySegment[],
): boolean {
  if (beamMatches(current, ray)) return false;
  for (const beam of current) {
    commands.destroy(beam.id);
  }
  for (const segment of ray) {
    commands.spawn({
      type: RuntimeEntityTypeId.LASER_BEAM,
      x: segment.cell.x,
      y: segment.cell.y,
      direction: segment.direction,
      state: {
        sourceId: emitter.id,
        terminal: segment.terminal,
        ...(segment.outgoingDirection
          ? { outgoingDirection: segment.outgoingDirection }
          : {}),
      },
    });
  }
  return true;
}

function downActorsInRay(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  ray: readonly LaserRaySegment[],
): void {
  const actorIds = new Set<number>();
  for (const segment of ray) {
    for (const presence of query.presencesAt(segment.cell)) {
      if (presence.facts.includes("player")) actorIds.add(presence.entityId);
    }
  }
  for (const actorId of [...actorIds].sort((left, right) => left - right)) {
    commands.downActor(actorId, "laser-beam");
  }
}

function laserBeamEntities(
  query: WorldQueryApi,
): readonly Readonly<EntityInstance>[] {
  return query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  });
}

function compareEntityIds(left: EntityId, right: EntityId): number {
  return left - right;
}

function beamMatches(
  beams: readonly Readonly<EntityInstance>[],
  ray: readonly LaserRaySegment[],
): boolean {
  if (beams.length !== ray.length) return false;
  const beamKeys = beams.map(beamKey).sort();
  const rayKeys = ray.map(segmentKey).sort();
  return beamKeys.every((key, index) => key === rayKeys[index]);
}

function laserStopsAt(query: LaserRayQuery, cell: CellPosition): boolean {
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    if (!entity || entity.type === RuntimeEntityTypeId.LASER_BEAM) return false;
    if (
      entity.type === MapEntityTypeId.EXIT ||
      entity.type === MapEntityTypeId.MIRROR
    ) {
      return true;
    }
    if (entity.type === MapEntityTypeId.LASER_MIRROR) return false;
    return presence.facts.includes("blocking");
  });
}

function reflectedDirectionAt(
  query: LaserRayQuery,
  cell: CellPosition,
  incoming: Direction,
): Direction | null {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (!entity) continue;
    const reflected = reflectedLaserDirection(entity, incoming);
    if (reflected) return reflected;
  }
  return null;
}

function beamKey(beam: Readonly<EntityInstance>): string {
  return [
    cellKey(beam.anchor),
    beam.direction ?? "right",
    directionState(beam.state?.outgoingDirection) ?? "straight",
    beam.state?.terminal === true ? "terminal" : "through",
  ].join(":");
}

function segmentKey(segment: LaserRaySegment): string {
  return [
    cellKey(segment.cell),
    segment.direction,
    segment.outgoingDirection ?? "straight",
    segment.terminal ? "terminal" : "through",
  ].join(":");
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

function directionState(value: unknown): Direction | null {
  if (
    value === "up" ||
    value === "right" ||
    value === "down" ||
    value === "left"
  ) {
    return value;
  }
  return null;
}

function drawLaserLine(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: Direction,
  source: boolean,
  terminal: boolean,
  outgoingDirection: Direction | null = null,
): void {
  const vector = directionVector(direction);
  const outgoingVector = directionVector(outgoingDirection ?? direction);
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const startFactor = source ? 0 : -0.5;
  const endFactor = terminal ? 0 : 0.5;
  const startX = centerX + vector.x * size * startFactor;
  const startY = centerY + vector.y * size * startFactor;
  const endX = centerX + outgoingVector.x * size * endFactor;
  const endY = centerY + outgoingVector.y * size * endFactor;
  context.save();
  context.strokeStyle = "rgba(255,45,45,.35)";
  context.lineWidth = Math.max(5, size * 0.18);
  context.beginPath();
  context.moveTo(startX, startY);
  if (outgoingDirection) {
    context.lineTo(centerX, centerY);
  }
  context.lineTo(endX, endY);
  context.stroke();
  context.strokeStyle = "#ffefef";
  context.lineWidth = Math.max(1, size * 0.045);
  context.beginPath();
  context.moveTo(startX, startY);
  if (outgoingDirection) {
    context.lineTo(centerX, centerY);
  }
  context.lineTo(endX, endY);
  context.stroke();
  context.restore();
}
