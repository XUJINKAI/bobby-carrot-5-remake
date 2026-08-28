import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { extractSharePayload, loadEmbedMap } from "../dist/mapInput.js";

const level = {
  schemaVersion: 1,
  width: 2,
  height: 2,
  entities: [],
};

function payload(value = level) {
  return gzipSync(JSON.stringify(value)).toString("base64url");
}

test("extractSharePayload accepts raw, BC5R1 and loose v1# inputs", () => {
  assert.equal(extractSharePayload("abc_DEF-123"), "abc_DEF-123");
  assert.equal(extractSharePayload(" BC5R1:abc_DEF-123 "), "abc_DEF-123");
  assert.equal(
    extractSharePayload("prefix https://bc5r.com/import/v1#abc_DEF-123"),
    "abc_DEF-123",
  );
  assert.equal(
    extractSharePayload("anything/v1#first-v1#second"),
    "first-v1#second",
  );
});

test("loadEmbedMap decodes Editor-compatible BC5R1 data", async () => {
  const encoded = payload();
  assert.deepEqual(await loadEmbedMap({ map: `BC5R1:${encoded}` }), level);
  assert.deepEqual(
    await loadEmbedMap({ map: `https://bc5r.com/import/v1#${encoded}` }),
    level,
  );
});

test("loadEmbedMap accepts user-managed mapUrl text", async () => {
  const encoded = payload();
  const url = `data:text/plain,${encodeURIComponent(`BC5R1:${encoded}`)}`;
  assert.deepEqual(await loadEmbedMap({ mapUrl: url }), level);
});

test("loadEmbedMap requires one source and rejects invalid maps", async () => {
  await assert.rejects(() => loadEmbedMap({}), /exactly one/);
  await assert.rejects(
    () => loadEmbedMap({ map: payload(), mapUrl: "data:text/plain,unused" }),
    /exactly one/,
  );
  await assert.rejects(
    () => loadEmbedMap({ map: payload({ ...level, schemaVersion: 2 }) }),
    /schemaVersion must be 1/,
  );
});
