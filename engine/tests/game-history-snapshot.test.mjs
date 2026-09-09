import test from "node:test";
import assert from "node:assert/strict";
import { GameplaySession } from "../dist/core/GameplaySession.js";

function createSession(mode, carrotX = 1) {
  const session = new GameplaySession({
    history: { mode },
    timing: { worldHz: 20 },
    bobbyLocomotion: { moveMs: 100 },
  });
  session.loadLevel({
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
  const actorId = session.actorIds[0];
  const snapshot = session.world.snapshot.bind(session.world);
  let snapshotCount = 0;
  session.world.snapshot = () => {
    snapshotCount += 1;
    return snapshot();
  };
  return { session, actorId, snapshotCount: () => snapshotCount };
}

function inputRight(session, historyBoundary = true) {
  const actorId = session.actorIds[0];
  return session.advanceTicks(1, () => ({
    groups: [{
      historyBoundary,
      intents: [{
        type: "move",
        actorId,
        direction: "right",
        cause: { type: "player-input", source: "test" },
      }],
    }],
  }));
}

for (const mode of ["disabled", "world-change", "every-intent"]) {
  test(`历史策略 ${mode} 按需创建快照并保持移动与收集语义`, () => {
    const { session, actorId, snapshotCount } = createSession(mode);
    inputRight(session);
    session.advanceTicks(2);
    assert.equal(session.world.entity(actorId).anchor.x, 1);
    assert.equal(
      session.world.entities.all().some((entity) => entity.type === "carrot"),
      false,
    );
    assert.equal(snapshotCount(), mode === "disabled" ? 0 : 1);
    assert.equal(session.canUndo, mode !== "disabled");

    session.undo();
    assert.equal(session.world.entity(actorId).anchor.x, mode === "disabled" ? 1 : 0);
    assert.equal(
      session.world.entities.all().some((entity) => entity.type === "carrot"),
      mode !== "disabled",
    );
    session.redo();
    assert.equal(session.world.entity(actorId).anchor.x, 1);
  });
}

test("续接步骤复用待提交快照，并让 Undo 回到操作起点", () => {
  const { session, actorId, snapshotCount } = createSession("world-change", 2);
  inputRight(session);
  session.advanceTicks(2);
  assert.equal(session.canUndo, false);
  assert.equal(snapshotCount(), 1);

  inputRight(session, false);
  session.advanceTicks(2);
  assert.equal(session.world.entity(actorId).anchor.x, 2);
  assert.equal(snapshotCount(), 1);
  assert.equal(session.canUndo, true);
  session.undo();
  assert.equal(session.world.entity(actorId).anchor.x, 0);
  assert.equal(
    session.world.entities.all().some((entity) => entity.type === "carrot"),
    true,
  );
});
