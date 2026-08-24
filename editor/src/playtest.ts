import {
  Game,
  InputController,
  NullAudioBackend,
  type AudioBackend,
} from "@bobby/engine";
import { toLevelMap, type EditorLevel } from "./level.js";

export interface EditorPlayTestAssets {
  atlasUrl: string;
  animationAtlasUrl?: string;
  bobbyUrls: { left: string; right: string; up: string; down: string };
  mowerBobbyUrl?: string;
  kiteUrl?: string;
  sourceTileSize: number;
}

export interface EditorPlayTestOptions {
  canvas: HTMLCanvasElement;
  level: EditorLevel;
  assets: EditorPlayTestAssets;
  audio?: AudioBackend;
  onStatus(text: string): void;
}

/** Owns the temporary Engine instance used by Editor Play Test. */
export class EditorPlayTest {
  private game: Game | null = null;
  private input: InputController | null = null;

  async start(options: EditorPlayTestOptions): Promise<void> {
    this.stop();
    const assets = options.assets;
    const game = new Game({
      canvas: options.canvas,
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
    });
    const input = new InputController(game);
    this.game = game;
    this.input = input;
    try {
      await game.loadLevel(toLevelMap(options.level));
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
    this.input?.destroy();
    this.input = null;
    this.game?.destroy();
    this.game = null;
  }
}
