import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveGameMusic } from "../src/pages/game/gameMusic.ts";

test("Original music defaults come from product context", () => {
  assert.equal(
    resolveGameMusic(undefined, { bonus: false, specialScene: false }),
    "ingame1",
  );
  assert.equal(
    resolveGameMusic(undefined, { bonus: true, specialScene: false }),
    "bonus",
  );
  assert.equal(
    resolveGameMusic(undefined, { bonus: false, specialScene: true }),
    "title",
  );
});

test("Map music override takes precedence over product defaults", () => {
  assert.equal(
    resolveGameMusic("ingame0", { bonus: true, specialScene: true }),
    "ingame0",
  );
  assert.equal(
    resolveGameMusic("none", { bonus: true, specialScene: true }),
    null,
  );
});
