import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
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
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.ICE_BLOCK, x: 2, y: 0 },
      { type: MapEntityTypeId.TRAP, x: 2, y: 0, active: true },
      { type: MapEntityTypeId.LANDING, x: 3, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  actor.state = { kite: true };

  const takeoff = move(world, actor.id, "right");
  assert.equal(world.entity(actor.id).state.flying, true);
  assert.ok(takeoff.events.some((event) => event.type === "kite-airborne"));

  world.update({ tick: 1, stepMs: DEFAULT_FLIGHT_CELL_MS });
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");

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
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  const whirlwind = world.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.WHIRLWIND);
  assert.ok(whirlwind);
  const result = move(world, actor.id, "right");
  assert.equal(result.moves[0].moved, false);
  assert.deepEqual(
    result.events.find((event) => event.type === "missing-item"),
    {
      type: "missing-item",
      actorId: actor.id,
      entityId: whirlwind.id,
      x: 1,
      y: 0,
      data: { item: "kite" },
    },
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
          type: "grass",
          variant: "ts-10-1",
          x,
          y: 0,
        })),
        { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
        {
          type: MapEntityTypeId.BOBBY,
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
  actor.state = { kite: true };
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
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  actor.state = { kite: true };
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

test("Downing an airborne actor cancels flight and clears flight state", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ...Array.from({ length: 3 }, (_, x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: MapEntityTypeId.WHIRLWIND, x: 1, y: 0 },
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  actor.state = { kite: true };
  move(world, actor.id, "right");

  const downed = world.downActor(actor.id, "test-down");
  assert.equal(world.entity(actor.id).state.flying, false);
  assert.equal(world.actions.active.length, 0);
  assert.ok(
    downed.deltas.some(
      (delta) =>
        delta.type === "action-cancelled" &&
        delta.reason === "owner-inactive",
    ),
  );
});
