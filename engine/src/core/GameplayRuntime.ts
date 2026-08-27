import type { LevelMap } from "@bobby/model";
import {
  AudioRuntime,
  type AudioRuntimeOptions,
} from "../audio/AudioRuntime.js";
import { InputController } from "../input/InputController.js";
import { Game, type GameOptions, type GameRuntimeOptions } from "./Game.js";

export type GameplayRuntimeConfig = GameRuntimeOptions;

export interface CreateGameplayRuntimeOptions
  extends Omit<GameOptions, "runtime" | "audio"> {
  level: LevelMap;
  audio?: AudioRuntime;
  audioOptions?: AudioRuntimeOptions;
  runtime?: GameplayRuntimeConfig;
}

export interface GameplayRuntime {
  game: Game;
  input: InputController;
  audio: AudioRuntime;
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
  const audio = suppliedAudio ?? new AudioRuntime(audioOptions);
  const audioOwnedByRuntime = suppliedAudio === undefined;
  const game = new Game({
    ...gameOptions,
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
    if (audioOwnedByRuntime) audio.destroy();
    throw error;
  }
  return {
    game,
    input,
    audio,
    destroy(): void {
      if (!inputOwnedByGame) input.destroy();
      game.destroy();
      if (audioOwnedByRuntime) audio.destroy();
    },
  };
}
