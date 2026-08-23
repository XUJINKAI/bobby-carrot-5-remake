import type { EditorLevel } from './level.js';
import { normalizeEditorLevel } from './level.js';

interface CompactLevel {
  v: 1;
  n: string;
  a?: string;
  d?: string;
  w: number;
  h: number;
  /** terrain 的 [byte,count,byte,count...] RLE。 */
  t: number[];
  /** objects 的 [id,x,y,id,x,y...] 扁平数组。 */
  o: number[];
}

/**
 * URL 分享格式：compact JSON -> deflate-raw（浏览器支持时）-> base64url。
 * 前缀 z. 表示 deflate-raw，j. 表示仅 compact JSON 的兼容回退。
 */
export async function encodeShareLevel(level: EditorLevel): Promise<string> {
  const compact = compactLevel(normalizeEditorLevel(level));
  const raw = new TextEncoder().encode(JSON.stringify(compact));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const compressed = await transformBytes(raw, new CompressionStream('deflate-raw'));
      if (compressed.length < raw.length) return `z.${base64UrlEncode(compressed)}`;
    } catch {
      // 某些旧浏览器存在 CompressionStream 但不支持 deflate-raw，继续使用兼容格式。
    }
  }
  return `j.${base64UrlEncode(raw)}`;
}

export async function decodeShareLevel(encoded: string): Promise<EditorLevel> {
  const value = encoded.trim();
  const dot = value.indexOf('.');
  if (dot <= 0) throw new Error('未知的分享地图编码');
  const type = value.slice(0, dot);
  let bytes = base64UrlDecode(value.slice(dot + 1));
  if (type === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('当前浏览器不支持解压此分享地图');
    bytes = await transformBytes(bytes, new DecompressionStream('deflate-raw'));
  } else if (type !== 'j') {
    throw new Error(`未知的分享地图编码：${type}`);
  }
  const compact = JSON.parse(new TextDecoder().decode(bytes)) as CompactLevel;
  return expandLevel(compact);
}

export function shareValueFromHash(hash = location.hash): string | null {
  const match = /(?:^#|[&#])map=([^&]+)/.exec(hash);
  return match ? decodeURIComponent(match[1]!) : null;
}

function compactLevel(level: EditorLevel): CompactLevel {
  const flat = level.terrain.flat();
  const t: number[] = [];
  for (const id of flat) {
    const lastCountIndex = t.length - 1;
    if (t.length >= 2 && t[t.length - 2] === id && (t[lastCountIndex] ?? 0) < 65535) {
      t[lastCountIndex] = (t[lastCountIndex] ?? 0) + 1;
    } else {
      t.push(id, 1);
    }
  }
  const o = level.objects.flatMap(({ id, x, y }) => [id, x, y]);
  const compact: CompactLevel = { v: 1, n: level.name, w: level.width, h: level.height, t, o };
  if (level.author) compact.a = level.author;
  if (level.description) compact.d = level.description;
  return compact;
}

function expandLevel(compact: CompactLevel): EditorLevel {
  if (compact.v !== 1) throw new Error(`不支持的分享地图版本：${String(compact.v)}`);
  const flat: number[] = [];
  for (let index = 0; index < compact.t.length; index += 2) {
    const id = compact.t[index];
    const count = compact.t[index + 1];
    if (id === undefined || count === undefined || count < 1) throw new Error('分享地图 terrain RLE 损坏');
    for (let i = 0; i < count; i += 1) flat.push(id);
  }
  if (flat.length !== compact.w * compact.h) throw new Error('分享地图 terrain 尺寸不一致');
  const terrain = Array.from({ length: compact.h }, (_, y) => flat.slice(y * compact.w, (y + 1) * compact.w));
  const objects = [];
  for (let index = 0; index < compact.o.length; index += 3) {
    const id = compact.o[index];
    const x = compact.o[index + 1];
    const y = compact.o[index + 2];
    if (id === undefined || x === undefined || y === undefined) throw new Error('分享地图 object 数据损坏');
    objects.push({ id, x, y });
  }
  return normalizeEditorLevel({
    schemaVersion: 1,
    name: compact.n || 'Shared Bobby Level',
    ...(compact.a ? { author: compact.a } : {}),
    ...(compact.d ? { description: compact.d } : {}),
    width: compact.w,
    height: compact.h,
    terrain,
    objects
  });
}

async function transformBytes(input: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
