import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { encodeExchangeText } from "@bobby/exchange";
import {
  levelMapFixture,
  mapDocumentFixture,
  scopedSaveFixtures,
} from "../../exchange/tests/fixtures.mjs";
import { loadEmbedMap } from "../dist/mapInput.js";

test("map 接受 JSON、两种 payload、BC5R1 与完整分享 URL", async () => {
  const json = JSON.stringify(levelMapFixture);
  const plainPayload = Buffer.from(json, "utf8").toString("base64url");
  const gzipPayload = gzipSync(json).toString("base64url");
  const sources = [
    json,
    JSON.stringify(mapDocumentFixture),
    plainPayload,
    gzipPayload,
    `BC5R1:${plainPayload}`,
    `BC5R1:${gzipPayload}`,
    `https://example.com/import/v1#${plainPayload}`,
    `https://example.com/import/v1#${gzipPayload}`,
    await encodeExchangeText(json),
    await encodeExchangeText(json, { publicBaseUrl: "https://example.com/" }),
  ];
  for (const map of sources)
    assert.deepEqual(await loadEmbedMap({ map }), levelMapFixture);
});

test("mapUrl 下载后的内容经过同一组 decoder", async () => {
  const json = JSON.stringify(mapDocumentFixture);
  const plainPayload = Buffer.from(json, "utf8").toString("base64");
  const gzipPayload = gzipSync(json).toString("base64url");
  for (const source of [
    json,
    plainPayload,
    gzipPayload,
    await encodeExchangeText(json),
  ]) {
    const mapUrl = `data:text/plain,${encodeURIComponent(source)}`;
    assert.deepEqual(await loadEmbedMap({ mapUrl }), levelMapFixture);
  }
});

test("要求唯一输入，并将存档明确识别为非地图", async () => {
  await assert.rejects(() => loadEmbedMap({}), /exactly one/);
  await assert.rejects(
    () => loadEmbedMap({
      map: JSON.stringify(levelMapFixture),
      mapUrl: "data:text/plain,unused",
    }),
    /exactly one/,
  );
  for (const save of scopedSaveFixtures)
    await assert.rejects(
      () => loadEmbedMap({ map: JSON.stringify(save) }),
      new RegExp(`scope.*${save.scope}.*save, not a map`),
    );
  await assert.rejects(
    () => loadEmbedMap({ map: JSON.stringify({ ...levelMapFixture, schemaVersion: 2 }) }),
    /not a valid map/,
  );
});
