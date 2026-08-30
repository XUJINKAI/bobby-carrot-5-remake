import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityCatalog,
  defineEntityModule,
} from "../../engine/dist/public.js";
import {
  EditorDocument,
  EditorPreview,
  builtinEditorDefinition,
  createBlankLevel,
  entityCells,
  fromLevelMap,
  isEditorEntityCreatable,
  parseEditorLevel,
  placeEntity,
  resolveEditorPalette,
  resolvePlacement,
  serializeEditorLevel,
  toLevelMap,
  validateEditorLevel,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

test("Editor JSON only stores canonical Entity Map plus document metadata", () => {
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
  const dragons = map.entities.filter(
    (entity) => entity.type === EntityTypeId.DRAGON,
  );
  assert.deepEqual(dragons, [
    { type: EntityTypeId.DRAGON, x: 3, y: 3, direction: "right" },
  ]);

  const preview = new EditorPreview(level, catalog);
  const ref = {
    index: level.entities.findIndex(
      (entity) => entity.type === EntityTypeId.DRAGON,
    ),
  };
  assert.deepEqual(entityCells(preview, ref), [
    { x: 3, y: 3, role: "head" },
    { x: 4, y: 3, role: "body" },
    { x: 5, y: 3, role: "tail" },
  ]);
  assert.equal(
    fromLevelMap(map).entities.filter(
      (entity) => entity.type === EntityTypeId.DRAGON,
    ).length,
    1,
  );
});

test("placement derives persisted anchor from Editor role placementPoint", () => {
  const level = createBlankLevel(12, 8);
  const dragon = resolvePlacement(
    level,
    catalog,
    { type: EntityTypeId.DRAGON, direction: "right" },
    { x: 5, y: 3 },
    builtinEditorDefinition,
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
});

test("Editor replaceGroup replaces only matching authoring layers", () => {
  const level = createBlankLevel(8, 8);
  const before = new EditorPreview(level, catalog).inspectCell(1, 1);
  assert.deepEqual(before.presences.map((item) => item.entity.type), [
    EntityTypeId.GROUND_C,
  ]);
  const after = placeEntity(
    catalog,
    EntityTypeId.WATER,
    { x: 1, y: 1 },
  ).apply(level);
  assert.deepEqual(
    new EditorPreview(after, catalog)
      .inspectCell(1, 1)
      .presences.map((item) => item.entity.type),
    [EntityTypeId.WATER],
  );

  const withCarrot = placeEntity(
    catalog,
    EntityTypeId.CARROT,
    { x: 1, y: 1 },
  ).apply(after);
  assert.deepEqual(
    new EditorPreview(withCarrot, catalog)
      .inspectCell(1, 1)
      .presences.map((item) => item.entity.type),
    [EntityTypeId.WATER, EntityTypeId.CARROT],
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
    parsed.entities.find(
      (entity) => entity.type === EntityTypeId.SPEED_SWITCH,
    )?.state,
    { pressed: true },
  );
  assert.deepEqual(
    parsed.entities.find(
      (entity) => entity.type === EntityTypeId.CRUMBLY_ROCK,
    )?.traits,
    ["pushable"],
  );
});

test("validation is executed through Editor definitions", () => {
  const level = createBlankLevel(8, 8);
  assert.deepEqual(
    validateEditorLevel(level, catalog, builtinEditorDefinition),
    [],
  );
  const withoutPlayer = {
    ...level,
    entities: level.entities.filter(
      (entity) => entity.type !== EntityTypeId.BOBBY,
    ),
  };
  assert.ok(
    validateEditorLevel(
      withoutPlayer,
      catalog,
      builtinEditorDefinition,
    ).some((issue) => issue.message.includes("一个 player Entity")),
  );
});

test("one placement stroke forms one Undo and returns to the saved Entity state", () => {
  const document = new EditorDocument(createBlankLevel(8, 8));
  document.beginTransaction();
  document.execute(placeEntity(catalog, EntityTypeId.WATER, { x: 1, y: 1 }));
  document.execute(placeEntity(catalog, EntityTypeId.WATER, { x: 2, y: 1 }));
  document.commitTransaction();
  assert.equal(document.getSnapshot().canUndo, true);
  assert.equal(document.getSnapshot().dirty, true);
  document.undo();
  assert.equal(document.getSnapshot().canUndo, false);
  assert.equal(document.getSnapshot().dirty, false);
  const preview = new EditorPreview(document.getSnapshot().level, catalog);
  assert.equal(
    preview.inspectCell(1, 1).top?.entity.type,
    EntityTypeId.GROUND_C,
  );
  assert.equal(
    preview.inspectCell(2, 1).top?.entity.type,
    EntityTypeId.GROUND_C,
  );
});

test("Editor exclusions hide internal and raw Original variants from creation", () => {
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      EntityTypeId.CONSUMED_CARROT,
    ),
    false,
  );
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      "background-variant-001",
    ),
    false,
  );
  assert.equal(
    isEditorEntityCreatable(builtinEditorDefinition, EntityTypeId.GROUND_C),
    true,
  );
});

test("Palette keeps explicit directional presets and appends new creatable types ungrouped", () => {
  const customCatalog = createBuiltinEntityCatalog();
  customCatalog.register(
    defineEntityModule({
      definition: {
        type: "flower",
        traits: [],
        stackOrder: 100,
        presentation: { name: "Flower" },
      },
    }),
  );
  const palette = resolveEditorPalette(customCatalog, builtinEditorDefinition);
  const speed = palette
    .flatMap((group) => group.rows.flat())
    .filter((entry) => entry.type === EntityTypeId.SPEED);
  assert.deepEqual(
    speed.map((entry) => entry.direction),
    ["up", "right", "down", "left"],
  );
  assert.equal(
    palette.find((group) => group.id === "ungrouped")?.rows[0]
      .some((entry) => entry.type === "flower"),
    true,
  );
  assert.equal(
    palette.flatMap((group) => group.rows.flat())
      .some((entry) => entry.type === "background-variant-001"),
    false,
  );
});

test("Bobby Editor visual is fixed to the final down frame", () => {
  const resolve =
    builtinEditorDefinition.entities?.[EntityTypeId.BOBBY]?.editorVisual;
  assert.ok(resolve);
  assert.deepEqual(resolve({}).layers[0], {
    kind: "image",
    asset: "bobby-down",
    frameColumns: 8,
    frameRows: 1,
    frameIndex: 7,
    anchor: "bottom",
    offsetY: -12,
  });
});
