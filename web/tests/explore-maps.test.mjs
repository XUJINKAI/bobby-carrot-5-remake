import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveMapDocument } from "../src/services/catalog/exploreMaps.ts";

test("直达 Play 只按 URL 加载一个 canonical MapDocument", async () => {
  const requests = [];
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return new Response(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: "1-5" },
        width: 2,
        height: 1,
        entities: [
          { type: "start", x: 0, y: 0 },
          { type: "bobby", x: 0, y: 0 },
          { type: "exit", x: 1, y: 0 },
        ],
        rules: { win: { type: "reach", target: "exit" } },
      }),
    );
  };

  try {
    const resolved = await resolveMapDocument({
      collection: "original",
      id: "1-5",
    });
    assert.deepEqual(requests, [
      "https://example.test/assets/maps/original/1-5.json",
    ]);
    assert.equal(resolved.ref.id, "1-5");
    assert.equal(resolved.document.meta.name, "1-5");
    assert.equal(Object.hasOwn(resolved.level, "meta"), false);
    assert.equal(resolved.level.schemaVersion, 1);
    assert.deepEqual(resolved.level.entities, [
      { type: "start", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0 },
      { type: "exit", x: 1, y: 0 },
    ]);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  }
});

test("直达 Play 保留 canonical Bobby Entity 与 fill-all 规则", async () => {
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: "LOMA 01-01" },
        width: 2,
        height: 1,
        entities: [
          { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
          { type: "bobby", x: 0, y: 0 },
          { type: "push-goal", x: 1, y: 0 },
        ],
        rules: {
          win: {
            type: "fill-all",
            target: "push-goal",
            filler: "pushable",
          },
        },
      }),
    );

  try {
    const resolved = await resolveMapDocument({
      collection: "loma-pushbox",
      id: "01-01",
    });
    assert.ok(
      resolved.level.entities.some(
        (entity) => entity.type === "bobby" && entity.x === 0 && entity.y === 0,
      ),
    );
    assert.deepEqual(resolved.level.rules?.win, {
      type: "fill-all",
      target: "push-goal",
      filler: "pushable",
    });
    assert.equal(Object.hasOwn(resolved.level, "meta"), false);
    assert.equal(resolved.level.schemaVersion, 1);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  }
});

test("地图资源 identity 来自 URL，而不是 MapDocument metadata", async () => {
  const previousFetch = globalThis.fetch;
  const previousDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: "Other" },
        width: 1,
        height: 1,
        entities: [{ type: "bobby", x: 0, y: 0 }],
      }),
    );
  try {
    const resolved = await resolveMapDocument({
      collection: "engine-lab",
      id: "expected",
    });
    assert.equal(resolved.ref.id, "expected");
    assert.equal(resolved.document.meta.name, "Other");
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.document = previousDocument;
  }
});
