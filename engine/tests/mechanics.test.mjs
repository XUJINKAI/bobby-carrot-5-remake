import test from 'node:test';
import assert from 'node:assert/strict';
import { terrainPassage, canEnterTile } from '../dist/index.js';

test('default grass/path range is passable', () => {
  assert.equal(terrainPassage(0x90, { dx:1, dy:0 }).passable, true);
  assert.equal(terrainPassage(0x5e, { dx:1, dy:0 }).passable, true);
});

test('forest/wall terrain outside confirmed range is blocked', () => {
  assert.equal(terrainPassage(0x2b, { dx:1, dy:0 }).passable, false);
});

test('fence object -7 blocks a default-passable tile', () => {
  const result = canEnterTile(0x90, [{ id:249, signedId:-7, hexId:'0xF9', x:0, y:0 }], { dx:1, dy:0 });
  assert.equal(result.passable, false);
});
