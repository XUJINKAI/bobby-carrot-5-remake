import { REPLAY_PANEL_SESSION_STORAGE_KEY } from "../../storage/contracts.js";

type ReplayPanelStorage = Pick<Storage, "getItem" | "setItem">;

/** Replay 面板属于当前浏览器标签页的工作状态，刷新与地图导航共用。 */
export function loadReplayPanelOpen(
  storage: ReplayPanelStorage = sessionStorage,
): boolean {
  return storage.getItem(REPLAY_PANEL_SESSION_STORAGE_KEY) === "true";
}

export function storeReplayPanelOpen(
  open: boolean,
  storage: ReplayPanelStorage = sessionStorage,
): void {
  storage.setItem(REPLAY_PANEL_SESSION_STORAGE_KEY, String(open));
}
