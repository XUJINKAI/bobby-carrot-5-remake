import assert from "node:assert/strict";
import test from "node:test";
import { EntityTypeId } from "@bobby/model";
import { createDialogBehavior } from "../dist/public.js";
import { World } from "../dist/world/World.js";

function dialogLevel() {
  return {
    schemaVersion: 1,
    width: 2,
    height: 2,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 0, y: 1 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 1 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      {
        type: EntityTypeId.SANDMAN,
        x: 1,
        y: 0,

      },
    ],
  };
}

function dialogWorld(dialog) {
  const world = new World(dialogLevel());
  const sandman = world.entities.all().find(
    (entity) => entity.type === EntityTypeId.SANDMAN,
  );
  assert.ok(sandman);
  sandman.state = { dialog };
  return world;
}

function move(world, direction) {
  const actor = world.query.entitiesWithTrait("player")[0];
  assert.ok(actor, "test map must contain a player actor");
  return world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

test("dialog behavior emits a raw runtime message", () => {
  const world = dialogWorld({ message: "hello world!" });
  const result = move(world, "right");
  assert.equal(result.moves[0].moved, false);
  assert.equal(
    result.events.find((event) => event.type === "dialog")?.text,
    "hello world!",
  );
});

test("dialog message-ref invokes its registered runtime initializer each time", () => {
  const dispose = createDialogBehavior(
    "sandman-dialog-test",
    ({ self, commands }) => {
      const count = Number(self.entity.state?.dialogCount ?? 0);
      commands.setState(self.entity.id, {
        ...(self.entity.state ?? {}),
        dialogCount: count + 1,
      });
      return count === 0 ? "first" : "again";
    },
  );
  try {
    const world = dialogWorld({ "message-ref": "sandman-dialog-test" });
    assert.equal(
      move(world, "right").events.find((event) => event.type === "dialog")
        ?.text,
      "first",
    );
    assert.equal(
      move(world, "right").events.find((event) => event.type === "dialog")
        ?.text,
      "again",
    );
  } finally {
    dispose();
  }
});
