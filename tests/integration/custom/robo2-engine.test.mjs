import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseLevelMap } from "@bobby/model";
import { root } from "../../../tools/lib/fs.mjs";
import { World } from "../../support/engine/World.mjs";

const sourceDirectory = path.join(root, "custom-maps/robo2");

test("Robo 2 的 25 张地图都能启动为有效 Engine World", () => {
  const filenames = fs.readdirSync(sourceDirectory)
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  assert.equal(filenames.length, 25);

  for (const filename of filenames) {
    const source = JSON.parse(
      fs.readFileSync(path.join(sourceDirectory, filename), "utf8"),
    );
    const world = new World(parseLevelMap(source));
    world.update({ tick: 0, stepMs: 16 });

    const players = world.query.entitiesWithFact("player");
    assert.equal(players.length, 1, `${filename}: player 数量`);
    assert.equal(
      world.actorLifecycle(players[0].id).phase,
      "active",
      `${filename}: Bobby 初始状态`,
    );
    assert.equal(world.outcome.state.phase, "playing", `${filename}: World 状态`);
  }
});
