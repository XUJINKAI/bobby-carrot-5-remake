import {
  EXCHANGE_ERROR_CODES,
  ExchangeError,
} from "./errors.js";
import { buildImportUrl, extractImportPayload } from "./url.js";

const PREFIX = "BC5R1:";

export type ExchangeFormat = "json" | "bc5r1" | "unknown";

export interface DecodedExchangeData {
  value: unknown;
  format: Exclude<ExchangeFormat, "unknown">;
  jsonText: string;
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text))
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidBase64Url);
  const standard = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch (cause) {
    throw new ExchangeError(
      EXCHANGE_ERROR_CODES.invalidBase64Url,
      { cause },
    );
  }
}

export async function gzipText(text: string): Promise<Uint8Array> {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function gunzipText(value: Uint8Array): Promise<string> {
  try {
    const stream = new Blob([Uint8Array.from(value).buffer])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch (cause) {
    throw new ExchangeError(EXCHANGE_ERROR_CODES.damagedGzip, { cause });
  }
}

export async function encodeBc5rV1(jsonText: string): Promise<string> {
  return encodeBase64Url(await gzipText(jsonText));
}

export async function decodeBc5rV1(payload: string): Promise<string> {
  return gunzipText(decodeBase64Url(payload));
}

/** `/import/v1#` 已经确定 transport，这里只接受 fragment 中的 raw payload。 */
export async function decodeExchangePayload(
  payload: string,
): Promise<DecodedExchangeData> {
  const jsonText = await decodeBc5rV1(payload);
  return { value: parseJson(jsonText), format: "bc5r1", jsonText };
}

export async function encodeExchangeText(
  jsonText: string,
  options: { publicBaseUrl?: string } = {},
): Promise<string> {
  parseJson(jsonText);
  const payload = await encodeBc5rV1(jsonText);
  return options.publicBaseUrl
    ? buildImportUrl(options.publicBaseUrl, payload)
    : `${PREFIX}${payload}`;
}

export async function decodeExchangeText(
  text: string,
): Promise<DecodedExchangeData> {
  const source = text.trim();
  if (/^BC5R\d+:/.test(source) && !source.startsWith(PREFIX))
    throw new ExchangeError(EXCHANGE_ERROR_CODES.unsupportedVersion);
  const payload = source.startsWith(PREFIX)
    ? source.slice(PREFIX.length)
    : extractImportPayload(source);
  if (payload !== null) return decodeExchangePayload(payload);
  if (!source.startsWith("{") && !source.startsWith("["))
    throw new ExchangeError(EXCHANGE_ERROR_CODES.unknownRepresentation);
  return { value: parseJson(source), format: "json", jsonText: source };
}

export function detectExchangeFormat(text: string): ExchangeFormat {
  const source = text.trim();
  if (source.startsWith(PREFIX) || extractImportPayload(source)) return "bc5r1";
  try {
    JSON.parse(source);
    return "json";
  } catch {
    return "unknown";
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidJson, { cause });
  }
}
