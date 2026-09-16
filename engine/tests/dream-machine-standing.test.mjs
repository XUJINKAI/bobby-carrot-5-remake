import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { buildVisualScene } from "../dist/visual/VisualSceneBuilder.js";
import { World } from "./support/World.mjs";

const ground = (x, y) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y,
});

function passageWorld(type, bobbyY) {
  return new World({
    schemaVersion: 1,
    width: 2,
    height: 2,
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(0, 1),
      ground(1, 1),
      { type, x: 1, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: bobbyY },
    ],
  });
}

function moveRight(world) {
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

test("Bobby 可以经过直立对象的视觉 head，但不能进入 body anchor", () => {
  for (const type of [
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.DREAM_MACHINE,
    MapEntityTypeId.BEAVER,
  ]) {
    assert.equal(moveRight(passageWorld(type, 0)).moved, true, `${type} head`);
    assert.equal(moveRight(passageWorld(type, 1)).moved, false, `${type} body`);
  }
});

function standingTypes(bobbyY) {
  const world = new World({
    schemaVersion: 1,
    width: 1,
    height: 3,
    entities: [
      ground(0, 0),
      ground(0, 1),
      ground(0, 2),
      { type: MapEntityTypeId.DREAM_MACHINE, x: 0, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: bobbyY },
    ],
  });
  const scene = buildVisualScene(
    world,
    createBuiltinVisualRegistry(),
    new Map(),
  );
  return scene.standing.map((item) =>
    world.entity(item.presence.entityId)?.type
  );
}

test("Dream Machine 以 body anchor 与 Bobby 形成前后遮挡", () => {
  assert.deepEqual(standingTypes(0), [
    MapEntityTypeId.BOBBY,
    MapEntityTypeId.DREAM_MACHINE,
  ]);
  assert.deepEqual(standingTypes(2), [
    MapEntityTypeId.DREAM_MACHINE,
    MapEntityTypeId.BOBBY,
  ]);
});

test("直立对象从 body anchor 组合 head 与 body 视觉", () => {
  for (const type of [
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.DREAM_MACHINE,
    MapEntityTypeId.BEAVER,
  ]) {
    const world = passageWorld(type, 0);
    const item = buildVisualScene(
      world,
      createBuiltinVisualRegistry(),
      new Map(),
    ).standing.find((candidate) =>
      world.entity(candidate.presence.entityId)?.type === type
    );
    assert.ok(item, type);
    assert.equal(item.presence.cell.y, 1, type);
    assert.equal(item.composition.layers.length, 2, type);
    assert.equal(item.composition.layers[0].kind, "atlas", type);
    assert.equal(item.composition.layers[0].offsetY, -48, type);
    assert.equal(item.composition.layers[1].kind, "atlas", type);
    assert.equal(item.composition.layers[1].offsetY, undefined, type);
  }
});
