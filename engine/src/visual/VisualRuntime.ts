import { Camera } from "../render/Camera.js";
import type { RenderScene } from "../render/RenderScene.js";
import type { EngineTick } from "../time/EngineClock.js";
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
  startedTick: number;
  duration: number;
}

/** World 与 Renderer 之间唯一有业务感知的视觉运行时。 */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();
  private motion: VisualMotion | null = null;
  private time: EngineTick | undefined;

  constructor(
    private readonly visuals: VisualRegistry,
    sourceTileSize = 48,
  ) {
    this.camera = new Camera(sourceTileSize);
  }

  get isAnimating(): boolean {
    return this.motion !== null;
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
    duration: number,
    time: EngineTick,
  ): void {
    this.motion = {
      entityId,
      from: { ...from },
      to: { ...to },
      startedTick: time.tick,
      duration: Math.max(1, duration),
    };
    this.setEntityState(entityId, {
      offsetX: from.x - to.x,
      offsetY: from.y - to.y,
      moving: true,
      progress: 0,
    });
  }

  /** 推进所有由世界时钟驱动的视觉状态；返回 true 表示本 Tick 刚结束 motion。 */
  update(time: EngineTick, easing: MotionEasing): boolean {
    this.time = time;
    this.camera.update(time);
    return this.advanceMotion(time, easing);
  }

  clear(): void {
    this.motion = null;
    this.entityRuntime.clear();
  }

  /** 只组装当前视觉快照，不推进任何时间。 */
  scene(world: World): RenderScene {
    const playerRuntime = this.entityRuntime.get(world.playerId);
    this.camera.follow(
      {
        x: world.player.x + (playerRuntime?.offsetX ?? 0),
        y: world.player.y + (playerRuntime?.offsetY ?? 0),
      },
      world.width,
      world.height,
    );
    return buildVisualScene(world, this.visuals, this.entityRuntime, this.time);
  }

  private advanceMotion(time: EngineTick, easing: MotionEasing): boolean {
    const motion = this.motion;
    if (!motion) return false;
    const elapsedMs = Math.max(0, time.tick - motion.startedTick) * time.stepMs;
    const rawProgress = Math.min(1, elapsedMs / motion.duration);
    const progress = applyMotionEasing(rawProgress, easing);
    this.setEntityState(motion.entityId, {
      offsetX: (motion.from.x - motion.to.x) * (1 - progress),
      offsetY: (motion.from.y - motion.to.y) * (1 - progress),
      moving: true,
      progress,
    });
    if (rawProgress < 1) return false;
    this.clearEntityState(motion.entityId);
    this.motion = null;
    return true;
  }
}
