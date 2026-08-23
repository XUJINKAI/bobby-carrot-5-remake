import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  Terrain,
  ObjectId,
  inspectTerrainDefinition,
  inspectObjectDefinition
} from '../dist/index.js';

test('carousel definitions expose composable directional and rotation behaviors', () => {
  const definition = inspectTerrainDefinition(Terrain.CAROUSEL_1);
  assert.equal(definition.source?.datHexIds?.[0], '0xB9');
  assert.ok(definition.traits.includes('carousel'));
  assert.deepEqual(definition.behaviors.map((behavior) => behavior.id), ['directional-passage', 'rotate-on-leave']);
  assert.deepEqual(definition.behaviors[0].config.enter, ['left', 'down']);
  assert.equal(definition.behaviors[1].config.next, Terrain.CAROUSEL_4);
});

test('object definitions expose original provenance and passage behavior', () => {
  const lock = inspectObjectDefinition(ObjectId.LOCK);
  assert.equal(lock.source?.datHexIds?.[0], '0xCD');
  assert.equal(lock.behaviors[0].id, 'requires-key');
});
