import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinEntityRegistry } from "../../../engine/dist/entities/registry.js";
import { EntityRegistry } from "../../../engine/dist/world/entity/EntityRegistry.js";
import { CommandQueue } from "../../../engine/dist/world/behavior/CommandQueue.js";
import { World } from "../../support/engine/World.mjs";

function touchTarget(type, mechanisms) {
  const entities = new EntityRegistry();
  entities.registerAll([
    { type: "floor", presenceFacts: ["walkable"] },
    { type: "actor", presenceFacts: ["player"] },
    { type, presenceFacts: ["blocking"], mechanisms },
  ]);
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "floor", x: 0, y: 0 },
      { type: "floor", x: 1, y: 0 },
      { type: "actor", x: 0, y: 0 },
      { type, x: 1, y: 0 },
    ],
  }, { entities });
  const actor = world.entities.all().find((entity) => entity.type === "actor");
  const target = world.entities.all().find((entity) => entity.type === type);
  assert.ok(actor);
  assert.ok(target);
  const commands = new CommandQueue();
  commands.setState(target.id, { dialogue: "机关对白" });
  world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });
  return world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input" },
    }],
  }).events;
}

test("两种 Entity 显式组合相同机制，单独声明 Fact 不安装 Behavior", () => {
  for (const type of ["speaker-one", "speaker-two"]) {
    assert.deepEqual(
      touchTarget(type, ["object-interaction"]).map((event) => [event.type, event.lines]),
      [["dialogue-request", ["机关对白"]]],
    );
  }
  assert.deepEqual(touchTarget("silent", []).map((event) => event.type), []);
});

test("内置 Entity Definition 直接声明通用机制与专属 Behavior", () => {
  const registry = createBuiltinEntityRegistry();
  assert.deepEqual(
    registry.require(MapEntityTypeId.SANDMAN).mechanisms,
    ["object-interaction"],
  );
  assert.deepEqual(
    registry.require(MapEntityTypeId.WATER).mechanisms,
    [],
  );
  assert.deepEqual(
    registry.require(MapEntityTypeId.TIDE).mechanisms,
    undefined,
  );
  assert.ok(
    registry.require(MapEntityTypeId.EXIT).behaviors?.includes(
      "requires-unmounted-reach",
    ),
  );
  assert.ok(
    registry.require(MapEntityTypeId.CARROT).behaviors?.includes("collect-carrot"),
  );
});
