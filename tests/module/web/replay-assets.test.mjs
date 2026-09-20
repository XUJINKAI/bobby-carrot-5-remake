import assert from "node:assert/strict";
import { test } from "vitest";
import { WEB_ERROR_CODES, WebError } from "../../../web/src/errors/errorCodes.ts";
import {
  loadReplayAsset,
  saveReplayAsset,
} from "../../../web/src/pages/game/replayAssets.ts";

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
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.replay.builtinMissing,
  );
});

test("保存内置过法向加载地址写入当前文本", async () => {
  const url = "/assets/replays/original/1-1.json";
  const text = '{"formatVersion":1,"frames":[]}';
  await saveReplayAsset(url, text, async (requestedUrl, options) => {
    assert.equal(requestedUrl, url);
    assert.equal(options?.method, "PUT");
    assert.equal(options?.body, text);
    return new Response(null, { status: 204 });
  });
});
