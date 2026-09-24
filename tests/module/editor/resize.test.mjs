import assert from "node:assert/strict";
import test from "node:test";
import { builtinEngineEnvironment } from "../../../engine/dist/public.js";
import {
  createBlankLevel,
  previewEditorResize,
} from "../../../editor/dist/index.js";

test("Editor 缩放地图时允许 1×1 的最小尺寸", () => {
  const level = createBlankLevel(3, 3);
  const result = previewEditorResize(
    level,
    builtinEngineEnvironment.catalog,
    {
      left: 0,
      right: -10,
      top: 0,
      bottom: -10,
    },
  );

  assert.equal(result.map.width, 1);
  assert.equal(result.map.height, 1);
  assert.deepEqual(result.edges, {
    left: 0,
    right: -2,
    top: 0,
    bottom: -2,
  });
});
