import {
  createGameplayRuntime,
  NullAudioBackend,
  type AudioBackend,
  type GameplayRuntime,
} from "@bobby/engine";
import { toLevelMap, type EditorLevel } from "./level.js";

export interface EditorPlayTestAssets {
  atlasUrl: string;
  animationAtlasUrl?: string;
  bobbyUrls: { left: string; right: string; up: string; down: string };
  mowerBobbyUrl?: string;
  kiteUrl?: string;
  hudAtlasUrl?: string;
  goldenCarrotUrl?: string;
  sourceTileSize: number;
}

export interface EditorPlayTestOptions {
  canvas: HTMLCanvasElement;
  level: EditorLevel;
  assets: EditorPlayTestAssets;
  audio?: AudioBackend;
  screenJoystick?: boolean;
  onStatus(text: string): void;
}

/** 管理 Editor Play Test 使用的临时 Engine 实例。 */
export class EditorPlayTest {
  private runtime: GameplayRuntime | null = null;

  async start(options: EditorPlayTestOptions): Promise<void> {
    this.stop();
    const assets = options.assets;
    const runtime = await createGameplayRuntime({
      canvas: options.canvas,
      level: toLevelMap(options.level),
      audio: options.audio ?? new NullAudioBackend(),
      debug: false,
      assets: {
        atlasUrl: assets.atlasUrl,
        ...(assets.animationAtlasUrl
          ? { animationAtlasUrl: assets.animationAtlasUrl }
          : {}),
        bobbyUrls: assets.bobbyUrls,
        ...(assets.mowerBobbyUrl
          ? { mowerBobbyUrl: assets.mowerBobbyUrl }
          : {}),
        ...(assets.kiteUrl ? { kiteUrl: assets.kiteUrl } : {}),
        sourceTileSize: assets.sourceTileSize,
      },
      runtime: {
        hud: {
          ...(assets.hudAtlasUrl ? { hudAtlasUrl: assets.hudAtlasUrl } : {}),
          ...(assets.goldenCarrotUrl
            ? { goldenCarrotUrl: assets.goldenCarrotUrl }
            : {}),
        },
        input: {
          screenJoystick: {
            enabled: options.screenJoystick ?? false,
          },
        },
      },
    });
    const { game } = runtime;
    this.runtime = runtime;
    try {
      game.on("change", () => {
        if (!game.hasLevel) return;
        options.onStatus(
          `Play Test · (${game.world.player.x}, ${game.world.player.y}) · 目标 ${game.world.objectiveRemaining} · ${game.world.state.moves} 步`,
        );
      });
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop(): void {
    this.runtime?.destroy();
    this.runtime = null;
  }
}
