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

test('mirror definition composes passage, dragon-fire reflection and rotation', () => {
  const mirror = inspectTerrainDefinition(Terrain.MIRROR_1);
  assert.equal(mirror.source?.datHexIds?.[0], '0xB1');
  assert.deepEqual(mirror.behaviors.map((behavior) => behavior.id), [
    'mower-blocked', 'reflect-dragon-fire', 'rotate-on-leave'
  ]);
  assert.equal(mirror.behaviors[1].config.left, 'down');
  assert.equal(mirror.behaviors[1].config.up, 'right');
});

test('object definitions expose original provenance and passage behavior', () => {
  const lock = inspectObjectDefinition(ObjectId.LOCK);
  assert.equal(lock.source?.datHexIds?.[0], '0xCD');
  assert.equal(lock.behaviors[0].id, 'requires-key');
});

test('every known semantic Terrain and Object has a definition, behavior metadata and original DAT provenance', () => {
  for (const id of Object.values(Terrain)) {
    const definition = inspectTerrainDefinition(id);
    assert.equal(definition.id, id);
    assert.ok(definition.behaviors.length > 0, `terrain ${id} must expose behavior metadata`);
    assert.match(definition.source?.datHexIds?.[0] ?? '', /^0x[0-9A-F]{2}$/);
  }
  for (const id of Object.values(ObjectId)) {
    const definition = inspectObjectDefinition(id);
    assert.equal(definition.id, id);
    assert.ok(definition.behaviors.length > 0, `object ${id} must expose behavior metadata`);
    assert.match(definition.source?.datHexIds?.[0] ?? '', /^0x[0-9A-F]{2}$/);
  }
});

test('unnamed semantic variants keep introspectable original hex and category traits', () => {
  const walkable = inspectTerrainDefinition('walkable-variant-01');
  assert.equal(walkable.source?.datHexIds?.[0], '0x60');
  assert.equal(walkable.source?.confidence, 'inferred');
  assert.ok(walkable.traits.includes('walkable'));
  assert.ok(walkable.traits.includes('cloud-passable'));
  assert.ok(walkable.traits.includes('dragon-fire-passable'));

  const background = inspectTerrainDefinition('background-variant-001');
  assert.equal(background.source?.datHexIds?.[0], '0x00');
  assert.equal(background.source?.confidence, 'inferred');
  assert.ok(background.traits.includes('beanstalk-growth'));
  assert.ok(background.traits.includes('cloud-passable'));
  assert.ok(background.traits.includes('dragon-fire-passable'));

  const objectVariant = inspectObjectDefinition('object-variant-001');
  assert.equal(objectVariant.source?.datHexIds?.[0], '0x00');
  assert.equal(objectVariant.source?.confidence, 'inferred');
  assert.ok(objectVariant.behaviors.some((behavior) => behavior.id === 'unknown-object'));
});
