import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId, MapEntityTypeId } from "@bobby/model";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import {
  copyEntitySelection,
  createBlankLevel,
  pasteClipboard,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

test("Entity clipboard copies without Surface and pastes at the requested origin", () => {
  const level = createBlankLevel(6, 6);
  level.entities.push({ type: EntityTypeId.CARROT, x: 1, y: 1 });
  const clipboard = copyEntitySelection(level, catalog, {
    anchor: { x: 1, y: 1 },
    focus: { x: 1, y: 1 },
  });

  assert.deepEqual(clipboard.entities.map((entity) => entity.type), [
    EntityTypeId.CARROT,
  ]);
  const next = pasteClipboard(level, clipboard, { x: 4, y: 3 });
  assert.equal(
    next.entities.some(
      (entity) =>
        entity.type === EntityTypeId.CARROT && entity.x === 4 && entity.y === 3,
    ),
    true,
  );
  assert.equal(
    next.entities.filter(
      (entity) =>
        entity.x === 4 &&
        entity.y === 3 &&
        entity.type === MapEntityTypeId.GRASS,
    ).length,
    1,
  );
});
