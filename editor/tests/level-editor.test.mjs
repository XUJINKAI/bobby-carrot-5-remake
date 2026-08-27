import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  VisualRegistry,
  createBuiltinEntityRegistry,
} from "../../engine/dist/index.js";
import {
  createBlankLevel,
  fromLevelMap,
  parseEditorLevel,
  serializeEditorLevel,
  toLevelMap,
  EditorDocument,
  EditorPreview,
  entityCells,
  placeEntity,
  resolvePlacement,
  validateEditorLevel,
} from "../dist/index.js";

const registry = createBuiltinEntityRegistry();

test("Editor JSON only stores canonical Entity Map plus authoring metadata", () => {
  const level = createBlankLevel(10, 8);
  level.name = "Test Map";
  level.author = "xjk";
  level.entities.push({
    type: EntityTypeId.SANDMAN,
    x: 4,
    y: 4,
    properties: { dialogue: "作者写的话" },
  });
  const json = serializeEditorLevel(level);
  assert.equal(json.includes("\"terrain\""), false);
  assert.equal(json.includes("\"objects\""), false);
  assert.equal(json.includes("playerStart"), false);
  assert.equal(json.includes("作者写的话"), true);

  const parsed = parseEditorLevel(json);
  const map = toLevelMap(parsed);
  assert.deepEqual(Object.keys(map).sort(), [
    "entities",
    "height",
    "rules",
    "schemaVersion",
    "width",
  ]);
  assert.equal(map.schemaVersion, 1);
  assert.deepEqual(
    map.entities.find((entity) => entity.type === EntityTypeId.SANDMAN),
    {
      type: EntityTypeId.SANDMAN,
      x: 4,
      y: 4,
      properties: { dialogue: "作者写的话" },
    },
  );
});

test("multi-cell persistence stays anchor-only while Preview expands Presence roles", () => {
  const level = createBlankLevel(12, 8);
  level.entities.push({
    type: EntityTypeId.DRAGON,
    x: 3,
    y: 3,
    direction: "right",
  });
  const map = toLevelMap(level);
  const dragons = map.entities.filter((entity) => entity.type === EntityTypeId.DRAGON);
  assert.deepEqual(dragons, [
    { type: EntityTypeId.DRAGON, x: 3, y: 3, direction: "right" },
  ]);

  const preview = new EditorPreview(level, registry);
  const ref = { index: level.entities.findIndex((entity) => entity.type === EntityTypeId.DRAGON) };
  assert.deepEqual(entityCells(preview, ref), [
    { x: 3, y: 3, role: "head" },
    { x: 4, y: 3, role: "body" },
    { x: 5, y: 3, role: "tail" },
  ]);
  assert.equal(
    fromLevelMap(map).entities.filter((entity) => entity.type === EntityTypeId.DRAGON).length,
    1,
  );
});

test("placement derives footprint, cursor and same-group replacement from Definition", () => {
  const level = createBlankLevel(12, 8);
  const dragon = resolvePlacement(
    level,
    registry,
    EntityTypeId.DRAGON,
    { x: 5, y: 3 },
    { direction: "right" },
  );
  assert.equal(dragon.valid, true);
  assert.deepEqual(dragon.entity, {
    type: EntityTypeId.DRAGON,
    x: 4,
    y: 3,
    direction: "right",
  });
  assert.deepEqual(dragon.cells, [
    { x: 4, y: 3, role: "head" },
    { x: 5, y: 3, role: "body" },
    { x: 6, y: 3, role: "tail" },
  ]);

  const before = new EditorPreview(level, registry).inspectCell(1, 1);
  assert.deepEqual(before.presences.map((item) => item.entity.type), [EntityTypeId.GROUND_C]);
  const after = placeEntity(
    registry,
    EntityTypeId.WATER,
    { x: 1, y: 1 },
  ).apply(level);
  assert.deepEqual(
    new EditorPreview(after, registry).inspectCell(1, 1).presences.map((item) => item.entity.type),
    [EntityTypeId.WATER],
  );
});

test("Entity state and instance traits round-trip without splitting type", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    {
      type: EntityTypeId.SPEED_SWITCH,
      x: 3,
      y: 3,
      state: { pressed: true },
    },
    {
      type: EntityTypeId.CRUMBLY_ROCK,
      x: 4,
      y: 3,
      traits: ["pushable"],
    },
  );
  const parsed = parseEditorLevel(serializeEditorLevel(level));
  assert.deepEqual(
    parsed.entities.find((entity) => entity.type === EntityTypeId.SPEED_SWITCH)?.state,
    { pressed: true },
  );
  assert.deepEqual(
    parsed.entities.find((entity) => entity.type === EntityTypeId.CRUMBLY_ROCK)?.traits,
    ["pushable"],
  );
});

test("validation resolves player and win traits from Entity Definitions", () => {
  const level = createBlankLevel(8, 8);
  assert.deepEqual(validateEditorLevel(level, registry), []);
  const withoutPlayer = {
    ...level,
    entities: level.entities.filter((entity) => entity.type !== EntityTypeId.BOBBY),
  };
  assert.ok(
    validateEditorLevel(withoutPlayer, registry).some((issue) =>
      issue.message.includes("一个 player Entity"),
    ),
  );
});

test("one placement stroke forms one Undo and returns to the saved Entity state", () => {
  const document = new EditorDocument(createBlankLevel(8, 8));
  document.beginTransaction();
  document.execute(placeEntity(registry, EntityTypeId.WATER, { x: 1, y: 1 }));
  document.execute(placeEntity(registry, EntityTypeId.WATER, { x: 2, y: 1 }));
  document.commitTransaction();
  assert.equal(document.getSnapshot().canUndo, true);
  assert.equal(document.getSnapshot().dirty, true);
  document.undo();
  assert.equal(document.getSnapshot().canUndo, false);
  assert.equal(document.getSnapshot().dirty, false);
  const preview = new EditorPreview(document.getSnapshot().level, registry);
  assert.equal(preview.inspectCell(1, 1).top?.entity.type, EntityTypeId.GROUND_C);
  assert.equal(preview.inspectCell(2, 1).top?.entity.type, EntityTypeId.GROUND_C);
});

test("persisted visual variant 使用会话 placement sequence 初始化一次并随 JSON 固定", () => {
  const customRegistry = createBuiltinEntityRegistry();
  customRegistry.register({
    type: "flower",
    traits: [],
    stackBand: "content",
    presentation: { name: "Flower", visual: "flower-visual" },
    authoring: { palette: true, category: "test" },
  });
  const visuals = new VisualRegistry();
  visuals.register({
    id: "flower-visual",
    authoring: {
      persistedVariant: {
        property: "visualVariant",
        values: ["white", "yellow", "pink", "red"],
      },
    },
    resolve: () => null,
  });

  const document = new EditorDocument(createBlankLevel(8, 8));
  assert.equal(document.getSnapshot().placementSequence, 0);
  assert.equal(
    document.executePlacement((placementSequence) =>
      placeEntity(
        customRegistry,
        "flower",
        { x: 2, y: 2 },
        {},
        { placementSequence, visuals },
      ),
    ),
    true,
  );
  assert.equal(document.getSnapshot().placementSequence, 1);
  const flower = document.getSnapshot().level.entities.find((entity) => entity.type === "flower");
  assert.ok(flower?.properties?.visualVariant);
  const variant = flower.properties.visualVariant;

  const parsed = parseEditorLevel(serializeEditorLevel(document.getSnapshot().level));
  assert.equal(
    parsed.entities.find((entity) => entity.type === "flower")?.properties?.visualVariant,
    variant,
  );

  assert.equal(
    document.executePlacement((placementSequence) =>
      placeEntity(
        customRegistry,
        "flower",
        { x: -1, y: 0 },
        {},
        { placementSequence, visuals },
      ),
    ),
    false,
  );
  assert.equal(document.getSnapshot().placementSequence, 1);
});
