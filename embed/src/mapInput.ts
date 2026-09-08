import { parseLevelMap, type LevelMap } from "@bobby/model";

const SHARE_PREFIX = "BC5R1:";
const IMPORT_MARKER = "v1#";

export async function loadEmbedMap(options: {
  map?: string | undefined;
  mapUrl?: string | undefined;
}): Promise<LevelMap> {
  const hasMap = options.map !== undefined;
  const hasMapUrl = options.mapUrl !== undefined;
  if (Number(hasMap) + Number(hasMapUrl) !== 1) {
    throw new Error("BC5R.mount() requires exactly one of map or mapUrl");
  }
  const source = hasMap ? options.map! : await fetchMapText(options.mapUrl!);
  const payload = extractSharePayload(source);
  const jsonText = await gunzipText(decodeBase64Url(payload));
  return parsePayloadLevelMap(jsonText);
}

export function extractSharePayload(value: string): string {
  const source = value.trim();
  const marker = source.indexOf(IMPORT_MARKER);
  const payload =
    marker >= 0
      ? source.slice(marker + IMPORT_MARKER.length)
      : source.startsWith(SHARE_PREFIX)
        ? source.slice(SHARE_PREFIX.length)
        : source;
  const normalized = payload.trim();
  if (!normalized) throw new Error("BC5R map payload is empty");
  return normalized;
}

async function fetchMapText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`BC5R map request failed: HTTP ${response.status}`);
  return response.text();
}

function decodeBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text))
    throw new Error("Invalid BC5R1 payload");
  const standard = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch (cause) {
    throw new Error("Invalid BC5R1 payload", { cause });
  }
}

async function gunzipText(value: Uint8Array): Promise<string> {
  try {
    const stream = new Blob([Uint8Array.from(value).buffer])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch (cause) {
    throw new Error("Damaged BC5R1 payload", { cause });
  }
}

function parsePayloadLevelMap(jsonText: string): LevelMap {
  let value: unknown;
  try {
    value = JSON.parse(jsonText);
  } catch (cause) {
    throw new Error("BC5R1 payload does not contain valid JSON", { cause });
  }
  return parseLevelMap(value);
}
