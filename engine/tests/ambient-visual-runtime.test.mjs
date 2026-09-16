import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { AmbientVisualRuntime } from "../dist/visual/ambient/AmbientVisualRuntime.js";
import { createBuiltinEntityRegistry, createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { builtinEngineEnvironment } from "../dist/public.js";

test("Bonus Coin 共用 1/8 gate，并以 124ms 播放三帧闪光", () => {
  const runtime = new AmbientVisualRuntime(1);
  const sequence = [];
  for (let slot = 0; slot < 40; slot += 1) {
    runtime.update({ frame: slot, nowMs: slot * 124, deltaMs: 124 });
    sequence.push(runtime.state.bonusCoinSparkleFrame);
  }
  const start = sequence.findIndex((frame) => frame === 0);
  assert.ok(start >= 0);
  assert.deepEqual(sequence.slice(start, start + 4), [0, 1, 2, null]);

  const sameSeed = new AmbientVisualRuntime(1);
  const repeated = [];
  for (let slot = 0; slot < 40; slot += 1) {
    sameSeed.update({ frame: slot, nowMs: slot * 124, deltaMs: 124 });
    repeated.push(sameSeed.state.bonusCoinSparkleFrame);
  }
  assert.deepEqual(repeated, sequence);
});

test("所有 Bonus Coin 读取同一共享闪光帧", () => {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: MapEntityTypeId.BONUS_COIN, x: 0, y: 0 },
    { type: MapEntityTypeId.BONUS_COIN, x: 1, y: 0 },
  ]);
  const spatial = new SpatialIndex(
    store,
    entities,
    2,
    1,
    builtinEngineEnvironment.facts,
  );
  const query = new SpatialVisualQuery(store, spatial);
  const layers = store.all().map((coin) => visuals.resolve(
    entities.require(coin.type),
    {
      entity: coin,
      presence: spatial.presencesForEntity(coin.id)[0],
      query,
      time: { frame: 1, nowMs: 124, deltaMs: 124 },
      ambient: { bonusCoinSparkleFrame: 1 },
    },
  ).layers[0]);
  assert.deepEqual(layers[0], layers[1]);
  assert.equal(layers[0].frameIndex, 16);
});
