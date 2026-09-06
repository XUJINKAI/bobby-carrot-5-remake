import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { EntityMotionRequest } from "./WorldStepResult.js";
import {
  WorldMotionStore,
  type WorldMotion,
  type WorldMotionId,
  type WorldMotionSnapshot,
  type MovementLifecycle,
  type MovementMarkerDefinition,
} from "./WorldMotion.js";

export type MovementMarker = string;

export interface MovementRuntimePlan {
  motionId: WorldMotionId;
  source: EntityPresence[];
  target: EntityPresence[];
  markers: MovementMarkerDefinition[];
  nextMarkerIndex: number;
}

export interface MovementRuntimeSnapshot {
  motions: WorldMotionSnapshot;
  plans: MovementRuntimePlan[];
}

export interface MovementAdvanceVisitor {
  progressed(motion: WorldMotion): void;
  marker(motion: WorldMotion, marker: MovementMarkerDefinition): void;
  completed(motion: WorldMotion): void;
}

export const DEFAULT_MOVEMENT_MARKERS: readonly MovementMarkerDefinition[] = [
  // 原版中点先结算来源格离开，再处理目标格交互。
  {
    id: "departed",
    progress: 0.5,
    dispatch: [{ scope: "source", hook: "onLeave" }],
  },
  {
    id: "interaction",
    progress: 0.5,
    dispatch: [{ scope: "target", hook: "onEnter" }],
    recordsReach: true,
  },
  {
    id: "arrived",
    progress: 1,
    dispatch: [{ scope: "target", hook: "onArrive" }],
  },
];

/** WorldClock 驱动的空间过程；只报告语义阶段，不执行 Entity Behavior。 */
export class MovementRuntime {
  readonly motions = new WorldMotionStore();
  private readonly plans = new Map<WorldMotionId, MovementRuntimePlan>();

  get running(): readonly WorldMotion[] {
    return this.motions.running;
  }

  start(
    request: EntityMotionRequest,
    durationMs: number,
    lifecycle?: MovementLifecycle,
  ): WorldMotion {
    const resolvedDurationMs = this.resolveDuration(request, durationMs);
    const motion = this.motions.start({
      ...request,
      durationMs: resolvedDurationMs,
    });
    this.plans.set(motion.id, {
      motionId: motion.id,
      source: lifecycle?.source.map(clonePresence) ?? [],
      target: lifecycle?.target.map(clonePresence) ?? [],
      markers: normalizeMarkers(lifecycle?.markers),
      nextMarkerIndex: 0,
    });
    return motion;
  }

  plan(motionId: WorldMotionId): Readonly<MovementRuntimePlan> | undefined {
    const plan = this.plans.get(motionId);
    return plan ? structuredClone(plan) : undefined;
  }

  advance(stepMs: number, visitor: MovementAdvanceVisitor): void {
    const safeStepMs = Math.max(0, Number.isFinite(stepMs) ? stepMs : 0);
    const ids = this.running.map((motion) => motion.id);
    for (const id of ids) this.advanceOne(id, safeStepMs, visitor);
  }

  interruptEntity(
    entityId: number,
    reason: string,
    progress?: number,
  ): WorldMotion | undefined {
    return this.motions.interruptEntity(entityId, reason, progress);
  }

  clearEntity(entityId: number): WorldMotion | undefined {
    const motion = this.motions.clearEntity(entityId);
    if (motion) this.plans.delete(motion.id);
    return motion;
  }

  snapshot(): MovementRuntimeSnapshot {
    return {
      motions: this.motions.snapshot(),
      plans: [...this.plans.values()]
        .sort((a, b) => a.motionId - b.motionId)
        .map((plan) => structuredClone(plan)),
    };
  }

  restore(snapshot: MovementRuntimeSnapshot): void {
    this.motions.restore(snapshot.motions);
    this.plans.clear();
    for (const source of snapshot.plans)
      this.plans.set(source.motionId, structuredClone(source));
  }

  private resolveDuration(
    request: EntityMotionRequest,
    durationMs: number,
  ): number {
    if (request.cause.type !== "carry") return durationMs;
    const carrier = this.motions.forEntity(request.cause.carrierId);
    if (!carrier || carrier.status !== "running")
      throw new Error(
        `Carry companion ${request.entityId} 缺少进行中的 carrier motion ${request.cause.carrierId}`,
      );
    return carrier.durationMs;
  }

  private advanceOne(
    motionId: WorldMotionId,
    stepMs: number,
    visitor: MovementAdvanceVisitor,
  ): void {
    const motion = this.motions.mutable(motionId);
    const plan = this.plans.get(motionId);
    if (!motion || !plan || motion.status !== "running") return;

    const targetElapsed =
      motion.durationMs === 0
        ? 0
        : Math.min(motion.durationMs, motion.elapsedMs + stepMs);
    const targetProgress =
      motion.durationMs === 0 ? 1 : targetElapsed / motion.durationMs;

    while (plan.nextMarkerIndex < plan.markers.length) {
      const marker = plan.markers[plan.nextMarkerIndex]!;
      if (marker.progress > targetProgress) break;
      this.progressTo(motion, marker.progress, visitor);
      plan.nextMarkerIndex += 1;
      visitor.marker(structuredClone(motion), structuredClone(marker));
      if (motion.status !== "running") return;
    }

    this.progressTo(motion, targetProgress, visitor);
    if (motion.progress < 1 || motion.status !== "running") return;
    const completed = this.motions.complete(motion.id) ?? structuredClone(motion);
    this.plans.delete(motion.id);
    visitor.completed(completed);
  }

  private progressTo(
    motion: WorldMotion,
    progress: number,
    visitor: MovementAdvanceVisitor,
  ): void {
    if (progress <= motion.progress) return;
    motion.progress = progress;
    motion.elapsedMs = motion.durationMs * progress;
    visitor.progressed(structuredClone(motion));
  }
}

function clonePresence(presence: EntityPresence): EntityPresence {
  return structuredClone(presence);
}

function normalizeMarkers(
  markers: readonly MovementMarkerDefinition[] | undefined,
): MovementMarkerDefinition[] {
  return (markers ?? DEFAULT_MOVEMENT_MARKERS)
    .map((marker, index) => ({
      marker: {
        ...structuredClone(marker),
        id: marker.id.trim() || `marker-${index}`,
        progress: clampProgress(marker.progress),
      },
      index,
    }))
    .sort((left, right) =>
      left.marker.progress === right.marker.progress
        ? left.index - right.index
        : left.marker.progress - right.marker.progress,
    )
    .map(({ marker }) => marker);
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}