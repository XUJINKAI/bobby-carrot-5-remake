import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const audioRoot = path.join(root, "assets/audio");
const expectedTracks = [
  "alarm.ogg",
  "bonus.ogg",
  "cleared.ogg",
  "death.ogg",
  "fly.ogg",
  "ingame0.ogg",
  "ingame1.ogg",
  "ingame2.ogg",
  "mow.ogg",
  "sandman.ogg",
  "shop.ogg",
  "title.ogg",
  "train.ogg",
  "universe.ogg",
];

test("modern and 8bit banks expose the same OGG track set", () => {
  for (const style of ["modern", "8bit"]) {
    const actual = fs
      .readdirSync(path.join(audioRoot, "original", style))
      .filter((name) => name.endsWith(".ogg"))
      .sort();
    assert.deepEqual(actual, expectedTracks);
  }
});

test("legacy runtime MIDI and pre-bank OGG paths are absent", () => {
  for (const relative of ["midi", "ogg", "ogg.8bit"]) {
    assert.equal(fs.existsSync(path.join(audioRoot, relative)), false, relative);
  }
});

test("TinySynth is not an npm dependency", () => {
  for (const relative of ["package.json", "package-lock.json"]) {
    const text = fs.readFileSync(path.join(root, relative), "utf8");
    assert.equal(text.includes("webaudio-tinysynth"), false, relative);
  }
});
