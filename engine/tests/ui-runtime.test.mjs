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

test("Gameplay HUD stays scoped to its own overlay area and keeps egg-nest semantics", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHud.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /inset:\s*"0"/);
  assert.match(source, /top:\s*"12px"/);
  assert.match(source, /right:\s*"12px"/);
  assert.match(source, /this\.sprite\("egg"\)/);
  assert.match(source, /state\.objective\.mode === "nest"/);
});

test("Item HUD only shows owned or collected items and reuses the Bonus Coin Entity visual", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHud.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /state\.inventory\.beans > 0/);
  assert.match(source, /goldenCarrotsCollected > 0/);
  assert.match(source, /bonusCoinsCollected > 0/);
  assert.match(source, /entityVisualIcon\(EntityTypeId\.BONUS_COIN\)/);
  assert.match(source, /resolveEntityVisualPreview\(\{ type \}\)/);
});
