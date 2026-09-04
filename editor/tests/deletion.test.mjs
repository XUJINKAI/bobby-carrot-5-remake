import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import {
  builtinEditorDefinition,
  createBlankLevel,
  resolveDeletion,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

test("single-cell deletion removes only the top non-Surface entity", () => {
  const level = createBlankLevel(5, 5);
  level.entities.push(
    { type: EntityTypeId.CARROT, x: 1, y: 1, stackOrder: 110 },
    { type: EntityTypeId.BONUS_COIN, x: 1, y: 1, stackOrder: 120 },
  );

  const refs = resolveDeletion(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 1, y: 1 } },
    builtinEditorDefinition,
  );
  assert.equal(refs.length, 1);
  assert.equal(level.entities[refs[0].index].type, EntityTypeId.BONUS_COIN);
});

test("multi-cell deletion removes only the highest stackOrder layer", () => {
  const level = createBlankLevel(5, 5);
  level.entities.push(
    { type: EntityTypeId.CARROT, x: 1, y: 1, stackOrder: 110 },
    { type: EntityTypeId.BONUS_COIN, x: 1, y: 1, stackOrder: 130 },
    { type: EntityTypeId.BONUS_COIN, x: 2, y: 1, stackOrder: 130 },
    { type: EntityTypeId.CARROT, x: 2, y: 1, stackOrder: 120 },
  );

  const refs = resolveDeletion(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 2, y: 1 } },
    builtinEditorDefinition,
  );
  assert.equal(refs.length, 2);
  assert.deepEqual(
    refs.map((ref) => level.entities[ref.index].stackOrder).sort(),
    [130, 130],
  );
});

test("Palette deletion never selects Surface", () => {
  const level = createBlankLevel(5, 5);
  const refs = resolveDeletion(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 1, y: 1 } },
    builtinEditorDefinition,
  );
  assert.deepEqual(refs, []);
});
