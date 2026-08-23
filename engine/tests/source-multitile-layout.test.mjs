import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from '../dist/index.js';

function countObject(level, type) {
  return level.objects.filter((object) => object.type === type).length;
}

function hasObject(level, type, x, y) {
  return level.objects.some((object) => object.type === type && object.x === x && object.y === y);
}

test('original decoded levels store multi-tile object parts explicitly', () => {
  const catalog = JSON.parse(fs.readFileSync('assets/generated/catalog.json', 'utf8'));
  const stats = {
    dragon: { anchor: 0, partA: 0, partB: 0, complete: 0 },
    sandman: { anchor: 0, part: 0, complete: 0 },
    dreamMachine: { anchor: 0, part: 0, complete: 0 },
    beaver: { anchor: 0, part: 0, complete: 0 }
  };

  for (const entry of catalog.levels) {
    const level = JSON.parse(fs.readFileSync(path.join('assets/generated', entry.path), 'utf8'));
    stats.dragon.anchor += countObject(level, ObjectId.DRAGON_HEAD_BASE);
    stats.dragon.partA += countObject(level, ObjectId.DRAGON_BODY);
    stats.dragon.partB += countObject(level, ObjectId.DRAGON_TAIL);
    stats.sandman.anchor += countObject(level, ObjectId.SANDMAN);
    stats.sandman.part += countObject(level, ObjectId.SANDMAN_BODY);
    stats.dreamMachine.anchor += countObject(level, ObjectId.DREAM_MACHINE);
    stats.dreamMachine.part += countObject(level, ObjectId.DREAM_MACHINE_BODY);
    stats.beaver.anchor += countObject(level, ObjectId.BEAVER_BASE);
    stats.beaver.part += countObject(level, ObjectId.BEAVER_BODY);

    for (const object of level.objects) {
      if (object.type === ObjectId.DRAGON_HEAD_BASE
        && hasObject(level, ObjectId.DRAGON_BODY, object.x + 1, object.y)
        && hasObject(level, ObjectId.DRAGON_TAIL, object.x + 2, object.y)) stats.dragon.complete += 1;
      if (object.type === ObjectId.SANDMAN && hasObject(level, ObjectId.SANDMAN_BODY, object.x, object.y + 1)) stats.sandman.complete += 1;
      if (object.type === ObjectId.DREAM_MACHINE && hasObject(level, ObjectId.DREAM_MACHINE_BODY, object.x, object.y + 1)) stats.dreamMachine.complete += 1;
      if (object.type === ObjectId.BEAVER_BASE && hasObject(level, ObjectId.BEAVER_BODY, object.x, object.y + 1)) stats.beaver.complete += 1;
    }
  }

  console.log('source multi-tile layout stats', JSON.stringify(stats));
  assert.ok(stats.dragon.partA > 0 && stats.dragon.partB > 0, 'original levels must contain explicit dragon body/tail records');
  assert.ok(stats.sandman.part > 0, 'original levels must contain explicit sandman-body records');
  assert.ok(stats.dreamMachine.part > 0, 'original levels must contain explicit dream-machine-body records');
  assert.ok(stats.beaver.part > 0, 'original levels must contain explicit beaver-body records');
});
