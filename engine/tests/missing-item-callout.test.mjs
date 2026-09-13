import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { World } from "../dist/world/World.js";
import { isMissingItemEvent } from "../dist/world/WorldTypes.js";
import { WorldCalloutRuntime } from "../dist/visual/callout/WorldCalloutRuntime.js";
import { createBuiltinWorldCalloutRegistry } from "../dist/visual/callout/builtinCallouts.js";
import {
  MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS,
  MISSING_ITEM_CALLOUT_DURATION_MS,
  missingItemCalloutDefinition,
} from "../dist/visual/callout/missingItemCallout.js";

const PRESENTATIONS = {
  gas: ["hud-gas", "需要汽油"],
  "lock-key": ["hud-key", "需要钥匙"],
  kite: ["hud-kite", "需要风筝"],
  shovel: ["hud-shovel", "需要雪铲"],
  bean: ["hud-bean", "需要魔豆"],
};

function missingItemEvent(item, actorId = 1, entityId = 10) {
  return {
    type: "missing-item",
    actorId,
    entityId,
    x: 2,
    y: 3,
    data: { item },
  };
}

function frame(nowMs) {
  return { frame: Math.floor(nowMs / 16), nowMs, deltaMs: 16 };
}

function move(world, actorId, direction) {
  return world.step({
    intents: [{
      type: "move",
      actorId,
      direction,
      cause: { type: "player-input", source: "test" },
    }],
  });
}

test("MissingItemEvent 类型守卫验证完整语义字段", () => {
  assert.equal(isMissingItemEvent(missingItemEvent("gas")), true);
  assert.equal(
    isMissingItemEvent({ ...missingItemEvent("gas"), actorId: undefined }),
    false,
  );
  assert.equal(isMissingItemEvent(missingItemEvent("unknown")), false);
});

test("五种缺少道具事件映射到统一 Callout 合同", () => {
  for (const [item, [sliceId, accessibleText]] of Object.entries(
    PRESENTATIONS,
  )) {
    const cue = missingItemCalloutDefinition.resolve(missingItemEvent(item));
    assert.deepEqual(cue, {
      channel: "missing-item:1",
      anchor: { type: "entity", entityId: 1 },
      content: { type: "image-slice", sliceId, accessibleText },
      placement: "auto-vertical",
      durationMs: MISSING_ITEM_CALLOUT_DURATION_MS,
      clearanceSourcePx: 36,
      blink: {
        periodMs: MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS,
        visibleFromMs: MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS / 2,
        visibleUntilMs: MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS,
      },
    });
  }
  assert.equal(
    missingItemCalloutDefinition.resolve(missingItemEvent("unknown")),
    null,
  );
});

test("内置 Callout Registry 按 Bobby 分槽并播报可访问文本", () => {
  const announcements = [];
  const runtime = new WorldCalloutRuntime(
    createBuiltinWorldCalloutRegistry(),
    { announce: (message) => announcements.push(message) },
  );
  const entities = new Map([
    [1, { id: 1, anchor: { x: 1, y: 1 } }],
    [2, { id: 2, anchor: { x: 3, y: 1 } }],
  ]);
  const world = { entity: (id) => entities.get(id) };

  runtime.consume(missingItemEvent("gas", 1), frame(0));
  runtime.consume(missingItemEvent("bean", 2), frame(0));
  runtime.update(frame(MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS / 2));

  const items = runtime.renderItems(
    world,
    new Map(),
    frame(MISSING_ITEM_CALLOUT_BLINK_PERIOD_MS / 2),
  );
  assert.deepEqual(
    items.map((item) => [item.channel, item.content.sliceId]),
    [
      ["missing-item:1", "hud-gas"],
      ["missing-item:2", "hud-bean"],
    ],
  );
  assert.deepEqual(announcements, ["需要汽油", "需要魔豆"]);
});

test("Editor Callout 测试地图依次触发五种缺少道具事件", () => {
  const level = JSON.parse(fs.readFileSync(
    new URL("../../tools/pipeline/callout-smoke.json", import.meta.url),
    "utf8",
  ));
  const world = new World(level);
  const actor = world.query.entitiesWithTrait("player")[0];
  const items = [];

  for (let x = 1; x <= 5; x += 1) {
    move(world, actor.id, "right");
    const interaction = move(world, actor.id, "up");
    const event = interaction.events.find(isMissingItemEvent);
    assert.ok(event, `x=${x} 应触发 missing-item`);
    items.push(event.data.item);
    if (event.data.item === "bean") move(world, actor.id, "down");
  }

  assert.deepEqual(items, ["gas", "lock-key", "kite", "shovel", "bean"]);
});
