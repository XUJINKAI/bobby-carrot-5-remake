import type { LevelMap } from "@bobby/model";
import type { AudioBackend } from "../audio/AudioBackend.js";
import {
  AudioRuntime,
  type AudioRuntimeOptions,
} from "../audio/AudioRuntime.js";
import { builtinEngineEnvironment } from "../environment/EngineEnvironment.js";
import { InputController } from "../input/InputController.js";
import { Game } from "./Game.js";
import type { GameOptions, GameRuntimeOptions } from "./GameOptions.js";
import {
  validateLevelPlayability,
  type LevelRuntimeWarning,
} from "./LevelWarnings.js";

export type GameplayRuntimeConfig = GameRuntimeOptions;

export interface CreateGameplayRuntimeOptions
  extends Omit<GameOptions, "runtime" | "audio"> {
  level: LevelMap;
  audio?: AudioBackend;
  audioOptions?: AudioRuntimeOptions;
  runtime?: GameplayRuntimeConfig;
}

export interface GameplayRuntime {
  game: Game;
  input: InputController;
  audio: AudioBackend;
  warnings: readonly LevelRuntimeWarning[];
  destroy(): void;
}

/** 用一份 LevelMap 和少量配置创建可独立游玩的 Engine runtime。 */
export async function createGameplayRuntime(
  options: CreateGameplayRuntimeOptions,
): Promise<GameplayRuntime> {
  const {
    level,
    runtime,
    audio: suppliedAudio,
    audioOptions,
    ...gameOptions
  } = options;
  const environment = gameOptions.environment ?? builtinEngineEnvironment;
  const warnings = validateLevelPlayability(level, environment);
  const ownedAudio = suppliedAudio ? null : new AudioRuntime(audioOptions);
  const audio = suppliedAudio ?? ownedAudio!;
  const game = new Game({
    ...gameOptions,
    environment,
    audio,
    ...(runtime ? { runtime } : {}),
  });
  const input = game.inputController ?? new InputController(game);
  const inputOwnedByGame = game.inputController === input;
  try {
    await game.loadLevel(level);
  } catch (error) {
    if (!inputOwnedByGame) input.destroy();
    game.destroy();
    ownedAudio?.destroy();
    throw error;
  }
  return {
    game,
    input,
    audio,
    warnings,
    destroy(): void {
      if (!inputOwnedByGame) input.destroy();
      game.destroy();
      ownedAudio?.destroy();
    },
  };
}
