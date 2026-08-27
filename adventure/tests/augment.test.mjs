import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "../../model/dist/index.js";
import {
  augmentAdventureLevel,
  createAdventureSave,
  createAdventureLevelInstance,
} from "../dist/index.js";

function sandmanLevel() {
  return {
    schemaVersion: 1,
    width: 4,
    height: 4,
    entities: [{ type: EntityTypeId.SANDMAN, x: 1, y: 1 }],
  };
}

test("Adventure can add dialogue without changing the base LevelMap", () => {
  const base = sandmanLevel();
  const augmented = augmentAdventureLevel(base, [
    {
      type: EntityTypeId.SANDMAN,
      x: 1,
      y: 1,
      properties: { dialogue: "Adventure 自定义对白" },
    },
  ]);
  assert.equal(base.entities[0].properties, undefined);
  assert.deepEqual(augmented.entities[0].properties, {
    dialogue: "Adventure 自定义对白",
  });
});

test("prepareAdventureLevel applies property patches before Engine", () => {
  const prepared = createAdventureLevelInstance(
    "1-1",
    sandmanLevel(),
    createAdventureSave(),
    [
      {
        x: 1,
        y: 1,
        properties: { dialogue: "关卡剧情对白" },
      },
    ],
  );
  assert.deepEqual(prepared.entities[0].properties, {
    dialogue: "关卡剧情对白",
  });
});
