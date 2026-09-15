import {
  createGameplayRuntime,
  type GameplayDialogController,
  type Game,
  type InputController,
  type GameOptions,
  type GameplayRuntimeConfig,
  type LevelMap,
  type ObjectInteractionEvent,
} from "@bobby/engine";
import { setShellRuntimeWarnings } from "../../shell/shellBridge.js";
import { GameplayGateManager } from "./GameplayGateManager.js";

export interface GameSession {
  game: Game;
  input: InputController;
  dialog: GameplayDialogController | null;
  gates: GameplayGateManager;
  destroy(): void;
}

export interface CreateGameSessionOptions {
  canvas: HTMLCanvasElement;
  level: LevelMap;
  gameOptions: Omit<GameOptions, "canvas" | "runtime">;
  runtime?: GameSessionRuntimeConfig;
  interaction?: GameSessionInteractionHandler;
}

export type GameSessionRuntimeConfig = GameplayRuntimeConfig;

export interface GameSessionInteractionContext {
  request: ObjectInteractionEvent;
  game: Game;
  dialog: GameplayDialogController | null;
}

export type GameSessionInteractionHandler = (
  context: GameSessionInteractionContext,
) => void | Promise<void>;

/** Web Session 组合 Engine runtime 与仅针对外部业务交互的页面级门禁。 */
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
  const { game, input, dialog } = runtime;
  const gates = new GameplayGateManager(game, input);
  let interactionChain = Promise.resolve();
  const unsubscribeInteraction = game.onInteractionRequest((request) => {
    const lease = gates.acquire("blocking-interaction");
    interactionChain = interactionChain
      .then(async () => {
        await options.interaction?.({ request, game, dialog });
      })
      .catch((error: unknown) => {
        console.error("Gameplay interaction failed", error);
      })
      .finally(() => lease.release());
  });
  return {
    game,
    input,
    dialog,
    gates,
    destroy(): void {
      unsubscribeInteraction();
      gates.destroy();
      setShellRuntimeWarnings([]);
      runtime.destroy();
    },
  };
}
