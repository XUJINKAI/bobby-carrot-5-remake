import type { VisualAssetSources } from "@bobby/engine";

export function siteUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

export function publicBaseUrl(): string {
  return import.meta.env.VITE_PUBLIC_BASE_URL || new URL(".", document.baseURI).href;
}

export function gameAssets(): VisualAssetSources {
  return {
    atlasUrl: siteUrl("assets/art/hd/ts.png"),
    imageUrls: {
      "original-animated-tiles": siteUrl("assets/art/hd/ta.png"),
      "bobby-left": siteUrl("assets/art/hd/b0.png"),
      "bobby-right": siteUrl("assets/art/hd/b1.png"),
      "bobby-up": siteUrl("assets/art/hd/b2.png"),
      "bobby-down": siteUrl("assets/art/hd/b3.png"),
      "bobby-idle": siteUrl("assets/art/hd/b4.png"),
      "bobby-death": siteUrl("assets/art/hd/b5.png"),
      "bobby-mower": siteUrl("assets/art/hd/b7.png"),
      "bobby-kite": siteUrl("assets/art/hd/b9.png"),
    },
    sourceTileSize: 48,
  };
}
