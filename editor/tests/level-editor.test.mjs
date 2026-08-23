import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankLevel,
  normalizeEditorLevel,
  parseEditorLevel,
  resizeEditorLevel,
  serializeEditorLevel,
  toLevelData
} from '../dist/level.js';
import { encodeShareLevel, decodeShareLevel } from '../dist/share.js';

test('Editor JSON 只保留可分享的地图字段，并可转回 Engine LevelData', () => {
  const level = createBlankLevel(10, 8);
  level.name = 'Test Map';
  level.author = 'xjk';
  level.objects.push({ id: 0xca, x: 4, y: 4 });
  const json = serializeEditorLevel(level);
  assert.equal(json.includes('recordSha256'), false);
  const parsed = parseEditorLevel(json);
  const runtime = toLevelData(parsed);
  assert.equal(runtime.width, 10);
  assert.equal(runtime.height, 8);
  assert.equal(runtime.objects[0]?.id, 0xca);
  assert.equal(runtime.source.edition, 'custom');
});

test('Resize 保留左上区域并删除越界对象', () => {
  const level = createBlankLevel(12, 12);
  level.objects.push({ id: 0xca, x: 10, y: 10 });
  level.objects.push({ id: 0xcf, x: 3, y: 3 });
  const resized = resizeEditorLevel(level, 8, 8);
  assert.equal(resized.width, 8);
  assert.equal(resized.height, 8);
  assert.deepEqual(resized.objects, [{ id: 0xcf, x: 3, y: 3 }]);
});

test('Normalize 保证每格最多一个 Object', () => {
  const level = createBlankLevel(8, 8);
  level.objects = [{ id: 0xca, x: 2, y: 2 }, { id: 0xcf, x: 2, y: 2 }];
  assert.equal(normalizeEditorLevel(level).objects.length, 1);
});

test('URL share codec 可以往返地图，并对 terrain 做紧凑编码', async () => {
  const level = createBlankLevel(20, 16);
  level.name = 'Shared Test';
  level.objects.push({ id: 0xca, x: 5, y: 5 }, { id: 0xdc, x: 7, y: 8 });
  const encoded = await encodeShareLevel(level);
  assert.ok(encoded.startsWith('z.') || encoded.startsWith('j.'));
  const decoded = await decodeShareLevel(encoded);
  assert.deepEqual(decoded, normalizeEditorLevel(level));
  assert.ok(encoded.length < serializeEditorLevel(level).length);
});
