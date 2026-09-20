import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { World } from "../support/engine/World.mjs";

const ROTATIONS = [
  ["right-top", "right-bottom", "right"],
  ["right-bottom", "left-bottom", "right"],
  ["left-bottom", "left-top", "left"],
  ["left-top", "right-top", "left"],
  ["vertical", "horizontal", "down"],
  ["horizontal", "vertical", "right"],
];

function move(world, direction) {
  const actor = world.query.entitiesWithFact("player")[0];
  return world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction,
      cause: { type: "player-input" },
    }],
  });
}

test("Bobby 离开 Carousel 时按原版顺时针顺序旋转", () => {
  for (const [variant, expected, direction] of ROTATIONS) {
    const world = new World({
      schemaVersion: 1,
      width: 3,
      height: 3,
      entities: [
        { type: MapEntityTypeId.GRASS, variant: "ts-10-1", x: 0, y: 1 },
        { type: MapEntityTypeId.GRASS, variant: "ts-10-1", x: 1, y: 2 },
        { type: MapEntityTypeId.GRASS, variant: "ts-10-1", x: 2, y: 1 },
        { type: MapEntityTypeId.CAROUSEL, variant, x: 1, y: 1 },
        { type: MapEntityTypeId.BOBBY, x: 1, y: 1, direction },
      ],
    }, { motionDurationMs: 0 });
    const carousel = world.query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.CAROUSEL,
    })[0];

    assert.equal(move(world, direction).moves[0].moved, true, variant);
    assert.equal(world.entity(carousel.id).state?.variant, expected, variant);
  }
});

test("Carousel Switch 对全部 Carousel 使用相同的顺时针顺序", () => {
  const world = new World({
    schemaVersion: 1,
    width: ROTATIONS.length,
    height: 3,
    entities: [
      { type: MapEntityTypeId.GRASS, variant: "ts-10-1", x: 0, y: 1 },
      { type: MapEntityTypeId.CAROUSEL_SWITCH, x: 1, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
      ...ROTATIONS.map(([variant], x) => ({
        type: MapEntityTypeId.CAROUSEL,
        variant,
        x,
        y: 0,
      })),
    ],
  });
  const carousels = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.CAROUSEL,
  });

  assert.equal(move(world, "right").moves[0].moved, true);
  assert.deepEqual(
    carousels.map((carousel) => world.entity(carousel.id).state?.variant),
    ROTATIONS.map(([, expected]) => expected),
  );
});
