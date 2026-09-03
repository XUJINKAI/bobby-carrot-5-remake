import {
  createGameplayRuntime,
  type Game,
  type InputController,
  type GameOptions,
  type GameplayRuntimeConfig,
  type LevelMap,
} from "@bobby/engine";
import { setShellRuntimeWarnings } from "../../shell/shellBridge.js";

export interface GameSession {
  game: Game;
  input: InputController;
  destroy(): void;
}

export interface CreateGameSessionOptions {
  canvas: HTMLCanvasElement;
  level: LevelMap;
  gameOptions: Omit<GameOptions, "canvas" | "runtime">;
  runtime?: GameplayRuntimeConfig;
}

/** 页面决定关卡与 session 语义；Engine runtime 持有地图内 HUD、Dialog 与输入生命周期。 */
export async function createGameSession(
  options: CreateGameSessionOptions,
): Promise<GameSession> {
  const runtime = await createGameplayRuntime({
    canvas: options.canvas,
    level: options.level,
    ...options.gameOptions,
    ...(options.runtime ? { runtime: options.runtime } : {}),
  });
  setShellRuntimeWarnings(runtime.warnings.map((warning) => warning.message));
  const { game, input } = runtime;
  return {
    game,
    input,
    destroy(): void {
      setShellRuntimeWarnings([]);
      runtime.destroy();
    },
  };
}
