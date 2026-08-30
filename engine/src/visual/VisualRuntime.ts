import type { Direction } from "@bobby/model";
import { Camera } from "../render/Camera.js";
import type { RenderScene } from "../render/RenderScene.js";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { World } from "../world/World.js";
import type {
  CellPosition,
  EntityId,
} from "../world/entity/EntityInstance.js";
import { buildVisualScene } from "./VisualSceneBuilder.js";
import type { EntityVisualRuntimeState } from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";
import {
  applyMotionEasing,
  type MotionEasing,
} from "./tuning/PresentationTuning.js";

interface VisualMotion {
  entityId: EntityId;
  startOffsetX: number;
  startOffsetY: number;
  endOffsetX: number;
  endOffsetY: number;
  startedAtMs: number;
  durationMs: number;
  animation?: string;
  direction?: Direction;
}

export interface VisualRuntimeInspection {
  visualId: string;
  runtime: Readonly<EntityVisualRuntimeState> | null;
}

/** World 与 Renderer 之间唯一有业务感知的表现运行时；只吃 PresentationFrame。 */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();
  /** 每个 Entity 保留最近一次 motion，便于 Debug 在刚结束后仍可倒一帧检查。 */
  private readonly motions = new Map<EntityId, VisualMotion>();
  private readonly activeMotionIds = new Set<EntityId>();
  private frame: PresentationFrame | undefined;

  constructor(
    private readonly visuals: VisualRegistry,
    sourceTileSize = 48,
  ) {
    this.camera = new Camera(sourceTileSize);
  }

  get isAnimating(): boolean {
    return this.activeMotionIds.size > 0;
  }

  setEntityState(entityId: EntityId, state: EntityVisualRuntimeState): void {
    this.entityRuntime.set(entityId, { ...state });
  }

  clearEntityState(entityId: EntityId): void {
    this.entityRuntime.delete(entityId);
  }

  beginMove(
    entityId: EntityId,
    from: CellPosition,
    to: CellPosition,
    durationMs: number,
    frame: PresentationFrame,
  ): void {
    this.beginMotion(
      entityId,
      { x: from.x - to.x, y: from.y - to.y },
      { x: 0, y: 0 },
      durationMs,
      frame,
    );
  }

  /** Hazard death 只向目标格推进一部分；World 仍保持已经判定死亡后的 canonical 状态。 */
  beginDeath(
    entityId: EntityId,
    from: CellPosition,
    to: CellPosition,
    durationMs: number,
    frame: PresentationFrame,
    travelFraction = 0.4,
  ): void {
    const fraction = Math.max(0, Math.min(1, travelFraction));
    const start = { x: from.x - to.x, y: from.y - to.y };
    this.beginMotion(
      entityId,
      start,
      { x: start.x * (1 - fraction), y: start.y * (1 - fraction) },
      durationMs,
      frame,
      "death",
    );
  }

  /** 原地的纯表现动作，例如铲雪；不修改 World anchor。 */
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
      animation,
      direction,
    );
  }

  /** 只推进表现状态；绝不触发 gameplay mutation。可接受 Debug 的负 delta frame。 */
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

  /** 组装当前视觉快照，并让 Camera 跟随 gameplay 指定目标；默认跟随 Bobby。 */
  scene(world: World, cameraTarget: EntityId | null = null): RenderScene {
    this.ensureStationaryPlayerState(world);
    const targetId = cameraTarget ?? world.playerId;
    const target = world.entity(targetId) ?? world.entity(world.playerId);
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
    return buildVisualScene(world, this.visuals, this.entityRuntime, this.frame);
  }

  /** Engine Debug Runtime 使用的只读视觉诊断信息。 */
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
      motion.durationMs <= 0 ? 1 : Math.min(1, elapsedMs / motion.durationMs);
    const progress = applyMotionEasing(rawProgress, easing);
    if (rawProgress >= 1) {
      this.activeMotionIds.delete(motion.entityId);
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
      moving: motion.animation === undefined,
      progress: animationProgress,
      ...(motion.animation ? { animation: motion.animation } : {}),
      ...(motion.direction ? { direction: motion.direction } : {}),
    });
  }

  private finishMotion(motion: VisualMotion, frame: PresentationFrame): void {
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

  private ensureStationaryPlayerState(world: World): void {
    if (!this.frame || this.activeMotionIds.has(world.playerId)) return;
    if (this.entityRuntime.has(world.playerId)) return;
    this.setEntityState(world.playerId, {
      moving: false,
      progress: 1,
      stationarySinceMs: this.frame.nowMs,
    });
  }
}
