import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinEntityRegistry } from "../../engine/dist/entities/registry.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
import { World } from "../support/engine/World.mjs";

const ground = (x) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y: 0,
});

function createWorld() {
  return new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.PUSHABLE_STONE, x: 1, y: 0 },
    ],
  });
}

function moveRight(world) {
  const actor = world.query.entitiesWithFact("player")[0];
  return world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction: "right",
        cause: { type: "player-input", source: "test" },
      },
    ],
  }).moves[0];
}

function stone(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.PUSHABLE_STONE,
  })[0];
}

test("可推动石头使用通用推动规则，边界会阻止连续推动", () => {
  const world = createWorld();

  assert.equal(moveRight(world).moved, true);
  assert.deepEqual(stone(world).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.query.entitiesWithFact("player")[0].anchor, {
    x: 1,
    y: 0,
  });

  assert.equal(moveRight(world).moved, false);
  assert.deepEqual(stone(world).anchor, { x: 2, y: 0 });
});

test("可推动石头注册为阻挡、可推动对象，并复用碎石视觉", () => {
  const definition = createBuiltinEntityRegistry().require(
    MapEntityTypeId.PUSHABLE_STONE,
  );
  assert.deepEqual(definition.presenceFacts, ["blocking", "pushable"]);
  assert.deepEqual(
    resolveLevelEntityVisualPreview({ type: MapEntityTypeId.PUSHABLE_STONE }),
    resolveLevelEntityVisualPreview({ type: MapEntityTypeId.CRUMBLY_ROCK }),
  );
});
