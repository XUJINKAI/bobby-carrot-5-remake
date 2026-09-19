const jerseyFontFamily = "BC5R Jersey 10";
const jerseyFontPath =
  "assets/ui/fonts/jersey-10/Jersey10-Regular.woff2";

export const embedPublicBaseUrl =
  typeof document === "undefined"
    ? new URL("http://localhost/")
    : document.currentScript instanceof HTMLScriptElement && document.currentScript.src
      ? new URL("../../", document.currentScript.src)
      : new URL(".", document.baseURI);

let jerseyFontReady: Promise<void> | null = null;

export function embedAssetUrl(path: string): URL {
  return new URL(path.replace(/^\/+/, ""), embedPublicBaseUrl);
}

/**
 * Shadow DOM 中的 @font-face 不会稳定注册到 Document FontFaceSet。
 * Embed 必须显式注册字体，确保第三方宿主页无需预先加载 Web 全局样式。
 */
export function loadEmbedJerseyFont(): Promise<void> {
  if (
    typeof document === "undefined" ||
    typeof FontFace === "undefined" ||
    !document.fonts
  )
    return Promise.resolve();
  if (jerseyFontReady) return jerseyFontReady;

  const face = new FontFace(
    jerseyFontFamily,
    `url(${JSON.stringify(embedAssetUrl(jerseyFontPath).href)}) format("woff2")`,
    {
      style: "normal",
      weight: "400",
      display: "swap",
    },
  );
  document.fonts.add(face);
  jerseyFontReady = face.load()
    .then(() => undefined)
    .catch((error: unknown) => {
      document.fonts.delete(face);
      jerseyFontReady = null;
      throw error;
    });
  return jerseyFontReady;
}
