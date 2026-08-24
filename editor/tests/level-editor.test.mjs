import test from "node:test";
import assert from "node:assert/strict";
import {
  ObjectId,
  expandObjectLayouts,
  inspectObjectDefinition,
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

test("Editor JSON only stores semantic LevelMap plus authoring metadata", () => {
  const level = createBlankLevel(10, 8);
  level.name = "Test Map";
  level.author = "xjk";
  level.objects.push({
    type: ObjectId.SANDMAN,
    x: 4,
    y: 4,
    properties: { dialogue: "作者写的话" },
  });
  const json = serializeEditorLevel(level);
  assert.equal(json.includes("recordSha256"), false);
  assert.equal(json.includes("hexId"), false);
  assert.equal(json.includes("作者写的话"), true);
  const parsed = parseEditorLevel(json),
    map = toLevelMap(parsed);
  assert.deepEqual(Object.keys(map).sort(), [
    "height",
    "objects",
    "terrain",
    "width",
  ]);
  assert.equal(map.width, 10);
  assert.deepEqual(map.objects[0], {
    type: ObjectId.SANDMAN,
    x: 4,
    y: 4,
    properties: { dialogue: "作者写的话" },
  });
});

test("multi-cell persistence stays anchor-only while runtime occupancy expands", () => {
  const level = createBlankLevel(12, 8);
  level.objects.push({
    type: ObjectId.SANDMAN,
    x: 3,
    y: 3,
    properties: { dialogue: "hello" },
  });
  const semantic = toLevelMap(normalizeEditorLevel(level));
  assert.deepEqual(semantic.objects, [
    {
      type: ObjectId.SANDMAN,
      x: 3,
      y: 3,
      properties: { dialogue: "hello" },
    },
  ]);
  const runtimeObjects = expandObjectLayouts(
    semantic.objects,
    semantic.width,
    semantic.height,
  );
  assert.deepEqual(runtimeObjects, [
    {
      type: ObjectId.SANDMAN,
      x: 3,
      y: 3,
      properties: { dialogue: "hello" },
    },
    {
      type: ObjectId.SANDMAN_BODY,
      x: 3,
      y: 4,
      properties: { dialogue: "hello" },
    },
  ]);
  assert.deepEqual(fromLevelMap({ ...semantic, objects: runtimeObjects }).objects, [
    {
      type: ObjectId.SANDMAN,
      x: 3,
      y: 3,
      properties: { dialogue: "hello" },
    },
  ]);
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

test("authoring visibility and properties are Engine Definition facts", () => {
  assert.equal(isObjectAuthorable(ObjectId.CARROT), true);
  assert.equal(isObjectAuthorable(ObjectId.DRAGON_ANIM_1), false);
  assert.equal(isObjectAuthorable(ObjectId.ICE_MELT_2), false);
  assert.deepEqual(inspectObjectDefinition(ObjectId.SANDMAN).authoring?.properties, [
    {
      key: "dialogue",
      kind: "string",
      label: "对白",
      multiline: true,
      maxLength: 1000,
      placeholder: "可选；留空时仍会触发空对白框",
    },
  ]);
});
