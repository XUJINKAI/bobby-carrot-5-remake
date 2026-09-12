import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("World Callout 使用独立 aria-live 状态节点", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/WorldCalloutAnnouncer.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /engine-world-callout-status/);
  assert.match(source, /setAttribute\("role", "status"\)/);
  assert.match(source, /setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /queueMicrotask/);
  assert.doesNotMatch(source, /pointerEvents/);
});
