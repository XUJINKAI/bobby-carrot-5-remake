import {
  createGameplayRuntime,
  type Game,
  type InputController,
  type GameOptions,
  type GameplayRuntimeConfig,
  type LevelMap,
} from "@bobby/engine";

export interface GameSession {
  game: Game;
  input: InputController;
  destroy(): void;
}

export interface CreateGameSessionOptions {
  root: ParentNode;
  canvas: HTMLCanvasElement;
  level: LevelMap;
  gameOptions: Omit<GameOptions, "canvas" | "runtime">;
  runtime?: GameplayRuntimeConfig;
}

/** 页面决定关卡与 session 语义；Engine runtime 持有地图内 HUD、Dialog 与输入生命周期。 */
export async function createGameSession(
  options: CreateGameSessionOptions,
): Promise<GameSession> {
  void options.root;
  const runtime = await createGameplayRuntime({
    canvas: options.canvas,
    level: options.level,
    ...options.gameOptions,
    ...(options.runtime ? { runtime: options.runtime } : {}),
  });
  const { game, input } = runtime;
  return {
    game,
    input,
    destroy(): void {
      runtime.destroy();
    },
  };
}
