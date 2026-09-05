import type { Direction } from "@bobby/model";
import { Camera } from "../render/Camera.js";
import type { RenderScene } from "../render/RenderScene.js";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { World } from "../world/World.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import type { WorldMotion } from "../world/movement/WorldMotion.js";
import { buildVisualScene } from "./VisualSceneBuilder.js";
import type { MotionEasing } from "./tuning/PresentationTuning.js";
import { applyMotionEasing } from "./tuning/PresentationTuning.js";
import type { EntityVisualRuntimeState } from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";

interface VisualMotion {
  entityId: EntityId;
  startOffsetX: number;
  startOffsetY: number;
  endOffsetX: number;
  endOffsetY: number;
  startedAtMs: number;
  durationMs: number;
  /** Spatial movement stays moving even when a mechanism supplies an animation name. */
  moving: boolean;
  animation?: string;
  direction?: Direction;
}

export interface VisualRuntimeInspection {
  visualId: string;
  runtime: EntityVisualRuntimeState | null;
}

export interface WorldDeltaPresentationOptions {
  motionDuration(motion: WorldMotion): number;
  stationaryDeathDurationMs: number;
}

/** Pure presentation runtime. It never mutates World gameplay state. */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly motions = new Map<EntityId, VisualMotion>();
  private readonly activeMotionIds = new Set<EntityId>();
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();
  private frame: PresentationFrame | null = null;

  constructor(
    private readonly visuals: VisualRegistry,
    sourceTileSize: number,
  ) {
    this.camera = new Camera(sourceTileSize);
  }

  get isAnimating(): boolean {
    return this.activeMotionIds.size > 0;
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
    for (const delta of deltas) {
      if (delta.type === "motion-started") {
        const motion = delta.motion;
        this.beginMove(
          motion.entityId,
          motion.from,
          motion.to,
          options.motionDuration(motion),
          frame,
          {
            ...(motion.cause.type === "forced" && motion.cause.mechanism
              ? { animation: motion.cause.mechanism }
              : {}),
            direction: motion.direction,
          },
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
      if (delta.type === "motion-cleared" || delta.type === "entity-destroyed") {
        const entityId =
          delta.type === "motion-cleared"
            ? delta.motion.entityId
            : delta.entityId;
        this.clearEntity(entityId);
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
    for (const motion of this.motions.values())
      this.advanceMotion(motion, frame, easing);
  }

  clear(): void {
    this.motions.clear();
    this.activeMotionIds.clear();
    this.entityRuntime.clear();
  }

  clearEntity(entityId: EntityId): void {
    this.motions.delete(entityId);
    this.activeMotionIds.delete(entityId);
    this.entityRuntime.delete(entityId);
  }

  /** Camera focus wins; otherwise follow the first player-trait actor. */
  scene(world: World, cameraTarget: EntityId | null = null): RenderScene {
    const actorIds = world.query
      .entitiesWithTrait("player")
      .map((entity) => entity.id);
    this.ensureStationaryActorStates(actorIds);
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
      );
    }
    return buildVisualScene(
      world,
      this.visuals,
      this.entityRuntime,
      this.frame ?? undefined,
    );
  }

  inspectEntity(world: World, entityId: EntityId): VisualRuntimeInspection {
    const definition = world.definition(entityId);
    const runtime = this.entityRuntime.get(entityId);
    return {
      visualId: this.visuals.visualIdFor(definition),
      runtime: runtime ? structuredClone(runtime) : null,
    };
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
  ): void {
    const motion: VisualMotion = {
      entityId,
      startOffsetX: startOffset.x,
      startOffsetY: startOffset.y,
      endOffsetX: endOffset.x,
      endOffsetY: endOffset.y,
      startedAtMs: frame.nowMs,
      durationMs: Math.max(0, durationMs),
      moving,
      ...(animation ? { animation } : {}),
      ...(direction ? { direction } : {}),
    };
    this.motions.set(entityId, motion);
    this.activeMotionIds.add(entityId);
    this.setMotionState(motion, 0, 0);
  }

  private advanceMotion(
    motion: VisualMotion,
    frame: PresentationFrame,
    easing: MotionEasing,
  ): void {
    const elapsedMs = Math.max(0, frame.nowMs - motion.startedAtMs);
    const rawProgress =
      motion.durationMs <= 0
        ? 1
        : Math.min(1, elapsedMs / motion.durationMs);
    const progress = applyMotionEasing(rawProgress, easing);
    if (rawProgress >= 1) {
      // Completed motions stay in `motions` for presentation-clock rewind. Only the
      // active -> stationary transition may stamp stationarySinceMs; later frames
      // must not keep resetting the idle timer.
      if (this.activeMotionIds.delete(motion.entityId))
        this.finishMotion(motion, frame);
      return;
    }
    this.activeMotionIds.add(motion.entityId);
    this.setMotionState(motion, progress, rawProgress);
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
    const keepAnimation = motion.animation === "death";
    this.setEntityState(motion.entityId, {
      offsetX: motion.endOffsetX,
      offsetY: motion.endOffsetY,
      moving: false,
      progress: 1,
      stationarySinceMs: frame.nowMs,
      ...(keepAnimation ? { animation: motion.animation } : {}),
      ...(motion.direction ? { direction: motion.direction } : {}),
    });
  }

  private ensureStationaryActorStates(
    actorIds: readonly EntityId[],
  ): void {
    if (!this.frame) return;
    for (const entityId of actorIds) {
      if (
        this.activeMotionIds.has(entityId) ||
        this.entityRuntime.has(entityId)
      )
        continue;
      this.setEntityState(entityId, {
        moving: false,
        progress: 1,
        stationarySinceMs: this.frame.nowMs,
      });
    }
  }

  private setEntityState(
    entityId: EntityId,
    state: EntityVisualRuntimeState,
  ): void {
    this.entityRuntime.set(entityId, state);
  }
}
