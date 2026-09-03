import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("Debug dock fully hides when disabled and reopens both panes by default", () => {
  const source = fs.readFileSync(
    new URL("../src/debug/DebugSidebar.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /private enabled = false/);
  assert.match(source, /display: "none"/);
  assert.match(source, /this\.toolRoot\.style\.display = "none"/);
  assert.match(source, /this\.controlVisible = true/);
  assert.match(source, /this\.infoVisible = true/);
  assert.match(source, /this\.toolRoot\.style\.display = "flex"/);
  assert.match(source, /if \(!this\.enabled\) return/);
  assert.doesNotMatch(source, /this\.toolRoot\.hidden/);
});
