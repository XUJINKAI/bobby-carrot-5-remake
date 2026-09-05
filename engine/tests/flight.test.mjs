import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { DEFAULT_FLIGHT_CELL_MS } from "../dist/entities/original/flight.js";
import { World } from "../dist/world/World.js";

function move(world, actorId, direction) {
  return world.step({
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input" },
      },
    ],
  });
}

test("Kite flight crosses blocking cells, ignores their interactions, and lands", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ...Array.from({ length: 4 }, (_, x) => ({
        type: EntityTypeId.GROUND_C,
        x,
        y: 0,
      })),
      { type: EntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: EntityTypeId.ICE_BLOCK, x: 2, y: 0 },
      { type: EntityTypeId.TRAP, x: 2, y: 0, state: { active: true } },
      { type: EntityTypeId.LANDING, x: 3, y: 0 },
      {
        type: EntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "right",
        state: { kite: true },
      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];

  const takeoff = move(world, actor.id, "right");
  assert.equal(world.entity(actor.id).state.flying, true);
  assert.ok(takeoff.events.some((event) => event.type === "kite-airborne"));

  world.update({ tick: 1, stepMs: DEFAULT_FLIGHT_CELL_MS });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.actorLifecycle(actor.id).status, "active");

  world.update({ tick: 2, stepMs: DEFAULT_FLIGHT_CELL_MS });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 3, y: 0 });
  assert.equal(world.entity(actor.id).state.flying, true);
  const landing = world.update({ tick: 3, stepMs: DEFAULT_FLIGHT_CELL_MS });
  assert.equal(world.entity(actor.id).state.flying, false);
  assert.ok(landing.events.some((event) => event.type === "kite-landed"));
  assert.equal(world.actions.active.length, 0);
});

test("Whirlwind without Kite blocks and emits a missing-item event", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      { type: EntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  const result = move(world, actor.id, "right");
  assert.equal(result.moves[0].moved, false);
  assert.ok(
    result.events.some(
      (event) =>
        event.type === "missing-item" && event.data?.item === "kite",
    ),
  );
});

test("Airborne movement chains without a stationary World tick", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 8,
      height: 1,
      entities: [
        ...Array.from({ length: 8 }, (_, x) => ({
          type: EntityTypeId.GROUND_C,
          x,
          y: 0,
        })),
        { type: EntityTypeId.WHIRLWIND, x: 1, y: 0 },
        {
          type: EntityTypeId.BOBBY,
          x: 0,
          y: 0,
          direction: "right",
          state: { kite: true },
        },
      ],
    },
    { motionDurationMs: 350 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  move(world, actor.id, "right");

  let airborne = false;
  let observedFlightMotion = false;
  for (let tick = 0; tick < 20; tick += 1) {
    world.update({ tick, stepMs: 50 });
    airborne ||= world.entity(actor.id).state?.flying === true;
    if (!airborne) continue;
    const motion = world.movement.motions.forEntity(actor.id);
    if (motion?.cause.mechanism === "flight") observedFlightMotion = true;
    if (observedFlightMotion)
      assert.equal(motion?.status, "running", `stationary at tick ${tick}`);
  }
  assert.equal(observedFlightMotion, true);
});

test("Flight boundary leaves the actor in a coherent grounded state", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ...Array.from({ length: 3 }, (_, x) => ({
        type: EntityTypeId.GROUND_C,
        x,
        y: 0,
      })),
      { type: EntityTypeId.WHIRLWIND, x: 1, y: 0 },
      {
        type: EntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "right",
        state: { kite: true },
      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  move(world, actor.id, "right");
  world.update({ tick: 1, stepMs: DEFAULT_FLIGHT_CELL_MS });
  const boundary = world.update({ tick: 2, stepMs: DEFAULT_FLIGHT_CELL_MS });

  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.entity(actor.id).state.flying, false);
  assert.equal(world.actions.active.length, 0);
  assert.ok(
    boundary.events.some(
      (event) =>
        event.type === "flight-path-invalid" && event.reason === "void",
    ),
  );
});
