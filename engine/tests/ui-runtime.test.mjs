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

test("Gameplay HUD derives carrot and egg counters from semantic win progress", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHud.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /inset:\s*"0"/);
  assert.match(source, /top:\s*"12px"/);
  assert.match(source, /right:\s*"12px"/);
  assert.match(source, /this\.sprite\("egg"\)/);
  assert.match(source, /const winState = this\.game\.winState/);
  assert.match(source, /item\.type === "collect-all"/);
  assert.match(source, /item\.target === EntityTypeId\.CARROT/);
  assert.match(source, /item\.type === "fill-all"/);
  assert.match(source, /item\.target === EGG_NEST_TARGET/);
  assert.match(source, /item\.filler === EGG_FILLER/);
  assert.doesNotMatch(source, /push-goal|pushable/);
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
