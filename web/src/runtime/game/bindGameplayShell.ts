import type { GameSession } from "./createGameSession.js";

export interface GameplayShellBindingOptions {
  initialScreenControlEnabled: boolean;
  onScreenControlChange?(enabled: boolean): void;
}

/** 连接 App Shell 的通用 gameplay 控件与 session 门禁。 */
export function bindGameplayShell(
  session: Pick<GameSession, "input" | "gates">,
  options: GameplayShellBindingOptions,
): () => void {
  let screenControlEnabled = options.initialScreenControlEnabled;
  let shellDialogLease: ReturnType<GameSession["gates"]["acquire"]> | null =
    null;

  const updateScreenControl = (): void => {
    session.input.setScreenJoystickEnabled(screenControlEnabled);
  };
  const onScreenControlChange = (event: Event): void => {
    screenControlEnabled = Boolean(
      (event as CustomEvent<{ enabled: boolean }>).detail.enabled,
    );
    updateScreenControl();
    options.onScreenControlChange?.(screenControlEnabled);
  };
  const onDialogOpen = (): void => {
    shellDialogLease ??= session.gates.acquire("shell-dialog");
  };
  const onDialogClose = (): void => {
    shellDialogLease?.release();
    shellDialogLease = null;
  };

  updateScreenControl();
  window.addEventListener("screen-control-change", onScreenControlChange);
  window.addEventListener("shell-dialog-open", onDialogOpen);
  window.addEventListener("shell-dialog-close", onDialogClose);

  return () => {
    shellDialogLease?.release();
    shellDialogLease = null;
    window.removeEventListener("screen-control-change", onScreenControlChange);
    window.removeEventListener("shell-dialog-open", onDialogOpen);
    window.removeEventListener("shell-dialog-close", onDialogClose);
  };
}
