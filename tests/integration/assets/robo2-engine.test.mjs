import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parseLevelMap } from "@bobby/model";
import {
  buildRobo2Maps,
  ROBO2_SOURCE_FILE,
} from "../../../tools/assets/robo2/generate.mjs";
import { World } from "../../support/engine/World.mjs";

test("Robo 2 的 25 张地图都能启动为有效 Engine World", () => {
  const maps = buildRobo2Maps(fs.readFileSync(ROBO2_SOURCE_FILE));
  assert.equal(maps.length, 25);

  for (const map of maps) {
    const world = new World(parseLevelMap(map.document));
    world.update({ tick: 0, stepMs: 16 });

    const players = world.query.entitiesWithFact("player");
    assert.equal(players.length, 1, `${map.id}: player 数量`);
    assert.equal(
      world.actorLifecycle(players[0].id).phase,
      "active",
      `${map.id}: Bobby 初始状态`,
    );
    assert.equal(world.outcome.state.phase, "playing", `${map.id}: World 状态`);
  }
});
