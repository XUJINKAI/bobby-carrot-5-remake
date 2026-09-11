import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { GameplaySession } from "../dist/core/GameplaySession.js";

function shopLevel() {
  return {
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      {
        type: MapEntityTypeId.SHOP_SUPER_KEY,
        x: 1,
        y: 0,
        stackOrder: 12,
      },
    ],
  };
}

function entityAt(session, type, x, y) {
  return session.world.entities.all().find(
    (entity) =>
      entity.type === type && entity.anchor.x === x && entity.anchor.y === y,
  );
}

test("Entity replacement 提交到当前 World 并成为 Restart 基线", () => {
  const session = new GameplaySession();
  session.loadLevel(shopLevel());
  const original = entityAt(
    session,
    MapEntityTypeId.SHOP_SUPER_KEY,
    1,
    0,
  );
  assert.ok(original);

  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      historyBoundary: false,
      intents: [{
        type: "commit-entity-replacement",
        target: {
          type: MapEntityTypeId.SHOP_SUPER_KEY,
          x: 1,
          y: 0,
        },
        replacementType: MapEntityTypeId.SHOP_EMPTY,
      }],
    }],
  }));

  const replacement = entityAt(session, MapEntityTypeId.SHOP_EMPTY, 1, 0);
  assert.ok(replacement);
  assert.equal(replacement.stackOrder, 12);
  assert.equal(entityAt(session, MapEntityTypeId.SHOP_SUPER_KEY, 1, 0), undefined);
  assert.deepEqual(tick.result.mutations.destroyed, [original.id]);
  assert.deepEqual(tick.result.mutations.spawned, [replacement.id]);
  assert.deepEqual(tick.result.events.at(-1), {
    type: "entity-replacement-committed",
    entityId: original.id,
    x: 1,
    y: 0,
    data: { replacementType: MapEntityTypeId.SHOP_EMPTY },
  });

  session.restart();
  assert.ok(entityAt(session, MapEntityTypeId.SHOP_EMPTY, 1, 0));
  assert.equal(entityAt(session, MapEntityTypeId.SHOP_SUPER_KEY, 1, 0), undefined);
});

test("找不到唯一目标时 Entity replacement 保持无副作用", () => {
  const session = new GameplaySession();
  session.loadLevel(shopLevel());
  const [tick] = session.advanceTicks(1, () => ({
    groups: [{
      intents: [{
        type: "commit-entity-replacement",
        target: {
          type: MapEntityTypeId.SHOP_SUPER_KEY,
          x: 0,
          y: 0,
        },
        replacementType: MapEntityTypeId.SHOP_EMPTY,
      }],
    }],
  }));

  assert.deepEqual(tick.inputGroups, []);
  assert.deepEqual(tick.result.events, []);
  assert.ok(entityAt(session, MapEntityTypeId.SHOP_SUPER_KEY, 1, 0));
});
