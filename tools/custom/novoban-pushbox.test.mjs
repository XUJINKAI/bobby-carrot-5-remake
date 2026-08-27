import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { root } from "../lib/fs.mjs";
import { parseNovoban } from "./novoban-pushbox.mjs";
import { countPushGoals, SOKOBAN_WIN_RULE } from "./sokoban-xsb.mjs";

const levels = parseNovoban(
  fs.readFileSync(`${root}/tools/custom/NOVOBAN.txt`, "utf8"),
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

test("Novoban keeps variable box counts and only uses fill-all push goals", () => {
  const boxCounts = new Set();
  for (const entry of levels) {
    assert.deepEqual(entry.level.rules.win, SOKOBAN_WIN_RULE);
    const pushables = entry.level.objects.filter((object) =>
      object.traits?.includes("pushable"),
    );
    const goals = countPushGoals(entry.level);
    assert.equal(pushables.length, goals, entry.id);
    assert.ok(goals > 0, entry.id);
    assert.ok(entry.level.playerStart, entry.id);
    assert.equal(entry.level.terrain.flat().includes("start"), false, entry.id);
    assert.equal(entry.level.terrain.flat().includes("exit"), false, entry.id);
    boxCounts.add(pushables.length);
  }
  assert.ok(boxCounts.size > 1, "Novoban 应保留每关不同的箱子数量");
});

test("Novoban XSB plus keeps push-goal terrain under explicit playerStart", () => {
  const surrounded = levels.find((level) => level.title === "Surrounded");
  assert.ok(surrounded);
  assert.deepEqual(surrounded.level.playerStart, { x: 3, y: 3 });
  assert.equal(surrounded.level.terrain[3]?.[3], "custom:push-goal");
});
