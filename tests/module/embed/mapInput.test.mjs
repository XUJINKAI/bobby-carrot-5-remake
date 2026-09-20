import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import test from "node:test";
import {
  EXCHANGE_ERROR_CODES,
  ExchangeMapError,
  encodeExchangeText,
} from "@bobby/exchange";
import {
  levelMapFixture,
  mapDocumentFixture,
  scopedSaveFixtures,
} from "../../fixtures/exchange/fixtures.mjs";
import {
  EmbedMapInputError,
  loadEmbedMap,
} from "../../../embed/dist/mapInput.js";

test("map 接受 JSON、两种 payload 与完整分享 URL", async () => {
  const json = JSON.stringify(levelMapFixture);
  const plainPayload = Buffer.from(json, "utf8").toString("base64url");
  const gzipPayload = gzipSync(json).toString("base64url");
  const sources = [
    json,
    JSON.stringify(mapDocumentFixture),
    plainPayload,
    gzipPayload,
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

test("要求唯一非空输入，并将存档明确识别为非地图", async () => {
  for (const value of [{}, { map: "" }, { mapUrl: "" }])
    await assert.rejects(
      () => loadEmbedMap(value),
      (error) =>
        error instanceof EmbedMapInputError &&
        error.reason === "missing-map",
    );
  await assert.rejects(
    () => loadEmbedMap({
      map: JSON.stringify(levelMapFixture),
      mapUrl: "data:text/plain,unused",
    }),
    (error) =>
      error instanceof EmbedMapInputError &&
      error.reason === "multiple-inputs",
  );
  for (const save of scopedSaveFixtures)
    await assert.rejects(
      () => loadEmbedMap({ map: JSON.stringify(save) }),
      (error) =>
        error instanceof ExchangeMapError &&
        error.code === EXCHANGE_ERROR_CODES.saveNotMap &&
        error.reason === "save" &&
        error.scope === save.scope,
    );
  await assert.rejects(
    () => loadEmbedMap({ map: JSON.stringify({ ...levelMapFixture, schemaVersion: 2 }) }),
    (error) =>
      error instanceof ExchangeMapError &&
      error.code === EXCHANGE_ERROR_CODES.invalidMap &&
      error.reason === "invalid-map",
  );
});
