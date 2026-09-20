import type { MapMeta } from "../../services/catalog/catalog.js";
import type {
  ShellIndicator,
  ShellIndicatorDetail,
} from "../../shell/shellBridge.js";
import type { GamePageMode } from "./gamePageCapabilities.js";
import { webT } from "../../i18n/webI18n.js";

export type MapVerificationStatus =
  | "verified"
  | "verified-explore"
  | "unverified"
  | "editor-draft";

export function mapStatusIndicator(
  verification: MapVerificationStatus,
  mapId: string,
  mapName: string,
  meta?: MapMeta,
): ShellIndicator {
  const author = normalizedMetadataText(meta?.author);
  const note = normalizedMetadataText(meta?.note);
  const details: ShellIndicatorDetail[] = [
    {
      id: "verification",
      label: webT("game.map.verification"),
      text: mapVerificationText(verification),
    },
    {
      id: "map-id",
      label: webT("game.map.id"),
      text: mapId,
    },
    {
      id: "map-name",
      label: webT("game.map.name"),
      text: mapName,
    },
    ...(author
      ? [{ id: "author", label: webT("game.map.author"), text: author }]
      : []),
    ...(note
      ? [{ id: "note", label: webT("game.map.note"), text: note, kind: "note" as const }]
      : []),
  ];
  return {
    id: "map-status",
    icon: author || note ? "map-details" : "map-status",
    tone: verification === "verified" || verification === "verified-explore"
      ? "success"
      : "muted",
    label: webT("game.map.status", {
      details: details.map((detail) => `${detail.label} ${detail.text}`).join(" · "),
    }),
    details,
  };
}

export function mapVerificationText(
  verification: MapVerificationStatus,
): string {
  if (verification === "verified") return webT("game.map.verified");
  if (verification === "verified-explore")
    return webT("game.map.verifiedExplore");
  if (verification === "editor-draft") return webT("game.map.editorDraft");
  return webT("game.map.unverified");
}

export function gameMapVerificationStatus(
  mode: GamePageMode,
  verified: boolean,
): MapVerificationStatus {
  if (!verified) return "unverified";
  return mode === "explore" ? "verified" : "verified-explore";
}

function normalizedMetadataText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
