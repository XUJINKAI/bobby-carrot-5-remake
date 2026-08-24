import {
  Game,
  InputController,
  type GameOptions,
  type InputControllerOptions,
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
  gameOptions: Omit<GameOptions, "canvas">;
  inputOptions?: InputControllerOptions;
}

/**
 * Web-owned adapter around the Engine lifecycle.
 *
 * Pages decide what level/profile/session rules mean. This module only owns the
 * repeated browser plumbing around Game + InputController + mobile controls.
 */
export async function createGameSession(
  options: CreateGameSessionOptions,
): Promise<GameSession> {
  const game = new Game({ canvas: options.canvas, ...options.gameOptions });
  const input = new InputController(game, options.inputOptions);
  bindMobileControls(options.root, input);
  let disposeDialog = (): void => {};
  try {
    await game.loadLevel(options.level);
    disposeDialog = bindWorldDialog(options.root, game);
  } catch (error) {
    input.destroy();
    game.destroy();
    throw error;
  }
  return {
    game,
    input,
    destroy(): void {
      disposeDialog();
      input.destroy();
      game.destroy();
    },
  };
}

function bindMobileControls(root: ParentNode, input: InputController): void {
  root.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
    const direction = button.dataset.move as "up" | "down" | "left" | "right";
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      input.setHeldDirection(direction);
    });
    const release = (event: PointerEvent): void => {
      event.preventDefault();
      input.setHeldDirection(null);
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", () =>
      input.setHeldDirection(null),
    );
  });
}

/** Web 只负责展示通用 dialog 事件；不知道事件来自 Sandman、Adventure 还是 Maker。 */
function bindWorldDialog(root: ParentNode, game: Game): () => void {
  if (!(root instanceof HTMLElement)) return () => {};
  const dialog = document.createElement("dialog");
  dialog.className = "game-dialog engine-dialog";
  dialog.setAttribute("aria-label", "对象对白");
  dialog.innerHTML = `<header><strong>对话</strong><button class="dialog-close icon-btn" type="button" aria-label="关闭">×</button></header><div class="engine-dialog-text" aria-live="polite"></div>`;
  const text = dialog.querySelector<HTMLElement>(".engine-dialog-text");
  const close = dialog.querySelector<HTMLButtonElement>(".dialog-close");
  if (!text || !close) throw new Error("Web dialog failed to mount");
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  root.append(dialog);
  const unsubscribe = game.onWorldEvent((event) => {
    if (event.type !== "dialog") return;
    text.textContent = event.text ?? "...";
    if (!dialog.open) dialog.showModal();
  });
  return () => {
    unsubscribe();
    dialog.remove();
  };
}
