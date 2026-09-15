import assert from "node:assert/strict";
import test from "node:test";
import { builtinEngineEnvironment } from "../dist/public.js";
import { RuntimeActionRegistry } from "../dist/world/action/RuntimeActionRegistry.js";
import { RuntimeActionScheduler } from "../dist/world/action/RuntimeActionScheduler.js";
import { ActorLifecycleStore } from "../dist/world/actor/ActorLifecycle.js";
import { CommandQueue } from "../dist/world/behavior/CommandQueue.js";
import { WorldQueryApi } from "../dist/world/behavior/WorldQueryApi.js";
import { WorldDeltaSequence } from "../dist/world/delta/WorldDelta.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { createGlobalState } from "../dist/world/GlobalState.js";
import { MovementRuntime } from "../dist/world/movement/MovementRuntime.js";
import { WorldOutcomeStore } from "../dist/world/outcome/WorldOutcome.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { WorldCommitter } from "../dist/world/WorldCommitter.js";

function fixture(actionsRegistry = new RuntimeActionRegistry()) {
  const entities = new EntityStore([
    { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
    { type: "bobby", x: 0, y: 0 },
  ]);
  const spatial = new SpatialIndex(
    entities,
    builtinEngineEnvironment.catalog.entities,
    2,
    1,
    builtinEngineEnvironment.facts,
  );
  const actions = new RuntimeActionScheduler(actionsRegistry);
  const movement = new MovementRuntime();
  const actors = new ActorLifecycleStore();
  const outcome = new WorldOutcomeStore();
  const state = createGlobalState();
  const sequence = new WorldDeltaSequence();
  const query = new WorldQueryApi(
    entities,
    spatial,
    () => state,
    builtinEngineEnvironment.facts,
    movement.motions,
  );
  const committer = new WorldCommitter(
    entities,
    spatial,
    actions,
    query,
    movement,
    actors,
    outcome,
    () => state,
    sequence,
  );
  return {
    entities,
    spatial,
    actions,
    movement,
    actors,
    outcome,
    state,
    sequence,
    committer,
  };
}

const clock = { worldTick: 3, worldTimeMs: 187.5 };

test("World commit 失败时恢复 Entity、GlobalState、Delta 序号与原命令队列", () => {
  const world = fixture();
  const before = world.entities.snapshot();
  const queue = new CommandQueue();
  queue.move(2, 1, 0);
  queue.setGlobal("moves", 9);
  queue.spawn({ type: "carrot", x: 2, y: 0 });

  assert.throws(() => world.committer.commit(queue, clock), /footprint 超出地图/);
  assert.deepEqual(world.entities.snapshot(), before);
  assert.deepEqual(world.spatial.presencesAt({ x: 0, y: 0 }).map((p) => p.entityId), [1, 2]);
  assert.deepEqual(world.spatial.presencesAt({ x: 1, y: 0 }), []);
  assert.equal(world.state.moves, 0);
  assert.equal(queue.size, 3);

  const next = new CommandQueue();
  next.emit({ type: "after-rollback" });
  assert.equal(world.committer.commit(next, clock).deltas[0].sequence, 1);
});

test("Action cancellation 的次生命令失败时恢复 Action", () => {
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "rollback-cancel",
    update: () => "running",
    onCancel({ commands }) {
      commands.spawn({ type: "carrot", x: 2, y: 0 });
    },
  });
  const world = fixture(registry);
  const actionId = world.actions.start({ kind: "rollback-cancel" });
  const before = world.actions.snapshot();
  const queue = new CommandQueue();
  queue.cancelAction(actionId);

  assert.throws(() => world.committer.commit(queue, clock), /footprint 超出地图/);
  assert.deepEqual(world.actions.snapshot(), before);
  assert.equal(queue.size, 1);
});
