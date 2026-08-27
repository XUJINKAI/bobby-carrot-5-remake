import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveMapDocument } from "../src/services/catalog/exploreMaps.ts";

test("直达 Play 只按 URL 加载一个 MapDocument", async () => {
  const requests = [];
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return new Response(JSON.stringify({
      schemaVersion: 1,
      meta: {
        id: "1-5",
        name: "1-5",
        next: "1-6",
      },
      width: 1,
      height: 1,
      terrain: [["start"]],
      objects: [],
      rules: { win: { type: "reach-terrain", trait: "exit" } },
    }));
  };

  try {
    const resolved = await resolveMapDocument({
      collection: "original",
      id: "1-5",
    });
    assert.deepEqual(requests, [
      "https://example.test/assets/maps/original/1-5.json",
    ]);
    assert.equal(resolved.document.meta.id, "1-5");
    assert.equal(resolved.document.meta.next, "1-6");
    assert.equal(Object.hasOwn(resolved.level, "meta"), false);
    assert.equal(Object.hasOwn(resolved.level, "schemaVersion"), false);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  }
});

test("直达 Play 保留 MapDocument.playerStart", async () => {
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async () => new Response(JSON.stringify({
    schemaVersion: 1,
    meta: { id: "01-01", name: "LOMA 01-01" },
    width: 2,
    height: 1,
    playerStart: { x: 0, y: 0 },
    terrain: [["ground-c", "custom:push-goal"]],
    objects: [],
    rules: {
      win: {
        type: "fill-all",
        terrainTrait: "push-goal",
        objectTrait: "pushable",
      },
    },
  }));

  try {
    const resolved = await resolveMapDocument({
      collection: "loma-pushbox",
      id: "01-01",
    });
    assert.deepEqual(resolved.level.playerStart, { x: 0, y: 0 });
    assert.equal(Object.hasOwn(resolved.level, "meta"), false);
    assert.equal(Object.hasOwn(resolved.level, "schemaVersion"), false);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  }
});

test("MapDocument 的 meta.id 必须与 URL map id 一致", async () => {
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async () => new Response(JSON.stringify({
    schemaVersion: 1,
    meta: { id: "other", name: "Other" },
    width: 1,
    height: 1,
    terrain: [["start"]],
    objects: [],
  }));
  try {
    await assert.rejects(
      resolveMapDocument({ collection: "engine-lab", id: "expected" }),
      /meta.id/,
    );
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  }
});
