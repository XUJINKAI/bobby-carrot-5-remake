import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../../engine/dist/entities/registry.js";
import { builtinEngineEnvironment } from "../../engine/dist/public.js";
import { SpatialVisualQuery } from "../../engine/dist/visual/SpatialVisualQuery.js";
import { buildVisualScene } from "../../engine/dist/visual/VisualSceneBuilder.js";
import { EntityStore } from "../../engine/dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../../engine/dist/world/spatial/SpatialIndex.js";
import { World } from "../support/engine/World.mjs";

const AMBIENT_STEP_MS = 124;

function resolveExit(winState) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([{ type: MapEntityTypeId.EXIT, x: 0, y: 0 }]);
  const spatial = new SpatialIndex(
    store,
    entities,
    1,
    1,
    builtinEngineEnvironment.facts,
  );
  const entity = store.all()[0];
  assert.ok(entity);
  const presence = spatial.presencesForEntity(entity.id)[0];
  assert.ok(presence);
  const composition = visuals.resolve(entities.require(entity.type), {
    entity,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    winState,
    time: { frame: 1, nowMs: AMBIENT_STEP_MS, deltaMs: 16 },
  });
  assert.ok(composition);
  const layer = composition.layers[0];
  assert.ok(layer);
  return layer;
}

function expectAnimated(winState) {
  const layer = resolveExit(winState);
  assert.equal(layer.kind, "image");
  assert.equal(layer.asset, "original-animated-tiles");
  assert.equal(layer.frameIndex, 0);
}

function expectBase(winState) {
  assert.equal(resolveExit(winState).kind, "atlas");
}

test("Exit 在完成自身分支即可通关时播放提示动画", () => {
  expectAnimated({ type: "exit", completed: false });
  expectAnimated({
    type: "all",
    completed: false,
    conditions: [
      { type: "carrot", completed: true, remaining: 0 },
      { type: "exit", completed: false },
    ],
  });
  expectAnimated({
    type: "any",
    completed: false,
    conditions: [
      { type: "exit", completed: false },
      { type: "golden-carrot", completed: false, remaining: 1 },
    ],
  });
});

test("Exit 按原有 all/any 结构投影目标树", () => {
  expectAnimated({
    type: "all",
    completed: false,
    conditions: [
      {
        type: "any",
        completed: false,
        conditions: [
          { type: "exit", completed: false },
          { type: "golden-carrot", completed: false, remaining: 1 },
        ],
      },
      { type: "egg", completed: true, remaining: 0 },
    ],
  });

  expectBase({
    type: "all",
    completed: false,
    conditions: [
      {
        type: "any",
        completed: false,
        conditions: [
          { type: "exit", completed: false },
          { type: "golden-carrot", completed: false, remaining: 1 },
        ],
      },
      { type: "egg", completed: false, remaining: 1 },
    ],
  });

  expectBase({
    type: "any",
    completed: false,
    conditions: [
      {
        type: "all",
        completed: false,
        conditions: [
          { type: "exit", completed: false },
          { type: "carrot", completed: false, remaining: 1 },
        ],
      },
      { type: "golden-carrot", completed: false, remaining: 1 },
    ],
  });
});

test("any(exit, golden-carrot) 的 World 状态直接启用 Exit 动画", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 1, y: 0, variant: "ts-10-1" },
      { type: "grass", x: 2, y: 0, variant: "ts-10-1" },
      { type: "bobby", x: 0, y: 0 },
      { type: "exit", x: 1, y: 0 },
      { type: "golden-carrot", x: 2, y: 0 },
    ],
    rules: {
      win: {
        type: "any",
        conditions: [
          { type: "exit" },
          { type: "golden-carrot" },
        ],
      },
    },
  });
  const exitEntity = world.entities.all().find((entity) => entity.type === "exit");
  assert.ok(exitEntity);
  const scene = buildVisualScene(
    world,
    createBuiltinVisualRegistry(),
    new Map(),
    { frame: 1, nowMs: AMBIENT_STEP_MS, deltaMs: 16 },
  );
  const exitLayer = scene.world.find(
    (item) => item.presence.entityId === exitEntity.id,
  )?.composition.layers[0];
  assert.ok(exitLayer);
  assert.equal(exitLayer.kind, "image");
});
