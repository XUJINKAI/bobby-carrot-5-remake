import test from "node:test";
import assert from "node:assert/strict";
import { resolveExploreMap } from "../dist-src/services/catalog/exploreMaps.js";

test("直达 Play 使用 URL 映射加载地图，不要求 Catalog 条目存在", async (context) => {
  const requests = [];
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return new Response(JSON.stringify({
      schemaVersion: 3,
      width: 1,
      height: 1,
      terrain: [["start"]],
      objects: [],
      rules: { win: { type: "reach-terrain", trait: "exit" } },
    }));
  };
  context.after(() => {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  });

  const resolved = await resolveExploreMap(
    { levels: [] },
    { schemaVersion: 1, collections: [] },
    { collection: "original", id: "1-5" },
  );

  assert.equal(requests.length, 1);
  assert.match(requests[0], /assets\/maps\/original\/1-5\.json$/);
  assert.equal(resolved?.title, "1-5");
  assert.equal(resolved?.official, undefined);
});
