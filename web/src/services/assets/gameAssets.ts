export function siteUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

export function publicBaseUrl(): string {
  return import.meta.env.VITE_PUBLIC_BASE_URL || new URL(".", document.baseURI).href;
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
