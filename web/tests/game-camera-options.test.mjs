import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Explore 与 Adventure 使用各自的 Camera Pan 边界", async () => {
  const source = await readFile(
    new URL("../src/pages/game/gameplayCameraOptions.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /FREE_GAMEPLAY_CAMERA_OPTIONS[\s\S]*?panBounds: "map-edge"/,
  );
  assert.match(
    source,
    /ADVENTURE_GAMEPLAY_CAMERA_OPTIONS[\s\S]*?panBounds: "viewport"/,
  );
});

test("Editor Play Test 复用 Explore 自由镜头", async () => {
  const source = await readFile(
    new URL("../src/pages/editor/EditorPage.vue", import.meta.url),
    "utf8",
  );

  assert.match(source, /camera: FREE_GAMEPLAY_CAMERA_OPTIONS/);
});
