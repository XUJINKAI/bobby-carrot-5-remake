import type { Direction } from "@bobby/model";
import { Camera, type CameraOptions } from "../render/Camera.js";
import {
  sortRenderItems,
  type RenderItem,
  type RenderScene,
} from "../render/RenderScene.js";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { World } from "../world/World.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import type { WorldMotion } from "../world/movement/WorldMotion.js";
import type { WorldEvent } from "../world/WorldTypes.js";
import { buildVisualScene } from "./VisualSceneBuilder.js";
import type { MotionEasing } from "./tuning/PresentationTuning.js";
import { applyMotionEasing } from "./tuning/PresentationTuning.js";
import type {
  EntityVisualRuntimeState,
  TransientVisualDefinition,
  VisualRenderPass,
} from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";
import { WorldCalloutRegistry } from "./callout/WorldCalloutRegistry.js";
import {
  WorldCalloutRuntime,
  type WorldCalloutRuntimeOptions,
} from "./callout/WorldCalloutRuntime.js";

interface VisualTimeline {
  startedAtMs: number;
  durationMs: number;
}

interface VisualMotion {
  entityId: EntityId;
  startOffsetX: number;
  startOffsetY: number;
  endOffsetX: number;
  endOffsetY: number;
  startElevationPx: number;
  endElevationPx: number;
  timeline: VisualTimeline;
  /** Spatial movement stays moving even when a mechanism supplies an animation name. */
  moving: boolean;
  animation?: string;
  direction?: Direction;
}

interface VisualMovementGroup {
  primary: WorldMotion;
  motions: WorldMotion[];
}

interface ActiveTransientVisual {
  id: number;
  definition: TransientVisualDefinition;
  event: WorldEvent;
  x: number;
  y: number;
  startedAtMs: number;
}

interface TimelineProgress {
  raw: number;
  position: number;
}

export interface VisualRuntimeInspection {
  visualId: string;
  runtime: EntityVisualRuntimeState | null;
}

export interface WorldDeltaPresentationOptions {
  motionDuration(motion: WorldMotion): number;
  stationaryDeathDurationMs: number;
  levelExitDurationMs?: number;
}

export interface VisualRuntimeOptions extends WorldCalloutRuntimeOptions {
  callouts?: WorldCalloutRegistry;
}

/** Pure presentation runtime. It never mutates World gameplay state. */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly motions = new Map<EntityId, VisualMotion>();
  private readonly activeMotionIds = new Set<EntityId>();
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();
  private readonly transients = new Map<number, ActiveTransientVisual>();
  private readonly activeTransientIds = new Set<number>();
  private readonly callouts: WorldCalloutRuntime;
  private nextTransientId = 1;
  private frame: PresentationFrame | null = null;

  constructor(
    private readonly visuals: VisualRegistry,
    sourceTileSize = 48,
    cameraOptions?: CameraOptions,
    options: VisualRuntimeOptions = {},
  ) {
    this.camera = new Camera(sourceTileSize, cameraOptions);
    this.callouts = new WorldCalloutRuntime(
      options.callouts ?? new WorldCalloutRegistry(),
      options,
    );
  }

  get isAnimating(): boolean {
    return (
      this.activeMotionIds.size > 0 ||
      this.activeTransientIds.size > 0 ||
      this.callouts.isAnimating
    );
  }

  get blocksGameplay(): boolean {
    for (const entityId of this.activeMotionIds) {
      if (this.motions.get(entityId)?.animation === "level-enter") return true;
    }
    return false;
  }

  get runtimeStates(): ReadonlyMap<EntityId, EntityVisualRuntimeState> {
    return this.entityRuntime;
  }

  beginMove(
    entityId: EntityId,
    from: CellPosition,
    to: CellPosition,
    durationMs: number,
    frame: PresentationFrame,
    options: {
      animation?: string;
      direction?: Direction;
    } = {},
  ): void {
    this.frame = frame;
    this.beginMotion(
      entityId,
      { x: from.x - to.x, y: from.y - to.y },
      { x: 0, y: 0 },
      durationMs,
      frame,
      true,
      options.animation,
      options.direction,
    );
  }

  beginDeath(
    entityId: EntityId,
    from: CellPosition,
    to: CellPosition,
    durationMs: number,
    frame: PresentationFrame,
    travelRatio: number,
  ): void {
    const ratio = Math.max(0, Math.min(1, travelRatio));
    const deltaX = from.x - to.x;
    const deltaY = from.y - to.y;
    this.beginMotion(
      entityId,
      { x: deltaX, y: deltaY },
      { x: deltaX * (1 - ratio), y: deltaY * (1 - ratio) },
      durationMs,
      frame,
      false,
      "death",
    );
  }

  beginAction(
    entityId: EntityId,
    animation: string,
    direction: Direction,
    durationMs: number,
    frame: PresentationFrame,
  ): void {
    this.beginMotion(
      entityId,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      durationMs,
      frame,
      false,
      animation,
      direction,
    );
  }

  beginLevelEntrance(
    world: World,
    durationMs: number,
    frame: PresentationFrame,
  ): void {
    this.beginPlayerTransition(world, "level-enter", durationMs, frame);
  }

  beginLevelExit(
    world: World,
    durationMs: number,
    frame: PresentationFrame,
  ): void {
    this.beginPlayerTransition(world, "level-exit", durationMs, frame);
  }

  /** 将有序 World 事实映射为表现状态；不向 World 回写 delay 或 gameplay mutation。 */
  consumeWorldDeltas(
    world: World,
    deltas: readonly WorldDelta[],
    frame: PresentationFrame,
    options: WorldDeltaPresentationOptions,
  ): void {
    const interruptedActors = new Set(
      deltas
        .filter((delta) => delta.type === "motion-interrupted")
        .map((delta) => delta.motion.entityId),
    );
    const movementGroups = buildVisualMovementGroups(deltas);
    const startedGroups = new Set<number>();

    for (const delta of deltas) {
      if (delta.type === "motion-started") {
        const group = movementGroups.get(delta.motion.id);
        if (!group || startedGroups.has(group.primary.id)) continue;
        startedGroups.add(group.primary.id);
        this.beginMoveGroup(
          world,
          group.motions,
          options.motionDuration(group.primary),
          frame,
        );
        continue;
      }
      if (delta.type === "motion-interrupted") {
        const motion = delta.motion;
        const offset = {
          x: (motion.from.x - motion.to.x) * (1 - motion.progress),
          y: (motion.from.y - motion.to.y) * (1 - motion.progress),
        };
        this.beginMotion(
          motion.entityId,
          offset,
          offset,
          options.motionDuration(motion),
          frame,
          false,
          "death",
        );
        continue;
      }
      if (delta.type === "motion-cleared") {
        this.clearEntity(delta.motion.entityId);
        continue;
      }
      if (delta.type === "entity-destroyed") {
        this.clearEntity(delta.entityId);
        this.callouts.removeEntity(delta.entityId);
        continue;
      }
      if (delta.type === "world-event") {
        this.beginTransient(delta.event, frame);
        this.callouts.consume(delta.event, frame);
        continue;
      }
      if (delta.type === "world-outcome-changed") {
        if (delta.outcome.phase !== "playing") this.callouts.clear();
        if (delta.outcome.phase === "won") {
          this.beginLevelExit(
            world,
            options.levelExitDurationMs ??
              options.stationaryDeathDurationMs,
            frame,
          );
        }
        continue;
      }
      if (delta.type !== "actor-lifecycle-changed") continue;
      const actor = delta.actor;
      if (actor.phase === "active") {
        this.clearEntity(actor.entityId);
        continue;
      }
      if (interruptedActors.has(actor.entityId)) continue;
      const entity = world.entity(actor.entityId);
      if (!entity) continue;
      this.beginDeath(
        actor.entityId,
        entity.anchor,
        entity.anchor,
        options.stationaryDeathDurationMs,
        frame,
        0,
      );
    }
  }

  update(frame: PresentationFrame, easing: MotionEasing): void {
    this.frame = frame;
    this.camera.update(frame);
    const timelineProgress = new Map<VisualTimeline, TimelineProgress>();
    for (const motion of this.motions.values()) {
      let progress = timelineProgress.get(motion.timeline);
      if (!progress) {
        progress = resolveTimelineProgress(motion.timeline, frame, easing);
        timelineProgress.set(motion.timeline, progress);
      }
      this.advanceMotion(motion, frame, progress);
    }
    this.updateTransients(frame);
    this.callouts.update(frame);
  }

  clear(): void {
    this.motions.clear();
    this.activeMotionIds.clear();
    this.entityRuntime.clear();
    this.transients.clear();
    this.activeTransientIds.clear();
    this.nextTransientId = 1;
    this.callouts.clear();
  }

  clearEntity(entityId: EntityId): void {
    this.motions.delete(entityId);
    this.activeMotionIds.delete(entityId);
    this.entityRuntime.delete(entityId);
  }

  /** 阻挡移动只更新表现朝向，并从该方向的静止终止帧开始显示。 */
  faceDirection(
    entityId: EntityId,
    direction: Direction,
    frame: PresentationFrame,
  ): void {
    if (this.activeMotionIds.has(entityId)) return;
    const current = this.entityRuntime.get(entityId);
    this.setEntityState(entityId, {
      offsetX: current?.offsetX ?? 0,
      offsetY: current?.offsetY ?? 0,
      elevationPx: current?.elevationPx ?? 0,
      moving: false,
      progress: 1,
      stationarySinceMs: frame.nowMs,
      direction,
    });
  }

  /** 多 player 始终共同构图；单 player 时 camera focus 可临时接管。 */
  scene(world: World, cameraTarget: EntityId | null = null): RenderScene {
    const actorIds = world.query
      .entitiesWithTrait("player")
      .map((entity) => entity.id);
    this.ensureStationaryActorStates(world, actorIds);
    if (actorIds.length > 1) {
      const targets = actorIds
        .map((id) => world.entity(id))
        .filter((entity) => entity !== undefined)
        .map((entity) => {
          const runtime = this.entityRuntime.get(entity.id);
          return {
            x: entity.anchor.x + (runtime?.offsetX ?? 0),
            y: entity.anchor.y + (runtime?.offsetY ?? 0),
          };
        });
      const focus = cameraTarget === null ? undefined : world.entity(cameraTarget);
      if (focus && !actorIds.includes(focus.id)) {
        const runtime = this.entityRuntime.get(focus.id);
        targets.push({
          x: focus.anchor.x + (runtime?.offsetX ?? 0),
          y: focus.anchor.y + (runtime?.offsetY ?? 0),
        });
      }
      this.camera.followPoints(targets, world.width, world.height);
    } else {
      const defaultTargetId = actorIds[0];
      const target =
        (cameraTarget !== null ? world.entity(cameraTarget) : undefined) ??
        (defaultTargetId !== undefined
          ? world.entity(defaultTargetId)
          : undefined);
      if (target) {
        const runtime = this.entityRuntime.get(target.id);
        this.camera.follow(
          {
            x: target.anchor.x + (runtime?.offsetX ?? 0),
            y: target.anchor.y + (runtime?.offsetY ?? 0),
          },
          world.width,
          world.height,
          this.frame ?? undefined,
        );
      }
    }
    const scene = buildVisualScene(
      world,
      this.visuals,
      this.entityRuntime,
      this.frame ?? undefined,
    );
    const withTransients = this.appendTransientVisuals(scene);
    if (!this.frame) return withTransients;
    return {
      ...withTransients,
      callouts: this.callouts.renderItems(
        world,
        this.entityRuntime,
        this.frame,
      ),
    };
  }

  inspectEntity(world: World, entityId: EntityId): VisualRuntimeInspection {
    const definition = world.definition(entityId);
    const runtime = this.entityRuntime.get(entityId);
    return {
      visualId: this.visuals.visualIdFor(definition),
      runtime: runtime ? structuredClone(runtime) : null,
    };
  }

  private beginMoveGroup(
    world: World,
    motions: readonly WorldMotion[],
    durationMs: number,
    frame: PresentationFrame,
  ): void {
    const timeline: VisualTimeline = {
      startedAtMs: frame.nowMs,
      durationMs: Math.max(0, durationMs),
    };
    for (const motion of motions) {
      const carrierHeight =
        motion.cause.type === "carry"
          ? this.supportHeightForEntity(world, motion.cause.carrierId)
          : null;
      const previousHeight = this.entityRuntime.get(
        motion.entityId,
      )?.elevationPx;
      const startElevationPx =
        carrierHeight ??
        previousHeight ??
        this.supportHeightAt(world, motion.from, motion.entityId);
      const endElevationPx =
        carrierHeight ??
        this.supportHeightAt(world, motion.to, motion.entityId);
      this.beginMotion(
        motion.entityId,
        { x: motion.from.x - motion.to.x, y: motion.from.y - motion.to.y },
        { x: 0, y: 0 },
        durationMs,
        frame,
        true,
        motion.cause.type === "carry"
          ? "carry"
          : motion.cause.type === "forced" && motion.cause.mechanism
            ? motion.cause.mechanism
            : undefined,
        motion.cause.type === "carry" ? undefined : motion.direction,
        timeline,
        { startPx: startElevationPx, endPx: endElevationPx },
      );
    }
  }

  private beginPlayerTransition(
    world: World,
    animation: "level-enter" | "level-exit",
    durationMs: number,
    frame: PresentationFrame,
  ): void {
    for (const actor of world.query.entitiesWithTrait("player")) {
      this.beginAction(
        actor.id,
        animation,
        actor.direction ?? "down",
        durationMs,
        frame,
      );
    }
  }

  private beginMotion(
    entityId: EntityId,
    startOffset: { x: number; y: number },
    endOffset: { x: number; y: number },
    durationMs: number,
    frame: PresentationFrame,
    moving: boolean,
    animation?: string,
    direction?: Direction,
    timeline?: VisualTimeline,
    elevation?: { startPx: number; endPx: number },
  ): void {
    const currentElevationPx = this.entityRuntime.get(entityId)?.elevationPx ?? 0;
    const motion: VisualMotion = {
      entityId,
      startOffsetX: startOffset.x,
      startOffsetY: startOffset.y,
      endOffsetX: endOffset.x,
      endOffsetY: endOffset.y,
      startElevationPx: elevation?.startPx ?? currentElevationPx,
      endElevationPx: elevation?.endPx ?? currentElevationPx,
      timeline: timeline ?? {
        startedAtMs: frame.nowMs,
        durationMs: Math.max(0, durationMs),
      },
      moving,
      ...(animation ? { animation } : {}),
      ...(direction ? { direction } : {}),
    };
    this.motions.set(entityId, motion);
    this.activeMotionIds.add(entityId);
    this.setMotionState(motion, 0, 0);
  }

  private beginTransient(event: WorldEvent, frame: PresentationFrame): void {
    const definition = this.visuals.transientForEvent(event.type);
    if (
      !definition ||
      typeof event.x !== "number" ||
      typeof event.y !== "number" ||
      !Number.isFinite(event.x) ||
      !Number.isFinite(event.y)
    )
      return;
    const id = this.nextTransientId++;
    this.transients.set(id, {
      id,
      definition,
      event: structuredClone(event),
      x: event.x,
      y: event.y,
      startedAtMs: frame.nowMs,
    });
    if (definition.durationMs > 0) this.activeTransientIds.add(id);
  }

  private updateTransients(frame: PresentationFrame): void {
    for (const transient of this.transients.values()) {
      const visible =
        frame.nowMs >= transient.startedAtMs &&
        frame.nowMs < transient.startedAtMs + Math.max(0, transient.definition.durationMs);
      if (visible) this.activeTransientIds.add(transient.id);
      else this.activeTransientIds.delete(transient.id);
    }
  }

  private appendTransientVisuals(scene: RenderScene): RenderScene {
    if (!this.frame || this.activeTransientIds.size === 0) return scene;
    const passes: Partial<Record<VisualRenderPass, RenderItem[]>> = {};
    for (const id of this.activeTransientIds) {
      const transient = this.transients.get(id)!;
      const durationMs = Math.max(0, transient.definition.durationMs);
      const elapsedMs = this.frame.nowMs - transient.startedAtMs;
      if (elapsedMs < 0 || durationMs <= 0 || elapsedMs >= durationMs) continue;
      const progress = Math.max(0, Math.min(1, elapsedMs / durationMs));
      const composition = transient.definition.resolve({
        event: transient.event,
        progress,
        time: this.frame,
      });
      if (!composition) continue;
      const pass = transient.definition.renderPass ?? "effect";
      // 基础场景已排序；只有实际追加特效的 pass 才需要复制和重排。
      const items = passes[pass] ?? (passes[pass] = [...scene[pass]]);
      items.push({
        presence: {
          entityId: -transient.id,
          cell: { x: transient.x, y: transient.y },
          layer: "object",
          traits: [],
          stackOrder: transient.definition.stackOrder ?? 0,
        },
        composition,
        visualX: transient.x,
        visualY: transient.y,
      });
    }
    if (!passes.world && !passes.player && !passes.effect) return scene;
    return {
      worldWidth: scene.worldWidth,
      worldHeight: scene.worldHeight,
      world: passes.world ? sortRenderItems(passes.world) : scene.world,
      player: passes.player ? sortRenderItems(passes.player) : scene.player,
      effect: passes.effect ? sortRenderItems(passes.effect) : scene.effect,
      callouts: scene.callouts,
    };
  }

  private advanceMotion(
    motion: VisualMotion,
    frame: PresentationFrame,
    progress: TimelineProgress,
  ): void {
    if (progress.raw >= 1) {
      // Completed motions stay in `motions` for presentation-clock rewind. Only the
      // active -> stationary transition may stamp stationarySinceMs; later frames
      // must not keep resetting the idle timer.
      if (this.activeMotionIds.delete(motion.entityId))
        this.finishMotion(motion, frame);
      return;
    }
    this.activeMotionIds.add(motion.entityId);
    this.setMotionState(motion, progress.position, progress.raw);
  }

  private setMotionState(
    motion: VisualMotion,
    positionProgress: number,
    animationProgress: number,
  ): void {
    this.setEntityState(motion.entityId, {
      offsetX:
        motion.startOffsetX +
        (motion.endOffsetX - motion.startOffsetX) * positionProgress,
      offsetY:
        motion.startOffsetY +
        (motion.endOffsetY - motion.startOffsetY) * positionProgress,
      elevationPx:
        animationProgress < 0.5
          ? motion.startElevationPx
          : motion.endElevationPx,
      moving: motion.moving,
      progress: animationProgress,
      ...(motion.animation ? { animation: motion.animation } : {}),
      ...(motion.direction ? { direction: motion.direction } : {}),
    });
  }

  private finishMotion(
    motion: VisualMotion,
    frame: PresentationFrame,
  ): void {
    const keepAnimation =
      motion.animation === "death" || motion.animation === "level-exit";
    this.setEntityState(motion.entityId, {
      offsetX: motion.endOffsetX,
      offsetY: motion.endOffsetY,
      elevationPx: motion.endElevationPx,
      moving: false,
      progress: 1,
      stationarySinceMs: frame.nowMs,
      ...(keepAnimation ? { animation: motion.animation } : {}),
      ...(motion.direction ? { direction: motion.direction } : {}),
    });
  }

  private ensureStationaryActorStates(
    world: World,
    actorIds: readonly EntityId[],
  ): void {
    if (!this.frame) return;
    for (const entityId of actorIds) {
      if (
        this.activeMotionIds.has(entityId) ||
        this.entityRuntime.has(entityId)
      )
        continue;
      const entity = world.entity(entityId);
      if (!entity) continue;
      this.setEntityState(entityId, {
        elevationPx: this.supportHeightAt(world, entity.anchor, entityId),
        moving: false,
        progress: 1,
        stationarySinceMs: this.frame.nowMs,
      });
    }
  }

  private supportHeightAt(
    world: World,
    cell: CellPosition,
    excludeEntityId?: EntityId,
  ): number {
    let height = 0;
    for (const presence of world.presencesAt(cell)) {
      if (presence.entityId === excludeEntityId) continue;
      const entity = world.entity(presence.entityId);
      if (!entity) continue;
      height = Math.max(
        height,
        this.visuals.supportHeightFor(world.registry.require(entity.type)),
      );
    }
    return height;
  }

  private supportHeightForEntity(world: World, entityId: EntityId): number {
    const entity = world.entity(entityId);
    return entity
      ? this.visuals.supportHeightFor(world.registry.require(entity.type))
      : 0;
  }

  private setEntityState(
    entityId: EntityId,
    state: EntityVisualRuntimeState,
  ): void {
    this.entityRuntime.set(entityId, state);
  }
}

function resolveTimelineProgress(
  timeline: VisualTimeline,
  frame: PresentationFrame,
  easing: MotionEasing,
): TimelineProgress {
  const elapsedMs = Math.max(0, frame.nowMs - timeline.startedAtMs);
  const raw =
    timeline.durationMs <= 0
      ? 1
      : Math.min(1, elapsedMs / timeline.durationMs);
  return {
    raw,
    position: applyMotionEasing(raw, easing),
  };
}

function buildVisualMovementGroups(
  deltas: readonly WorldDelta[],
): ReadonlyMap<number, VisualMovementGroup> {
  const started = deltas
    .filter((delta) => delta.type === "motion-started")
    .map((delta) => delta.motion);
  const byEntity = new Map(started.map((motion) => [motion.entityId, motion]));
  const groupsByPrimary = new Map<number, VisualMovementGroup>();

  for (const motion of started) {
    const primary = resolveVisualGroupPrimary(motion, byEntity);
    const group = groupsByPrimary.get(primary.id) ?? {
      primary,
      motions: [],
    };
    group.motions.push(motion);
    groupsByPrimary.set(primary.id, group);
  }

  const byMotionId = new Map<number, VisualMovementGroup>();
  for (const group of groupsByPrimary.values())
    for (const motion of group.motions) byMotionId.set(motion.id, group);
  return byMotionId;
}

function resolveVisualGroupPrimary(
  source: WorldMotion,
  byEntity: ReadonlyMap<EntityId, WorldMotion>,
): WorldMotion {
  let current = source;
  const visited = new Set<number>();
  while (current.cause.type === "carry") {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    const carrier = byEntity.get(current.cause.carrierId);
    if (!carrier) break;
    current = carrier;
  }
  return current;
}
