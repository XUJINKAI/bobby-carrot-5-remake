import type { MusicStyle } from "@bobby/engine";
import type { WebTheme } from "../../theme/webTheme.js";

export type MusicMode = "follow-theme" | MusicStyle;

export function resolveMusicStyle(theme: WebTheme, mode: MusicMode): MusicStyle {
  if (mode === "modern" || mode === "8bit") return mode;
  return theme === "fc" ? "8bit" : "modern";
}

export function resolveMusicMode(value: string | null | undefined): MusicMode {
  if (value === "modern" || value === "8bit") return value;
  return "follow-theme";
}

export function resolveVolume(value: string | null | undefined): number {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(200, Math.max(0, parsed));
}
