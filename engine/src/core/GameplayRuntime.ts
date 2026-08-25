import type { LevelMap } from "@bobby/model";
import { Game, type GameOptions, type GameRuntimeOptions } from "./Game.js";
import { InputController } from "../input/InputController.js";

export type GameplayRuntimeConfig = GameRuntimeOptions;

export interface CreateGameplayRuntimeOptions
  extends Omit<GameOptions, "runtime"> {
  level: LevelMap;
  runtime?: GameplayRuntimeConfig;
}

export interface GameplayRuntime {
  game: Game;
  input: InputController;
  destroy(): void;
}

/** 用一份 LevelMap 和少量配置创建可独立游玩的 Engine runtime。 */
export async function createGameplayRuntime(
  options: CreateGameplayRuntimeOptions,
): Promise<GameplayRuntime> {
  const { level, runtime, ...gameOptions } = options;
  const game = new Game({
    ...gameOptions,
    ...(runtime ? { runtime } : {}),
  });
  const input = game.inputController ?? new InputController(game);
  const inputOwnedByGame = game.inputController === input;
  try {
    await game.loadLevel(level);
  } catch (error) {
    if (!inputOwnedByGame) input.destroy();
    game.destroy();
    throw error;
  }
  return {
    game,
    input,
    destroy(): void {
      if (!inputOwnedByGame) input.destroy();
      game.destroy();
    },
  };
}
