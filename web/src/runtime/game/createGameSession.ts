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

/** 页面决定关卡与 session 语义；这里统一管理浏览器侧 Engine 生命周期和屏幕控件。 */
export async function createGameSession(
  options: CreateGameSessionOptions,
): Promise<GameSession> {
  const runtime = await createGameplayRuntime({
    canvas: options.canvas,
    level: options.level,
    ...options.gameOptions,
    ...(options.runtime ? { runtime: options.runtime } : {}),
  });
  const { game, input } = runtime;
  let disposeDialog = (): void => {};
  try {
    disposeDialog = bindWorldDialog(options.root, game);
  } catch (error) {
    runtime.destroy();
    throw error;
  }
  return {
    game,
    input,
    destroy(): void {
      disposeDialog();
      runtime.destroy();
    },
  };
}

/** Web 只负责展示通用 dialog 事件；消息内容已经由 Engine runtime 行为确定。 */
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
