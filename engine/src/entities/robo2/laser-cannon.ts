import { MapEntityTypeId, type Direction } from "@bobby/model";
import { ROBO2_GAMEPLAY_IMAGE_IDS } from "../../image/Robo2GameplayImages.js";
import { resolveEnergyPropagationAt } from "../energy/EnergyPropagation.js";
import type { TransientVisualDefinition } from "../../visual/VisualDefinition.js";
import type { RuntimeActionDefinition } from "../../world/action/RuntimeAction.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
  EntitySpawnSpec,
} from "../../world/entity/EntityInstance.js";
import type { EntityPresence } from "../../world/spatial/EntityPresence.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import { armLaserBombs, startLaserBombScheduler } from "./laser-bomb.js";
import { resolveLaserAppearance } from "./laser-appearance.js";
import {
  beginLaserCannonDestruction,
  groupLaserBeamsBySource,
  LASER_CANNON_FLASH_COUNT,
  LASER_CANNON_FLASH_DURATION_MS,
  laserCannonDestructionAction,
} from "./laser-cannon-destruction.js";
import {
  laserMirrorCoversIncoming,
} from "./laser-mirror.js";

export interface LaserRayQuery {
  inBounds(cell: CellPosition): boolean;
  presencesAt(cell: CellPosition): readonly EntityPresence[];
  entity(id: EntityId): Readonly<EntityInstance> | undefined;
}

export interface LaserRaySegment {
  cell: CellPosition;
  direction: Direction;
  outgoingDirection?: Direction;
  terminal: boolean;
}

export interface LaserRayProjection {
  sourceId: EntityId;
  segments: readonly LaserRaySegment[];
}

const LASER_BEAM_CONTACT_ACTION = "laser-beam-contact";
const LASER_CANNON_SOURCE_TILE_SIZE = 14;
export const LASER_BEAM_DAMAGE_PROGRESS = 0.8;
export {
  LASER_CANNON_FLASH_COUNT,
  LASER_CANNON_FLASH_DURATION_MS,
  LASER_CANNON_FLASH_INTERVAL_MS,
} from "./laser-cannon-destruction.js";

const laserCannonBehavior: Behavior = {
  id: "laser-cannon",
  onInitialize({ self, query, commands }) {
    const cannons = laserCannons(query);
    if (cannons[0]?.id !== self.entity.id) return;
    for (const projection of projectLaserRays(query, cannons)) {
      const cannon = cannons.find((candidate) =>
        candidate.id === projection.sourceId
      );
      if (!cannon) continue;
      reconcileOwnedBeam(commands, cannon, [], projection.segments);
    }
    commands.spawn({
      type: RuntimeEntityTypeId.LASER_SYSTEM,
      x: self.entity.anchor.x,
      y: self.entity.anchor.y,
    });
    startLaserBombScheduler(commands);
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
  onEnter({ actor, self, movement, query, commands }) {
    // MovementPlan 可能在光束销毁前已经建立；进入目标格时先确认光束仍存在。
    const beam = query.entity(self.entity.id);
    if (
      beam?.type !== RuntimeEntityTypeId.LASER_BEAM ||
      beam.state?.terminal === true
    ) {
      return;
    }
    if (!query.entityHasFact(actor.id, "player")) return;
    const sourceId = numericState(beam.state?.sourceId);
    const source = query.entity(sourceId);
    if (source?.type !== MapEntityTypeId.LASER_CANNON) return;
    startLaserContact(
      commands,
      actor.id,
      source.id,
      beamKey(beam),
      movement?.motion,
    );
  },
};

const laserBeamContactAction: RuntimeActionDefinition = {
  kind: LASER_BEAM_CONTACT_ACTION,
  update({ action, time, query, commands }) {
    const sourceId = action.ownerEntityId;
    const actorId = numericState(action.state.actorId);
    const contactSegmentKey = stringState(action.state.segmentKey);
    const source = sourceId === undefined ? undefined : query.entity(sourceId);
    const actor = query.entity(actorId);
    if (
      source?.type !== MapEntityTypeId.LASER_CANNON ||
      source.state?.destroying === true ||
      !contactSegmentKey ||
      !traceCannonRay(query, source).some((segment) =>
        !segment.terminal && segmentKey(segment) === contactSegmentKey
      ) ||
      !actor ||
      !query.entityHasFact(actor.id, "player")
    ) {
      return "complete";
    }
    const elapsedMs = numericState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs + 1e-6 < numericState(action.state.delayMs)) return "running";
    commands.downActor(actor.id, "laser-beam");
    return "complete";
  },
};

export const laserCannon: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.LASER_CANNON,
    presenceFacts: ["blocking"],
    resolvePresenceFacts({ entity }) {
      return entity.state?.destroying === true ? [] : ["pushable"];
    },
    properties: [
      {
        key: "direction",
        kind: "enum",
        label: "方向",
        default: "right",
        options: ["up", "right", "down", "left"].map((value) => ({ value })),
      },
    ],
    state: [
      {
        key: "destroying",
        kind: "boolean",
        label: "损毁中",
        default: false,
      },
    ],
    presentation: { name: "Laser Cannon" },
  },
  behaviorBindings: [{ behavior: laserCannonBehavior }],
  runtimeActions: [laserCannonDestructionAction],
  visual: {
    id: MapEntityTypeId.LASER_CANNON,
    resolve: ({ entity }) => {
      if (entity.state?.destroying === true) return null;
      const direction = entity.direction ?? "right";
      return {
        layers: [{
          kind: "image",
          asset: ROBO2_GAMEPLAY_IMAGE_IDS.cannon[direction],
          sourceTileSize: LASER_CANNON_SOURCE_TILE_SIZE,
          anchor: "center",
        }],
      };
    },
  },
  transientVisuals: [{
    id: "laser-cannon-destroyed",
    eventType: "laser-cannon-destroyed",
    durationMs: LASER_CANNON_FLASH_DURATION_MS,
    renderPass: "world-effect",
    resolve({ event, progress, time }) {
      const interval = Math.min(
        LASER_CANNON_FLASH_COUNT * 2 - 1,
        Math.floor(progress * LASER_CANNON_FLASH_COUNT * 2),
      );
      if (interval % 2 === 1) return null;
      const direction = directionState(event.direction) ?? "right";
      const segments = laserSegmentsFromEvent(event.data?.segments);
      return {
        layers: [
          {
            kind: "image",
            asset: ROBO2_GAMEPLAY_IMAGE_IDS.cannon[direction],
            sourceTileSize: LASER_CANNON_SOURCE_TILE_SIZE,
            anchor: "center",
          },
          {
            kind: "canvas",
            draw: (context, x, y, size) =>
              drawLaserSnapshot(
                context,
                x,
                y,
                size,
                segments,
                event.entityId ?? 0,
                time.nowMs,
              ),
          },
        ],
      };
    },
  } satisfies TransientVisualDefinition],
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
  runtimeActions: [laserBeamContactAction],
  visual: {
    id: RuntimeEntityTypeId.LASER_BEAM,
    renderPass: "world-effect",
    resolve: ({ entity, query, time }) => {
      if (entity.state?.terminal === true) return null;
      const direction = entity.direction ?? "right";
      const mirror = mirrorAt(query, entity.anchor);
      const renderPass = mirror && !laserMirrorCoversIncoming(mirror, direction)
        ? "effect"
        : "world-effect";
      return {
        layers: [{
          kind: "canvas",
          renderPass,
          draw: (context, x, y, size) =>
            drawLaserLine(
              context,
              x,
              y,
              size,
              direction,
              directionState(entity.state?.outgoingDirection),
              numericState(entity.state?.sourceId),
              time?.nowMs ?? 0,
            ),
        }],
      };
    },
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
    const propagation = resolveEnergyPropagationAt(
      query,
      cell,
      currentDirection,
    );
    const terminal = propagation.kind === "blocked" ||
      laserTargetStopsAt(query, cell);
    const outgoingDirection = !terminal && propagation.kind === "reflected"
      ? propagation.direction
      : undefined;
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

export function projectLaserRays(
  query: LaserRayQuery,
  cannons: readonly Readonly<EntityInstance>[],
): readonly LaserRayProjection[] {
  return cannons.map((cannon) => ({
    sourceId: cannon.id,
    segments: traceCannonRay(query, cannon),
  }));
}

export function laserBeamSpawnSpecs(
  sourceId: EntityId,
  ray: readonly LaserRaySegment[],
): readonly EntitySpawnSpec[] {
  return ray.map((segment) => laserBeamSpawnSpec(sourceId, segment));
}

function laserBeamSpawnSpec(
  sourceId: EntityId,
  segment: LaserRaySegment,
): EntitySpawnSpec {
  return {
    type: RuntimeEntityTypeId.LASER_BEAM,
    x: segment.cell.x,
    y: segment.cell.y,
    direction: segment.direction,
    state: {
      sourceId,
      terminal: segment.terminal,
      ...(segment.outgoingDirection
        ? { outgoingDirection: segment.outgoingDirection }
        : {}),
    },
  };
}

function updateLaserSystem(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  system: Readonly<EntityInstance>,
): void {
  const topologySignature = laserTopologySignature(query);
  if (system.state?.topologySignature === topologySignature) return;

  const cannons = laserCannons(query);
  const rays = new Map(
    projectLaserRays(query, cannons).map((projection) => [
      projection.sourceId,
      projection.segments,
    ]),
  );
  const hitCannons = new Set<EntityId>();
  const hitBombs = new Set<EntityId>();
  for (const cannon of cannons) {
    const ray = rays.get(cannon.id) ?? [];
    collectLaserTargets(query, ray, hitCannons, hitBombs);
  }

  const destroyedCannons = new Set(hitCannons);
  const beamsBySource = groupLaserBeamsBySource(query);
  for (const cannonId of [...destroyedCannons].sort(compareEntityIds)) {
    const cannon = cannons.find((candidate) => candidate.id === cannonId);
    if (!cannon) continue;
    beginLaserCannonDestruction(
      commands,
      cannon,
      beamsBySource.get(cannonId) ?? [],
      rays.get(cannonId) ?? [],
    );
  }
  armLaserBombs(query, commands, [...hitBombs]);

  for (const cannon of cannons) {
    if (destroyedCannons.has(cannon.id)) continue;
    const ray = rays.get(cannon.id) ?? [];
    const addedSegments = reconcileOwnedBeam(
      commands,
      cannon,
      beamsBySource.get(cannon.id) ?? [],
      ray,
    );
    contactActorsInAddedSegments(query, commands, cannon, addedSegments);
  }
  commands.setState(system.id, { topologySignature });
}

function laserTopologySignature(query: WorldQueryApi): string {
  const entities = query.entitiesMatching({
    kind: "any",
    selectors: [
      { kind: "type", value: MapEntityTypeId.EXIT },
      { kind: "type", value: MapEntityTypeId.MIRROR },
      { kind: "type", value: MapEntityTypeId.LASER_MIRROR },
      { kind: "type", value: MapEntityTypeId.LASER_STONE },
      { kind: "type", value: MapEntityTypeId.LASER_CANNON },
      { kind: "type", value: MapEntityTypeId.LASER_BOMB },
      { kind: "type", value: MapEntityTypeId.CRUMBLY_ROCK },
      { kind: "type", value: MapEntityTypeId.DRAGON },
      { kind: "type", value: MapEntityTypeId.COLOR_BLOCK },
      { kind: "type", value: MapEntityTypeId.SNOW },
    ],
  });
  return entities
    .map((entity) => [
      entity.id,
      entity.type,
      entity.anchor.x,
      entity.anchor.y,
      entity.type === MapEntityTypeId.LASER_CANNON ||
        entity.type === MapEntityTypeId.DRAGON
        ? entity.direction ?? "right"
        : "",
      entity.type === MapEntityTypeId.LASER_CANNON
        ? entity.state?.destroying === true
        : "",
      entity.type === MapEntityTypeId.LASER_MIRROR ||
        entity.type === MapEntityTypeId.MIRROR
        ? entity.state?.variant ?? ""
        : "",
      entity.type === MapEntityTypeId.COLOR_BLOCK
        ? entity.state?.raised !== false
        : "",
    ].join(":"))
    .join("|");
}

function laserCannons(
  query: WorldQueryApi,
): readonly Readonly<EntityInstance>[] {
  return query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_CANNON,
  }).filter((cannon) => cannon.state?.destroying !== true);
}

function traceCannonRay(
  query: LaserRayQuery,
  cannon: Readonly<EntityInstance>,
): readonly LaserRaySegment[] {
  return traceLaserRay(
    query,
    cannon.anchor,
    cannon.direction ?? "right",
  );
}

function collectLaserTargets(
  query: WorldQueryApi,
  ray: readonly LaserRaySegment[],
  hitCannons: Set<EntityId>,
  hitBombs: Set<EntityId>,
): void {
  for (const segment of ray) {
    for (const presence of query.presencesAt(segment.cell)) {
      const entity = query.entity(presence.entityId);
      if (
        entity?.type === MapEntityTypeId.LASER_CANNON &&
        entity.state?.destroying !== true
      ) {
        hitCannons.add(entity.id);
      } else if (
        entity?.type === MapEntityTypeId.LASER_BOMB &&
        entity.state?.armed !== true
      ) {
        hitBombs.add(entity.id);
      }
    }
  }
}

function reconcileOwnedBeam(
  commands: WorldCommandApi,
  cannon: Readonly<EntityInstance>,
  current: readonly Readonly<EntityInstance>[],
  ray: readonly LaserRaySegment[],
): readonly LaserRaySegment[] {
  const unmatchedByKey = new Map<string, Readonly<EntityInstance>[]>();
  for (const beam of [...current].sort((left, right) => left.id - right.id)) {
    const key = beamKey(beam);
    const unmatched = unmatchedByKey.get(key) ?? [];
    unmatched.push(beam);
    unmatchedByKey.set(key, unmatched);
  }

  const addedSegments: LaserRaySegment[] = [];
  for (const segment of ray) {
    const key = segmentKey(segment);
    const unmatched = unmatchedByKey.get(key);
    if (unmatched?.length) {
      unmatched.shift();
      if (unmatched.length === 0) unmatchedByKey.delete(key);
      continue;
    }
    commands.spawn(laserBeamSpawnSpec(cannon.id, segment));
    addedSegments.push(segment);
  }
  for (const unmatched of unmatchedByKey.values()) {
    for (const beam of unmatched) commands.destroy(beam.id);
  }
  return addedSegments;
}

function contactActorsInAddedSegments(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  cannon: Readonly<EntityInstance>,
  addedSegments: readonly LaserRaySegment[],
): void {
  const contactedActors = new Set<EntityId>();
  for (const segment of addedSegments) {
    if (segment.terminal) continue;
    for (const presence of query.presencesAt(segment.cell)) {
      if (
        contactedActors.has(presence.entityId) ||
        !presence.facts.includes("player")
      ) {
        continue;
      }
      contactedActors.add(presence.entityId);
      const motion = query.motionForEntity(presence.entityId);
      const enteringMotion = motion?.status === "running" &&
          sameCell(motion.to, segment.cell)
        ? motion
        : undefined;
      startLaserContact(
        commands,
        presence.entityId,
        cannon.id,
        segmentKey(segment),
        enteringMotion,
      );
    }
  }
}

interface LaserContactMotion {
  readonly durationMs: number;
  readonly progress: number;
}

function startLaserContact(
  commands: WorldCommandApi,
  actorId: EntityId,
  sourceId: EntityId,
  contactSegmentKey: string,
  motion: LaserContactMotion | undefined,
): void {
  const delayMs = motion
    ? Math.max(
        0,
        motion.durationMs * LASER_BEAM_DAMAGE_PROGRESS -
          motion.durationMs * motion.progress,
      )
    : 0;
  if (delayMs === 0) {
    commands.downActor(actorId, "laser-beam");
    return;
  }
  commands.startAction({
    kind: LASER_BEAM_CONTACT_ACTION,
    ownerEntityId: sourceId,
    state: {
      actorId,
      segmentKey: contactSegmentKey,
      delayMs,
      elapsedMs: 0,
    },
  });
}

function compareEntityIds(left: EntityId, right: EntityId): number {
  return left - right;
}

function laserTargetStopsAt(
  query: LaserRayQuery,
  cell: CellPosition,
): boolean {
  return query.presencesAt(cell).some((presence) => {
    const entity = query.entity(presence.entityId);
    return entity?.type === MapEntityTypeId.EXIT ||
      entity?.type === MapEntityTypeId.LASER_STONE ||
      entity?.type === MapEntityTypeId.LASER_CANNON ||
      entity?.type === MapEntityTypeId.LASER_BOMB;
  });
}

function mirrorAt(
  query: LaserRayQuery,
  cell: CellPosition,
): Readonly<EntityInstance> | null {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type === MapEntityTypeId.LASER_MIRROR) return entity;
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

function sameCell(left: CellPosition, right: CellPosition): boolean {
  return left.x === right.x && left.y === right.y;
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

function numericState(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringState(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

interface LaserFlashSegment {
  x: number;
  y: number;
  direction: Direction;
  terminal: boolean;
  outgoingDirection?: Direction;
}

function laserSegmentsFromEvent(value: unknown): readonly LaserFlashSegment[] {
  if (!Array.isArray(value)) return [];
  const segments: LaserFlashSegment[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }
    const segment = candidate as Record<string, unknown>;
    const direction = directionState(segment.direction);
    if (
      !Number.isInteger(segment.x) ||
      !Number.isInteger(segment.y) ||
      !direction ||
      typeof segment.terminal !== "boolean"
    ) {
      continue;
    }
    const outgoingDirection = directionState(segment.outgoingDirection);
    segments.push({
      x: segment.x as number,
      y: segment.y as number,
      direction,
      terminal: segment.terminal,
      ...(outgoingDirection ? { outgoingDirection } : {}),
    });
  }
  return segments;
}

function drawLaserSnapshot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  segments: readonly LaserFlashSegment[],
  sourceId: number,
  nowMs: number,
): void {
  for (const segment of segments) {
    if (segment.terminal) continue;
    drawLaserLine(
      context,
      x + segment.x * size,
      y + segment.y * size,
      size,
      segment.direction,
      segment.outgoingDirection ?? null,
      sourceId,
      nowMs,
    );
  }
}

function drawLaserLine(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: Direction,
  outgoingDirection: Direction | null = null,
  sourceId = 0,
  nowMs = 0,
): void {
  const vector = directionVector(direction);
  const outgoingVector = directionVector(outgoingDirection ?? direction);
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const startX = centerX - vector.x * size / 2;
  const startY = centerY - vector.y * size / 2;
  const endX = centerX + outgoingVector.x * size / 2;
  const endY = centerY + outgoingVector.y * size / 2;
  const appearance = resolveLaserAppearance(sourceId, nowMs);
  context.save();
  context.strokeStyle = appearance.color;
  context.lineWidth = Math.max(1, size * appearance.widthRatio);
  context.beginPath();
  context.moveTo(startX, startY);
  if (outgoingDirection) {
    context.lineTo(centerX, centerY);
  }
  context.lineTo(endX, endY);
  context.stroke();
  context.restore();
}
