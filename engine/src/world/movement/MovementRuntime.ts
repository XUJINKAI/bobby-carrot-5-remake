import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { EntityMotionRequest } from "./WorldStepResult.js";
import {
  WorldMotionStore,
  type WorldMotion,
  type WorldMotionId,
  type WorldMotionSnapshot,
  type MovementLifecycle,
} from "./WorldMotion.js";

export type MovementMarker = "departed" | "interaction" | "arrived";

export interface MovementPlan {
  motionId: WorldMotionId;
  source: EntityPresence[];
  target: EntityPresence[];
  nextMarkerIndex: number;
}

export interface MovementRuntimeSnapshot {
  motions: WorldMotionSnapshot;
  plans: MovementPlan[];
}

export interface MovementAdvanceVisitor {
  progressed(motion: WorldMotion): void;
  marker(motion: WorldMotion, marker: MovementMarker): void;
  completed(motion: WorldMotion): void;
}

const MARKERS: readonly { progress: number; marker: MovementMarker }[] = [
  // 原版中点先结算来源格离开，再处理目标格交互。
  { progress: 0.5, marker: "departed" },
  { progress: 0.5, marker: "interaction" },
  { progress: 1, marker: "arrived" },
];

/** WorldClock 驱动的空间过程；只报告语义阶段，不执行 Entity Behavior。 */
export class MovementRuntime {
  readonly motions = new WorldMotionStore();
  private readonly plans = new Map<WorldMotionId, MovementPlan>();

  get running(): readonly WorldMotion[] {
    return this.motions.running;
  }

  start(
    request: EntityMotionRequest,
    durationMs: number,
    lifecycle?: MovementLifecycle,
  ): WorldMotion {
    const motion = this.motions.start({ ...request, durationMs });
    this.plans.set(motion.id, {
      motionId: motion.id,
      source: lifecycle?.source.map(clonePresence) ?? [],
      target: lifecycle?.target.map(clonePresence) ?? [],
      nextMarkerIndex: 0,
    });
    return motion;
  }

  plan(motionId: WorldMotionId): Readonly<MovementPlan> | undefined {
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

    while (plan.nextMarkerIndex < MARKERS.length) {
      const marker = MARKERS[plan.nextMarkerIndex]!;
      if (marker.progress > targetProgress) break;
      this.progressTo(motion, marker.progress, visitor);
      plan.nextMarkerIndex += 1;
      visitor.marker(structuredClone(motion), marker.marker);
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
