import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "../dist/world/World.js";

function runtime(onEnter) {
  const entities = new EntityRegistry();
  entities.registerAll([
    { type: "floor", traits: ["walkable"], layer: "surface", stackOrder: 0 },
    { type: "player", traits: ["player"], layer: "object", stackOrder: 100 },
    { type: "trigger", traits: ["trigger"], layer: "object", stackOrder: 100 },
  ]);
  const behaviors = new BehaviorRegistry();
  behaviors.register({ id: "trigger-enter", onEnter });
  behaviors.bindTrait("trigger", "trigger-enter");
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        { type: "floor", x: 0, y: 0 },
        { type: "floor", x: 1, y: 0 },
        { type: "player", x: 0, y: 0 },
        { type: "trigger", x: 1, y: 0 },
      ],
    },
    { entities, behaviors, motionDurationMs: 100 },
  );
  return { world, actorId: world.query.entitiesWithTrait("player")[0].id };
}

function moveRight(world, actorId) {
  return world.step({
    intents: [
      {
        type: "move",
        actorId,
        direction: "right",
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

test("movement interaction marker 在任意 WorldTick 跨过中点时只执行一次", () => {
  const { world, actorId } = runtime(({ self, commands }) => {
    commands.setState(self.entity.id, {
      hits: Number(self.entity.state?.hits ?? 0) + 1,
    });
  });

  const started = moveRight(world, actorId);
  assert.equal(world.entity(actorId).anchor.x, 1);
  assert.equal(started.events.length, 0);
  assert.equal(world.query.entitiesWithTrait("trigger")[0].state, undefined);

  const crossed = world.update({ tick: 0, stepMs: 60 });
  assert.equal(world.query.entitiesWithTrait("trigger")[0].state.hits, 1);
  assert.deepEqual(
    crossed.deltas
      .filter((delta) => delta.type === "motion-marker")
      .map((delta) => delta.marker),
    ["departed", "interaction"],
  );

  world.update({ tick: 1, stepMs: 10 });
  assert.equal(world.query.entitiesWithTrait("trigger")[0].state.hits, 1);
});

test("midpoint death 冻结 World pose 并保持 marker 到中断的因果顺序", () => {
  const { world, actorId } = runtime(({ actor, commands }) => {
    commands.downActor(actor.id, "trap");
  });

  moveRight(world, actorId);
  const result = world.update({ tick: 0, stepMs: 60 });
  const motion = world.movement.motions.forEntity(actorId);
  assert.equal(motion.status, "interrupted");
  assert.equal(motion.progress, 0.5);
  assert.deepEqual(world.movement.motions.poseFor(actorId, { x: 1, y: 0 }), {
    x: 0.5,
    y: 0,
  });

  const causalTypes = result.deltas.map((delta) => delta.type);
  assert.ok(
    causalTypes.indexOf("motion-marker") <
      causalTypes.indexOf("actor-lifecycle-changed"),
  );
  assert.ok(
    causalTypes.indexOf("world-event") <
      causalTypes.indexOf("motion-interrupted"),
  );
});

test("movement snapshot 保存已跨过的 marker", () => {
  const { world, actorId } = runtime(({ self, commands }) => {
    commands.setState(self.entity.id, {
      hits: Number(self.entity.state?.hits ?? 0) + 1,
    });
  });
  moveRight(world, actorId);
  world.update({ tick: 0, stepMs: 60 });
  const snapshot = world.snapshot();
  world.update({ tick: 1, stepMs: 40 });

  world.restore(snapshot);
  world.update({ tick: 1, stepMs: 40 });
  assert.equal(world.query.entitiesWithTrait("trigger")[0].state.hits, 1);
});

test("revive 清除死亡时冻结的 motion 并恢复到 grid anchor", () => {
  const { world, actorId } = runtime(({ actor, commands }) => {
    commands.downActor(actor.id, "trap");
  });
  moveRight(world, actorId);
  world.update({ tick: 0, stepMs: 60 });
  assert.equal(world.movement.motions.forEntity(actorId).status, "interrupted");

  const revived = world.reviveActor(actorId);
  assert.equal(world.movement.motions.forEntity(actorId), undefined);
  assert.deepEqual(
    world.movement.motions.poseFor(actorId, world.entity(actorId).anchor),
    { x: 1, y: 0 },
  );
  assert.ok(revived.deltas.some((delta) => delta.type === "motion-cleared"));
});

test("destroy 中断并清除实体正在进行的 motion", () => {
  const { world, actorId } = runtime(({ actor, commands }) => {
    commands.destroy(actor.id);
  });
  moveRight(world, actorId);
  const result = world.update({ tick: 0, stepMs: 60 });

  assert.equal(world.entity(actorId), undefined);
  assert.equal(world.movement.motions.forEntity(actorId), undefined);
  const types = result.deltas.map((delta) => delta.type);
  assert.ok(types.indexOf("motion-marker") < types.indexOf("motion-interrupted"));
  assert.ok(types.indexOf("motion-interrupted") < types.indexOf("motion-cleared"));
  assert.ok(types.indexOf("motion-cleared") < types.indexOf("entity-destroyed"));
});
