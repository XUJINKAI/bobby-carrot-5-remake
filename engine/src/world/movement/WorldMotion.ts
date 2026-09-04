import type { Direction } from "@bobby/model";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { MoveCause } from "./WorldIntent.js";

export type WorldMotionId = number;
export type WorldMotionStatus = "running" | "interrupted";

export interface WorldPose {
  x: number;
  y: number;
}

export interface WorldMotionInterruption {
  reason: string;
}

/** World 持有的连续空间事实；Entity anchor 始终保留整数网格语义。 */
export interface WorldMotion {
  id: WorldMotionId;
  kind: "move";
  entityId: EntityId;
  from: CellPosition;
  to: CellPosition;
  direction: Direction;
  cause: MoveCause;
  durationMs: number;
  elapsedMs: number;
  progress: number;
  status: WorldMotionStatus;
  interruption?: WorldMotionInterruption;
}

export interface WorldMotionSnapshot {
  nextId: number;
  motions: WorldMotion[];
}

export interface StartWorldMotion {
  entityId: EntityId;
  from: CellPosition;
  to: CellPosition;
  direction: Direction;
  cause: MoveCause;
  durationMs: number;
}

export class WorldMotionStore {
  private readonly motions = new Map<WorldMotionId, WorldMotion>();
  private readonly motionByEntity = new Map<EntityId, WorldMotionId>();
  private nextIdValue = 1;

  get all(): readonly WorldMotion[] {
    return [...this.motions.values()]
      .sort((a, b) => a.id - b.id)
      .map(cloneMotion);
  }

  get running(): readonly WorldMotion[] {
    return this.all.filter((motion) => motion.status === "running");
  }

  start(spec: StartWorldMotion): WorldMotion {
    const current = this.forEntity(spec.entityId);
    if (current?.status === "running")
      throw new Error(`Entity ${spec.entityId} 已有进行中的 WorldMotion`);
    if (current) this.remove(current.id);

    const durationMs = safeDuration(spec.durationMs);
    const motion: WorldMotion = {
      id: this.nextIdValue++,
      kind: "move",
      entityId: spec.entityId,
      from: { ...spec.from },
      to: { ...spec.to },
      direction: spec.direction,
      cause: structuredClone(spec.cause),
      durationMs,
      elapsedMs: 0,
      progress: durationMs === 0 ? 1 : 0,
      status: "running",
    };
    this.motions.set(motion.id, motion);
    this.motionByEntity.set(motion.entityId, motion.id);
    return cloneMotion(motion);
  }

  forEntity(entityId: EntityId): Readonly<WorldMotion> | undefined {
    const id = this.motionByEntity.get(entityId);
    const motion = id === undefined ? undefined : this.motions.get(id);
    return motion ? cloneMotion(motion) : undefined;
  }

  mutable(id: WorldMotionId): WorldMotion | undefined {
    return this.motions.get(id);
  }

  poseFor(entityId: EntityId, anchor: CellPosition): WorldPose {
    const motion = this.forEntity(entityId);
    if (!motion) return { ...anchor };
    return {
      x: motion.from.x + (motion.to.x - motion.from.x) * motion.progress,
      y: motion.from.y + (motion.to.y - motion.from.y) * motion.progress,
    };
  }

  interruptEntity(
    entityId: EntityId,
    reason: string,
    progress?: number,
  ): WorldMotion | undefined {
    const id = this.motionByEntity.get(entityId);
    const motion = id === undefined ? undefined : this.motions.get(id);
    if (!motion || motion.status !== "running") return undefined;
    if (progress !== undefined) {
      motion.progress = clampProgress(progress);
      motion.elapsedMs = motion.durationMs * motion.progress;
    }
    motion.status = "interrupted";
    motion.interruption = { reason };
    return cloneMotion(motion);
  }

  remove(id: WorldMotionId): WorldMotion | undefined {
    const motion = this.motions.get(id);
    if (!motion) return undefined;
    this.motions.delete(id);
    if (this.motionByEntity.get(motion.entityId) === id)
      this.motionByEntity.delete(motion.entityId);
    return cloneMotion(motion);
  }

  clearEntity(entityId: EntityId): WorldMotion | undefined {
    const id = this.motionByEntity.get(entityId);
    return id === undefined ? undefined : this.remove(id);
  }

  snapshot(): WorldMotionSnapshot {
    return {
      nextId: this.nextIdValue,
      motions: this.all.map(cloneMotion),
    };
  }

  restore(snapshot: WorldMotionSnapshot): void {
    this.motions.clear();
    this.motionByEntity.clear();
    this.nextIdValue = Math.max(1, Math.floor(snapshot.nextId));
    for (const source of snapshot.motions) {
      const motion = cloneMotion(source);
      this.motions.set(motion.id, motion);
      this.motionByEntity.set(motion.entityId, motion.id);
    }
  }

  clear(): void {
    this.motions.clear();
    this.motionByEntity.clear();
    this.nextIdValue = 1;
  }
}

function cloneMotion(motion: WorldMotion): WorldMotion {
  return structuredClone(motion);
}

function safeDuration(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
