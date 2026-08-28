import type { LevelMap } from "@bobby/model";

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
  return parseLevelMap(jsonText);
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

function parseLevelMap(jsonText: string): LevelMap {
  let value: unknown;
  try {
    value = JSON.parse(jsonText);
  } catch (cause) {
    throw new Error("BC5R1 payload does not contain valid JSON", { cause });
  }
  if (!value || typeof value !== "object")
    throw new Error("BC5R map must be an object");
  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== 1)
    throw new Error("BC5R map schemaVersion must be 1");
  if (!Number.isInteger(candidate.width) || Number(candidate.width) <= 0)
    throw new Error("BC5R map width must be a positive integer");
  if (!Number.isInteger(candidate.height) || Number(candidate.height) <= 0)
    throw new Error("BC5R map height must be a positive integer");
  if (!Array.isArray(candidate.entities))
    throw new Error("BC5R map entities must be an array");
  return value as LevelMap;
}
