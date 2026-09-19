import test from "node:test";
import assert from "node:assert/strict";
import { BC5R_GAME_ID, entityMapDefinition, MapEntityTypeId } from "@bobby/model";
import {
  builtinEngineEnvironment,
  SpatialVisualQuery,
} from "../../engine/dist/public.js";
import {
  EditorDocument,
  EditorPreview,
  applyPlacementVariant,
  builtinEditorDefinition,
  createBlankLevel,
  cyclePlacementVariant,
  entityCells,
  fromLevelMap,
  isEditorEntityCreatable,
  paintSurface,
  parseEditorLevel,
  placeEntity,
  resolveEditorEntityPreviewLayout,
  resolveEditorPalette,
  resolvePalettePlacement,
  resolvePlacement,
  serializeEditorLevel,
  toLevelMap,
  updateEntityField,
  updateMetadata,
  updateMusic,
  validateEditorLevel,
} from "../dist/index.js";
import { World } from "../../engine/tests/support/World.mjs";

const environment = builtinEngineEnvironment;
const catalog = environment.catalog;
const visualRegistry = environment.visuals;

test("Editor Play Test 使用语义地图的 Goal，运行过程保持 Draft 原样", () => {
  const draft = {
    schemaVersion: 1,
    meta: { name: "Goal Play Test" },
    width: 3,
    height: 1,
    entities: [
      ...[0, 1, 2].map((x) => ({ type: MapEntityTypeId.GRASS, variant: "ts-10-1", x, y: 0 })),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
      { type: MapEntityTypeId.EXIT, x: 2, y: 0 },
    ],
    rules: {
      win: {
        type: "all",
        conditions: [{ type: "carrot" }, { type: "exit" }],
      },
    },
  };
  const saved = structuredClone(draft);
  const world = new World(toLevelMap(draft));
  const actor = world.query.entitiesWithFact("player")[0];
  const carrot = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.CARROT,
  })[0];

  assert.equal(world.winState.completed, false);
  assert.equal(world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input" },
    }],
  }).moves[0].moved, true);
  world.update({ tick: 1, stepMs: 350 });
  assert.equal(world.entity(carrot.id)?.state?.consumed, true);
  assert.equal(world.winState.conditions[0].completed, true);
  assert.equal(world.winState.completed, false);
  assert.deepEqual(draft, saved);
});

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
  assert.equal(JSON.parse(json).meta.game, BC5R_GAME_ID);
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

test("Editor metadata command 只修改显式字段并保留空字符串", () => {
  const level = createBlankLevel(10, 8);
  const withNote = updateMetadata({
    name: "Note Test",
    author: "xjk",
    note: "地图注记",
  }).apply(level);
  assert.deepEqual(withNote.meta, {
    game: BC5R_GAME_ID,
    name: "Note Test",
    author: "xjk",
    note: "地图注记",
  });

  const emptyNote = updateMetadata({ note: "" }).apply(withNote);
  assert.equal(emptyNote.meta.name, "Note Test");
  assert.equal(emptyNote.meta.author, "xjk");
  assert.equal(emptyNote.meta.note, "");
});

test("Editor 背景音乐使用省略字段表达默认随机", () => {
  const level = createBlankLevel(10, 8);
  const withMusic = updateMusic("shop").apply(level);
  assert.equal(withMusic.music, "shop");
  assert.equal(JSON.parse(serializeEditorLevel(withMusic)).music, "shop");

  const defaultMusic = updateMusic(undefined).apply(withMusic);
  assert.equal("music" in defaultMusic, false);
  assert.equal("music" in JSON.parse(serializeEditorLevel(defaultMusic)), false);

  const explicitRandom = parseEditorLevel(JSON.stringify({
    ...level,
    music: "random",
  }));
  assert.equal(explicitRandom.music, "random");
});

test("Editor 打开合法 MapDocument 时完整保留输入", () => {
  const source = {
    schemaVersion: 1,
    meta: {
      game: "another-game",
      name: "N".repeat(140),
      author: "A".repeat(90),
      note: "note".repeat(160),
    },
    music: "random",
    width: 1,
    height: 1,
    entities: [{ type: MapEntityTypeId.BOBBY, x: 0, y: 0 }],
  };
  assert.deepEqual(parseEditorLevel(JSON.stringify(source)), source);
  assert.deepEqual(JSON.parse(serializeEditorLevel(source)), source);
  assert.deepEqual(toLevelMap(source), {
    schemaVersion: 1,
    music: "random",
    width: 1,
    height: 1,
    entities: [{ type: MapEntityTypeId.BOBBY, x: 0, y: 0 }],
  });

  const large = {
    ...source,
    width: 256,
    height: 129,
    entities: [{ type: MapEntityTypeId.BOBBY, x: 255, y: 128 }],
  };
  assert.deepEqual(parseEditorLevel(JSON.stringify(large)), large);
  assert.deepEqual(JSON.parse(serializeEditorLevel(large)), large);

  const opaque = {
    ...source,
    meta: { name: "Opaque Surface" },
    entities: [{ type: "ts-1-1", x: 0, y: 0, stackOrder: 0 }],
  };
  assert.deepEqual(JSON.parse(serializeEditorLevel(opaque)), opaque);

  assert.equal(createBlankLevel(1, 1).width, 1);
  assert.equal(createBlankLevel(1, 1).height, 1);

  const emptyMeta = { ...source, meta: {} };
  assert.deepEqual(parseEditorLevel(JSON.stringify(emptyMeta)), emptyMeta);
  assert.deepEqual(JSON.parse(serializeEditorLevel(emptyMeta)), emptyMeta);
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

  const preview = new EditorPreview(level, environment);
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
    environment,
    { type: MapEntityTypeId.DRAGON, fields: { direction: "right" } },
    { x: 5, y: 3 },
    builtinEditorDefinition,
  );
  assert.equal(dragon.valid, true);
  assert.deepEqual(dragon.entity, {
    type: MapEntityTypeId.DRAGON,
    x: 5,
    y: 3,
    direction: "right",
    stackOrder: 1,
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
    environment,
    { type: MapEntityTypeId.DRAGON, fields: { direction: "left" } },
    { x: 5, y: 3 },
    builtinEditorDefinition,
  );
  assert.equal(dragon.valid, true);
  assert.deepEqual(dragon.entity, {
    type: MapEntityTypeId.DRAGON,
    x: 5,
    y: 3,
    direction: "left",
    stackOrder: 1,
  });
  assert.deepEqual(dragon.cells, [
    { x: 4, y: 3, role: "head" },
    { x: 5, y: 3, role: "body" },
    { x: 6, y: 3, role: "tail" },
  ]);
});

test("直立角色只把 Editor 光标格作为可选中的 body anchor", () => {
  const level = createBlankLevel(12, 8);
  for (const type of [
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.BEAVER,
    MapEntityTypeId.DREAM_MACHINE,
  ]) {
    const placement = resolvePlacement(
      level,
      environment,
      { type },
      { x: 5, y: 3 },
      builtinEditorDefinition,
    );
    assert.equal(placement.valid, true, type);
    assert.deepEqual(
      placement.entity,
      { type, x: 5, y: 3, stackOrder: 1 },
      type,
    );
    assert.deepEqual(placement.cells, [{ x: 5, y: 3 }], type);
  }
});

test("Entity fields and instance stack order round-trip", () => {
  const level = createBlankLevel(8, 8);
  level.entities[0].stackOrder = 0;
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
  const serialized = serializeEditorLevel(level);
  const stored = JSON.parse(serialized);
  assert.equal(stored.entities[0].stackOrder, 0);
  const parsed = parseEditorLevel(serialized);
  const speedSwitch = parsed.entities.find(
    (entity) => entity.type === MapEntityTypeId.SPEED_SWITCH,
  );
  assert.equal(speedSwitch?.pressed, true);
  assert.equal(speedSwitch?.stackOrder, 2300);
  assert.equal(
    parsed.entities.find(
      (entity) => entity.type === MapEntityTypeId.CRUMBLY_ROCK,
    )?.facts,
    undefined,
  );
});

test("dialogue string lists survive the complete Editor document round-trip", () => {
  const map = {
    schemaVersion: 1,
    width: 3,
    height: 3,
    entities: [
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      {
        type: MapEntityTypeId.BEAVER,
        x: 1,
        y: 1,
        dialogue: ["first", "second"],
      },
    ],
  };
  const document = new EditorDocument(fromLevelMap(map));
  const beaverIndex = document.getSnapshot().level.entities.findIndex(
    (entity) => entity.type === MapEntityTypeId.BEAVER,
  );

  assert.equal(document.execute(updateEntityField(
    { index: beaverIndex },
    "dialogue",
    ["third", "fourth"],
  )), true);

  const saved = serializeEditorLevel(document.getSnapshot().level);
  const restored = toLevelMap(parseEditorLevel(saved));
  assert.deepEqual(
    restored.entities.find(
      (entity) => entity.type === MapEntityTypeId.BEAVER,
    )?.dialogue,
    ["third", "fourth"],
  );
});

test("validation is executed through Editor definitions", () => {
  const level = createBlankLevel(8, 8);
  assert.deepEqual(
    validateEditorLevel(level, environment, builtinEditorDefinition),
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
      environment,
      builtinEditorDefinition,
    ).some((issue) => issue.message.includes("一个 player Entity")),
  );
});

test("Editor Preview 将字段无效的已知 Entity 降级为占位定义", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push({
    type: MapEntityTypeId.GRASS,
    x: 1,
    y: 1,
    variant: "future",
  });
  const preview = new EditorPreview(level, environment);
  const invalid = preview.inspectCell(1, 1).presences.find(
    (item) => item.entity.variant === "future",
  );

  assert.equal(invalid?.definition.placeholder, "unknown");
  assert.ok(
    validateEditorLevel(level, environment, builtinEditorDefinition).some(
      (issue) =>
        issue.level === "warning" &&
        issue.message.includes("variant 不符合 enum 合同"),
    ),
  );
});

test("one placement stroke forms one Undo and returns to the saved Entity state", () => {
  const document = new EditorDocument(createBlankLevel(8, 8));
  document.beginTransaction();
  document.execute(placeEntity(environment, MapEntityTypeId.CARROT, { x: 1, y: 1 }));
  document.execute(placeEntity(environment, MapEntityTypeId.CARROT, { x: 2, y: 1 }));
  document.commitTransaction();
  assert.equal(document.getSnapshot().canUndo, true);
  assert.equal(document.getSnapshot().dirty, true);
  document.undo();
  assert.equal(document.getSnapshot().canUndo, false);
  assert.equal(document.getSnapshot().dirty, false);
  const preview = new EditorPreview(document.getSnapshot().level, environment);
  assert.equal(
    preview.inspectCell(1, 1).top?.entity.type,
    MapEntityTypeId.GRASS,
  );
  assert.equal(
    preview.inspectCell(2, 1).top?.entity.type,
    MapEntityTypeId.GRASS,
  );
});

test("Editor definitions 决定可创建入口，Model 定义可持久化身份", () => {
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      "fireball",
    ),
    false,
  );
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      MapEntityTypeId.GRASS,
    ),
    true,
  );
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      MapEntityTypeId.BEANSTALK,
    ),
    false,
  );
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      MapEntityTypeId.ORIGINAL_TILE,
    ),
    false,
  );
  assert.equal(
    isEditorEntityCreatable(
      builtinEditorDefinition,
      MapEntityTypeId.TRANSPARENT,
    ),
    false,
  );
});

test("Palette 只发布具有 Model Definition 的 canonical preset", () => {
  const palette = resolveEditorPalette(catalog, builtinEditorDefinition);
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
  const egg = palette
    .flatMap((group) => group.rows.flat())
    .find((entry) => entry.type === MapEntityTypeId.EGG);
  assert.equal(egg?.label, "Egg");
});

test("EditorPlacementPreset 将 direction 保存在 fields 中", () => {
  const next = cyclePlacementVariant(
    { type: MapEntityTypeId.SPEED, fields: { direction: "up" } },
    catalog,
    builtinEditorDefinition.entities[MapEntityTypeId.SPEED],
    1,
  );
  assert.deepEqual(next, {
    type: MapEntityTypeId.SPEED,
    fields: { direction: "right" },
  });
  assert.equal("direction" in next, false);
  assert.equal(
    builtinEditorDefinition.entities[MapEntityTypeId.SPEED]
      .variants.every((variant) => !("direction" in variant)),
    true,
  );
  assert.deepEqual(
    builtinEditorDefinition.entities[MapEntityTypeId.SPEED].defaultFields,
    { direction: "right" },
  );
  assert.equal(
    resolvePlacement(
      createBlankLevel(4, 4),
      environment,
      { type: MapEntityTypeId.SPEED },
      { x: 1, y: 1 },
      builtinEditorDefinition,
    ).entity.direction,
    "right",
  );
});

test("带 fields 的响应式 Palette preset 可用于 Canvas 与 Inspector 预览", () => {
  const fields = new Proxy({ direction: "up" }, {});
  const preset = new Proxy({
    type: MapEntityTypeId.SPEED,
    fields,
  }, {});
  const plan = resolvePlacement(
    createBlankLevel(4, 4),
    environment,
    preset,
    { x: 1, y: 1 },
    builtinEditorDefinition,
  );
  assert.equal(plan.valid, true);
  assert.equal(plan.entity.direction, "up");
  const previewEntity = resolveEditorEntityPreviewLayout(
    catalog,
    preset,
    builtinEditorDefinition,
  ).entity;
  assert.equal(previewEntity.type, MapEntityTypeId.SPEED);
  assert.equal(previewEntity.direction, "up");
  assert.equal(
    cyclePlacementVariant(
      preset,
      catalog,
      builtinEditorDefinition.entities[MapEntityTypeId.SPEED],
      1,
    )?.fields?.direction,
    "right",
  );
});

test("Inspector variant 切换解析对应的放置 preset", () => {
  const palette = resolveEditorPalette(catalog, builtinEditorDefinition);
  const current = resolvePalettePlacement(
    catalog,
    builtinEditorDefinition,
    palette,
    { type: MapEntityTypeId.SPEED, fields: { direction: "up" } },
    "Speed",
  );
  const variant = builtinEditorDefinition.entities[MapEntityTypeId.SPEED]
    .variants[1];
  const preset = applyPlacementVariant(current, variant);
  const resolved = resolvePalettePlacement(
    catalog,
    builtinEditorDefinition,
    palette,
    preset,
    current.label,
  );
  assert.equal(resolved.fields?.direction, "right");
  assert.equal(resolved.previewPreset.fields?.direction, "right");
});

test("Palette 表独立控制顺序、预览外观与 variant 展开", () => {
  const editor = {
    ...builtinEditorDefinition,
    palette: {
      groups: [
        {
          id: "table",
          label: "Table",
          rows: [
            [
              {
                type: MapEntityTypeId.SPEED_SWITCH,
                label: "默认速度开关",
                fields: { pressed: false },
                preview: { fields: { pressed: true } },
              },
              {
                type: MapEntityTypeId.TIDE_SWITCH,
                expand: "variants",
              },
            ],
            [
              { type: MapEntityTypeId.EGG },
              { type: MapEntityTypeId.CARROT },
            ],
          ],
        },
      ],
    },
  };
  const [group] = resolveEditorPalette(catalog, editor);
  assert.ok(group);
  assert.deepEqual(
    group.rows[0].map((entry) => entry.type),
    [
      MapEntityTypeId.SPEED_SWITCH,
      MapEntityTypeId.TIDE_SWITCH,
      MapEntityTypeId.TIDE_SWITCH,
    ],
  );
  assert.equal(group.rows[0][0].label, "默认速度开关");
  assert.deepEqual(group.rows[0][0].fields, { pressed: false });
  assert.deepEqual(group.rows[0][0].previewPreset.fields, { pressed: true });
  assert.deepEqual(
    group.rows[0].slice(1).map((entry) => entry.fields?.pressed),
    [true, false],
  );
  assert.deepEqual(
    group.rows[1].map((entry) => entry.type),
    [MapEntityTypeId.EGG, MapEntityTypeId.CARROT],
  );
});

test("Palette remainder 按表顺序接收尚未使用的 Entity", () => {
  const editor = {
    ...builtinEditorDefinition,
    palette: {
      groups: [
        {
          id: "main",
          label: "Main",
          rows: [[{ type: MapEntityTypeId.EGG }]],
        },
      ],
      remainders: [
        {
          id: "remaining",
          label: "Remaining",
          types: [
            MapEntityTypeId.EGG,
            MapEntityTypeId.CARROT,
            MapEntityTypeId.BEANSTALK,
            MapEntityTypeId.SPEED_SWITCH,
          ],
          expand: "variants",
          rows: "by-type",
        },
      ],
    },
  };
  const palette = resolveEditorPalette(catalog, editor);
  assert.deepEqual(palette.map((group) => group.id), ["main", "remaining"]);
  assert.deepEqual(
    palette[1].rows.map((row) => row.map((entry) => entry.type)),
    [
      [MapEntityTypeId.CARROT],
      [MapEntityTypeId.SPEED_SWITCH, MapEntityTypeId.SPEED_SWITCH],
    ],
  );
});

test("Editor 对合并后的 canonical Entity 共用 Runtime Definition", () => {
  const level = createBlankLevel(4, 2);
  level.entities.push(
    { type: MapEntityTypeId.WINDMILL, x: 1, y: 0, direction: "left" },
    { type: MapEntityTypeId.EGG, x: 2, y: 0 },
  );
  assert.deepEqual(
    validateEditorLevel(level, environment, builtinEditorDefinition),
    [],
  );
  assert.deepEqual(
    [1, 2].map(
      (x) => new EditorPreview(level, environment).inspectCell(x, 0).top?.entity.type,
    ),
    [MapEntityTypeId.WINDMILL, MapEntityTypeId.EGG],
  );
  assert.equal(
    resolvePlacement(
      level,
      environment,
      { type: MapEntityTypeId.WINDMILL, fields: { direction: "right" } },
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
  const preview = new EditorPreview(level, environment);
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
    { type: MapEntityTypeId.DRAGON, fields: { direction: "left" } },
    builtinEditorDefinition,
  );
  assert.equal(layout.width, 3);
  assert.equal(layout.height, 1);
  assert.equal(layout.entity.type, MapEntityTypeId.DRAGON);
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

test("Egg 只在 Palette 预览中显示 filled 且保持单一放置形态", () => {
  const policy = builtinEditorDefinition.entities?.[MapEntityTypeId.EGG];
  assert.equal(policy?.editorVisual, undefined);
  assert.equal(policy.variants, undefined);

  const palette = resolveEditorPalette(catalog, builtinEditorDefinition);
  const eggs = palette
    .flatMap((group) => group.rows.flat())
    .filter((entry) => entry.type === MapEntityTypeId.EGG);
  assert.equal(eggs.length, 1);
  assert.deepEqual(eggs[0].preview?.state, { filled: true });
  assert.equal(eggs[0].previewPreset.fields, undefined);
  const placed = resolvePlacement(
    createBlankLevel(4, 4),
    environment,
    eggs[0],
    { x: 1, y: 1 },
    builtinEditorDefinition,
  );
  assert.deepEqual(placed.entity, {
    type: MapEntityTypeId.EGG,
    x: 1,
    y: 1,
    stackOrder: 1,
  });
});
