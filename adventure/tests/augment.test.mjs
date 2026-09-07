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
      fields: { dialogue: "Adventure 自定义对白" },
    },
  ]);
  assert.equal(base.entities[0].dialogue, undefined);
  assert.equal(augmented.entities[0].dialogue, "Adventure 自定义对白");
});

test("prepareAdventureLevel applies field patches before Engine", () => {
  const prepared = createAdventureLevelInstance(
    "1-1",
    sandmanLevel(),
    createAdventureSave(),
    [
      {
        x: 1,
        y: 1,
        fields: { dialogue: "关卡剧情对白" },
      },
    ],
  );
  assert.equal(prepared.entities[0].dialogue, "关卡剧情对白");
});

test("type-only Adventure patches apply to every matching Entity", () => {
  const level = {
    schemaVersion: 1,
    width: 4,
    height: 4,
    entities: [
      { type: EntityTypeId.BEAVER, x: 0, y: 0 },
      { type: EntityTypeId.BEAVER, x: 2, y: 0 },
      { type: EntityTypeId.LOCK, x: 1, y: 2 },
    ],
  };
  const augmented = augmentAdventureLevel(level, [
    {
      type: EntityTypeId.BEAVER,
      fields: { interaction: "bonus-key-vendor" },
    },
  ]);
  assert.equal(augmented.entities[0].interaction, "bonus-key-vendor");
  assert.equal(augmented.entities[1].interaction, "bonus-key-vendor");
  assert.equal(augmented.entities[2].interaction, undefined);
});
