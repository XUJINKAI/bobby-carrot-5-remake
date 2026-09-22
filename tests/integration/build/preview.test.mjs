import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createPreviewServer } from "../../../tools/pipeline/preview.mjs";

test("preview 独立提供现有 dist 且不回退未知路径", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-preview-"));
  fs.writeFileSync(path.join(directory, "index.html"), "preview");
  const server = createPreviewServer(directory);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(
    () => new Promise((resolve) => server.close(resolve)),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  const index = await fetch(`${origin}/`);
  assert.equal(index.status, 200);
  assert.equal(await index.text(), "preview");

  const missing = await fetch(`${origin}/missing`);
  assert.equal(missing.status, 404);
});
