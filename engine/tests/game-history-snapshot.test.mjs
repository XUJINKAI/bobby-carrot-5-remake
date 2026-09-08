import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/core/Game.js";
import { World } from "../dist/world/World.js";

function createGame(mode, carrotX = 1) {
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ...[0, 1, 2, 3].map((x) => ({
        type: "grass",
        variant: "ts-10-1",
        x,
        y: 0,
      })),
      { type: "bobby", x: 0, y: 0 },
      { type: "carrot", x: carrotX, y: 0 },
    ],
  });
  const actorId = world.query.entitiesWithTrait("player")[0].id;
  const game = Object.create(Game.prototype);
  game.worldValue = world;
  game.worldClock = { paused: false };
  game.controlBindings = [{ input: "external", targets: [{ entityId: actorId }] }];
  game.historyPolicy = { mode };
  game.history = [];
  game.future = [];
  game.pendingHistorySnapshot = null;
  // 只隔离浏览器表现适配，移动、收集和历史恢复使用正式 Game / World。
  game.visual = { clear() {} };
  game.render = () => {};
  game.emit = () => {};
  game.consumeWorldDeltas = () => {};
  game.publishWorldEvents = () => {};
  const snapshot = world.snapshot.bind(world);
  let snapshotCount = 0;
  world.snapshot = () => {
    snapshotCount += 1;
    return snapshot();
  };
  return { game, world, actorId, snapshotCount: () => snapshotCount };
}

for (const mode of ["disabled", "world-change", "every-intent"]) {
  test(`历史策略 ${mode} 按需创建快照并保持移动与收集语义`, () => {
    const { game, world, actorId, snapshotCount } = createGame(mode);
    assert.equal(game.move("right").moved, true);
    assert.equal(world.entity(actorId).anchor.x, 1);
    assert.equal(world.entities.all().some((entity) => entity.type === "carrot"), false);
    assert.equal(snapshotCount(), mode === "disabled" ? 0 : 1);
    assert.equal(game.canUndo, mode !== "disabled");
    assert.equal(game.pendingHistorySnapshot, null);

    game.undo();
    assert.equal(world.entity(actorId).anchor.x, mode === "disabled" ? 1 : 0);
    assert.equal(
      world.entities.all().some((entity) => entity.type === "carrot"),
      mode !== "disabled",
    );
    game.redo();
    assert.equal(world.entity(actorId).anchor.x, 1);
    assert.equal(world.entities.all().some((entity) => entity.type === "carrot"), false);
  });
}

test("续接步骤复用待提交快照，并让 Undo 回到操作起点", () => {
  const { game, world, actorId, snapshotCount } = createGame("world-change", 2);
  assert.equal(game.move("right").moved, true);
  assert.equal(game.canUndo, false);
  const pending = game.pendingHistorySnapshot;
  assert.ok(pending);
  assert.equal(snapshotCount(), 1);

  const result = game.startLogicalStep({
    historyBoundary: false,
    intents: [{
      type: "move",
      actorId,
      direction: "right",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(result.moves[0].moved, true);
  assert.equal(world.entity(actorId).anchor.x, 2);
  assert.equal(snapshotCount(), 1);
  assert.equal(game.history[0], pending);
  game.undo();
  assert.equal(world.entity(actorId).anchor.x, 0);
  assert.equal(world.entities.all().some((entity) => entity.type === "carrot"), true);
});
