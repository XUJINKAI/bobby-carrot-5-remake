import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { GameplaySession } from "../dist/core/GameplaySession.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });
const bobby = (x, y) => ({ type: MapEntityTypeId.BOBBY, x, y });

function corridor(extra, rules, bobbyState) {
  return {
    schemaVersion: 1,
    width: 4,
    height: 2,
    ...(rules ? { rules } : {}),
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      ground(3, 0),
      bobby(0, 0),
      ...extra,
    ],
  };
}

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

test("reach can complete on a collectible removed by onEnter", () => {
  const world = new World(
    corridor(
      [{ type: MapEntityTypeId.GOLDEN_CARROT, x: 1, y: 0 }],
      { win: { type: "reach", target: MapEntityTypeId.GOLDEN_CARROT } },
    ),
  );
  const result = move(world, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(
    result.events.some((event) => event.type === "collect-golden-carrot"),
    true,
  );
  assert.equal(world.completed, true);
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === MapEntityTypeId.GOLDEN_CARROT),
    false,
  );
});

test("任一 Bobby 到达 Golden Carrot 即完成多人关卡", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    rules: { win: { type: "reach", target: MapEntityTypeId.GOLDEN_CARROT } },
    entities: [
      ground(0, 0), ground(1, 0), ground(2, 0), ground(3, 0),
      bobby(0, 0), bobby(3, 0),
      { type: MapEntityTypeId.GOLDEN_CARROT, x: 1, y: 0 },
    ],
  });
  const first = world.query.entitiesWithTrait("player")[0];

  move(world, "right");

  assert.equal(world.completed, true);
  assert.deepEqual(world.entity(first.id).anchor, { x: 1, y: 0 });
});

test("Exit 要求所有 Bobby 同时到达 Exit", () => {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    rules: { win: { type: "reach", target: MapEntityTypeId.EXIT } },
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.EXIT, x: 1, y: 0 },
      { type: MapEntityTypeId.EXIT, x: 2, y: 0 },
      ground(3, 0),
      bobby(0, 0), bobby(3, 0),
    ],
  });
  const players = world.query.entitiesWithTrait("player");

  move(world, "right");
  assert.equal(world.completed, false);
  world.step({
    intents: [{
      type: "move",
      actorId: players[1].id,
      direction: "left",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(world.completed, true);
});

test("requireKey Lock 消耗一把关卡内钥匙并启动死亡倒计时", () => {
  const world = new World(
    corridor(
      [
        {
          type: MapEntityTypeId.LOCK,
          x: 1,
          y: 0,
          requireKey: true,
          deathCountdownSeconds: 1,
        },
      ],
      undefined,
      { lockKeys: 1 },
    ),
  );
  actor(world).state = { lockKeys: 1 };
  const unlock = move(world, "right");
  assert.equal(unlock.moves[0].moved, true);
  assert.equal(actor(world).state?.lockKeys, 0);
  assert.equal(world.query.entitiesWithTrait("gate").length, 0);
  assert.equal(world.query.entitiesWithTrait("timed-challenge").length, 1);
  assert.equal(
    unlock.events.some((event) => event.type === "death-countdown-started"),
    true,
  );
  world.update({ stepMs: 1000, tick: 1 });
  assert.equal(world.dead, true);
});

test("GameplayState 投影等待开锁与运行中的 Timed Challenge", () => {
  const session = new GameplaySession({ timing: { worldHz: 10 } });
  session.loadLevel(
    corridor([
      {
        type: MapEntityTypeId.LOCK,
        x: 1,
        y: 0,
        deathCountdownSeconds: 60,
      },
    ]),
  );

  assert.equal(session.state.timedChallengePhase, "waiting");
  assert.equal(session.state.timedChallengeRemainingMs, 60_000);
  session.world.update({ stepMs: 100, tick: 1 });
  assert.equal(session.state.timedChallengePhase, "waiting");
  assert.equal(session.state.timedChallengeRemainingMs, 60_000);
  move(session.world, "right");
  assert.equal(session.state.timedChallengePhase, "running");
  assert.equal(session.state.timedChallengeRemainingMs, 60_000);
  session.world.update({ stepMs: 100, tick: 2 });
  assert.equal(session.state.timedChallengeRemainingMs, 59_900);
});

test("缺省 Lock 不要求钥匙", () => {
  const world = new World(
    corridor([{ type: MapEntityTypeId.LOCK, x: 1, y: 0 }]),
  );
  assert.equal(move(world, "right").moves[0].moved, true);
  assert.equal(actor(world).state?.lockKeys, undefined);
  assert.equal(world.query.entitiesWithTrait("gate").length, 0);
});

test("关卡内道具动作按数量增加钥匙", () => {
  const world = new World(
    corridor([{
      type: MapEntityTypeId.LOCK,
      x: 1,
      y: 0,
      requireKey: true,
    }]),
  );
  const actorId = actor(world).id;
  world.step({
    intents: [
      {
        type: "add-actor-inventory-item",
        actorId,
        item: "lock-key",
        count: 2,
      },
    ],
  });
  assert.equal(actor(world).state?.lockKeys, 2);
  assert.equal(move(world, "right").moves[0].moved, true);
  assert.equal(actor(world).state?.lockKeys, 1);
});

test("deathCountdownSeconds 为 0 时不创建 Timed Challenge", () => {
  const session = new GameplaySession();
  session.loadLevel(corridor([{
    type: MapEntityTypeId.LOCK,
    x: 1,
    y: 0,
    deathCountdownSeconds: 0,
  }]));

  assert.equal(session.state.timedChallengePhase, null);
  assert.equal(move(session.world, "right").moves[0].moved, true);
  assert.equal(session.state.timedChallengePhase, null);
  assert.equal(session.state.timedChallengeRemainingMs, null);
});
