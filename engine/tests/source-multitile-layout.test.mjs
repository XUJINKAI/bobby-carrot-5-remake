import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { ObjectId, isMultiCellObject, objectLayoutFor } from "../dist/index.js";

function countObject(level, type) {
  return level.objects.filter((object) => object.type === type).length;
}

test("all 485 original unique maps preserve implicit multi-cell objects as unambiguous anchors", () => {
  const catalog = JSON.parse(
    fs.readFileSync("assets/maps/catalog.json", "utf8"),
  );
  const entries = [...catalog.levels, ...catalog.specialScenes];
  assert.equal(entries.length, 485);
  const stats = {
    dragon: { anchor: 0, body: 0, tail: 0 },
    sandman: { anchor: 0, body: 0 },
    dreamMachine: { anchor: 0, body: 0 },
    beaver: { anchor: 0, body: 0 },
  };

  for (const entry of entries) {
    const level = JSON.parse(
      fs.readFileSync(path.join("assets", `maps/original/${entry.publicId}.json`), "utf8"),
    );
    stats.dragon.anchor += countObject(level, ObjectId.DRAGON_HEAD_BASE);
    stats.dragon.body += countObject(level, ObjectId.DRAGON_BODY);
    stats.dragon.tail += countObject(level, ObjectId.DRAGON_TAIL);
    stats.sandman.anchor += countObject(level, ObjectId.SANDMAN);
    stats.sandman.body += countObject(level, ObjectId.SANDMAN_BODY);
    stats.dreamMachine.anchor += countObject(level, ObjectId.DREAM_MACHINE);
    stats.dreamMachine.body += countObject(level, ObjectId.DREAM_MACHINE_BODY);
    stats.beaver.anchor += countObject(level, ObjectId.BEAVER_BASE);
    stats.beaver.body += countObject(level, ObjectId.BEAVER_BODY);

    const explicit = new Map(
      level.objects.map((object) => [`${object.x},${object.y}`, object]),
    );
    for (const anchor of level.objects) {
      if (!isMultiCellObject(anchor.type)) continue;
      for (const cell of objectLayoutFor(anchor.type).cells.slice(1)) {
        const x = anchor.x + cell.dx;
        const y = anchor.y + cell.dy;
        const conflict = explicit.get(`${x},${y}`);
        assert.equal(
          conflict,
          undefined,
          `${entry.publicId ?? entry.id}: ${anchor.type}@${anchor.x},${anchor.y} footprint overlaps explicit ${conflict?.type ?? "object"}@${x},${y}`,
        );
      }
    }
  }

  assert.deepEqual(stats, {
    dragon: { anchor: 101, body: 0, tail: 0 },
    sandman: { anchor: 7, body: 0 },
    dreamMachine: { anchor: 1, body: 0 },
    beaver: { anchor: 83, body: 0 },
  });
});
