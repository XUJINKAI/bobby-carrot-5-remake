import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { readBobbyInventory } from "../dist/entities/player/BobbyState.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: EntityTypeId.GROUND_C, x, y });

function actors(world) {
  return world.query.entitiesWithTrait("player");
}

function move(world, actorId, direction) {
  return world.step({
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

test("pickup inventory belongs only to the Bobby that enters the cell", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: EntityTypeId.BOBBY, x: 2, y: 0, direction: "left" },
      { type: EntityTypeId.GAS, x: 1, y: 0 },
    ],
  });
  const [left, right] = actors(world);
  assert.ok(left && right);

  assert.equal(move(world, left.id, "right").moves[0].moved, true);
  assert.equal(readBobbyInventory(world.entity(left.id)?.state).gas, true);
  assert.equal(readBobbyInventory(world.entity(right.id)?.state).gas, false);
});

test("bean pickup increments only the acting Bobby inventory", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      {
        type: EntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "right",
        state: { beans: 2 },
      },
      { type: EntityTypeId.BEAN, x: 1, y: 0 },
    ],
  });
  const [bobby] = actors(world);
  assert.ok(bobby);

  move(world, bobby.id, "right");
  assert.equal(readBobbyInventory(world.entity(bobby.id)?.state).beans, 3);
});

test("shovel pickup leaves a canonical walkable surface behind", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: EntityTypeId.SHOVEL_PICKUP, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const [bobby] = actors(world);
  assert.ok(bobby);

  const result = move(world, bobby.id, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(readBobbyInventory(world.entity(bobby.id)?.state).shovel, true);
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === EntityTypeId.SHOVEL_CLEARED_GROUND),
    true,
  );
  assert.equal(world.presencesAt({ x: 1, y: 0 }).some((p) => p.traits.includes("walkable")), true);
});
