import test from "node:test";
import assert from "node:assert/strict";
import { entityMapDefinition, MapEntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityCatalog,
  SpatialVisualQuery,
  visualRegistry,
} from "../../engine/dist/public.js";
import {
  EditorDocument,
  EditorPreview,
  buildInspectorModel,
  builtinEditorDefinition,
  createBlankLevel,
  entityCells,
  fromLevelMap,
  isEditorEntityCreatable,
  paintSurface,
  parseEditorLevel,
  placeEntity,
  reorderEntityStack,
  resolveEditorEntityPreviewLayout,
  resolveEditorPalette,
  resolvePlacement,
  serializeEditorLevel,
  toLevelMap,
  updateMetadata,
  validateEditorLevel,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

test("Editor JSON only stores canonical Entity Map plus document metadata", () => {
  const level = createBlankLevel(10, 8);
  level.meta.name = "Test Map";
  level.meta.author = "xjk";
  level.entities.push({
    type: MapEntityTypeId.SANDMAN,
    x: 4,
    y: 4,
    dialogue: "作者写的话",
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
    map.entities.find((entity) => entity.type === MapEntityTypeId.SANDMAN),
    {
      type: MapEntityTypeId.SANDMAN,
      x: 4,
      y: 4,
      dialogue: "作者写的话",
    },
  );
});

test("Editor metadata command edits and clears the top-level note", () => {
  const level = createBlankLevel(10, 8);
  const withNote = updateMetadata({
    name: "Note Test",
    author: "xjk",
    note: "地图注记",
  }).apply(level);
  assert.equal(withNote.note, "地图注记");
  assert.deepEqual(withNote.meta, { name: "Note Test", author: "xjk" });

  const withoutNote = updateMetadata({ name: "Note Test" }).apply(withNote);
  assert.equal("note" in withoutNote, false);
});

test("multi-cell persistence stays anchor-only while Preview expands Presence roles", () => {
  const level = createBlankLevel(12, 8);
  level.entities.push({
    type: MapEntityTypeId.DRAGON,
    x: 3,
    y: 3,
    direction: "left",
  });
  const map = toLevelMap(level);
  const dragons = map.entities.filter(
    (entity) => entity.type === MapEntityTypeId.DRAGON,
  );
  assert.deepEqual(dragons, [
    { type: MapEntityTypeId.DRAGON, x: 3, y: 3, direction: "left" },
  ]);

  const preview = new EditorPreview(level, catalog);
  const ref = {
    index: level.entities.findIndex(
      (entity) => entity.type === MapEntityTypeId.DRAGON,
    ),
  };
  assert.deepEqual(entityCells(preview, ref), [
    { x: 2, y: 3, role: "head" },
    { x: 3, y: 3, role: "body" },
    { x: 4, y: 3, role: "tail" },
  ]);
  assert.equal(
    fromLevelMap(map).entities.filter(
      (entity) => entity.type === MapEntityTypeId.DRAGON,
    ).length,
    1,
  );
});

test("Dragon right-facing footprint mirrors around the placement body", () => {
  const level = createBlankLevel(12, 8);
  const dragon = resolvePlacement(
    level,
    catalog,
    { type: MapEntityTypeId.DRAGON, direction: "right" },
    { x: 5, y: 3 },
    builtinEditorDefinition,
  );
  assert.equal(dragon.valid, true);
  assert.deepEqual(dragon.entity, {
    type: MapEntityTypeId.DRAGON,
    x: 5,
    y: 3,
    direction: "right",
  });
  assert.deepEqual(dragon.cells, [
    { x: 6, y: 3, role: "head" },
    { x: 5, y: 3, role: "body" },
    { x: 4, y: 3, role: "tail" },
  ]);
});

test("placement derives persisted anchor from Editor role placementPoint", () => {
  const level = createBlankLevel(12, 8);
  const dragon = resolvePlacement(
    level,
    catalog,
    { type: MapEntityTypeId.DRAGON, direction: "left" },
    { x: 5, y: 3 },
    builtinEditorDefinition,
  );
  assert.equal(dragon.valid, true);
  assert.deepEqual(dragon.entity, {
    type: MapEntityTypeId.DRAGON,
    x: 5,
    y: 3,
    direction: "left",
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
    MapEntityTypeId.GRASS,
  ]);
  const after = placeEntity(
    catalog,
    MapEntityTypeId.CARROT,
    { x: 1, y: 1 },
  ).apply(
    paintSurface(
      catalog,
      [{ x: 1, y: 1 }],
      { terrain: "water", pattern: "exact", exact: MapEntityTypeId.WATER, seed: 1 },
    ).apply(level),
  );
  assert.deepEqual(
    new EditorPreview(after, catalog)
      .inspectCell(1, 1)
      .presences.map((item) => item.entity.type),
    [MapEntityTypeId.WATER, MapEntityTypeId.CARROT],
  );

  const withLock = placeEntity(
    catalog,
    MapEntityTypeId.LOCK,
    { x: 1, y: 1 },
  ).apply(after);
  assert.deepEqual(
    new EditorPreview(withLock, catalog)
      .inspectCell(1, 1)
      .presences.map((item) => item.entity.type),
    [MapEntityTypeId.WATER, MapEntityTypeId.CARROT, MapEntityTypeId.LOCK],
  );
});

test("Entity fields and instance stack order round-trip", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    {
      type: MapEntityTypeId.SPEED_SWITCH,
      x: 3,
      y: 3,
      stackOrder: 2300,
      pressed: true,
    },
    { type: MapEntityTypeId.CRUMBLY_ROCK, x: 4, y: 3 },
  );
  const parsed = parseEditorLevel(serializeEditorLevel(level));
  const speedSwitch = parsed.entities.find(
    (entity) => entity.type === MapEntityTypeId.SPEED_SWITCH,
  );
  assert.equal(speedSwitch?.pressed, true);
  assert.equal(speedSwitch?.stackOrder, 2300);
  assert.equal(
    parsed.entities.find(
      (entity) => entity.type === MapEntityTypeId.CRUMBLY_ROCK,
    )?.traits,
    undefined,
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
      (entity) => entity.type !== MapEntityTypeId.BOBBY,
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
  document.execute(placeEntity(catalog, MapEntityTypeId.CARROT, { x: 1, y: 1 }));
  document.execute(placeEntity(catalog, MapEntityTypeId.CARROT, { x: 2, y: 1 }));
  document.commitTransaction();
  assert.equal(document.getSnapshot().canUndo, true);
  assert.equal(document.getSnapshot().dirty, true);
  document.undo();
  assert.equal(document.getSnapshot().canUndo, false);
  assert.equal(document.getSnapshot().dirty, false);
  const preview = new EditorPreview(document.getSnapshot().level, catalog);
  assert.equal(
    preview.inspectCell(1, 1).top?.entity.type,
    MapEntityTypeId.GRASS,
  );
  assert.equal(
    preview.inspectCell(2, 1).top?.entity.type,
    MapEntityTypeId.GRASS,
  );
});

test("Engine authoring metadata 隐藏 runtime-only 与 raw Original variant", () => {
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      "consumed-carrot",
      catalog,
    ),
    false,
  );
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      "grass",
      catalog,
    ),
    false,
  );
});

test("Palette 只发布具有 Model Definition 的 canonical directional preset", () => {
  const palette = resolveEditorPalette(catalog, builtinEditorDefinition);
  const speed = palette
    .flatMap((group) => group.rows.flat())
    .filter((entry) => entry.type === MapEntityTypeId.SPEED);
  assert.deepEqual(
    speed.map((entry) => entry.direction),
    ["up", "down", "left", "right"],
  );
  assert.equal(
    palette.flatMap((group) => group.rows.flat())
      .some((entry) => entry.type === "ts-1-1"),
    false,
  );
  assert.equal(
    palette
      .flatMap((group) => group.rows.flat())
      .some((entry) => entry.type === MapEntityTypeId.ORIGINAL_TILE),
    false,
  );
  const allTypes = palette.flatMap((group) => group.rows.flat()).map((item) => item.type);
  assert.equal(allTypes.includes(MapEntityTypeId.EGG), true);
  assert.equal(allTypes.every((type) => entityMapDefinition(type)), true);
  assert.deepEqual(
    palette
      .flatMap((group) => group.rows.flat())
      .filter((entry) => entry.type === MapEntityTypeId.WINDMILL)
      .map((entry) => entry.direction),
    ["up", "down", "left", "right"],
  );
  const egg = palette
    .flatMap((group) => group.rows.flat())
    .find((entry) => entry.type === MapEntityTypeId.EGG);
  assert.equal(egg?.label, "Egg");
  assert.equal(egg?.traits.includes("egg-nest"), true);
});

test("Editor 对合并后的 canonical Entity 共用 Runtime Definition", () => {
  const level = createBlankLevel(4, 2);
  level.entities.push(
    { type: MapEntityTypeId.WINDMILL, x: 1, y: 0, direction: "left" },
    { type: MapEntityTypeId.EGG, x: 2, y: 0 },
  );
  assert.deepEqual(
    validateEditorLevel(level, catalog, builtinEditorDefinition),
    [],
  );
  assert.deepEqual(
    [1, 2].map(
      (x) => new EditorPreview(level, catalog).inspectCell(x, 0).top?.entity.type,
    ),
    [MapEntityTypeId.WINDMILL, MapEntityTypeId.EGG],
  );
  assert.equal(
    resolvePlacement(
      level,
      catalog,
      { type: MapEntityTypeId.WINDMILL, direction: "right" },
      { x: 0, y: 1 },
    ).entity.type,
    MapEntityTypeId.WINDMILL,
  );
});

test("Editor Preview 将 Surface variant 投影到 Engine visual state", () => {
  const level = createBlankLevel(2, 1);
  level.entities.push({
    type: MapEntityTypeId.GRASS,
    x: 0,
    y: 0,
    variant: "ts-7-1",
  });
  level.entities.push({
    type: MapEntityTypeId.GRASS,
    x: 1,
    y: 0,
    variant: "ts-10-1",
  });
  const preview = new EditorPreview(level, catalog);
  const entities = preview.entities.all().slice(-2);
  assert.deepEqual(
    entities.map((entity) => entity.state?.variant),
    ["ts-7-1", "ts-10-1"],
  );
  const query = new SpatialVisualQuery(preview.entities, preview.spatial);
  assert.deepEqual(
    entities.map((entity) => {
      const presence = preview.spatial.presencesForEntity(entity.id)[0];
      const visual = visualRegistry.resolve(catalog.require(entity.type), {
        entity,
        presence,
        query,
      });
      return [visual?.layers[0]?.row, visual?.layers[0]?.column];
    }),
    [[6, 0], [9, 0]],
  );
});

test("Palette preview layout derives full multi-cell footprint generically", () => {
  const layout = resolveEditorEntityPreviewLayout(
    catalog,
    { type: MapEntityTypeId.DRAGON, direction: "left" },
    builtinEditorDefinition,
  );
  assert.equal(layout.width, 3);
  assert.equal(layout.height, 1);
  assert.equal(layout.entity.type, MapEntityTypeId.DRAGON);
});

test("single-cell Inspector exposes every layer top-first", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.PORTAL, x: 3, y: 3, stackOrder: 1000 },
    { type: MapEntityTypeId.CARROT, x: 3, y: 3, stackOrder: 2000 },
  );
  const model = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 3, y: 3 }, focus: { x: 3, y: 3 } },
    builtinEditorDefinition,
  );
  assert.equal(model.mode, "cell");
  assert.deepEqual(model.layers.slice(0, 2).map((layer) => layer.entity.type), [
    MapEntityTypeId.CARROT,
    MapEntityTypeId.PORTAL,
  ]);
});

test("multi-cell Inspector groups same types and prioritizes editable groups", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.SPEED_SWITCH, x: 1, y: 1 },
    { type: MapEntityTypeId.SPEED_SWITCH, x: 2, y: 1 },
    { type: MapEntityTypeId.CARROT, x: 1, y: 2 },
  );
  const model = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 2, y: 2 } },
    builtinEditorDefinition,
  );
  assert.equal(model.mode, "multi");
  assert.equal(model.groups[0].type, MapEntityTypeId.SPEED_SWITCH);
  assert.equal(model.groups[0].count, 2);
  assert.equal(
    model.groups.find((group) => group.type === MapEntityTypeId.GRASS)?.count,
    4,
  );
});

test("Inspector 直接使用 canonical Entity Definition", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.EGG, x: 1, y: 1 },
    { type: MapEntityTypeId.BEANSTALK, x: 2, y: 1 },
    { type: MapEntityTypeId.WINDMILL, x: 3, y: 1, direction: "left" },
  );

  const cell = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 1, y: 1 } },
    builtinEditorDefinition,
  );
  assert.equal(cell.layers[0]?.definition.type, MapEntityTypeId.EGG);
  assert.equal(cell.layers[0]?.label, "Egg");

  const multi = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 3, y: 1 } },
    builtinEditorDefinition,
  );
  const definitions = new Map(
    multi.groups.map((group) => [group.type, group.definition.type]),
  );
  assert.equal(definitions.get(MapEntityTypeId.EGG), MapEntityTypeId.EGG);
  assert.equal(
    definitions.get(MapEntityTypeId.BEANSTALK),
    MapEntityTypeId.BEANSTALK,
  );
  assert.equal(
    definitions.get(MapEntityTypeId.WINDMILL),
    MapEntityTypeId.WINDMILL,
  );
  assert.equal(
    multi.groups.find((group) => group.type === MapEntityTypeId.EGG)?.label,
    "Egg",
  );
});

test("reordering a cell stack changes actual Spatial top Presence", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.PORTAL, x: 3, y: 3 },
    { type: MapEntityTypeId.CARROT, x: 3, y: 3 },
  );
  const portalIndex = level.entities.length - 2;
  const carrotIndex = level.entities.length - 1;
  const reordered = reorderEntityStack([
    { index: portalIndex },
    { index: carrotIndex },
  ]).apply(level);
  const preview = new EditorPreview(reordered, catalog);
  assert.equal(preview.inspectCell(3, 3).top?.entity.type, MapEntityTypeId.PORTAL);
});

test("Bobby Editor visual is fixed to the final down frame", () => {
  const resolve =
    builtinEditorDefinition.entities?.[MapEntityTypeId.BOBBY]?.editorVisual;
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
