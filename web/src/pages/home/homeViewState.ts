import { webT } from "../../i18n/webI18n.js";
import type { HomeViewState } from "./types.js";

/** 预渲染与浏览器接管共用初始状态，游戏启动后再更新剩余目标。 */
export function createHomeViewState(): HomeViewState {
  return {
    demoStatus: webT("home.demoMove"),
    demoResult: null,
    deathReason: "",
    importFeedback: "",
    screenControlEnabled: true,
  };
}
