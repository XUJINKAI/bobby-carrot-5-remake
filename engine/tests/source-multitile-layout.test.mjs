import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from '../dist/index.js';

function countObject(level, type) {
  return level.objects.filter((object) => object.type === type).length;
}

test('original decoded levels preserve implicit multi-cell objects as anchors', () => {
  const catalog = JSON.parse(fs.readFileSync('assets/generated/catalog.json', 'utf8'));
  const stats = {
    dragon: { anchor: 0, body: 0, tail: 0 },
    sandman: { anchor: 0, body: 0 },
    dreamMachine: { anchor: 0, body: 0 },
    beaver: { anchor: 0, body: 0 }
  };

  for (const entry of catalog.levels) {
    const level = JSON.parse(fs.readFileSync(path.join('assets/generated', entry.path), 'utf8'));
    stats.dragon.anchor += countObject(level, ObjectId.DRAGON_HEAD_BASE);
    stats.dragon.body += countObject(level, ObjectId.DRAGON_BODY);
    stats.dragon.tail += countObject(level, ObjectId.DRAGON_TAIL);
    stats.sandman.anchor += countObject(level, ObjectId.SANDMAN);
    stats.sandman.body += countObject(level, ObjectId.SANDMAN_BODY);
    stats.dreamMachine.anchor += countObject(level, ObjectId.DREAM_MACHINE);
    stats.dreamMachine.body += countObject(level, ObjectId.DREAM_MACHINE_BODY);
    stats.beaver.anchor += countObject(level, ObjectId.BEAVER_BASE);
    stats.beaver.body += countObject(level, ObjectId.BEAVER_BODY);
  }

  assert.deepEqual(stats, {
    dragon: { anchor: 101, body: 0, tail: 0 },
    sandman: { anchor: 7, body: 0 },
    dreamMachine: { anchor: 1, body: 0 },
    beaver: { anchor: 83, body: 0 }
  });
});
