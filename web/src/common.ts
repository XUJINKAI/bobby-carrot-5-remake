export type Navigate = (path: string) => void;

export interface PageController {
  destroy(): void;
}

export const NOOP_CONTROLLER: PageController = {
  destroy() {},
};

export function siteUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  };

  return value.replace(/[&<>\"]/g, (char) => entities[char] ?? char);
}

export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function gameAssets() {
  return {
    atlasUrl: siteUrl("assets/art/hd/ts.png"),
    animationAtlasUrl: siteUrl("assets/art/hd/ta.png"),
    bobbyUrls: {
      left: siteUrl("assets/art/hd/b0.png"),
      right: siteUrl("assets/art/hd/b1.png"),
      up: siteUrl("assets/art/hd/b2.png"),
      down: siteUrl("assets/art/hd/b3.png"),
    },
    mowerBobbyUrl: siteUrl("assets/art/hd/b7.png"),
    idleBobbyUrl: siteUrl("assets/art/hd/b4.png"),
    deathBobbyUrl: siteUrl("assets/art/hd/b5.png"),
    kiteUrl: siteUrl("assets/art/hd/b9.png"),
    sourceTileSize: 48,
  };
}
