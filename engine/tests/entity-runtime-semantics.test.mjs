import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";
import { createBuiltinEntityRegistry } from "../dist/entities/registry.js";
import {
  resolveEntityVisualPreview,
  resolveLevelEntityVisualPreview,
} from "../dist/visual/preview.js";
import { portal } from "../dist/entities/custom/portal.js";
import { RuntimeEntityTypeId } from "../dist/entities/runtime-types.js";

const BLOCKING_TYPES = [
  MapEntityTypeId.WINDMILL,
  MapEntityTypeId.ICE_BLOCK,
];

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });
const bobby = (x, y) => ({
  type: MapEntityTypeId.BOBBY,
  x,
  y,
  direction: "right",
});

function actor(world) {
  const entity = world.query.entitiesWithTrait("player")[0];
  assert.ok(entity, "test map must contain a player actor");
  return entity;
}

function move(world, direction) {
  const player = actor(world);
  return world.step({
    intents: [
      {
        type: "move",
        actorId: player.id,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

test("canonical original obstacle semantics keep known blockers blocking", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of BLOCKING_TYPES) {
    assert.equal(registry.require(type).traits.includes("blocking"), true, type);
  }
});

test("胡萝卜收集后留下持久的 consumed runtime state", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    rules: { win: { type: "collect-all", target: MapEntityTypeId.CARROT } },
    entities: [
      ground(0, 0),
      ground(1, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
    ],
  });

  assert.equal(move(world, "right").moves[0].moved, true);
  assert.equal(
    world.entities.all().some((entity) => entity.type === MapEntityTypeId.CARROT),
    false,
  );
  const consumed = world.entities.all().find(
    (entity) => entity.type === RuntimeEntityTypeId.CONSUMED_CARROT,
  );
  assert.deepEqual(consumed?.anchor, { x: 1, y: 0 });
  assert.equal(world.winState.remaining, 0);
  world.update({ tick: 1, stepMs: 1000 });
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === RuntimeEntityTypeId.CONSUMED_CARROT),
    true,
  );

  const visual = resolveEntityVisualPreview({
    type: RuntimeEntityTypeId.CONSUMED_CARROT,
  });
  assert.deepEqual(visual?.layers[0], {
    kind: "atlas",
    column: 9,
    row: 12,
  });
});

test("Portal visual 接受 hex color 与常用颜色别名", () => {
  const expectedRings = {
    "#abc": "#aabbcc",
    "#12ABef": "#12abef",
    orange: "#ffa500",
  };
  for (const [color, ring] of Object.entries(expectedRings)) {
    const composition = resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.PORTAL,
      channel: "test-channel",
      color,
    });
    const layer = composition?.layers[0];
    assert.equal(layer?.kind, "canvas");
    const stops = [];
    const gradient = {
      addColorStop(offset, color) {
        stops.push({ offset, color });
      },
    };
    layer.draw({
      createRadialGradient: () => gradient,
      save() {},
      beginPath() {},
      arc() {},
      fill() {},
      stroke() {},
      restore() {},
    }, 0, 0, 48);
    assert.deepEqual(stops[1], { offset: 0.55, color: ring });
  }
});

test("Portal visual 使用固定三帧循环", () => {
  const radii = [0, 160, 320, 480].map((nowMs) => {
    const composition = portal.visual.resolve({
      entity: { id: 1, type: MapEntityTypeId.PORTAL, state: { color: "cyan" } },
      presence: {},
      query: {},
      time: { frame: 0, nowMs, deltaMs: 0 },
    });
    const layer = composition.layers[0];
    let outerRadius = 0;
    const gradient = { addColorStop() {} };
    layer.draw({
      createRadialGradient(_x0, _y0, _r0, _x1, _y1, radius) {
        outerRadius = radius;
        return gradient;
      },
      save() {},
      beginPath() {},
      arc() {},
      fill() {},
      stroke() {},
      restore() {},
    }, 0, 0, 48);
    return outerRadius;
  });
  assert.equal(new Set(radii.slice(0, 3)).size, 3);
  assert.equal(radii[3], radii[0]);
});

test("Portal 在进入中点切换出口并沿进入方向续行一格", () => {
  const vectors = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };
  const entrance = { x: 2, y: 2 };
  const exit = { x: 4, y: 2 };
  for (const [direction, vector] of Object.entries(vectors)) {
    const world = portalWorld({
      bobby: {
        x: entrance.x - vector.x,
        y: entrance.y - vector.y,
      },
      entrance,
      exit,
    });
    move(world, direction);
    const result = world.update({ tick: 1, stepMs: 50 });
    const expected = { x: exit.x + vector.x, y: exit.y + vector.y };
    assert.deepEqual(actor(world).anchor, expected, direction);
    const motion = world.movement.motions.forEntity(actor(world).id);
    assert.deepEqual(motion?.from, exit, direction);
    assert.deepEqual(motion?.to, expected, direction);
    assert.equal(motion?.direction, direction);
    const types = result.deltas.map((delta) => delta.type);
    assert.ok(types.indexOf("motion-cleared") < types.lastIndexOf("motion-started"));
  }
});

test("Portal 出口前方不可通行时停在出口 Portal", () => {
  const exit = { x: 4, y: 2 };
  const world = portalWorld({
    bobby: { x: 2, y: 1 },
    entrance: { x: 2, y: 2 },
    exit,
    blocker: { x: 4, y: 3 },
  });
  move(world, "down");
  const result = world.update({ tick: 1, stepMs: 50 });
  assert.deepEqual(actor(world).anchor, exit);
  assert.equal(world.movement.motions.forEntity(actor(world).id), undefined);
  assert.equal(result.moves.at(-1)?.moved, false);
});

test("Portal 目标格已有 Bobby 时不会产生重叠", () => {
  const entrance = { x: 2, y: 2 };
  const exit = { x: 4, y: 2 };
  const world = portalWorld({
    bobby: { x: 2, y: 1 },
    entrance,
    exit,
    targetBobby: true,
  });

  move(world, "down");
  const result = world.update({ tick: 1, stepMs: 50 });

  assert.deepEqual(actor(world).anchor, entrance);
  assert.equal(result.events.some((event) => event.type === "teleport"), false);
  assert.equal(world.presencesAt(exit).filter((item) =>
    item.traits.includes("player")
  ).length, 1);
});

test("Pushable Box 使用正上方视角的独立 Canvas 木箱视觉", () => {
  const composition = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.PUSHABLE_BOX,
  });
  const layer = composition?.layers[0];
  assert.equal(layer?.kind, "canvas");
  const calls = [];
  layer.draw({
    save() {},
    fillRect(...args) {
      calls.push(["fillRect", ...args]);
    },
    strokeRect(...args) {
      calls.push(["strokeRect", ...args]);
    },
    beginPath() {},
    moveTo(...args) {
      calls.push(["moveTo", ...args]);
    },
    lineTo(...args) {
      calls.push(["lineTo", ...args]);
    },
    stroke() {},
    arc(...args) {
      calls.push(["arc", ...args]);
    },
    fill() {},
    restore() {},
  }, 0, 0, 48);
  assert.equal(calls.filter(([kind]) => kind === "fillRect").length, 3);
  assert.equal(calls.filter(([kind]) => kind === "strokeRect").length, 2);
  assert.equal(calls.filter(([kind]) => kind === "arc").length, 4);
  assert.equal(calls.filter(([kind]) => kind === "lineTo").length, 2);
});

test("Push Goal 使用正上方视角的方形目标视觉", () => {
  const composition = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.PUSH_GOAL,
  });
  const layer = composition?.layers[0];
  assert.equal(layer?.kind, "canvas");
  const calls = [];
  layer.draw({
    save() {},
    fillRect(...args) {
      calls.push(["fillRect", ...args]);
    },
    strokeRect(...args) {
      calls.push(["strokeRect", ...args]);
    },
    restore() {},
  }, 0, 0, 48);
  assert.deepEqual(calls[0], ["fillRect", 0, 0, 48, 48]);
  assert.equal(calls[1]?.[0], "strokeRect");
  assert.ok(Math.abs(calls[1][1] - 9.6) < Number.EPSILON * 48);
  assert.ok(Math.abs(calls[1][2] - 9.6) < Number.EPSILON * 48);
  assert.ok(Math.abs(calls[1][3] - 28.8) < Number.EPSILON * 48);
  assert.ok(Math.abs(calls[1][4] - 28.8) < Number.EPSILON * 48);
});

function portalWorld({ bobby: start, entrance, exit, blocker, targetBobby }) {
  const width = 7;
  const height = 5;
  return new World({
    schemaVersion: 1,
    width,
    height,
    entities: [
      ...Array.from({ length: width * height }, (_, index) =>
        ground(index % width, Math.floor(index / width))),
      bobby(start.x, start.y),
      {
        type: MapEntityTypeId.PORTAL,
        ...entrance,
        channel: "route",
        color: "cyan",
      },
      {
        type: MapEntityTypeId.PORTAL,
        ...exit,
        channel: "route",
        color: "cyan",
      },
      ...(targetBobby ? [bobby(exit.x, exit.y)] : []),
      ...(blocker ? [{ type: MapEntityTypeId.ICE_BLOCK, ...blocker }] : []),
    ],
  }, { motionDurationMs: 100 });
}

test("Surface atlas family 使用各自的通行语义", () => {
  const wall = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.STONE_WALL, variant: "ts-1-4", x: 1, y: 0 },
    ],
  });
  const wallEntity = wall.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.STONE_WALL);
  assert.ok(wallEntity);
  assert.equal(
    wall.query.entityHasTrait(wallEntity.id, "bean-growth-space"),
    true,
  );
  assert.equal(wall.query.entityHasTrait(wallEntity.id, "walkable"), false);
  assert.equal(move(wall, "right").moves[0].moved, false);

  const grassRoad = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.GRASS, variant: "ts-10-3", x: 1, y: 0 },
    ],
  });
  const grassPresence = grassRoad.presencesAt({ x: 1, y: 0 })
    .find((presence) =>
      grassRoad.entities.require(presence.entityId).type === MapEntityTypeId.GRASS
    );
  assert.ok(grassPresence);
  assert.equal(
    grassRoad.query.entityHasTrait(grassPresence.entityId, "bean-growth-space"),
    false,
  );
  assert.equal(
    grassRoad.query.entityHasTrait(grassPresence.entityId, "walkable"),
    true,
  );
  assert.equal(move(grassRoad, "right").moves[0].moved, true);
});

test("Egg Nest fills only when Bobby leaves the empty nest", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    rules: {
      win: { type: "fill-all", target: "egg-nest", filler: "filled-egg" },
    },
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.EGG, x: 1, y: 0 },
    ],
  });

  assert.equal(world.winState?.remaining, 1);
  const enter = move(world, "right");
  assert.equal(enter.moves[0].moved, true);
  assert.equal(world.winState?.remaining, 1);
  assert.equal(
    world.entities
      .all()
      .some(
        (entity) =>
          entity.type === MapEntityTypeId.EGG &&
          entity.state?.filled !== true,
      ),
    true,
  );

  const leave = move(world, "right");
  assert.equal(leave.moves[0].moved, true);
  assert.equal(
    leave.events.some((event) => event.type === "fill-egg-nest"),
    true,
  );
  const filledEgg = world.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.EGG);
  assert.equal(filledEgg?.state?.filled, true);
  assert.ok(filledEgg);
  assert.equal(world.query.entityHasTrait(filledEgg.id, "filled-egg"), true);
  assert.equal(world.query.entityHasTrait(filledEgg.id, "blocking"), true);
  assert.deepEqual(world.winState, {
    type: "fill-all",
    target: "egg-nest",
    filler: "filled-egg",
    completed: true,
    remaining: 0,
  });
  assert.equal(world.completed, true);
});

test("Ice Block cover blocks Bobby instead of becoming pass-through scenery", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.ICE_BLOCK, x: 1, y: 0 },
    ],
  });
  assert.equal(move(world, "right").moves[0].moved, false);
  assert.deepEqual(actor(world).anchor, { x: 0, y: 0 });
});

test("Water requires a terrain overlay for ordinary Bobby movement", () => {
  const direct = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      bobby(0, 0),
    ],
  });
  assert.equal(move(direct, "right").moves[0].moved, false);

  const withPlank = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
      bobby(0, 0),
    ],
  });
  assert.equal(move(withPlank, "right").moves[0].moved, true);
});

test("Unified color block uses flat color and raised fields for passage", () => {
  const raised = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 1,
        y: 0,
        color: "yellow",
        raised: true,
      },
      bobby(0, 0),
    ],
  });
  assert.equal(
    raised.entities.all().some((entity) => entity.type === MapEntityTypeId.COLOR_BLOCK),
    true,
  );
  assert.equal(move(raised, "right").moves[0].moved, false);

  const lowered = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 1,
        y: 0,
        color: "yellow",
        raised: false,
      },
      bobby(0, 0),
    ],
  });
  assert.equal(move(lowered, "right").moves[0].moved, true);
});

test("Color Switch toggles only switches and blocks of the same color", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      bobby(0, 0),
      {
        type: MapEntityTypeId.COLOR_SWITCH,
        x: 1,
        y: 0,
        color: "yellow",
      },
      {
        type: MapEntityTypeId.COLOR_SWITCH,
        x: 2,
        y: 0,
        color: "pink",
      },
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 2,
        y: 0,
        color: "yellow",
      },
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 2,
        y: 0,
        color: "pink",
      },
    ],
  });

  assert.equal(move(world, "right").moves[0].moved, true);
  const switches = world.query.entitiesWithTrait("switch");
  const blocks = world.query.entitiesWithTrait("stateful-block");
  assert.equal(
    switches.find((entity) => entity.state.color === "yellow").state.state,
    "state-2",
  );
  assert.equal(
    switches.find((entity) => entity.state.color === "pink").state.state,
    "state-1",
  );
  assert.equal(
    blocks.find((entity) => entity.state.color === "yellow").state.raised,
    false,
  );
  assert.equal(
    blocks.find((entity) => entity.state.color === "pink").state.raised,
    true,
  );
});

test("authoring visual preview resolves through canonical Visual definitions", () => {
  const carrot = resolveEntityVisualPreview({ type: MapEntityTypeId.CARROT });
  assert.equal(carrot?.layers[0]?.kind, "atlas");
  const fence = resolveEntityVisualPreview({ type: MapEntityTypeId.FENCE });
  assert.equal(fence?.layers[0]?.kind, "atlas");
});


test("collection icon preview translates canonical flat Map entities", () => {
  const beanstalk = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.BEANSTALK,
  });
  assert.ok(beanstalk?.layers.length);

  const mirror = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.MIRROR,
    variant: "left-bottom",
  });
  assert.equal(mirror?.layers[0]?.kind, "atlas");
});
