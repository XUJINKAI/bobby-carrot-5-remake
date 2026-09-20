import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { replaySaveMiddleware } from "../../../web/dev/replaySaveMiddleware.ts";

test("开发服务器按内置过法加载路径写入 Replay 文本", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "bc5r-replay-save-"));
  const middleware = replaySaveMiddleware(directory);
  const server = http.createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404;
      response.end();
    });
  });
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const text = '{"formatVersion":1,"endTick":5}';
    const response = await fetch(
      `http://127.0.0.1:${address.port}/assets/replays/original/1-1.json`,
      { method: "PUT", body: text },
    );
    assert.equal(response.status, 204);
    assert.equal(
      await fs.readFile(path.join(directory, "original/1-1.json"), "utf8"),
      text,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
