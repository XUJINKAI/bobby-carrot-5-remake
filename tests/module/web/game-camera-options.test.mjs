import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import {
  FREE_GAMEPLAY_CAMERA_OPTIONS,
  gameplayCameraOptions,
} from "../../../web/src/pages/game/gameplayCameraOptions.ts";

test("Explore 与 Adventure 使用各自的 Camera 初始缩放与 Pan 边界", () => {
  assert.equal(gameplayCameraOptions("explore"), FREE_GAMEPLAY_CAMERA_OPTIONS);
  assert.deepEqual(gameplayCameraOptions("explore"), {
    zoom: 0.9,
    minZoom: 0.25,
    maxZoom: 4,
    panBounds: "map-edge",
  });
  assert.deepEqual(gameplayCameraOptions("adventure"), {
    zoom: 0.95,
    minZoom: 0.8,
    maxZoom: 1.15,
    panBounds: "viewport",
  });
});

test("Editor Play Test 复用 Explore 自由镜头", async () => {
  const source = await readFile(
    new URL("../../../web/src/pages/editor/EditorPage.vue", import.meta.url),
    "utf8",
  );

  assert.match(source, /camera: FREE_GAMEPLAY_CAMERA_OPTIONS/);
});
