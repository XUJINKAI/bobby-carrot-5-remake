import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";
import { parseNovoban } from "../../../tools/assets/novoban/parser.mjs";
import {
  createPushboxTerrainPicker,
} from "../../../tools/assets/pushbox/terrain.mjs";
import {
  countPushGoals,
  SOKOBAN_WIN_RULE,
} from "../../../tools/assets/pushbox/xsb.mjs";

const levels = parseNovoban(
  fs.readFileSync(`${root}/tools/assets/novoban/NOVOBAN.txt`, "utf8"),
);

test("Novoban source parses into the original 50-level order", () => {
  assert.equal(levels.length, 50);
  assert.deepEqual(
    levels.slice(0, 3).map((level) => [level.id, level.title]),
    [
      ["01", "Be ban 10"],
      ["02", "Be ban 9"],
      ["03", "Be ban 7"],
    ],
  );
  assert.equal(levels.at(-1)?.id, "50");
  assert.equal(levels.at(-1)?.title, "For ban 5");
  assert.equal(levels.every((level) => level.author === "François Marques"), true);
});

test("Novoban keeps variable box counts and uses push goals", () => {
  const boxCounts = new Set();
  for (const entry of levels) {
    assert.deepEqual(entry.level.rules.win, SOKOBAN_WIN_RULE);
    const pushables = entry.level.entities.filter((entity) =>
      entity.type === "pushable-box",
    );
    const goals = countPushGoals(entry.level);
    assert.equal(pushables.length, goals, entry.id);
    assert.ok(goals > 0, entry.id);
    assert.equal(
      entry.level.entities.filter((entity) => entity.type === "bobby").length,
      1,
      entry.id,
    );
    assert.equal(
      entry.level.entities.some((entity) => entity.type === "start"),
      false,
      entry.id,
    );
    assert.equal(
      entry.level.entities.some((entity) => entity.type === "exit"),
      false,
      entry.id,
    );
    boxCounts.add(pushables.length);
  }
  assert.ok(boxCounts.size > 1, "Novoban 应保留每关不同的箱子数量");
});

test("Novoban XSB plus keeps push-goal surface under Bobby", () => {
  const surrounded = levels.find((level) => level.title === "Surrounded");
  assert.ok(surrounded);
  const bobby = surrounded.level.entities.find(
    (entity) => entity.type === "bobby",
  );
  const terrain = createPushboxTerrainPicker(
    `novoban-pushbox/${surrounded.id}`,
  );
  assert.deepEqual(bobby, { type: "bobby", x: 3, y: 3, stackOrder: 2 });
  assert.deepEqual(
    surrounded.level.entities.filter(
      (entity) => entity.x === 3 && entity.y === 3,
    ),
    [
      terrain("ground", 3, 3),
      { type: "push-goal", x: 3, y: 3, stackOrder: 1 },
      { type: "bobby", x: 3, y: 3, stackOrder: 2 },
    ],
  );
});
