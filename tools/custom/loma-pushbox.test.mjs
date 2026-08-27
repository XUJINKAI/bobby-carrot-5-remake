import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { root } from "../lib/fs.mjs";
import { parseLoma } from "./loma-pushbox.mjs";

const levels = parseLoma(fs.readFileSync(`${root}/tools/custom/LOMA.txt`, "utf8"));

test("LOMA source parses into 137 maps grouped by the ten source patterns", () => {
  assert.equal(levels.length, 137);
  const counts = Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => {
      const chapter = String(index + 1).padStart(2, "0");
      return [chapter, levels.filter((level) => level.chapter === chapter).length];
    }),
  );
  assert.deepEqual(counts, {
    "01": 16,
    "02": 13,
    "03": 15,
    "04": 13,
    "05": 14,
    "06": 14,
    "07": 13,
    "08": 13,
    "09": 13,
    "10": 13,
  });
  assert.equal(levels[0]?.id, "01-01");
  assert.equal(levels.at(-1)?.id, "10-13");
});

test("LOMA XSB conversion preserves geometry and uses only fill-all push goals", () => {
  const map0103 = levels.find((level) => level.id === "01-03");
  assert.ok(map0103);
  assert.equal(map0103.level.width, 8);
  assert.equal(map0103.level.height, 10);

  for (const entry of levels) {
    assert.deepEqual(entry.level.rules.win, {
      type: "fill-all",
      terrainTrait: "push-goal",
      objectTrait: "pushable",
    });
    assert.equal(entry.level.objects.length, 3, entry.id);
    assert.equal(
      entry.level.terrain.flat().filter((terrain) => terrain === "custom:push-goal").length,
      3,
      entry.id,
    );
    assert.ok(entry.level.playerStart, entry.id);
    assert.equal(entry.level.terrain.flat().includes("start"), false, entry.id);
    assert.equal(entry.level.terrain.flat().includes("exit"), false, entry.id);
  }
});
