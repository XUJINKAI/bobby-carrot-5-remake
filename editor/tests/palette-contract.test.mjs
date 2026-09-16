import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { builtinEngineEnvironment } from "../../engine/dist/public.js";
import { createWorld } from "../../engine/dist/entities/WorldComposition.js";
import {
  createBlankLevel,
  EditorRuleDetector,
  builtinEditorDefinition,
  enableEditorRules,
  editorRuleMode,
  inspectEditorRules,
  paletteItems,
  parseEditorLevel,
  placeEntity,
  resolvePlacement,
  resolveEditorPalette,
  serializeEditorLevel,
  toLevelMap,
  updateEditorRule,
  updateEditorRuleMode,
} from "../dist/index.js";

const environment = builtinEngineEnvironment;
const catalog = environment.catalog;

test("Inspector 与快捷键使用稳定的方向和转角顺序", () => {
  const fields = (type) =>
    builtinEditorDefinition.entities[type].variants.map(
      (variant) => variant.fields,
    );
  for (const type of [
    MapEntityTypeId.SPEED,
    MapEntityTypeId.TIDE,
    MapEntityTypeId.WINDMILL,
  ]) {
    assert.deepEqual(
      fields(type).map((variant) => variant.direction),
      ["up", "right", "down", "left"],
      type,
    );
  }
  assert.deepEqual(
    fields(MapEntityTypeId.DRAGON).map((variant) => variant.direction),
    ["right", "left"],
  );
  assert.deepEqual(fields(MapEntityTypeId.WIND_SWITCH), [
    { direction: "up", active: false },
    { direction: "right", active: false },
    { direction: "down", active: false },
    { direction: "left", active: false },
  ]);
  assert.deepEqual(
    fields(MapEntityTypeId.MIRROR).map((variant) => variant.variant),
    ["right-top", "right-bottom", "left-bottom", "left-top"],
  );
  assert.deepEqual(
    builtinEditorDefinition.entities[MapEntityTypeId.MIRROR].variants.map(
      (variant) => variant.label,
    ),
    ["rt", "rb", "lb", "lt"],
  );
  assert.deepEqual(
    fields(MapEntityTypeId.CAROUSEL).map((variant) => variant.variant),
    [
      "right-top",
      "right-bottom",
      "left-bottom",
      "left-top",
      "vertical",
      "horizontal",
    ],
  );
  assert.deepEqual(
    builtinEditorDefinition.entities[MapEntityTypeId.CAROUSEL].variants
      .slice(0, 4)
      .map((variant) => variant.label),
    ["rt", "rb", "lb", "lt"],
  );
  assert.deepEqual(fields(MapEntityTypeId.PORTAL), [
    { channel: "blue", color: "#54e8ff" },
    { channel: "red", color: "#ff466e" },
    { channel: "green", color: "#31d87b" },
  ]);
});

test("Trap 缩略图显示 active，放置 preset 使用 inactive", () => {
  const trap = resolveEditorPalette(catalog, builtinEditorDefinition)
    .flatMap((group) => group.rows.flat())
    .find((entry) => entry.type === MapEntityTypeId.TRAP);
  assert.ok(trap);
  assert.deepEqual(trap.fields, { active: false });
  assert.deepEqual(trap.preview?.state, { active: true });
  assert.deepEqual(
    resolvePlacement(
      createBlankLevel(4, 4),
      environment,
      trap,
      { x: 1, y: 1 },
      builtinEditorDefinition,
    ).entity,
    {
      type: MapEntityTypeId.TRAP,
      x: 1,
      y: 1,
      active: false,
      stackOrder: 0,
    },
  );
});

test("Palette 条目暴露 Model Definition 支持的字段名", () => {
  const bobby = paletteItems(catalog).find(
    (entry) => entry.type === MapEntityTypeId.BOBBY,
  );
  assert.ok(bobby);
  assert.deepEqual(bobby.supportedFields, ["controller", "mirrorX", "mirrorY"]);
});

test("每个 Palette Entity 都声明 authoring stackSlot", () => {
  for (const item of paletteItems(catalog)) {
    assert.ok(
      builtinEditorDefinition.entities?.[item.type]?.stackSlot,
      item.type,
    );
  }
});

test("每个可见 Palette 条目都可放置、保存并加载为 World", () => {
  for (const preset of paletteItems(catalog)) {
    const level = createBlankLevel();
    const cell = { x: 5, y: 5 };
    assert.equal(resolvePlacement(level, environment, preset, cell).valid, true, preset.type);
    const placed = placeEntity(environment, preset, cell).apply(level);
    const restored = parseEditorLevel(serializeEditorLevel(placed));
    assert.doesNotThrow(() => createWorld(toLevelMap(restored)), preset.type);
  }
});

test("新检测到的可用规则可一次性启用", () => {
  const level = {
    ...createBlankLevel(4, 4),
    entities: [
      ...createBlankLevel(4, 4).entities,
      { type: MapEntityTypeId.CARROT, x: 1, y: 1 },
    ],
  };
  assert.deepEqual(
    inspectEditorRules(level, environment).find(({ kind }) => kind === "carrots"),
    { kind: "carrots", available: true, enabled: false },
  );
  const enabled = enableEditorRules(environment, ["carrots", "exit"]).apply(level);
  assert.deepEqual(enabled.rules?.win, {
    type: "all",
    conditions: [
      { type: "carrot" },
      { type: "exit" },
    ],
  });
  const detector = new EditorRuleDetector();
  assert.deepEqual(detector.detect(level, environment), ["carrots"]);
  assert.deepEqual(detector.detect(level, environment), []);
  const disabled = updateEditorRule(environment, "carrots", false).apply(enabled);
  assert.deepEqual(detector.detect(disabled, environment), []);
  detector.reset();
  assert.deepEqual(detector.detect(level, environment), ["carrots"]);
});

test("Editor 保留并切换一层胜利条件的 any/all 模式", () => {
  const blank = createBlankLevel(4, 4);
  const level = {
    ...blank,
    entities: [
      ...blank.entities,
      { type: MapEntityTypeId.CARROT, x: 1, y: 1 },
    ],
    rules: {
      win: {
        type: "any",
        conditions: [{ type: "carrot" }, { type: "exit" }],
      },
    },
  };

  assert.equal(editorRuleMode(level), "any");
  assert.equal(
    inspectEditorRules(level, environment).find(({ kind }) => kind === "carrots")?.enabled,
    true,
  );
  const withoutCarrots = updateEditorRule(environment, "carrots", false).apply(level);
  assert.deepEqual(withoutCarrots.rules?.win, {
    type: "any",
    conditions: [{ type: "exit" }],
  });
  const all = updateEditorRuleMode("all").apply(withoutCarrots);
  assert.equal(editorRuleMode(all), "all");
  assert.deepEqual(all.rules?.win, {
    type: "all",
    conditions: [{ type: "exit" }],
  });
});

test("Editor 规则提示通过 Engine Goal 识别 Egg", () => {
  const level = {
    ...createBlankLevel(2, 2),
    entities: [
      ...createBlankLevel(2, 2).entities,
      { type: MapEntityTypeId.EGG, x: 1, y: 1 },
    ],
  };
  assert.deepEqual(
    inspectEditorRules(level, environment).find(({ kind }) => kind === "eggs"),
    { kind: "eggs", available: true, enabled: false },
  );
});

test("三色云朵停靠格放置后保留底层地形与持久化颜色", () => {
  for (const color of ["red", "purple", "green"]) {
    const level = createBlankLevel();
    const cell = { x: 5, y: 5 };
    const ground = level.entities.find((entity) => entity.x === 5 && entity.y === 5);
    const placed = placeEntity(environment, {
      type: "cloud-parking",
      fields: { color },
    }, cell).apply(level);
    const restored = parseEditorLevel(serializeEditorLevel(placed));
    assert.deepEqual(
      restored.entities.filter((entity) => entity.x === 5 && entity.y === 5),
      [ground, { type: "cloud-parking", ...cell, stackOrder: 1, color }],
    );
  }
});

test("草下胡萝卜与 egg 组合可以往返保存", () => {
  for (const type of ["carrot", "egg"]) {
    let level = createBlankLevel();
    for (const entityType of [type, "high-grass"])
      level = placeEntity(environment, entityType, { x: 5, y: 5 }).apply(level);
    const restored = parseEditorLevel(serializeEditorLevel(level));
    assert.deepEqual(
      restored.entities.filter((entity) => entity.x === 5 && entity.y === 5)
        .map((entity) => entity.type),
      ["grass", type, "high-grass"],
    );
  }
});
