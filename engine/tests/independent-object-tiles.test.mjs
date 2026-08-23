import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId, Terrain } from '../dist/index.js';
import { World } from '../dist/world/World.js';

function level(objects) {
  return {
    schemaVersion: 2,
    id: 'independent-object-test',
    source: { edition: 'test', packFile: 'test.dat', levelIndex: 0 },
    recordLength: 0,
    recordSha256: 'test',
    width: 6,
    height: 3,
    dynamicSlots: 0,
    terrainEncoding: 'semantic-row-major',
    terrain: Array.from({ length: 3 }, (_, y) => Array.from({ length: 6 }, (_, x) => x === 0 && y === 0 ? Terrain.START : Terrain.GROUND_C)),
    objects
  };
}

test('World does not synthesize Dragon body/tail from a head tile', () => {
  const world = new World(level([{ type: ObjectId.DRAGON_HEAD_BASE, x: 2, y: 1 }]));
  assert.equal(world.objectIdAt(2, 1), ObjectId.DRAGON_HEAD_BASE);
  assert.equal(world.objectIdAt(3, 1), ObjectId.EMPTY);
  assert.equal(world.objectIdAt(4, 1), ObjectId.EMPTY);
});

test('World preserves intentionally broken multi-tile layouts verbatim', () => {
  const world = new World(level([
    { type: ObjectId.DRAGON_HEAD_BASE, x: 1, y: 1 },
    { type: ObjectId.DRAGON_TAIL, x: 3, y: 1 },
    { type: ObjectId.BEAVER_BODY, x: 5, y: 2 }
  ]));

  assert.equal(world.objectIdAt(1, 1), ObjectId.DRAGON_HEAD_BASE);
  assert.equal(world.objectIdAt(2, 1), ObjectId.EMPTY);
  assert.equal(world.objectIdAt(3, 1), ObjectId.DRAGON_TAIL);
  assert.equal(world.objectIdAt(5, 2), ObjectId.BEAVER_BODY);
});
