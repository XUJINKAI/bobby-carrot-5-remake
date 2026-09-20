import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { builtinEngineEnvironment } from "../../../engine/dist/public.js";
import {
  EditorPreview,
  builtinEditorDefinition,
  createBlankLevel,
  paintSurface,
  placeEntity,
  resolvePlacement,
} from "../../../editor/dist/index.js";

const environment = builtinEngineEnvironment;
const catalog = environment.catalog;

function typesAt(level, x, y) {
  return new EditorPreview(level, environment)
    .inspectCell(x, y)
    .presences.map((item) => item.entity.type);
}

test("stackSlot 只替换同层素材", () => {
  const level = createBlankLevel(8, 8);
  const surface = paintSurface(
    environment,
    [{ x: 1, y: 1 }],
    {
      terrain: "water",
      pattern: "exact",
      exact: MapEntityTypeId.WATER,
      seed: 1,
    },
  ).apply(level);
  const content = placeEntity(
    environment,
    MapEntityTypeId.CARROT,
    { x: 1, y: 1 },
  ).apply(surface);
  const occupant = placeEntity(
    environment,
    MapEntityTypeId.LOCK,
    { x: 1, y: 1 },
  ).apply(content);

  assert.deepEqual(typesAt(occupant, 1, 1), [
    MapEntityTypeId.WATER,
    MapEntityTypeId.CARROT,
    MapEntityTypeId.LOCK,
  ]);
  assert.deepEqual(
    new EditorPreview(occupant, environment)
      .inspectCell(1, 1)
      .presences.map((item) => item.presence.stackOrder),
    [0, 1, 2],
  );
});

test("同一 floor-feature slot 的新素材替换旧素材", () => {
  let level = createBlankLevel(8, 8);
  level = placeEntity(environment, MapEntityTypeId.TRAP, { x: 1, y: 1 }).apply(level);
  level = placeEntity(environment, MapEntityTypeId.SPEED, { x: 1, y: 1 }).apply(level);

  assert.deepEqual(typesAt(level, 1, 1), [
    MapEntityTypeId.GRASS,
    MapEntityTypeId.SPEED,
  ]);
  assert.equal(
    new EditorPreview(level, environment).inspectCell(1, 1).top?.presence.stackOrder,
    1,
  );
});

test("多格素材会原子替换覆盖范围内的同 slot 素材", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.LOCK, x: 2, y: 3 },
    { type: MapEntityTypeId.LOCK, x: 4, y: 3 },
  );

  const placed = placeEntity(
    environment,
    { type: MapEntityTypeId.DRAGON, fields: { direction: "left" } },
    { x: 3, y: 3 },
  ).apply(level);

  assert.equal(
    placed.entities.some((entity) => entity.type === MapEntityTypeId.LOCK),
    false,
  );
  for (const x of [2, 3, 4]) {
    assert.equal(typesAt(placed, x, 3).includes(MapEntityTypeId.DRAGON), true);
  }
});

test("非推荐的跨 slot 堆叠会返回结构化警告", () => {
  let level = createBlankLevel(8, 8);
  level = placeEntity(environment, MapEntityTypeId.LOCK, { x: 2, y: 2 }).apply(level);
  const warning = resolvePlacement(
    level,
    environment,
    { type: MapEntityTypeId.EGG },
    { x: 2, y: 2 },
    builtinEditorDefinition,
  ).warnings[0];

  assert.deepEqual(warning, {
    cell: { x: 2, y: 2 },
    existing: { index: level.entities.length - 1 },
    existingType: MapEntityTypeId.LOCK,
    placedSlot: "content",
    existingSlot: "occupant",
  });
});
