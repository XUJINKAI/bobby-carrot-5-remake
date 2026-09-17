import type { MapMeta } from "../../services/catalog/catalog.js";
import type {
  ShellIndicator,
  ShellIndicatorDetail,
} from "../../shell/shellBridge.js";
import type { GamePageMode } from "./gamePageCapabilities.js";

export function mapStatusIndicator(
  mode: GamePageMode,
  verified: boolean,
  meta?: MapMeta,
): ShellIndicator {
  const author = normalizedMetadataText(meta?.author);
  const note = normalizedMetadataText(meta?.note);
  const details: ShellIndicatorDetail[] = [
    {
      id: "verification",
      label: "通关验证",
      text: mapVerificationText(mode, verified),
    },
    ...(author
      ? [{ id: "author", label: "作者", text: author }]
      : []),
    ...(note
      ? [{ id: "note", label: "注记", text: note, kind: "note" as const }]
      : []),
  ];
  return {
    id: "map-status",
    icon: author || note ? "map-details" : "map-status",
    tone: verified ? "success" : "muted",
    label: `地图状态：${details
      .map((detail) => `${detail.label} ${detail.text}`)
      .join("；")}`,
    details,
  };
}

export function mapVerificationText(
  mode: GamePageMode,
  verified: boolean,
): string {
  if (mode === "explore") {
    return verified ? "已验证可通关" : "尚未进行通关验证";
  }
  return verified
    ? "已在自由探索模式中验证可通关"
    : "尚未进行通关验证";
}

function normalizedMetadataText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
