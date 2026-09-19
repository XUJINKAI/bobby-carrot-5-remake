export function normalizeAppBaseUrl(value: string): URL {
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url;
}

export function buildImportUrl(publicBaseUrl: string, payload: string): string {
  const url = new URL("import/v1", normalizeAppBaseUrl(publicBaseUrl));
  url.hash = payload;
  return url.toString();
}

export function extractImportPayload(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const pathname = url.pathname.replace(/\/+$/, "");
    if (!pathname.endsWith("/import/v1") || !url.hash) return null;
    return url.hash.slice(1);
  } catch {
    return null;
  }
}
