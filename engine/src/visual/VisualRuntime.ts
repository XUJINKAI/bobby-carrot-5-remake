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
  from: CellPosition;
  to: CellPosition;
  startedAtMs: number;
  durationMs: number;
}

export interface VisualRuntimeInspection {
  visualId: string;
  runtime: Readonly<EntityVisualRuntimeState> | null;
}

/** World 与 Renderer 之间唯一有业务感知的表现运行时；只吃 PresentationFrame。 */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();
  private readonly motions = new Map<EntityId, VisualMotion>();
  private frame: PresentationFrame | undefined;

  constructor(
    private readonly visuals: VisualRegistry,
    sourceTileSize = 48,
  ) {
    this.camera = new Camera(sourceTileSize);
  }

  get isAnimating(): boolean {
    return this.motions.size > 0;
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
    this.motions.set(entityId, {
      entityId,
      from: { ...from },
      to: { ...to },
      startedAtMs: frame.nowMs,
      durationMs: Math.max(0, durationMs),
    });
    this.setEntityState(entityId, {
      offsetX: from.x - to.x,
      offsetY: from.y - to.y,
      moving: true,
      progress: 0,
    });
  }

  /** 只推进表现状态；绝不触发 gameplay mutation。 */
  update(frame: PresentationFrame, easing: MotionEasing): void {
    this.frame = frame;
    this.camera.update(frame);
    for (const motion of [...this.motions.values()])
      this.advanceMotion(motion, frame, easing);
  }

  clear(): void {
    this.motions.clear();
    this.entityRuntime.clear();
  }

  /** 组装当前视觉快照，并让 Camera 跟随 gameplay 指定目标；默认跟随 Bobby。 */
  scene(world: World, cameraTarget: EntityId | null = null): RenderScene {
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

  private advanceMotion(
    motion: VisualMotion,
    frame: PresentationFrame,
    easing: MotionEasing,
  ): void {
    const elapsedMs = Math.max(0, frame.nowMs - motion.startedAtMs);
    const rawProgress =
      motion.durationMs <= 0 ? 1 : Math.min(1, elapsedMs / motion.durationMs);
    const progress = applyMotionEasing(rawProgress, easing);
    this.setEntityState(motion.entityId, {
      offsetX: (motion.from.x - motion.to.x) * (1 - progress),
      offsetY: (motion.from.y - motion.to.y) * (1 - progress),
      moving: true,
      progress,
    });
    if (rawProgress < 1) return;
    this.clearEntityState(motion.entityId);
    this.motions.delete(motion.entityId);
  }
}
