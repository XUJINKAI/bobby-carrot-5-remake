import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createAdventureSave } from "@bobby/adventure";
import {
  encodeExchangePayload,
  encodeExchangeText,
} from "@bobby/exchange";
import { BC5R_GAME_ID } from "@bobby/model";
import { test } from "vitest";
import {
  levelMapFixture as level,
  mapDocumentFixture,
} from "../../fixtures/exchange/fixtures.mjs";
import { WEB_ERROR_CODES, WebError } from "../../../web/src/errors/errorCodes.ts";
import {
  applyImportedSave,
  classifyImportedJson,
  decodeImportedPayload,
  decodeImportedText,
  requireImportedJson,
} from "../../../web/src/services/import/importPipeline.ts";

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
  assert.equal(pure.value.meta.game, BC5R_GAME_ID);

  const document = classifyImportedJson(mapDocumentFixture);
  assert.equal(document?.type, "map");
  if (document?.type !== "map") return;
  assert.deepEqual(document.value, mapDocumentFixture);
  assert.deepEqual(document.level, level);
});

test("导入 pipeline 不规范化原始 MapDocument", () => {
  const source = {
    ...mapDocumentFixture,
    meta: { game: "another-game", name: "" },
    entities: mapDocumentFixture.entities.map((entity, index) => ({
      ...entity,
      ...(index === 0 ? { stackOrder: 0 } : {}),
    })),
  };
  const imported = classifyImportedJson(source);
  assert.equal(imported?.type, "map");
  if (imported?.type !== "map") return;
  assert.deepEqual(imported.value, source);
});

test("Explore Save 只写入 discovery index 白名单中的 collection", () => {
  const values = new Map();
  const storage = {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
  const previousLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  try {
    const imported = classifyImportedJson(exploreSave);
    assert.equal(imported?.type, "explore-save");
    if (imported?.type !== "explore-save") return;
    assert.throws(
      () => applyImportedSave(imported, [{ id: "engine-lab" }]),
      (error) =>
        error instanceof WebError &&
        error.code === WEB_ERROR_CODES.saveExchange.invalidExploreSave,
    );
    assert.equal(values.size, 0);
    assert.equal(
      applyImportedSave(imported, [{ id: "original" }]),
      "/explore",
    );
    assert.equal(values.has("bc5r:explore/original"), true);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  }
});

test("首页文本入口统一接受 JSON、两种裸 payload 与完整分享 URL", async () => {
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
      await encodeExchangePayload(JSON.stringify(value)),
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
  const payload = await encodeExchangePayload("{}");
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
