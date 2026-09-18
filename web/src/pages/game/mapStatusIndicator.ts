import type { MapMeta } from "../../services/catalog/catalog.js";
import type {
  ShellIndicator,
  ShellIndicatorDetail,
} from "../../shell/shellBridge.js";
import type { GamePageMode } from "./gamePageCapabilities.js";
import { webT } from "../../i18n/webI18n.js";

export function mapStatusIndicator(
  mode: GamePageMode,
  verified: boolean,
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
      text: mapVerificationText(mode, verified),
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
    tone: verified ? "success" : "muted",
    label: webT("game.map.status", {
      details: details.map((detail) => `${detail.label} ${detail.text}`).join(" · "),
    }),
    details,
  };
}

export function mapVerificationText(
  mode: GamePageMode,
  verified: boolean,
): string {
  if (mode === "explore") {
    return verified ? webT("game.map.verified") : webT("game.map.unverified");
  }
  return verified
    ? webT("game.map.verifiedExplore")
    : webT("game.map.unverified");
}

function normalizedMetadataText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
