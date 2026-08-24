import test from "node:test";
import assert from "node:assert/strict";
import { ObjectId, Terrain } from "../../model/dist/index.js";
import {
  augmentAdventureLevel,
  createAdventureSave,
  prepareAdventureLevel,
} from "../dist/index.js";

function sandmanLevel() {
  return {
    width: 4,
    height: 4,
    terrain: Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Terrain.GROUND_C),
    ),
    objects: [{ type: ObjectId.SANDMAN, x: 1, y: 1 }],
  };
}

test("Adventure can add dialogue without changing the base LevelMap", () => {
  const base = sandmanLevel();
  const augmented = augmentAdventureLevel(base, [
    {
      type: ObjectId.SANDMAN,
      x: 1,
      y: 1,
      properties: { dialogue: "Adventure 自定义对白" },
    },
  ]);
  assert.equal(base.objects[0].properties, undefined);
  assert.deepEqual(augmented.objects[0].properties, {
    dialogue: "Adventure 自定义对白",
  });
});

test("prepareAdventureLevel applies property patches before Engine", () => {
  const prepared = prepareAdventureLevel(
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
  assert.deepEqual(prepared.objects[0].properties, {
    dialogue: "关卡剧情对白",
  });
});
