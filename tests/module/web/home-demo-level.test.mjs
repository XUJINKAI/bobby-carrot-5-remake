import assert from "node:assert/strict";
import { test } from "vitest";
import { MapEntityTypeId, parseLevelMap } from "@bobby/model";
import { createHomeDemoLevel } from "../../../web/src/pages/home/homeDemoLevel.ts";
import {
  initializeWebI18n,
  preloadWebI18nScopes,
  setWebLocale,
} from "../../../web/src/i18n/webI18n.ts";

test("首页 Demo 补丁按进入时语言生成对白并保留原地图", async () => {
  await initializeWebI18n("zh-CN");
  await preloadWebI18nScopes(["home"]);
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
  const dialogue = patched.entities.flatMap((entity) =>
    Array.isArray(entity.dialogue) ? entity.dialogue : [],
  );
  assert.doesNotMatch(dialogue.join("\n"), /直达冒险模式/);
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
  await setWebLocale("en");
  await preloadWebI18nScopes(["home"]);
  const english = parseLevelMap(createHomeDemoLevel(original));
  assert.match(english.entities[1].dialogue[0], /Welcome to Bobby Carrot 5 Remake/);
  assert.match(patched.entities[1].dialogue[0], /兔子波比5重制版/);
});
