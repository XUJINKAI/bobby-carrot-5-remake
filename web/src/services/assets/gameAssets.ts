import { ImageManager } from "@bobby/engine";

export function siteUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

export function publicBaseUrl(): string {
  return import.meta.env.VITE_PUBLIC_BASE_URL || new URL(".", document.baseURI).href;
}

export function createImageManager(): ImageManager {
  return new ImageManager({
    atlas: "entity-atlas",
    sourceTileSize: 48,
    sources: {
      "entity-atlas": siteUrl("assets/art/hd/ts.png"),
      "original-animated-tiles": siteUrl("assets/art/hd/ta.png"),
      "original-title": siteUrl("assets/art/hd/title.png"),
      "original-train": siteUrl("assets/art/hd/train.png"),
      "original-misc": siteUrl("assets/art/hd/misc.png"),
      "bobby-left": siteUrl("assets/art/hd/b0.png"),
      "bobby-right": siteUrl("assets/art/hd/b1.png"),
      "bobby-up": siteUrl("assets/art/hd/b2.png"),
      "bobby-down": siteUrl("assets/art/hd/b3.png"),
      "bobby-idle": siteUrl("assets/art/hd/b4.png"),
      "bobby-death": siteUrl("assets/art/hd/b5.png"),
      "bobby-mower": siteUrl("assets/art/hd/b7.png"),
      "bobby-snowplow": siteUrl("assets/art/hd/b8.png"),
      "bobby-kite": siteUrl("assets/art/hd/b9.png"),
      "bobby-speed-trail": siteUrl("assets/art/hd/mow.png"),
      "hud-atlas": siteUrl("assets/art/hd/hud.png"),
      "golden-carrot": siteUrl("assets/art/hd/icon.png"),
    },
    slices: {
      "hud-carrot": { source: "hud-atlas", x: 42, y: 0, width: 39, height: 38 },
      "hud-gas": { source: "hud-atlas", x: 83, y: 0, width: 37, height: 38 },
      "hud-key": { source: "hud-atlas", x: 122, y: 0, width: 20, height: 38 },
      "hud-kite": { source: "hud-atlas", x: 144, y: 0, width: 35, height: 38 },
      "hud-shovel": { source: "hud-atlas", x: 179, y: 0, width: 37, height: 38 },
      "hud-egg": { source: "hud-atlas", x: 217, y: 0, width: 29, height: 38 },
      "hud-bean": { source: "hud-atlas", x: 247, y: 0, width: 35, height: 38 },
    },
  });
}
