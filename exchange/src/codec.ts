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
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidPayload);
  const standard = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch (cause) {
    throw new ExchangeError(
      EXCHANGE_ERROR_CODES.invalidPayload,
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
  return decodePayloadText(payload);
}

/** 解码裸 payload；内容可以是 Base64(JSON) 或 Base64(gzip(JSON))。 */
export async function decodeExchangePayload(
  payload: string,
): Promise<DecodedExchangeData> {
  const jsonText = await decodePayloadText(payload);
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
  if (source.startsWith("{") || source.startsWith("["))
    return { value: parseJson(source), format: "json", jsonText: source };
  if (!source)
    throw new ExchangeError(EXCHANGE_ERROR_CODES.unknownRepresentation);
  return decodeExchangePayload(source);
}

export function detectExchangeFormat(text: string): ExchangeFormat {
  const source = text.trim();
  if (source.startsWith(PREFIX) || extractImportPayload(source)) return "bc5r1";
  try {
    JSON.parse(source);
    return "json";
  } catch {
    return looksLikePayload(source) ? "bc5r1" : "unknown";
  }
}

async function decodePayloadText(payload: string): Promise<string> {
  const bytes = decodePayloadBase64(payload.trim());
  if (isGzip(bytes)) return gunzipText(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (cause) {
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidJson, { cause });
  }
}

function decodePayloadBase64(text: string): Uint8Array {
  const urlSafe = /^[A-Za-z0-9_-]+={0,2}$/.test(text);
  const standard = /^[A-Za-z0-9+/]+={0,2}$/.test(text);
  if ((!urlSafe && !standard) || text.length % 4 === 1)
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidPayload);
  const unpadded = text.replace(/=+$/, "");
  const normalized = unpadded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch (cause) {
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidPayload, { cause });
  }
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function looksLikePayload(source: string): boolean {
  if (!source) return false;
  try {
    const bytes = decodePayloadBase64(source);
    if (isGzip(bytes)) return true;
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return true;
  } catch {
    return false;
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new ExchangeError(EXCHANGE_ERROR_CODES.invalidJson, { cause });
  }
}
