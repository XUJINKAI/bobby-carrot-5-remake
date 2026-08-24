import test from "node:test";
import assert from "node:assert/strict";
import {
  ObjectId,
  expandObjectLayouts,
  isObjectAuthorable,
} from "../../engine/dist/index.js";
import {
  createBlankLevel,
  fromLevelMap,
  normalizeEditorLevel,
  parseEditorLevel,
  resizeEditorLevel,
  serializeEditorLevel,
  toLevelMap,
} from "../dist/level.js";
import { encodeShareLevel, decodeShareLevel } from "../dist/share.js";
test("Editor JSON only stores semantic LevelMap plus authoring metadata", () => {
  const level = createBlankLevel(10, 8);
  level.name = "Test Map";
  level.author = "xjk";
  level.objects.push({ type: ObjectId.CARROT, x: 4, y: 4 });
  const json = serializeEditorLevel(level);
  assert.equal(json.includes("recordSha256"), false);
  assert.equal(json.includes("hexId"), false);
  const parsed = parseEditorLevel(json),
    map = toLevelMap(parsed);
  assert.deepEqual(Object.keys(map).sort(), [
    "height",
    "objects",
    "terrain",
    "width",
  ]);
  assert.equal(map.width, 10);
  assert.equal(map.objects[0]?.type, ObjectId.CARROT);
});
test("multi-cell persistence stays anchor-only while runtime occupancy expands", () => {
  const level = createBlankLevel(12, 8);
  level.objects.push({ type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 });
  const semantic = toLevelMap(normalizeEditorLevel(level));
  assert.deepEqual(semantic.objects, [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 },
  ]);
  const runtimeObjects = expandObjectLayouts(
    semantic.objects,
    semantic.width,
    semantic.height,
  );
  assert.deepEqual(
    runtimeObjects.filter((object) => object.y === 3),
    [
      { type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 },
      { type: ObjectId.DRAGON_BODY, x: 4, y: 3 },
      { type: ObjectId.DRAGON_TAIL, x: 5, y: 3 },
    ],
  );
  assert.deepEqual(
    fromLevelMap({ ...semantic, objects: runtimeObjects }).objects,
    [{ type: ObjectId.DRAGON_HEAD_BASE, x: 3, y: 3 }],
  );
});
test("normalize drops internal layout parts and overlapping owners", () => {
  const level = createBlankLevel(10, 8);
  level.objects = [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 2, y: 2 },
    { type: ObjectId.DRAGON_BODY, x: 3, y: 2 },
    { type: ObjectId.CARROT, x: 4, y: 2 },
    { type: ObjectId.BEAN, x: 7, y: 2 },
  ];
  assert.deepEqual(normalizeEditorLevel(level).objects, [
    { type: ObjectId.DRAGON_HEAD_BASE, x: 2, y: 2 },
    { type: ObjectId.BEAN, x: 7, y: 2 },
  ]);
});
test("resize removes out-of-bounds multi-cell owners atomically", () => {
  const level = createBlankLevel(12, 12);
  level.objects.push(
    { type: ObjectId.DRAGON_HEAD_BASE, x: 9, y: 3 },
    { type: ObjectId.BEAN, x: 3, y: 3 },
  );
  assert.deepEqual(resizeEditorLevel(level, 10, 8).objects, [
    { type: ObjectId.BEAN, x: 3, y: 3 },
  ]);
});
test("authoring visibility is an Engine Definition fact", () => {
  assert.equal(isObjectAuthorable(ObjectId.CARROT), true);
  assert.equal(isObjectAuthorable(ObjectId.DRAGON_ANIM_1), false);
  assert.equal(isObjectAuthorable(ObjectId.ICE_MELT_2), false);
});
test("URL share uses the shared DAT anchor codec and round-trips metadata", async () => {
  const level = createBlankLevel(20, 16);
  level.name = "Shared Test";
  level.author = "xjk";
  level.description = "DAT binary share";
  level.objects.push(
    { type: ObjectId.DRAGON_HEAD_BASE, x: 5, y: 5 },
    { type: ObjectId.MOWER, x: 9, y: 8 },
  );
  const encoded = await encodeShareLevel(level);
  assert.ok(encoded.startsWith("d.") || encoded.startsWith("r."));
  const decoded = await decodeShareLevel(encoded);
  assert.deepEqual(decoded, normalizeEditorLevel(level));
  assert.ok(encoded.length < serializeEditorLevel(level).length);
});
