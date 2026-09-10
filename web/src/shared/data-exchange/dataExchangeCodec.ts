import { extractImportPayload, buildImportUrl } from "./dataExchangeUrl.js";
import { DataExchangeError, type DataExchangeFormat } from "./dataExchangeTypes.js";

const PREFIX = "BC5R1:";

export interface DecodedExchangeData {
  value: unknown;
  format: Exclude<DataExchangeFormat, "unknown">;
  jsonText: string;
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) {
    throw new DataExchangeError("invalid-base64url", "BC5R1 数据编码无效");
  }
  const standard = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch (cause) {
    throw new DataExchangeError("invalid-base64url", "BC5R1 数据编码无效", { cause });
  }
}

export async function gzipText(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function gunzipText(value: Uint8Array): Promise<string> {
  try {
    const stream = new Blob([Uint8Array.from(value).buffer])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch (cause) {
    throw new DataExchangeError("damaged-gzip", "BC5R1 压缩数据已损坏", { cause });
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

export async function decodeExchangeText(text: string): Promise<DecodedExchangeData> {
  const source = text.trim();
  if (/^BC5R\d+:/.test(source) && !source.startsWith(PREFIX)) {
    throw new DataExchangeError("unsupported-version", "不支持此 BC5R 数据版本");
  }
  const payload = source.startsWith(PREFIX)
    ? source.slice(PREFIX.length)
    : extractImportPayload(source);
  if (payload !== null) {
    return decodeExchangePayload(payload);
  }
  if (!source.startsWith("{") && !source.startsWith("[")) {
    throw new DataExchangeError("unknown-representation", "无法识别的数据格式");
  }
  return { value: parseJson(source), format: "json", jsonText: source };
}

export function detectExchangeFormat(text: string): DataExchangeFormat {
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
    throw new DataExchangeError("invalid-json", "JSON 格式错误", { cause });
  }
}
