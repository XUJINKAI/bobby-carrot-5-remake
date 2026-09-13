import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  DEFAULT_BEAN_GROWTH_SEGMENT_MS,
} from "../dist/entities/original/bean-field.js";
import { RuntimeEntityTypeId } from "../dist/entities/runtime-types.js";
import { World } from "../dist/world/World.js";

function entitiesAt(world, x, y) {
  return world.presencesAt({ x, y }).map((presence) =>
    world.entity(presence.entityId)
  );
}

function hasType(world, x, y, type) {
  return entitiesAt(world, x, y).some((entity) => entity?.type === type);
}

function createWorld(beans = 1) {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 4,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 3 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 3 },
      { type: MapEntityTypeId.STUMP, x: 1, y: 2 },
      { type: MapEntityTypeId.STUMP, x: 1, y: 1 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: MapEntityTypeId.BEAN_FIELD, x: 1, y: 3 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 3,

      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  actor.state = { beans };
  return world;
}

test("Bean growth changes climbable World facts one cell at a time", () => {
  const world = createWorld();
  const actor = world.query.entitiesWithTrait("player")[0];

  const planted = world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction: "right",
        cause: { type: "player-input" },
      },
    ],
  });
  assert.ok(planted.events.some((event) => event.type === "bean-growth-started"));
  assert.equal(world.entity(actor.id).state.beans, 0);
  assert.equal(hasType(world, 1, 3, RuntimeEntityTypeId.BEAN_SPROUT), true);
  assert.equal(world.isActorClimbing(actor.id), false);

  world.update({ tick: 1, stepMs: DEFAULT_BEAN_GROWTH_SEGMENT_MS });
  assert.equal(hasType(world, 1, 3, RuntimeEntityTypeId.BEANSTALK_BASE), true);
  assert.equal(hasType(world, 1, 2, MapEntityTypeId.BEANSTALK), true);
  assert.equal(world.query.hasTraitAt({ x: 1, y: 2 }, "climbable"), true);

  world.update({ tick: 2, stepMs: DEFAULT_BEAN_GROWTH_SEGMENT_MS });
  assert.equal(hasType(world, 1, 2, RuntimeEntityTypeId.BEANSTALK_MID), true);
  assert.equal(hasType(world, 1, 1, MapEntityTypeId.BEANSTALK), true);

  const stopped = world.update({
    tick: 3,
    stepMs: DEFAULT_BEAN_GROWTH_SEGMENT_MS,
  });
  assert.equal(hasType(world, 1, 0, MapEntityTypeId.BEANSTALK), false);
  assert.ok(stopped.events.some(
    (event) => event.type === "bean-growth-completed" && event.data.height === 3,
  ));
  assert.equal(world.actions.active.length, 0);
});

test("Bean Field without a Bean leaves the field unchanged", () => {
  const world = createWorld(0);
  const actor = world.query.entitiesWithTrait("player")[0];
  const result = world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction: "right",
        cause: { type: "player-input" },
      },
    ],
  });

  const field = world.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.BEAN_FIELD);
  assert.ok(field);
  assert.equal(hasType(world, 1, 3, MapEntityTypeId.BEAN_FIELD), true);
  assert.deepEqual(
    result.events.find((event) => event.type === "missing-item"),
    {
      type: "missing-item",
      actorId: actor.id,
      entityId: field.id,
      x: 1,
      y: 3,
      data: { item: "bean" },
    },
  );
  assert.equal(world.actions.active.length, 0);
});
