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
  assert.ok(definition.traits.includes('carousel'));
  assert.deepEqual(definition.behaviors.map((behavior) => behavior.id), ['directional-passage', 'rotate-on-leave']);
  assert.deepEqual(definition.behaviors[0].config.enter, ['left', 'down']);
  assert.equal(definition.behaviors[1].config.next, Terrain.CAROUSEL_4);
});

test('mirror definition composes passage, dragon-fire reflection and rotation', () => {
  const mirror = inspectTerrainDefinition(Terrain.MIRROR_1);
  assert.deepEqual(mirror.behaviors.map((behavior) => behavior.id), [
    'mower-blocked', 'reflect-dragon-fire', 'rotate-on-leave'
  ]);
  assert.equal(mirror.behaviors[1].config.left, 'down');
  assert.equal(mirror.behaviors[1].config.up, 'right');
});

test('object definitions expose passage and authoring behavior', () => {
  const lock = inspectObjectDefinition(ObjectId.LOCK);
  assert.equal(lock.behaviors[0].id, 'requires-key');
  assert.equal(lock.authoring?.palette, true);

  const internal = inspectObjectDefinition(ObjectId.DRAGON_BODY);
  assert.equal(internal.authoring?.palette, false);
});

test('every known semantic Terrain and Object has a definition and behavior metadata', () => {
  for (const id of Object.values(Terrain)) {
    const definition = inspectTerrainDefinition(id);
    assert.equal(definition.id, id);
    assert.ok(definition.behaviors.length > 0, `terrain ${id} must expose behavior metadata`);
    assert.equal(typeof definition.authoring?.palette, 'boolean', `terrain ${id} must expose authoring metadata`);
  }
  for (const id of Object.values(ObjectId)) {
    const definition = inspectObjectDefinition(id);
    assert.equal(definition.id, id);
    assert.ok(definition.behaviors.length > 0, `object ${id} must expose behavior metadata`);
    assert.equal(typeof definition.authoring?.palette, 'boolean', `object ${id} must expose authoring metadata`);
  }
});

test('unnamed semantic variants keep category traits without importing DAT ownership', () => {
  const walkable = inspectTerrainDefinition('walkable-variant-01');
  assert.ok(walkable.traits.includes('walkable'));
  assert.ok(walkable.traits.includes('cloud-passable'));
  assert.ok(walkable.traits.includes('dragon-fire-passable'));

  const background = inspectTerrainDefinition('background-variant-001');
  assert.ok(background.traits.includes('beanstalk-growth'));
  assert.ok(background.traits.includes('cloud-passable'));
  assert.ok(background.traits.includes('dragon-fire-passable'));

  const objectVariant = inspectObjectDefinition('object-variant-001');
  assert.ok(objectVariant.behaviors.some((behavior) => behavior.id === 'unknown-object'));
});
