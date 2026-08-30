import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { resolveEntityVisualPreview } from "../dist/visual/preview.js";

test("Bobby authoring visual is fixed to the final b3 frame", () => {
  const composition = resolveEntityVisualPreview({
    type: EntityTypeId.BOBBY,
    direction: "left",
  });
  assert.deepEqual(composition?.layers[0], {
    kind: "image",
    asset: "bobby-down",
    frameColumns: 8,
    frameRows: 1,
    frameIndex: 7,
    anchor: "bottom",
    offsetY: -12,
  });
});
