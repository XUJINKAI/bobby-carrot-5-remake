import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseDatPackage } from '../../tools/src/level-format.mjs';

function decodeEdition(edition) {
  const levels = [];
  for (let pack = 0; pack <= 4; pack += 1) {
    const file = pack.toString().padStart(2, '0');
    const buffer = fs.readFileSync(path.resolve(`assets/extracted/${edition}/${file}.dat`));
    levels.push(...parseDatPackage(buffer, { edition, packFile: file }).levels);
  }
  return levels;
}

test('Base 与 UP9 都能解码为 53 个 source level', () => {
  assert.equal(decodeEdition('base').length, 53);
  assert.equal(decodeEdition('up09').length, 53);
});

test('base and UP9 share the five 00.dat levels byte-for-byte', () => {
  const base = parseDatPackage(fs.readFileSync('assets/extracted/base/00.dat'), { edition:'base', packFile:'00' });
  const hd = parseDatPackage(fs.readFileSync('assets/extracted/up09/00.dat'), { edition:'up09', packFile:'00' });
  assert.equal(base.levels.length, 5);
  assert.deepEqual(base.levels.map((level) => level.recordSha256), hd.levels.map((level) => level.recordSha256));
});

test('level 001 decodes exact dimensions, object count, and start marker', () => {
  const parsed = parseDatPackage(fs.readFileSync('assets/extracted/base/00.dat'), { edition:'base', packFile:'00' });
  const level = parsed.levels[0];
  assert.ok(level);
  assert.equal(level.width, 25);
  assert.equal(level.height, 20);
  assert.equal(level.objects.length, 10);
  assert.equal(level.terrain[16]?.[7], 0x95);
});
