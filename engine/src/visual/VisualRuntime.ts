import { Camera } from "../render/Camera.js";
import type { RenderScene } from "../render/RenderScene.js";
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
  startedAt: number;
  duration: number;
}

/** World 与 Renderer 之间唯一有业务感知的视觉运行时。 */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();
  private motion: VisualMotion | null = null;

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
    startedAt: number,
  ): void {
    this.motion = {
      entityId,
      from: { ...from },
      to: { ...to },
      startedAt,
      duration,
    };
    this.setEntityState(entityId, {
      offsetX: from.x - to.x,
      offsetY: from.y - to.y,
      moving: true,
      progress: 0,
    });
  }

  /** 推进当前 motion；返回 true 表示本次调用刚刚结束了一段动画。 */
  advanceMotion(timestamp: number, easing: MotionEasing): boolean {
    const motion = this.motion;
    if (!motion) return false;
    const rawProgress = Math.min(
      1,
      Math.max(0, (timestamp - motion.startedAt) / motion.duration),
    );
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

  clear(): void {
    this.motion = null;
    this.entityRuntime.clear();
  }

  update(world: World): RenderScene {
    const playerRuntime = this.entityRuntime.get(world.playerId);
    this.camera.follow(
      {
        x: world.player.x + (playerRuntime?.offsetX ?? 0),
        y: world.player.y + (playerRuntime?.offsetY ?? 0),
      },
      world.width,
      world.height,
    );
    return buildVisualScene(world, this.visuals, this.entityRuntime);
  }
}
