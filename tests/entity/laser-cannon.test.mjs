import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  resolveEntityVisualPreview,
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../engine/dist/public.js";
import {
  createBuiltinBehaviorRegistry,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../../engine/dist/entities/registry.js";
import {
  LASER_CANNON_FLASH_DURATION_MS,
  LASER_CANNON_FLASH_PHASE_MS,
} from "../../engine/dist/entities/robo2/laser-cannon.js";
import { resolveLaserAppearance } from "../../engine/dist/entities/robo2/laser-appearance.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
import { VisualRuntime } from "../../engine/dist/visual/VisualRuntime.js";
import { CommandQueue } from "../../engine/dist/world/behavior/CommandQueue.js";
import { World } from "../support/engine/World.mjs";

const ground = (x, y) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y,
});

function beamEntities(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  });
}

function cannonEntities(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_CANNON,
  });
}

test("四向激光炮使用对应的 Robo 2 原图", () => {
  for (const direction of ["up", "right", "down", "left"]) {
    const visual = resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.LASER_CANNON,
      direction,
    });
    assert.deepEqual(visual?.layers[0], {
      kind: "image",
      asset: ROBO2_GAMEPLAY_IMAGE_IDS.cannon[direction],
      sourceTileSize: 14,
      anchor: "center",
    });
    assert.equal(visual?.layers.length, 1);
  }
});

test("激光按激光炮身份循环渐变颜色与粗细", () => {
  const visual = resolveEntityVisualPreview({
    type: RuntimeEntityTypeId.LASER_BEAM,
    direction: "right",
    state: { sourceId: 1, terminal: false },
  });
  const layer = visual?.layers[0];
  assert.equal(layer?.kind, "canvas");

  const strokes = [];
  const context = {
    strokeStyle: "",
    lineWidth: 0,
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      strokes.push({
        color: this.strokeStyle,
        width: this.lineWidth,
      });
    },
  };
  layer.draw(context, 0, 0, 36);

  const expected = resolveLaserAppearance(1, 0);
  assert.deepEqual(strokes, [{
    color: expected.color,
    width: 36 * expected.widthRatio,
  }]);
  assert.equal(layer.renderPass, "world-effect");

  assert.notDeepEqual(
    resolveLaserAppearance(1, 0),
    resolveLaserAppearance(2, 0),
  );
  assert.notDeepEqual(
    resolveLaserAppearance(1, 0),
    resolveLaserAppearance(1, 700),
  );
  assert.deepEqual(
    resolveLaserAppearance(1, 700),
    resolveLaserAppearance(1, 700),
  );
});

test("激光只在空格的两侧边界之间绘制", () => {
  const through = resolveEntityVisualPreview({
    type: RuntimeEntityTypeId.LASER_BEAM,
    direction: "right",
    state: { sourceId: 1, terminal: false },
  });
  const layer = through?.layers[0];
  assert.equal(layer?.kind, "canvas");
  const points = [];
  const context = {
    strokeStyle: "",
    lineWidth: 0,
    save() {},
    restore() {},
    beginPath() {},
    moveTo(x, y) {
      points.push(["move", x, y]);
    },
    lineTo(x, y) {
      points.push(["line", x, y]);
    },
    stroke() {},
  };
  layer.draw(context, 10, 20, 36);
  assert.deepEqual(points, [
    ["move", 10, 38],
    ["line", 46, 38],
  ]);

  const terminal = resolveEntityVisualPreview({
    type: RuntimeEntityTypeId.LASER_BEAM,
    direction: "right",
    state: { sourceId: 1, terminal: true },
  });
  assert.equal(terminal, null);
});

test("激光从炮口沿固定方向延伸，并停在首个阻挡格", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1)
    for (let x = 0; x < 6; x += 1) entities.push(ground(x, y));
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_STONE, x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities,
  });

  assert.deepEqual(
    beamEntities(world).map((beam) => ({
      x: beam.anchor.x,
      y: beam.anchor.y,
      terminal: beam.state?.terminal,
    })),
    [
      { x: 1, y: 0, terminal: false },
      { x: 2, y: 0, terminal: false },
      { x: 3, y: 0, terminal: true },
    ],
  );
});

test("Stump 在格子边界阻断激光", () => {
  const entities = [];
  for (let x = 0; x < 5; x += 1) {
    if (x !== 3) entities.push(ground(x, 0));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.STUMP, x: 3, y: 0, stackOrder: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 5,
    height: 1,
    entities,
  });

  assert.deepEqual(
    beamEntities(world).map((beam) => ({
      x: beam.anchor.x,
      terminal: beam.state?.terminal,
    })),
    [
      { x: 1, terminal: false },
      { x: 2, terminal: false },
      { x: 3, terminal: true },
    ],
  );
  const terminal = resolveEntityVisualPreview({
    type: RuntimeEntityTypeId.LASER_BEAM,
    direction: "right",
    state: { sourceId: 1, terminal: true },
  });
  assert.equal(terminal, null);
});

test("激光按 Energy 规则穿过 High Grass、Fence 和普通可推动物", () => {
  const entities = [];
  for (let x = 0; x < 8; x += 1) entities.push(ground(x, 0));
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.HIGH_GRASS, x: 2, y: 0, stackOrder: 1 },
    { type: MapEntityTypeId.FENCE, x: 3, y: 0, stackOrder: 1 },
    { type: MapEntityTypeId.PUSHABLE_BOX, x: 4, y: 0, stackOrder: 1 },
    { type: MapEntityTypeId.EXIT, x: 6, y: 0, stackOrder: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 8,
    height: 1,
    entities,
  });

  assert.deepEqual(
    beamEntities(world).map((beam) => ({
      x: beam.anchor.x,
      terminal: beam.state?.terminal,
    })),
    [
      { x: 1, terminal: false },
      { x: 2, terminal: false },
      { x: 3, terminal: false },
      { x: 4, terminal: false },
      { x: 5, terminal: false },
      { x: 6, terminal: true },
    ],
  );
});

test("Bobby 进入激光格八成时死亡", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1)
    for (let x = 0; x < 4; x += 1) entities.push(ground(x, y));
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 1, y: 1 },
  );
  const world = new World(
    { schemaVersion: 1, width: 4, height: 2, entities },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];

  world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  world.update({ tick: 0, stepMs: 79 });

  assert.equal(world.dead, false);
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.79);
  world.update({ tick: 1, stepMs: 1 });

  assert.equal(world.dead, true);
  assert.equal(world.actorLifecycle(actor.id).reason, "laser-beam");
  assert.equal(world.movement.motions.forEntity(actor.id).status, "interrupted");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.8);
});

test("Bobby 可以走上截断激光的单面 Mirror 而不受伤", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 4; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.MIRROR, variant: "right-bottom", x: 2, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 1 },
  );
  const world = new World(
    { schemaVersion: 1, width: 4, height: 2, entities },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];

  const result = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(result.moves[0].moved, true);
  world.update({ tick: 0, stepMs: 100 });

  assert.equal(world.dead, false);
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 0 });
});

test("光路重新投影不会伤害终点 Mirror 格上的 Bobby", () => {
  const entities = [];
  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 4; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.MIRROR, variant: "left-bottom", x: 2, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 0 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 3,
    entities,
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const mirror = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.MIRROR,
  })[0];
  const commands = new CommandQueue();
  commands.setState(mirror.id, { ...mirror.state, variant: "right-bottom" });
  world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });

  world.update({ tick: 0, stepMs: 16 });

  assert.equal(world.dead, false);
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.deepEqual(
    beamEntities(world).map((beam) => ({
      x: beam.anchor.x,
      terminal: beam.state?.terminal,
    })),
    [
      { x: 1, terminal: false },
      { x: 2, terminal: true },
    ],
  );
});

test("关卡起点位于既有光路时可先离开", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 4; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 0 },
  );
  const world = new World(
    { schemaVersion: 1, width: 4, height: 2, entities },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];

  world.update({ tick: 0, stepMs: 16 });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "down",
      cause: { type: "player-input", source: "test" },
    }],
  });
  world.update({ tick: 1, stepMs: 100 });

  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.deepEqual(world.entity(actor.id).anchor, { x: 2, y: 1 });
});

test("从非炮口方向推动激光炮后，光束从新位置重新投影", () => {
  const entities = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 1, y: 1 },
    { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 4,
    entities,
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const cannon = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_CANNON,
  })[0];

  const pushed = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "down",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(pushed.moves[0].moved, true);
  assert.deepEqual(world.entity(cannon.id).anchor, { x: 1, y: 2 });

  world.update({ tick: 0, stepMs: 16 });
  assert.deepEqual(
    beamEntities(world).map((beam) => beam.anchor),
    [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ],
  );
});

test("激光从背面命中同向激光炮时只摧毁目标", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities,
  });
  const [source, target] = cannonEntities(world);

  world.update({ tick: 0, stepMs: 16 });

  assert.deepEqual(
    cannonEntities(world).map((cannon) => cannon.id),
    [source.id],
  );
  assert.equal(world.entity(target.id), undefined);
  assert.equal(
    beamEntities(world).some((beam) => beam.state?.sourceId === target.id),
    false,
  );

  world.update({ tick: 1, stepMs: 16 });
  assert.deepEqual(
    beamEntities(world).map((beam) => beam.anchor),
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ],
  );
});

test("激光炮与所属光束在销毁后同步闪烁三次", () => {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 6; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 3, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 2,
    entities,
  });
  const target = cannonEntities(world)[1];
  const result = world.update({ tick: 0, stepMs: 16 });
  const event = result.events.find((candidate) =>
    candidate.type === "laser-cannon-destroyed" &&
    candidate.entityId === target.id
  );
  assert.ok(event);
  assert.equal(event.direction, "right");
  assert.equal(event.data?.segments.length, 2);
  assert.equal(world.entity(target.id), undefined);
  assert.equal(
    beamEntities(world).some((beam) => beam.state?.sourceId === target.id),
    false,
  );

  const visual = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const options = {
    motionDuration: () => 0,
    stationaryDeathDurationMs: 0,
  };
  const start = { frame: 1, nowMs: 1000, deltaMs: 0 };
  visual.consumeWorldDeltas(world, result.deltas, start, options);

  function transientAt(offsetMs) {
    const frame = {
      frame: 2 + offsetMs,
      nowMs: start.nowMs + offsetMs,
      deltaMs: offsetMs,
    };
    visual.update(frame, "linear");
    return visual.scene(world).worldEffect.find(
      (item) => item.presence.entityId < 0,
    );
  }

  const first = transientAt(0);
  assert.ok(first);
  assert.deepEqual(first.composition.layers[0], {
    kind: "image",
    asset: ROBO2_GAMEPLAY_IMAGE_IDS.cannon.right,
    sourceTileSize: 14,
    anchor: "center",
  });
  const strokes = [];
  first.composition.layers[1].draw({
    strokeStyle: "",
    lineWidth: 0,
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      strokes.push(this.strokeStyle);
    },
  }, 0, 0, 12);
  const expectedColor = resolveLaserAppearance(target.id, start.nowMs).color;
  assert.deepEqual(strokes, [expectedColor, expectedColor]);

  assert.equal(transientAt(LASER_CANNON_FLASH_PHASE_MS), undefined);
  assert.ok(transientAt(LASER_CANNON_FLASH_PHASE_MS * 2));
  assert.equal(transientAt(LASER_CANNON_FLASH_DURATION_MS), undefined);
  assert.equal(visual.isAnimating, false);
});

test("移动途中已经销毁的光束不会在交互点造成伤害", () => {
  const behavior = createBuiltinBehaviorRegistry().require(
    "laser-beam-hazard",
  );
  const beam = {
    id: 20,
    type: RuntimeEntityTypeId.LASER_BEAM,
    anchor: { x: 1, y: 0 },
    state: {},
  };
  const actor = {
    id: 10,
    type: MapEntityTypeId.BOBBY,
    anchor: { x: 0, y: 0 },
    state: {},
  };
  const downed = [];
  behavior.onEnter({
    actor,
    self: {
      entity: beam,
      presence: {
        entityId: beam.id,
        cell: beam.anchor,
        facts: [],
        stackOrder: 0,
      },
    },
    query: {
      entity: () => undefined,
      entityHasFact: () => true,
    },
    commands: {
      downActor: (entityId, reason) => downed.push({ entityId, reason }),
    },
  });

  assert.deepEqual(downed, []);
});

test("把相向激光炮推入同一直线后两者同时摧毁", () => {
  const entities = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 1 },
    { type: MapEntityTypeId.LASER_CANNON, direction: "left", x: 4, y: 2 },
    { type: MapEntityTypeId.BOBBY, x: 4, y: 3 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 6,
    height: 4,
    entities,
  });
  const actor = world.query.entitiesWithFact("player")[0];

  const pushed = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(pushed.moves[0].moved, true);

  world.update({ tick: 0, stepMs: 16 });

  assert.deepEqual(cannonEntities(world), []);
  assert.deepEqual(beamEntities(world), []);
});

test("多激光炮地图由单个激光调度器统一更新", () => {
  const entities = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 12; x += 1) entities.push(ground(x, y));
  }
  for (let x = 0; x < 12; x += 1) {
    entities.push(
      { type: MapEntityTypeId.LASER_CANNON, direction: "down", x, y: 0 },
      { type: MapEntityTypeId.LASER_STONE, x, y: 2 },
    );
  }
  entities.push({ type: MapEntityTypeId.BOBBY, x: 0, y: 4 });
  const world = new World({
    schemaVersion: 1,
    width: 12,
    height: 5,
    entities,
  });

  assert.equal(
    world.query.entitiesMatching({
      kind: "type",
      value: RuntimeEntityTypeId.LASER_SYSTEM,
    }).length,
    1,
  );
  assert.equal(beamEntities(world).length, 24);

  const definitions = createBuiltinEntityRegistry();
  const behaviors = createBuiltinBehaviorRegistry();
  const cannonBehaviorId = definitions
    .require(MapEntityTypeId.LASER_CANNON).behaviors[0];
  const systemBehaviorId = definitions
    .require(RuntimeEntityTypeId.LASER_SYSTEM).behaviors[0];
  assert.equal(behaviors.require(cannonBehaviorId).onTick, undefined);
  assert.equal(typeof behaviors.require(systemBehaviorId).onTick, "function");
  assert.deepEqual(
    definitions.require(MapEntityTypeId.LASER_BOMB).behaviors ?? [],
    [],
  );

  const firstUpdate = world.update({ tick: 0, stepMs: 16 });
  const secondUpdate = world.update({ tick: 1, stepMs: 16 });
  assert.equal(firstUpdate.mutations.stateChanged.length, 1);
  assert.deepEqual(secondUpdate.mutations.stateChanged, []);
});
