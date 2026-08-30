import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBlankLevel,
  validateEditorLevel,
} from "../dist/index.js";
import { createBuiltinEntityCatalog } from "../../engine/dist/authoring.js";

const catalog = createBuiltinEntityCatalog();

test("zero players is an authoring warning instead of an error", () => {
  const level = createBlankLevel(8, 8);
  level.entities = level.entities.filter(
    (entity) => entity.type !== EntityTypeId.BOBBY,
  );
  const issues = validateEditorLevel(level, catalog);
  assert.equal(issues.some((issue) => issue.level === "error"), false);
  assert.equal(
    issues.some(
      (issue) => issue.level === "warning" && issue.message.includes("player"),
    ),
    true,
  );
});

test("multiple players are valid authoring content", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push({ type: EntityTypeId.BOBBY, x: 2, y: 2 });
  const issues = validateEditorLevel(level, catalog);
  assert.equal(issues.some((issue) => issue.message.includes("player")), false);
});
