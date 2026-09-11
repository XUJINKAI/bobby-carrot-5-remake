import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import {
  completedResultHtml,
  failedResultHtml,
} from "../src/pages/game/resultFormatting.ts";

function visibleLines(html) {
  return html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

test("通关卡片显示统计并只提供返回与主要下一关动作", () => {
  const html = completedResultHtml({
    elapsedMs: 39_999,
    moves: 84,
    collectedCoins: 2,
    availableCoins: 2,
    totalCoins: 4,
    nextId: "1-2",
  });

  assert.deepEqual(visibleLines(html), [
    "关卡完成！",
    "用时: 00:39",
    "步数: 84",
    "金币: 2/2",
    "总金币: 4",
    "返回",
    "下一关",
  ]);
  assert.equal((html.match(/<button/g) ?? []).length, 2);
  assert.match(html, /class="primary-btn" data-result="next"/);
});

test("失败卡片只显示失败以及返回与主要重新开始动作", () => {
  const html = failedResultHtml();

  assert.deepEqual(visibleLines(html), ["失败", "返回", "重新开始"]);
  assert.equal((html.match(/<button/g) ?? []).length, 2);
  assert.match(html, /class="primary-btn" data-result="retry"/);
});

test("Replay 录制状态不参与结果卡片分支，终局切换对应音乐", async () => {
  const source = await readFile(
    new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /game\.replayRecording/);
  assert.match(
    source,
    /audio\.playMusic\(kind === "complete" \? "cleared" : "death"\)/,
  );
});

test("Adventure 商品购买使用同级选项", async () => {
  const source = await readFile(
    new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /adventureItemReplacementIntent\(offer, request\)/);
  assert.match(source, /game\.dispatchInteractionEffect\(replacement\)/);
  assert.match(source, /\{ id: "purchase", label: offer\.leftLabel \}/);
  assert.doesNotMatch(
    source,
    /id: "purchase", label: offer\.leftLabel, primary: true/,
  );
});
