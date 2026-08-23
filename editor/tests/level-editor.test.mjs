import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from '../../engine/dist/index.js';
import {
  createBlankLevel,
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

test('Resize 保留左上区域并删除越界对象', () => {
  const level = createBlankLevel(12, 12);
  level.objects.push({ type: ObjectId.CARROT, x: 10, y: 10 });
  level.objects.push({ type: ObjectId.BEAN, x: 3, y: 3 });
  const resized = resizeEditorLevel(level, 8, 8);
  assert.equal(resized.width, 8);
  assert.equal(resized.height, 8);
  assert.deepEqual(resized.objects, [{ type: ObjectId.BEAN, x: 3, y: 3 }]);
});

test('Normalize 保证每格最多一个 Object', () => {
  const level = createBlankLevel(8, 8);
  level.objects = [{ type: ObjectId.CARROT, x: 2, y: 2 }, { type: ObjectId.BEAN, x: 2, y: 2 }];
  assert.equal(normalizeEditorLevel(level).objects.length, 1);
});

test('URL share codec 使用 DAT 二进制并完整往返地图 metadata', async () => {
  const level = createBlankLevel(20, 16);
  level.name = 'Shared Test';
  level.author = 'xjk';
  level.description = 'DAT binary share';
  level.objects.push({ type: ObjectId.CARROT, x: 5, y: 5 }, { type: ObjectId.MOWER, x: 7, y: 8 });
  const encoded = await encodeShareLevel(level);
  assert.ok(encoded.startsWith('d.') || encoded.startsWith('r.'));
  const decoded = await decodeShareLevel(encoded);
  assert.deepEqual(decoded, normalizeEditorLevel(level));
  assert.ok(encoded.length < serializeEditorLevel(level).length);
});

test('URL share codec 保留独立的 Dragon Tile，不引入 Stamp metadata', async () => {
  const level = createBlankLevel(12, 8);
  level.objects.push(
    { type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 },
    { type: ObjectId.DRAGON_BODY, x: 4, y: 3 },
    { type: ObjectId.DRAGON_TAIL, x: 5, y: 3 }
  );
  const decoded = await decodeShareLevel(await encodeShareLevel(level));
  assert.deepEqual(decoded.objects, level.objects);
});
