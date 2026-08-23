import type { LevelData, LevelObject } from '@bobby/engine';

/**
 * Editor / 分享使用的最小地图格式。
 *
 * 它故意不携带 DAT recordLength、SHA-256、release 等档案字段；
 * 官方地图进入 Editor 时先复制成这个 Draft，导出后就是普通自定义 JSON。
 */
export interface EditorLevel {
  schemaVersion: 1;
  name: string;
  author?: string;
  description?: string;
  width: number;
  height: number;
  terrain: number[][];
  objects: EditorObject[];
}

export interface EditorObject {
  id: number;
  x: number;
  y: number;
}

export interface LevelValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export function createBlankLevel(width = 16, height = 16): EditorLevel {
  const safeWidth = clampDimension(width);
  const safeHeight = clampDimension(height);
  const terrain = Array.from({ length: safeHeight }, () => Array.from({ length: safeWidth }, () => 0x90));
  // 默认地图直接可进入 Engine：左上附近出生、右下附近出口。
  terrain[Math.min(2, safeHeight - 1)]![Math.min(2, safeWidth - 1)] = 0x95;
  terrain[Math.max(0, safeHeight - 3)]![Math.max(0, safeWidth - 3)] = 0x96;
  return {
    schemaVersion: 1,
    name: 'Untitled Bobby Level',
    width: safeWidth,
    height: safeHeight,
    terrain,
    objects: []
  };
}

export function fromLevelData(level: LevelData): EditorLevel {
  return {
    schemaVersion: 1,
    name: level.publicId ? level.publicId.toUpperCase() : level.id ? `Level ${level.id}` : 'Bobby Level',
    width: level.width,
    height: level.height,
    terrain: level.terrain.map((row) => [...row]),
    objects: level.objects.map(({ id, x, y }) => ({ id, x, y }))
  };
}

/** 把 Editor Draft 转成 Engine 真正运行的 LevelData。每次 Play 都重新生成，绝不让 Runtime 反写 Draft。 */
export function toLevelData(level: EditorLevel): LevelData {
  const normalized = normalizeEditorLevel(level);
  const objects: LevelObject[] = normalized.objects.map(({ id, x, y }) => ({
    id,
    signedId: signedByte(id),
    hexId: hexByte(id),
    x,
    y
  }));
  return {
    schemaVersion: 1,
    id: 'custom',
    canonicalId: 'custom',
    publicId: 'custom',
    source: { edition: 'custom', release: 'custom', releaseLabel: 'Custom', packFile: 'json', levelIndex: 1 },
    recordLength: 0,
    recordSha256: 'custom-json',
    width: normalized.width,
    height: normalized.height,
    dynamicSlots: objects.filter((object) => [0xe0, 0xe1, 0xe2, 0xec].includes(object.id)).length,
    terrainEncoding: 'u8-row-major',
    terrain: normalized.terrain.map((row) => [...row]),
    objects
  };
}

export function normalizeEditorLevel(input: EditorLevel): EditorLevel {
  const width = clampDimension(Number(input.width));
  const height = clampDimension(Number(input.height));
  const terrain = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => normalizeByte(input.terrain?.[y]?.[x] ?? 0x90))
  );

  const seen = new Set<string>();
  const objects: EditorObject[] = [];
  for (const object of input.objects ?? []) {
    const x = Math.trunc(Number(object.x));
    const y = Math.trunc(Number(object.y));
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const id = normalizeByte(object.id);
    if (id === 0xff) continue;
    const key = `${x},${y}`;
    // 原始正式关卡每格最多一个静态对象；Editor 同样维持这个约束。
    if (seen.has(key)) continue;
    seen.add(key);
    objects.push({ id, x, y });
  }

  const level: EditorLevel = {
    schemaVersion: 1,
    name: String(input.name || 'Untitled Bobby Level').slice(0, 120),
    width,
    height,
    terrain,
    objects
  };
  if (input.author) level.author = String(input.author).slice(0, 80);
  if (input.description) level.description = String(input.description).slice(0, 500);
  return level;
}

export function validateEditorLevel(level: EditorLevel): LevelValidationIssue[] {
  const normalized = normalizeEditorLevel(level);
  const issues: LevelValidationIssue[] = [];
  let starts = 0;
  let exits = 0;
  for (const row of normalized.terrain) {
    for (const id of row) {
      if (id === 0x95) starts += 1;
      if (id === 0x96) exits += 1;
    }
  }
  if (starts === 0) issues.push({ level: 'warning', message: '没有 0x95 Bobby 出生点；Engine 会使用第一个可步行格作为回退出生点。' });
  if (starts > 1) issues.push({ level: 'warning', message: `存在 ${starts} 个出生点；原版语义只需要一个。` });
  if (exits === 0) issues.push({ level: 'warning', message: '没有 0x96 出口，因此地图通常无法正常通关。' });
  return issues;
}

export function resizeEditorLevel(level: EditorLevel, width: number, height: number): EditorLevel {
  const next = normalizeEditorLevel({ ...level, width, height });
  return next;
}

export function serializeEditorLevel(level: EditorLevel): string {
  return `${JSON.stringify(normalizeEditorLevel(level), null, 2)}\n`;
}

export function parseEditorLevel(text: string): EditorLevel {
  const parsed = JSON.parse(text) as Partial<EditorLevel>;
  if (parsed.schemaVersion !== 1) throw new Error(`不支持的地图 schemaVersion：${String(parsed.schemaVersion)}`);
  if (!Array.isArray(parsed.terrain)) throw new Error('JSON 缺少 terrain 二维数组');
  return normalizeEditorLevel(parsed as EditorLevel);
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.min(128, Math.max(3, Math.trunc(value)));
}

function normalizeByte(value: number): number {
  if (!Number.isFinite(Number(value))) return 0xff;
  return Math.min(255, Math.max(0, Math.trunc(Number(value)))) & 0xff;
}

function signedByte(id: number): number { return id > 127 ? id - 256 : id; }
function hexByte(id: number): string { return `0x${(id & 0xff).toString(16).padStart(2, '0').toUpperCase()}`; }
