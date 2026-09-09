import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Explore 与 Adventure 使用各自的 Camera Pan 边界", async () => {
  const source = await readFile(
    new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /explore:\s*\{[\s\S]*?panBounds: "map-edge"[\s\S]*?\}/,
  );
  assert.match(
    source,
    /adventure:\s*\{[\s\S]*?panBounds: "viewport"[\s\S]*?\}/,
  );
});
