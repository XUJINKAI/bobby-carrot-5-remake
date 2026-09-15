import {
  createGameplayRuntime,
  GameplayDialogView,
  type Game,
  type InputController,
  type GameplayDialogViewOptions,
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
  dialogView: GameplayDialogView | null;
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

export interface GameSessionRuntimeConfig extends GameplayRuntimeConfig {
  dialog?: boolean | GameplayDialogViewOptions;
}

export interface GameSessionInteractionContext {
  request: ObjectInteractionEvent;
  game: Game;
  dialogView: GameplayDialogView | null;
}

export type GameSessionInteractionHandler = (
  context: GameSessionInteractionContext,
) => void | Promise<void>;

/** 页面决定关卡与 session 语义；Engine runtime 持有地图内 HUD、Dialog 与输入生命周期。 */
export async function createGameSession(
  options: CreateGameSessionOptions,
): Promise<GameSession> {
  const { dialog: dialogOptions, ...gameRuntime } = options.runtime ?? {};
  const runtime = await createGameplayRuntime({
    canvas: options.canvas,
    level: options.level,
    ...options.gameOptions,
    ...(options.runtime ? { runtime: gameRuntime } : {}),
  });
  setShellRuntimeWarnings(runtime.warnings.map((warning) => warning.message));
  const { game, input } = runtime;
  const dialogView = dialogOptions === false
    ? null
    : new GameplayDialogView(
        options.canvas,
        dialogOptions === true || dialogOptions === undefined
          ? {}
          : dialogOptions,
      );
  const gates = new GameplayGateManager(game, input);
  let interactionChain = Promise.resolve();
  const unsubscribeInteraction = game.onInteractionRequest((request) => {
    const lease = gates.acquire("blocking-interaction");
    interactionChain = interactionChain
      .then(async () => {
        if (request.text && dialogView) await dialogView.show(request.text);
        await options.interaction?.({ request, game, dialogView });
      })
      .catch((error: unknown) => {
        console.error("Gameplay interaction failed", error);
      })
      .finally(() => lease.release());
  });
  return {
    game,
    input,
    dialogView,
    gates,
    destroy(): void {
      unsubscribeInteraction();
      gates.destroy();
      dialogView?.destroy();
      setShellRuntimeWarnings([]);
      runtime.destroy();
    },
  };
}
