import { decodeDatLevelRecord, encodeDatLevelRecord } from "@bobby/dat";
import type { EditorLevel } from "./level.js";
import { normalizeEditorLevel } from "./level.js";
const MAGIC = new Uint8Array([0x42, 0x43, 0x35, 0x52]);
const SHARE_VERSION = 1;
/** One share payload: bc5r metadata envelope + original DAT level record, optionally deflate-raw compressed. */
export async function encodeShareLevel(level: EditorLevel): Promise<string> {
  const raw = encodeShareBinary(normalizeEditorLevel(level));
  if (typeof CompressionStream !== "undefined") {
    try {
      const compressed = await transformBytes(
        raw,
        new CompressionStream("deflate-raw"),
      );
      if (compressed.length < raw.length)
        return `d.${base64UrlEncode(compressed)}`;
    } catch {}
  }
  return `r.${base64UrlEncode(raw)}`;
}
export async function decodeShareLevel(encoded: string): Promise<EditorLevel> {
  const value = encoded.trim(),
    dot = value.indexOf(".");
  if (dot <= 0) throw new Error("未知的分享地图编码");
  const type = value.slice(0, dot);
  let bytes = base64UrlDecode(value.slice(dot + 1));
  if (type === "d") {
    if (typeof DecompressionStream === "undefined")
      throw new Error("当前浏览器不支持解压此分享地图");
    bytes = await transformBytes(bytes, new DecompressionStream("deflate-raw"));
  } else if (type !== "r") throw new Error(`未知的分享地图编码：${type}`);
  return decodeShareBinary(bytes);
}
export function shareValueFromHash(hash = location.hash): string | null {
  const match = /(?:^#|[&#])map=([^&]+)/.exec(hash);
  return match ? decodeURIComponent(match[1]!) : null;
}
function encodeShareBinary(level: EditorLevel): Uint8Array {
  const encoder = new TextEncoder(),
    name = encoder.encode(level.name),
    author = encoder.encode(level.author ?? ""),
    description = encoder.encode(level.description ?? "");
  for (const [label, bytes] of [
    ["名称", name],
    ["作者", author],
    ["描述", description],
  ] as const)
    if (bytes.length > 0xffff) throw new Error(`${label}过长`);
  const record = encodeDatLevelRecord(level),
    headerLength =
      MAGIC.length + 1 + 6 + name.length + author.length + description.length,
    output = new Uint8Array(headerLength + record.length),
    view = new DataView(output.buffer);
  let offset = 0;
  output.set(MAGIC, offset);
  offset += MAGIC.length;
  output[offset++] = SHARE_VERSION;
  view.setUint16(offset, name.length);
  offset += 2;
  view.setUint16(offset, author.length);
  offset += 2;
  view.setUint16(offset, description.length);
  offset += 2;
  output.set(name, offset);
  offset += name.length;
  output.set(author, offset);
  offset += author.length;
  output.set(description, offset);
  offset += description.length;
  output.set(record, offset);
  return output;
}
function decodeShareBinary(bytes: Uint8Array): EditorLevel {
  let offset = 0;
  for (const expected of MAGIC)
    if (bytes[offset++] !== expected) throw new Error("不是 bc5r 分享地图");
  const version = bytes[offset++];
  if (version !== SHARE_VERSION)
    throw new Error(`不支持的分享地图版本：${String(version)}`);
  if (offset + 6 > bytes.length) throw new Error("分享地图 metadata 损坏");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    nameLength = view.getUint16(offset);
  offset += 2;
  const authorLength = view.getUint16(offset);
  offset += 2;
  const descriptionLength = view.getUint16(offset);
  offset += 2;
  const end = offset + nameLength + authorLength + descriptionLength;
  if (end > bytes.length) throw new Error("分享地图 metadata 被截断");
  const decoder = new TextDecoder(),
    name = decoder.decode(bytes.subarray(offset, offset + nameLength));
  offset += nameLength;
  const author = decoder.decode(bytes.subarray(offset, offset + authorLength));
  offset += authorLength;
  const description = decoder.decode(
    bytes.subarray(offset, offset + descriptionLength),
  );
  offset += descriptionLength;
  const map = decodeDatLevelRecord(bytes.subarray(offset)).map;
  return normalizeEditorLevel({
    schemaVersion: 2,
    name: name || "Shared Bobby Level",
    ...(author ? { author } : {}),
    ...(description ? { description } : {}),
    ...map,
  });
}
async function transformBytes(
  input: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}
function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/"),
    padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
    binary = atob(padded),
    bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}
