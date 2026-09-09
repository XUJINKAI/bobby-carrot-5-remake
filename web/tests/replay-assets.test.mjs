import assert from "node:assert/strict";
import { test } from "vitest";
import { loadReplayAsset } from "../src/pages/game/replayAssets.ts";

test("loads a built-in replay as editable source text", async () => {
  const text = JSON.stringify({ formatVersion: 1, meta: {} });
  const loaded = await loadReplayAsset(
    "/assets/replays/original/1-1.json",
    async (url, options) => {
      assert.equal(url, "/assets/replays/original/1-1.json");
      assert.equal(options?.headers?.accept, "application/json");
      return new Response(text, { status: 200 });
    },
  );
  assert.equal(loaded.text, text);
  assert.equal(loaded.replay.formatVersion, 1);
});

test("reports a missing built-in replay", async () => {
  await assert.rejects(
    loadReplayAsset(
      "/assets/replays/original/missing.json",
      async () => new Response("", { status: 404 }),
    ),
    /当前关卡暂无内置过法/,
  );
});
