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
  EditorDocument,
  paintTerrain,
} from "../dist/index.js";
import { Terrain } from "../../model/dist/index.js";

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
    "rules",
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
      key: "dialogId",
      kind: "string",
      label: "对白 ID",
      placeholder: "例如 custom.sandman.greeting",
    },
    {
      key: "dialogue",
      kind: "string",
      label: "自定义对白",
      multiline: true,
      maxLength: 1000,
      placeholder: "可选的即时显示文本",
    },
  ]);
});

test("实例 Trait 按 Object Definition 白名单 round-trip", () => {
  const level = createBlankLevel(8, 8);
  level.objects.push({
    type: ObjectId.CRUMBLY_ROCK,
    x: 3,
    y: 3,
    traits: ["pushable"],
  });
  const parsed = parseEditorLevel(serializeEditorLevel(level));
  assert.deepEqual(parsed.objects[0]?.traits, ["pushable"]);
  assert.throws(
    () => normalizeEditorLevel({
      ...level,
      objects: [{ type: ObjectId.CARROT, x: 2, y: 2, traits: ["pushable"] }],
    }),
    /不允许实例 Trait/,
  );
});

test("一次 stroke 形成一个 Undo，回到保存点时 dirty 恢复", () => {
  const document = new EditorDocument(createBlankLevel(8, 8));
  document.beginTransaction();
  document.execute(paintTerrain({ x: 1, y: 1 }, Terrain.WATER));
  document.execute(paintTerrain({ x: 2, y: 1 }, Terrain.WATER));
  document.commitTransaction();
  assert.equal(document.getSnapshot().canUndo, true);
  assert.equal(document.getSnapshot().dirty, true);
  document.undo();
  assert.equal(document.getSnapshot().canUndo, false);
  assert.equal(document.getSnapshot().dirty, false);
  assert.equal(document.getSnapshot().level.terrain[1][1], Terrain.GROUND_C);
  assert.equal(document.getSnapshot().level.terrain[1][2], Terrain.GROUND_C);
});
