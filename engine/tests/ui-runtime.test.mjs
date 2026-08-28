import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("Gameplay HUD keeps chip nodes mounted across gameplay state changes", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHud.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /replaceChildren\(/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /private readonly objectiveCarrot/);
  assert.match(source, /private readonly bonusCoinChip/);
  assert.match(source, /chip\.root\.hidden = !visible/);
});
