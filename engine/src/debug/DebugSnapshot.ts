import type { RenderScene } from "../render/RenderScene.js";
import type { EngineTiming } from "../time/EngineTiming.js";
import type { PresentationClock } from "../time/PresentationClock.js";
import type { WorldClock } from "../time/WorldClock.js";
import type { VisualRuntime } from "../visual/VisualRuntime.js";
import type { World } from "../world/World.js";
import type {
  CellPosition,
  EntityId,
} from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";

export interface DebugSelection {
  cell: CellPosition;
  entityId?: EntityId;
}

export interface DebugSnapshot {
  runtime: {
    worldTickCount: number;
    worldHz: number;
    worldStepMs: number;
    worldPaused: boolean;
    presentationFrame: number;
    presentationHz: number;
    presentationStepMs: number;
    hasLevel: boolean;
    status: "unloaded" | "playing" | "won" | "dead";
    moves: number;
    player: CellPosition | null;
    facing: string | null;
    forced: unknown;
    animating: boolean;
    actionCount: number;
    inputBlocked: boolean;
    cameraTarget: EntityId | null;
  };
  selection: DebugSelectionSnapshot | null;
}

export interface DebugSelectionSnapshot {
  cell: CellPosition;
  playerHere: boolean;
  presences: readonly DebugPresenceSnapshot[];
  entity: DebugEntitySnapshot | null;
}

export interface DebugPresenceSnapshot {
  entityId: EntityId;
  type: string;
  role?: string;
  stackBand: string;
  stackOrder: number;
  traits: readonly string[];
}

export interface DebugEntitySnapshot {
  id: EntityId;
  type: string;
  anchor: CellPosition;
  direction: string | null;
  properties: unknown;
  state: unknown;
  instanceTraits: readonly string[];
  definition: {
    traits: readonly string[];
    stackBand: string;
    stackOrder: number | null;
    occupancy: unknown;
    footprint: unknown;
    propertyFields: unknown;
    stateFields: unknown;
    explicitBehaviors: readonly string[];
  };
  behaviors: readonly string[];
  presences: readonly DebugPresenceSnapshot[];
  visual: {
    visualId: string;
    runtime: unknown;
    renderItems: readonly DebugRenderItemSnapshot[];
  };
}

export interface DebugRenderItemSnapshot {
  cell: CellPosition;
  role: string | null;
  visualX: number;
  visualY: number;
  layers: readonly Record<string, unknown>[];
}

export function buildDebugSnapshot(options: {
  world: World | null;
  scene: RenderScene | null;
  visual: VisualRuntime;
  worldClock: WorldClock;
  presentationClock: PresentationClock;
  timing: EngineTiming;
  selection: DebugSelection | null;
}): DebugSnapshot {
  const {
    world,
    scene,
    visual,
    worldClock,
    presentationClock,
    timing,
    selection,
  } = options;
  const runtime = {
    worldTickCount: worldClock.tickCount,
    worldHz: timing.worldHz,
    worldStepMs: worldClock.stepMs,
    worldPaused: worldClock.paused,
    presentationFrame: presentationClock.current.frame,
    presentationHz: timing.presentationHz,
    presentationStepMs: timing.presentationStepMs,
    hasLevel: world !== null,
    status: world
      ? world.dead
        ? ("dead" as const)
        : world.completed
          ? ("won" as const)
          : ("playing" as const)
      : ("unloaded" as const),
    moves: world?.state.moves ?? 0,
    player: world ? world.player : null,
    facing: world?.facing ?? null,
    forced: world?.state.forced ? structuredClone(world.state.forced) : null,
    animating: visual.isAnimating,
    actionCount: world?.actions.active.length ?? 0,
    inputBlocked: world?.inputBlocked ?? false,
    cameraTarget: world?.cameraTarget ?? null,
  };

  if (!world || !selection) return { runtime, selection: null };
  const inspection = world.inspect(selection.cell.x, selection.cell.y);
  if (!inspection) return { runtime, selection: null };

  const presences = world.presencesAt(selection.cell).map((presence) =>
    debugPresence(world, presence),
  );
  const selectedPresence =
    presences.find((presence) => presence.entityId === selection.entityId) ??
    presences.at(-1);
  const entity = selectedPresence
    ? buildEntitySnapshot(world, scene, visual, selectedPresence.entityId)
    : null;

  return {
    runtime,
    selection: {
      cell: { ...inspection.cell },
      playerHere: inspection.playerHere,
      presences,
      entity,
    },
  };
}

function buildEntitySnapshot(
  world: World,
  scene: RenderScene | null,
  visual: VisualRuntime,
  entityId: EntityId,
): DebugEntitySnapshot | null {
  const entity = world.entity(entityId);
  if (!entity) return null;
  const definition = world.definition(entityId);
  const presences = world.spatial
    .presencesForEntity(entityId)
    .map((presence) => debugPresence(world, presence));
  const traits = [...new Set(presences.flatMap((presence) => presence.traits))];
  const behaviors = world.behaviors
    .resolve(definition.behaviors ?? [], traits)
    .map((behavior) => behavior.id);
  const visualInspection = visual.inspectEntity(world, entityId);
  const renderItems = (scene?.items ?? [])
    .filter((item) => item.presence.entityId === entityId)
    .map((item) => ({
      cell: { ...item.presence.cell },
      role: item.presence.role ?? null,
      visualX: item.visualX,
      visualY: item.visualY,
      layers: item.composition.layers.map(debugVisualLayer),
    }));

  return {
    id: entity.id,
    type: entity.type,
    anchor: { ...entity.anchor },
    direction: entity.direction ?? null,
    properties: entity.properties ? structuredClone(entity.properties) : null,
    state: entity.state ? structuredClone(entity.state) : null,
    instanceTraits: [...(entity.instanceTraits ?? [])],
    definition: {
      traits: [...definition.traits],
      stackBand: definition.stackBand,
      stackOrder: definition.stackOrder ?? null,
      occupancy: definition.occupancy ? structuredClone(definition.occupancy) : null,
      footprint: definition.footprint ? structuredClone(definition.footprint) : null,
      propertyFields: definition.properties
        ? structuredClone(definition.properties)
        : null,
      stateFields: definition.state ? structuredClone(definition.state) : null,
      explicitBehaviors: [...(definition.behaviors ?? [])],
    },
    behaviors,
    presences,
    visual: {
      visualId: visualInspection.visualId,
      runtime: visualInspection.runtime,
      renderItems,
    },
  };
}

function debugPresence(
  world: World,
  presence: Readonly<EntityPresence>,
): DebugPresenceSnapshot {
  return {
    entityId: presence.entityId,
    type: world.entity(presence.entityId)?.type ?? "unknown",
    ...(presence.role ? { role: presence.role } : {}),
    stackBand: presence.stackBand,
    stackOrder: presence.stackOrder,
    traits: [...presence.traits],
  };
}

function debugVisualLayer(layer: unknown): Record<string, unknown> {
  if (!layer || typeof layer !== "object") return { kind: "unknown" };
  const value = layer as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "function") result[key] = entry;
  }
  return result;
}
