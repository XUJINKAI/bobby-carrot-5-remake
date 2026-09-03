import type { InputControllerInspection } from "../input/InputController.js";
import type { RenderScene } from "../render/RenderScene.js";
import type { EngineTiming } from "../time/EngineTiming.js";
import type { PresentationClock } from "../time/PresentationClock.js";
import type { WorldClock } from "../time/WorldClock.js";
import type { VisualRuntime } from "../visual/VisualRuntime.js";
import type { VisualRenderPass } from "../visual/VisualDefinition.js";
import type { World } from "../world/World.js";
import type { RuntimeActionInstance } from "../world/action/RuntimeAction.js";
import type { EntityLayer } from "../world/entity/EntityDefinition.js";
import type {
  CellPosition,
  EntityId,
} from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import type { DebugTraceEntry } from "./DebugTrace.js";

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
    presentationPaused: boolean;
    animating: boolean;
    actionCount: number;
    inputBlocked: boolean;
    cameraTarget: EntityId | null;
  };
  actor: DebugEntitySnapshot | null;
  actions: readonly RuntimeActionInstance[];
  input: InputControllerInspection | null;
  selection: DebugSelectionSnapshot | null;
  trace?: readonly DebugTraceEntry[];
}

export interface DebugSelectionSnapshot {
  cell: CellPosition;
  presences: readonly DebugPresenceSnapshot[];
  entity: DebugEntitySnapshot | null;
}

export interface DebugPresenceSnapshot {
  entityId: EntityId;
  type: string;
  layer: EntityLayer;
  role?: string;
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
    layer: EntityLayer;
    stackOrder: number | null;
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
  pass: VisualRenderPass;
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
  input: InputControllerInspection | null;
  selection: DebugSelection | null;
}): DebugSnapshot {
  const {
    world,
    scene,
    visual,
    worldClock,
    presentationClock,
    timing,
    input,
    selection,
  } = options;
  const actions = world?.actions.active ?? [];
  const runtime = {
    worldTickCount: worldClock.tickCount,
    worldHz: timing.worldHz,
    worldStepMs: worldClock.stepMs,
    worldPaused: worldClock.paused,
    presentationFrame: presentationClock.current.frame,
    presentationHz: timing.presentationHz,
    presentationStepMs: timing.presentationStepMs,
    presentationPaused: presentationClock.paused,
    animating: visual.isAnimating,
    actionCount: actions.length,
    inputBlocked: world?.inputBlocked ?? false,
    cameraTarget: world?.cameraTarget ?? null,
  };
  const actorId = world?.query.entitiesWithTrait("player")[0]?.id;
  const actor =
    world && actorId !== undefined
      ? buildEntitySnapshot(world, scene, visual, actorId)
      : null;

  if (!world || !selection)
    return { runtime, actor, actions, input, selection: null };
  const inspection = world.inspect(selection.cell.x, selection.cell.y);
  if (!inspection)
    return { runtime, actor, actions, input, selection: null };

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
    actor,
    actions,
    input,
    selection: {
      cell: { ...inspection.cell },
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
  const renderItems = renderSceneItems(scene)
    .filter(({ item }) => item.presence.entityId === entityId)
    .map(({ pass, item }) => ({
      pass,
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
      layer: definition.layer ?? "object",
      stackOrder: definition.stackOrder ?? null,
      footprint: definition.footprint ? structuredClone(definition.footprint) : null,
      propertyFields: definition.properties ? structuredClone(definition.properties) : null,
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

function renderSceneItems(scene: RenderScene | null): Array<{
  pass: VisualRenderPass;
  item: RenderScene["world"][number];
}> {
  if (!scene) return [];
  return [
    ...scene.world.map((item) => ({ pass: "world" as const, item })),
    ...scene.player.map((item) => ({ pass: "player" as const, item })),
    ...scene.effect.map((item) => ({ pass: "effect" as const, item })),
  ];
}

function debugPresence(
  world: World,
  presence: Readonly<EntityPresence>,
): DebugPresenceSnapshot {
  return {
    entityId: presence.entityId,
    type: world.entity(presence.entityId)?.type ?? "unknown",
    layer: presence.layer,
    ...(presence.role ? { role: presence.role } : {}),
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
