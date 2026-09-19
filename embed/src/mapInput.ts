import {
  decodeExchangeText,
  parseExchangeMap,
} from "@bobby/exchange";
import type { LevelMap } from "@bobby/model";

export type EmbedMapInputErrorReason =
  | "missing-map"
  | "multiple-inputs"
  | "request-failed";

export class EmbedMapInputError extends Error {
  constructor(
    public readonly reason: EmbedMapInputErrorReason,
    public readonly status?: number,
    options: ErrorOptions = {},
  ) {
    super(`embed-map-input.${reason}`, options);
    this.name = "EmbedMapInputError";
  }
}

export async function loadEmbedMap(options: {
  map?: string | undefined;
  mapUrl?: string | undefined;
}): Promise<LevelMap> {
  const hasMap = options.map !== undefined;
  const hasMapUrl = options.mapUrl !== undefined;
  if (hasMap && hasMapUrl)
    throw new EmbedMapInputError("multiple-inputs");
  if (!hasMap && !hasMapUrl)
    throw new EmbedMapInputError("missing-map");

  const source = hasMap
    ? options.map!.trim()
    : await fetchMapText(options.mapUrl!.trim());
  if (!source) throw new EmbedMapInputError("missing-map");

  const decoded = await decodeExchangeText(source);
  return parseExchangeMap(decoded.value);
}

async function fetchMapText(url: string): Promise<string> {
  if (!url) throw new EmbedMapInputError("missing-map");
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new EmbedMapInputError("request-failed", undefined, { cause });
  }
  if (!response.ok)
    throw new EmbedMapInputError("request-failed", response.status);
  return response.text();
}
