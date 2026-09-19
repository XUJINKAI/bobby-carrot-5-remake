import {
  decodeExchangeText,
  parseExchangeMap,
} from "@bobby/exchange";
import type { LevelMap } from "@bobby/model";

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
  const decoded = await decodeExchangeText(source);
  return parseExchangeMap(decoded.value);
}

async function fetchMapText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`BC5R map request failed: HTTP ${response.status}`);
  return response.text();
}
