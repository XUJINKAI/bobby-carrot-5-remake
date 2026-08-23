import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from '../../engine/dist/index.js';
import {
  createBlankLevel,
  fromLevelData,
  normalizeEditorLevel,
  parseEditorLevel,
  resizeEditorLevel,
  serializeEditorLevel,
  toLevelData
} from '../dist/level.js';
import { encodeShareLevel, decodeShareLevel } from '../dist/share.js';

test('Editor JSON 只保留可分享的语义地图字段，并可转回 Engine LevelData', () => {
  const level = createBlankLevel(10, 8);
  level.name = 'Test Map';
  level.author = 'xjk';
  level.objects.push({ type: ObjectId.CARROT, x: 4, y: 4 });
  const json = serializeEditorLevel(level);
  assert.equal(json.includes('recordSha256'), false);
  assert.equal(json.includes('hexId'), false);
  const parsed = parseEditorLevel(json);
  const runtime = toLevelData(parsed);
  assert.equal(runtime.schemaVersion, 2);
  assert.equal(runtime.width, 10);
  assert.equal(runtime.height, 8);
  assert.equal(runtime.objects[0]?.type, ObjectId.CARROT);
  assert.equal(runtime.source.edition, 'custom');
});

test('Multi-cell Object 在 EditorLevel 只保存 anchor，进入 Runtime 时展开 occupancy', () => {
  const level = createBlankLevel(12, 8);
  level.objects.push({ type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 });
  const normalized = normalizeEditorLevel(level);
  assert.deepEqual(normalized.objects, [{ type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 }]);

  const runtime = toLevelData(normalized);
  assert.deepEqual(runtime.objects.filter((object) => object.y === 3), [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 },
    { type: ObjectId.DRAGON_BODY, x: 4, y: 3 },
    { type: ObjectId.DRAGON_TAIL, x: 5, y: 3 }
  ]);

  const restored = fromLevelData(runtime);
  assert.deepEqual(restored.objects, [{ type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 }]);
});

test('Normalize 删除内部 body/tail，并保证 multi-cell footprint 不重叠', () => {
  const level = createBlankLevel(10, 8);
  level.objects = [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 2, y: 2 },
    { type: ObjectId.DRAGON_BODY, x: 3, y: 2 },
    { type: ObjectId.CARROT, x: 4, y: 2 },
    { type: ObjectId.BEAN, x: 7, y: 2 }
  ];
  assert.deepEqual(normalizeEditorLevel(level).objects, [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 2, y: 2 },
    { type: ObjectId.BEAN, x: 7, y: 2 }
  ]);
});

test('Resize 会整体删除越界的 multi-cell Object', () => {
  const level = createBlankLevel(12, 12);
  level.objects.push({ type: ObjectId.DRAGON_HEAD_BASE, x: 9, y: 3 });
  level.objects.push({ type: ObjectId.BEAN, x: 3, y: 3 });
  const resized = resizeEditorLevel(level, 10, 8);
  assert.deepEqual(resized.objects, [{ type: ObjectId.BEAN, x: 3, y: 3 }]);
});

test('URL share codec 使用 DAT anchor 编码并完整往返地图 metadata', async () => {
  const level = createBlankLevel(20, 16);
  level.name = 'Shared Test';
  level.author = 'xjk';
  level.description = 'DAT binary share';
  level.objects.push({ type: ObjectId.DRAGON_HEAD_BASE, x: 5, y: 5 }, { type: ObjectId.MOWER, x: 9, y: 8 });
  const encoded = await encodeShareLevel(level);
  assert.ok(encoded.startsWith('d.') || encoded.startsWith('r.'));
  const decoded = await decodeShareLevel(encoded);
  assert.deepEqual(decoded, normalizeEditorLevel(level));
  assert.deepEqual(decoded.objects, [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 5, y: 5 },
    { type: ObjectId.MOWER, x: 9, y: 8 }
  ]);
  assert.ok(encoded.length < serializeEditorLevel(level).length);
});
