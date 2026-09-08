import test from "node:test";
import assert from "node:assert/strict";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import {
  createBlankLevel,
  isSurfaceEntityType,
  materializeSurfaceVariants,
  paintSurface,
  parseEditorLevel,
  replaceSurfaceVisualVariant,
  serializeEditorLevel,
  surfaceVisualVariant,
  surfaceTerrain,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

function surfaceAt(level, x, y) {
  return [...level.entities]
    .reverse()
    .find(
      (entity) =>
        entity.x === x && entity.y === y && isSurfaceEntityType(entity.type),
    );
}

function hasAutoMetadata(entity) {
  return Object.keys(entity ?? {}).some((key) =>
    key.startsWith("__editorSurface"),
  );
}

test("Auto Surface is materialized before persistence and stays stable after reopen", () => {
  const draft = paintSurface(
    catalog,
    [{ x: 1, y: 1 }],
    { terrain: "grass", pattern: "auto", seed: 37 },
  ).apply(createBlankLevel(4, 4));

  assert.equal(hasAutoMetadata(surfaceAt(draft, 1, 1)), true);

  const materialized = materializeSurfaceVariants(draft);
  const fixed = surfaceAt(materialized, 1, 1);
  assert.ok(fixed);
  assert.equal(hasAutoMetadata(fixed), false);
  assert.match(fixed.variant, /^ts-\d+-\d+$/);

  const first = serializeEditorLevel(draft);
  const reopened = parseEditorLevel(first);
  const second = serializeEditorLevel(reopened);
  assert.equal(second, first);
});

test("Exact Surface persists the selected concrete visual", () => {
  const selected = "ts-8-1";
  const draft = paintSurface(
    catalog,
    [{ x: 2, y: 1 }],
    { terrain: "grass", pattern: "exact", exact: selected, seed: 1 },
  ).apply(createBlankLevel(4, 4));

  const reopened = parseEditorLevel(serializeEditorLevel(draft));
  const fixed = surfaceAt(reopened, 2, 1);
  assert.ok(fixed);
  assert.equal(fixed.type, "grass");
  assert.equal(fixed.variant, "ts-8-1");
  assert.equal(hasAutoMetadata(fixed), false);
});

test("Inspector Surface visual variant 复用 Palette atlas 身份", () => {
  const grass = {
    type: "grass",
    x: 2,
    y: 1,
    variant: "ts-7-1",
  };
  assert.equal(surfaceVisualVariant(grass), "ts-7-1");
  assert.deepEqual(
    replaceSurfaceVisualVariant(grass, "ts-8-1"),
    { type: "grass", x: 2, y: 1, variant: "ts-8-1" },
  );

  const fence = { type: "fence", x: 1, y: 1, variant: "ts-16-10" };
  assert.equal(surfaceVisualVariant(fence), "ts-16-10");
  assert.deepEqual(
    replaceSurfaceVisualVariant(fence, "ts-16-14"),
    { type: "fence", x: 1, y: 1, variant: "ts-16-14" },
  );
  assert.equal(
    surfaceVisualVariant({ type: "water", x: 1, y: 1, variant: "ripple" }),
    "ts-6-7",
  );
});
