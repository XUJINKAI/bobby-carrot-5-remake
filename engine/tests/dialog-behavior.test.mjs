import assert from "node:assert/strict";
import test from "node:test";
import { EntityTypeId } from "@bobby/model";
import { createDialogBehavior } from "../dist/public.js";
import { World } from "../dist/world/World.js";

function dialogLevel(dialog) {
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
        direction: "down",
        properties: { dialog },
      },
    ],
  };
}

test("dialog trait emits a raw message directly from JSON", () => {
  const world = new World(dialogLevel({ message: "hello world!" }));
  const result = world.move("right");
  assert.equal(result.moved, false);
  assert.equal(
    result.events.find((event) => event.type === "dialog")?.text,
    "hello world!",
  );
});

test("dialog message-ref invokes its registered runtime initializer each time", () => {
  const dispose = createDialogBehavior("sandman-dialog-test", ({ self, commands }) => {
    const count = Number(self.entity.state?.dialogCount ?? 0);
    commands.setState(self.entity.id, {
      ...(self.entity.state ?? {}),
      dialogCount: count + 1,
    });
    return count === 0 ? "first" : "again";
  });
  try {
    const world = new World(
      dialogLevel({ "message-ref": "sandman-dialog-test" }),
    );
    assert.equal(
      world.move("right").events.find((event) => event.type === "dialog")?.text,
      "first",
    );
    assert.equal(
      world.move("right").events.find((event) => event.type === "dialog")?.text,
      "again",
    );
  } finally {
    dispose();
  }
});
