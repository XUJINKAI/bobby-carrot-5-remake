import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createAdventureSave } from "@bobby/adventure";
import {
  encodeBc5rV1,
  encodeExchangeText,
} from "@bobby/exchange";
import { BC5R_GAME_ID } from "@bobby/model";
import { test } from "vitest";
import {
  levelMapFixture as level,
  mapDocumentFixture,
} from "../../exchange/tests/fixtures.mjs";
import { WEB_ERROR_CODES, WebError } from "../src/errors/errorCodes.ts";
import {
  classifyImportedJson,
  decodeImportedPayload,
  decodeImportedText,
  requireImportedJson,
} from "../src/services/import/importPipeline.ts";

const exploreSave = {
  game: BC5R_GAME_ID,
  schemaVersion: 1,
  scope: "explore/original",
  completedMaps: ["1-1"],
  lastMap: "1-1",
};

test("统一导入 pipeline 接受带 metadata 与纯 LevelMap", () => {
  const pure = classifyImportedJson(level);
  assert.equal(pure?.type, "map");
  if (pure?.type !== "map") return;
  assert.deepEqual(pure.level, level);
  assert.equal(pure.value.meta.name, "Imported Bobby Level");

  const document = classifyImportedJson(mapDocumentFixture);
  assert.equal(document?.type, "map");
  if (document?.type !== "map") return;
  assert.equal(document.value.meta.name, "Shared Map");
  assert.equal(document.value.meta.author, "Bobby");
});

test("首页文本入口统一接受 JSON、两种裸 payload、BC5R1 与完整分享 URL", async () => {
  const json = JSON.stringify(level);
  const encoded = await encodeExchangeText(json);
  const url = await encodeExchangeText(json, {
    publicBaseUrl: "https://example.com/game/",
  });
  const plainPayload = Buffer.from(json, "utf8").toString("base64");
  const gzipPayload = gzipSync(json).toString("base64url");

  for (const source of [json, plainPayload, gzipPayload, encoded, url]) {
    const imported = await decodeImportedText(source);
    assert.equal(imported.type, "map");
  }
});

test("URL payload 与首页入口识别相同的 Adventure 和 Explore Save", async () => {
  for (const [value, type] of [
    [createAdventureSave(), "adventure-save"],
    [exploreSave, "explore-save"],
  ]) {
    const textImported = await decodeImportedText(JSON.stringify(value));
    const payloadImported = await decodeImportedPayload(
      await encodeBc5rV1(JSON.stringify(value)),
    );
    const plainPayloadImported = await decodeImportedPayload(
      Buffer.from(JSON.stringify(value), "utf8").toString("base64url"),
    );
    assert.equal(textImported.type, type);
    assert.equal(payloadImported.type, type);
    assert.equal(plainPayloadImported.type, type);
    if (textImported.type === "explore-save")
      assert.equal(textImported.collection, "original");
  }
});

test("地图中的未知或字段无效 Entity 不阻断导入", async () => {
  const imported = await decodeImportedText(JSON.stringify({
    ...level,
    entities: [
      ...level.entities,
      { type: "future-mechanic", x: 1, y: 0, phase: 2 },
      { type: "grass", x: 1, y: 0, variant: "future" },
    ],
  }));
  assert.equal(imported.type, "map");
  if (imported.type !== "map") return;
  assert.equal(imported.level.entities.length, 4);
});

test("无法识别的 JSON 在 URL 中保留原文，在首页返回领域错误", async () => {
  const payload = await encodeBc5rV1("{}");
  assert.deepEqual(await decodeImportedPayload(payload), {
    type: "unknown",
    rawText: "{}",
  });
  assert.throws(
    () => requireImportedJson({}),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.import.unrecognizedData,
  );
});
