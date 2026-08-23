import {
  DYNAMIC_OBJECT_IDS,
  ObjectId,
  Terrain,
  type LevelData,
  type LevelObject,
  type ObjectType,
  type TerrainType
} from '@bobby/engine';

/**
 * Editor / 分享使用的最小地图格式。
 *
 * 这是 bc5r 自己的语义关卡格式，不是 DAT dump。Editor 不认识原版 byte；
 * DAT 导入/导出只能经过独立 codec 层。
 */
export interface EditorLevel {
  schemaVersion: 2;
  name: string;
  author?: string;
  description?: string;
  width: number;
  height: number;
  terrain: TerrainType[][];
  objects: EditorObject[];
}

export interface EditorObject {
  type: ObjectType;
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
  const terrain = Array.from({ length: safeHeight }, () => Array.from({ length: safeWidth }, () => Terrain.GROUND_C as TerrainType));
  terrain[Math.min(2, safeHeight - 1)]![Math.min(2, safeWidth - 1)] = Terrain.START;
  terrain[Math.max(0, safeHeight - 3)]![Math.max(0, safeWidth - 3)] = Terrain.EXIT;
  return {
    schemaVersion: 2,
    name: 'Untitled Bobby Level',
    width: safeWidth,
    height: safeHeight,
    terrain,
    objects: []
  };
}

export function fromLevelData(level: LevelData): EditorLevel {
  return {
    schemaVersion: 2,
    name: level.publicId ? level.publicId.toUpperCase() : level.id ? `Level ${level.id}` : 'Bobby Level',
    width: level.width,
    height: level.height,
    terrain: level.terrain.map((row) => [...row]),
    objects: level.objects.map(({ type, x, y }) => ({ type, x, y }))
  };
}

/** 把 Editor Draft 转成 Engine 真正运行的 LevelData。每次 Play 都重新生成，绝不让 Runtime 反写 Draft。 */
export function toLevelData(level: EditorLevel): LevelData {
  const normalized = normalizeEditorLevel(level);
  const objects: LevelObject[] = normalized.objects.map(({ type, x, y }) => ({ type, x, y }));
  return {
    schemaVersion: 2,
    id: 'custom',
    canonicalId: 'custom',
    publicId: 'custom',
    source: { edition: 'custom', release: 'custom', releaseLabel: 'Custom', packFile: 'json', levelIndex: 1 },
    recordLength: 0,
    recordSha256: 'custom-json',
    width: normalized.width,
    height: normalized.height,
    dynamicSlots: objects.filter((object) => DYNAMIC_OBJECT_IDS.has(object.type)).length,
    terrainEncoding: 'semantic-row-major',
    terrain: normalized.terrain.map((row) => [...row]),
    objects
  };
}

export function normalizeEditorLevel(input: EditorLevel): EditorLevel {
  const width = clampDimension(Number(input.width));
  const height = clampDimension(Number(input.height));
  const terrain = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => normalizeTerrain(input.terrain?.[y]?.[x]))
  );

  const seen = new Set<string>();
  const objects: EditorObject[] = [];
  for (const object of input.objects ?? []) {
    const x = Math.trunc(Number(object.x));
    const y = Math.trunc(Number(object.y));
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const type = normalizeObject(object.type);
    if (type === ObjectId.EMPTY) continue;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    objects.push({ type, x, y });
  }

  const level: EditorLevel = {
    schemaVersion: 2,
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
    for (const type of row) {
      if (type === Terrain.START) starts += 1;
      if (type === Terrain.EXIT) exits += 1;
    }
  }
  if (starts === 0) issues.push({ level: 'warning', message: '没有 Bobby 出生点；Engine 会使用第一个可步行格作为回退出生点。' });
  if (starts > 1) issues.push({ level: 'warning', message: `存在 ${starts} 个出生点；原版语义只需要一个。` });
  if (exits === 0) issues.push({ level: 'warning', message: '没有出口，因此地图通常无法正常通关。' });
  return issues;
}

export function resizeEditorLevel(level: EditorLevel, width: number, height: number): EditorLevel {
  return normalizeEditorLevel({ ...level, width, height });
}

export function serializeEditorLevel(level: EditorLevel): string {
  return `${JSON.stringify(normalizeEditorLevel(level), null, 2)}\n`;
}

export function parseEditorLevel(text: string): EditorLevel {
  const parsed = JSON.parse(text) as Partial<EditorLevel>;
  if (parsed.schemaVersion !== 2) throw new Error(`不支持的地图 schemaVersion：${String(parsed.schemaVersion)}；当前只接受语义 schema v2`);
  if (!Array.isArray(parsed.terrain)) throw new Error('JSON 缺少 terrain 二维数组');
  return normalizeEditorLevel(parsed as EditorLevel);
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.min(128, Math.max(3, Math.trunc(value)));
}

function normalizeTerrain(value: unknown): TerrainType {
  return typeof value === 'string' && value.length > 0 ? value as TerrainType : Terrain.GROUND_C;
}

function normalizeObject(value: unknown): ObjectType {
  return typeof value === 'string' && value.length > 0 ? value as ObjectType : ObjectId.EMPTY;
}
