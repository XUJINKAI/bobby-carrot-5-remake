import type { MusicStyle } from "@bobby/engine";
import type { MusicMode } from "../../storage/contracts.js";
import type { WebTheme } from "../../theme/webTheme.js";

export type { MusicMode } from "../../storage/contracts.js";

export function resolveMusicStyle(theme: WebTheme, mode: MusicMode): MusicStyle {
  if (mode === "modern" || mode === "8bit") return mode;
  return theme === "fc" ? "8bit" : "modern";
}
