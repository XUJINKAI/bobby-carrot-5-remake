import { Camera } from "../render/Camera.js";
import type { RenderScene } from "../render/RenderScene.js";
import type { World } from "../world/World.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import { buildVisualScene } from "./VisualSceneBuilder.js";
import type { EntityVisualRuntimeState } from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";

/** World 与 Renderer 之间唯一有业务感知的视觉运行时。 */
export class VisualRuntime {
  readonly camera: Camera;
  private readonly entityRuntime = new Map<EntityId, EntityVisualRuntimeState>();

  constructor(
    private readonly visuals: VisualRegistry,
    sourceTileSize = 48,
  ) {
    this.camera = new Camera(sourceTileSize);
  }

  setEntityState(entityId: EntityId, state: EntityVisualRuntimeState): void {
    this.entityRuntime.set(entityId, { ...state });
  }

  clearEntityState(entityId: EntityId): void {
    this.entityRuntime.delete(entityId);
  }

  clear(): void {
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
