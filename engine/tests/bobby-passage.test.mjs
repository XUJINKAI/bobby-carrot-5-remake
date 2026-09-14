import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { CommandQueue } from "../dist/world/behavior/CommandQueue.js";
import { World } from "./support/World.mjs";

const ground = (x) => ({ type: MapEntityTypeId.GRASS, variant: "ts-10-1", x, y: 0 });

function passageWorld(terrain, contents = [], mounted = false) {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0),
      terrain,
      ...contents,
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      ...(mounted ? [{ type: MapEntityTypeId.MOWER, x: 0, y: 0 }] : []),
    ],
  });
  if (mounted) {
    const actor = world.query.entitiesWithFact("player")[0];
    const mower = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.MOWER })[0];
    const commands = new CommandQueue();
    commands.setState(actor.id, { ...actor.state, mountId: mower.id });
    world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });
  }
  return world;
}

function tryRight(world) {
  const actor = world.query.entitiesWithFact("player")[0];
  return world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input" },
    }],
  }).moves[0];
}

test("完整木板和豆茎上段只让普通 Bobby 跨越水域", () => {
  for (const type of [MapEntityTypeId.PLANK, MapEntityTypeId.BEANSTALK]) {
    const target = { type, x: 1, y: 0 };
    assert.equal(tryRight(passageWorld({ type: MapEntityTypeId.WATER, x: 1, y: 0 }, [target])).moved, true);
    assert.equal(tryRight(passageWorld({ type: MapEntityTypeId.WATER, x: 1, y: 0 }, [target], true)).moved, false);
  }
});

test("木板跨越地形后仍检查独立 Ice Block", () => {
  const world = passageWorld(
    { type: MapEntityTypeId.WATER, x: 1, y: 0 },
    [
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
      { type: MapEntityTypeId.ICE_BLOCK, x: 1, y: 0 },
    ],
  );
  assert.equal(tryRight(world).moved, false);
  assert.equal(world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.ICE_BLOCK }).length, 1);
});

test("完整木板覆盖高草和 Snow 的地形限制", () => {
  for (const type of [MapEntityTypeId.HIGH_GRASS, MapEntityTypeId.SNOW]) {
    const world = passageWorld(ground(1), [
      { type, x: 1, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
    ]);
    assert.equal(tryRight(world).moved, true, type);
  }
});

test("完整木板覆盖升起色块和竖向 Carousel 的目标地形限制", () => {
  const terrains = [
    { type: MapEntityTypeId.COLOR_BLOCK, color: "yellow", raised: true, x: 1, y: 0 },
    { type: MapEntityTypeId.CAROUSEL, variant: "vertical", x: 1, y: 0 },
  ];
  for (const terrain of terrains) {
    assert.equal(tryRight(passageWorld(terrain)).moved, false, terrain.type);
    assert.equal(tryRight(passageWorld(terrain, [
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
    ])).moved, true, terrain.type);
    assert.equal(tryRight(passageWorld(terrain, [
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
    ], true)).moved, false, terrain.type);
    assert.equal(tryRight(passageWorld(terrain, [
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
      { type: MapEntityTypeId.ICE_BLOCK, x: 1, y: 0 },
    ])).moved, false, terrain.type);
  }
});

test("目标木板不覆盖来源 Carousel 的离开限制", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.CAROUSEL, variant: "vertical", x: 0, y: 0 },
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    ],
  });
  assert.equal(tryRight(world).passage.reason, "carousel-direction-blocked");
});

test("Plank 覆盖 Trap 的进入与离开交互，自身仍会破碎", () => {
  for (const active of [true, false]) {
    const world = new World({
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        ground(0),
        { type: MapEntityTypeId.TRAP, x: 1, y: 0, active },
        ground(2),
        { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      ],
    }, { motionDurationMs: 0 });
    const trap = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.TRAP })[0];
    const plank = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.PLANK })[0];

    assert.equal(tryRight(world).moved, true);
    assert.equal(world.outcome.state.phase, "playing");
    assert.equal(tryRight(world).moved, true);
    assert.equal(world.outcome.state.phase, "playing");
    assert.equal(world.entity(trap.id).state?.active, active);
    assert.equal(world.entity(plank.id), undefined);
  }
});

test("来源 Plank 覆盖 Carousel 的离开交互但保留方向限制", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.CAROUSEL, variant: "vertical", x: 0, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 0, y: 0 },
      ground(1),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    ],
  });
  assert.equal(tryRight(world).passage.reason, "carousel-direction-blocked");
});

test("Mower 可经过地面木板，Mirror 由对象规则阻挡", () => {
  assert.equal(tryRight(passageWorld(ground(1), [
    { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
  ], true)).moved, true);
  assert.equal(tryRight(passageWorld({ type: MapEntityTypeId.MIRROR, x: 1, y: 0 }, [], true)).moved, false);
});
