import test from "node:test";
import assert from "node:assert/strict";
import {
  MapEntityTypeId,
  applyLevelPatches,
  entityMapDefinition,
  parseLevelMap,
} from "../dist/index.js";

const base = {
  schemaVersion: 1,
  width: 3,
  height: 2,
  entities: [
    { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    { type: MapEntityTypeId.LOCK, x: 1, y: 0 },
  ],
};

test("LevelPatch 在 clone 上按顺序应用四种基础操作", () => {
  const patched = applyLevelPatches(base, [
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.LOCK },
      fields: { requireKey: true, deathCountdownSeconds: 0 },
    },
    {
      operation: "add",
      entity: { type: MapEntityTypeId.LOCK_KEY, x: 2, y: 0 },
    },
    {
      operation: "replace-type",
      selector: { type: MapEntityTypeId.LOCK_KEY },
      type: MapEntityTypeId.SHOP_EMPTY,
    },
    {
      operation: "remove",
      selector: { type: MapEntityTypeId.BOBBY },
    },
  ]);

  assert.deepEqual(base.entities, [
    { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    { type: MapEntityTypeId.LOCK, x: 1, y: 0 },
  ]);
  assert.deepEqual(patched.entities, [
    {
      type: MapEntityTypeId.LOCK,
      x: 1,
      y: 0,
      requireKey: true,
      deathCountdownSeconds: 0,
    },
    { type: MapEntityTypeId.SHOP_EMPTY, x: 2, y: 0 },
  ]);
});

test("Lock 与关卡内钥匙字段声明包含零倒计时和缺省行为", () => {
  const lock = entityMapDefinition(MapEntityTypeId.LOCK);
  const key = entityMapDefinition(MapEntityTypeId.LOCK_KEY);

  assert.equal(
    lock.fields.find((field) => field.key === "deathCountdownSeconds").min,
    0,
  );
  assert.equal(
    lock.fields.find((field) => field.key === "requireKey").default,
    false,
  );
  assert.equal(
    key.fields.find((field) => field.key === "collectible").default,
    true,
  );
});

test("对白字段接受字符串或字符串数组并由 LevelPatch 原样写入", () => {
  const dialogue = ["第一段\n允许换行", "第二段"];
  const patched = applyLevelPatches({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [{ type: MapEntityTypeId.BEAVER, x: 0, y: 0 }],
  }, [{
    operation: "set-fields",
    selector: { type: MapEntityTypeId.BEAVER },
    fields: { dialogue },
  }]);
  const parsed = parseLevelMap(patched);

  assert.deepEqual(parsed.entities[0].dialogue, dialogue);
  assert.equal(
    entityMapDefinition(MapEntityTypeId.BEAVER).fields[0].kind,
    "string-or-string-list",
  );
});
