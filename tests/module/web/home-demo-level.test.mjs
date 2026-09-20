import assert from "node:assert/strict";
import { test } from "vitest";
import { MapEntityTypeId, parseLevelMap } from "@bobby/model";
import { createHomeDemoLevel } from "../../../web/src/pages/home/homeDemoLevel.ts";

test("首页 Demo 补丁只修改加载副本中的角色、传送门和箱子", () => {
  const original = {
    schemaVersion: 1,
    width: 16,
    height: 16,
    entities: [
      { type: MapEntityTypeId.SNOWMAN, x: 10, y: 6, variant: "ts-4-3" },
      { type: MapEntityTypeId.SANDMAN, x: 6, y: 6 },
    ],
  };

  const patched = parseLevelMap(createHomeDemoLevel(original));
  assert.equal(original.entities.length, 2);
  assert.equal(original.entities[0].dialogue, undefined);
  assert.equal(original.entities[1].dialogue, undefined);
  assert.ok(Array.isArray(patched.entities[0].dialogue));
  assert.ok(patched.entities[0].dialogue.length > 0);
  assert.ok(Array.isArray(patched.entities[1].dialogue));
  assert.ok(patched.entities[1].dialogue.length > 0);
  assert.deepEqual(
    patched.entities.filter((entity) => entity.type === MapEntityTypeId.PORTAL)
      .map(({ x, y, channel }) => ({ x, y, channel })),
    [
      { x: 11, y: 5, channel: "home-demo" },
      { x: 5, y: 2, channel: "home-demo" },
    ],
  );
  assert.deepEqual(
    patched.entities.filter((entity) => entity.type === MapEntityTypeId.PUSHABLE_BOX)
      .map(({ x, y }) => ({ x, y })),
    [{ x: 7, y: 11 }, { x: 8, y: 11 }],
  );
});
