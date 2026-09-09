import test from "node:test";
import assert from "node:assert/strict";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { buildVisualScene } from "../dist/visual/VisualSceneBuilder.js";
import { World } from "../dist/world/World.js";

test("双 Bobby 使用不同颜色的 player 标记，单 Bobby 保持原视觉", () => {
  const visuals = createBuiltinVisualRegistry();
  const level = {
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 0, variant: "ts-10-1" },
      { type: "bobby", x: 0, y: 0 },
    ],
  };
  const single = buildVisualScene(new World(level), visuals, new Map());
  assert.deepEqual(single.player[0].composition.layers.map((layer) => layer.kind), ["image"]);

  const multiple = buildVisualScene(
    new World({
      ...level,
      entities: [...level.entities, { type: "bobby", x: 1, y: 0 }],
    }),
    visuals,
    new Map(),
  );
  assert.deepEqual(
    multiple.player.map((item) => item.composition.layers[0].kind),
    ["canvas", "canvas"],
  );
});

test("场景共享一次胜利求值，并在收集与恢复后更新出口视觉", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 0, variant: "ts-10-1" },
      { type: "bobby", x: 0, y: 0 },
      { type: "carrot", x: 1, y: 0 },
      { type: "exit", x: 2, y: 0 },
    ],
    rules: {
      win: {
        type: "all",
        conditions: [
          { type: "collect-all", target: "carrot" },
          { type: "reach", target: "exit" },
        ],
      },
    },
  });
  const visuals = createBuiltinVisualRegistry();
  const snapshot = world.snapshot();
  const actor = world.query.entitiesWithTrait("player")[0];
  const exit = world.entities.all().find((entity) => entity.type === "exit");
  const getter = Object.getOwnPropertyDescriptor(World.prototype, "winState").get;
  let evaluations = 0;
  Object.defineProperty(world, "winState", {
    get() {
      evaluations += 1;
      return getter.call(this);
    },
  });

  function exitLayer() {
    evaluations = 0;
    const scene = buildVisualScene(world, visuals, new Map(), {
      frame: 1,
      nowMs: 248,
      deltaMs: 16,
    });
    assert.equal(evaluations, 1);
    assert.ok(scene.world.length > 1);
    return scene.world.find((item) => item.presence.entityId === exit.id)
      .composition.layers[0];
  }

  assert.equal(exitLayer().kind, "atlas");
  world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(exitLayer().kind, "image");
  world.restore(snapshot);
  assert.equal(exitLayer().kind, "atlas");
});
