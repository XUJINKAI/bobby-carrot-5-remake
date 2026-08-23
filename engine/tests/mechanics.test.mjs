import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId, Terrain, objectAtlasCell, terrainAtlasCell } from '../dist/index.js';

test('engine public tile identities are semantic', () => {
  assert.equal(Terrain.GROUND_C, 'ground-c');
  assert.equal(Terrain.START, 'start');
  assert.equal(ObjectId.CARROT, 'carrot');
  assert.equal(ObjectId.LEAF, 'leaf');
});

test('art atlas mapping is separate from semantic identity', () => {
  assert.deepEqual(terrainAtlasCell(Terrain.START), { column: 5, row: 9 });
  assert.deepEqual(objectAtlasCell(ObjectId.CARROT), { column: 10, row: 12 });
  assert.equal(typeof Terrain.START, 'string');
  assert.equal(typeof ObjectId.CARROT, 'string');
});
