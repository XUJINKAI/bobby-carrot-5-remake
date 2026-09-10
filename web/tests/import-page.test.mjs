import assert from "node:assert/strict";
import { createAdventureSave } from "@bobby/adventure";
import { BC5R_GAME_ID } from "@bobby/model";
import { test } from "vitest";
import {
  classifyImportedJson,
  decodeImportedPayload,
  decodeImportedText,
  requireImportedJson,
} from "../src/services/import/importPipeline.ts";
import {
  encodeBc5rV1,
  encodeExchangeText,
} from "../src/shared/data-exchange/dataExchangeCodec.ts";

const level = {
  schemaVersion: 1,
  width: 2,
  height: 1,
  entities: [
    { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
    { type: "bobby", x: 0, y: 0 },
  ],
};

const exploreSave = {
  game: BC5R_GAME_ID,
  schemaVersion: 1,
  mode: "explore",
  collections: {
    original: {
      game: BC5R_GAME_ID,
      schemaVersion: 1,
      completedMaps: ["1-1"],
      lastMap: "1-1",
    },
  },
};

test("统一导入 pipeline 接受带 metadata 与纯 LevelMap", () => {
  const pure = classifyImportedJson(level);
  assert.equal(pure?.type, "map");
  if (pure?.type !== "map") return;
  assert.deepEqual(pure.level, level);
  assert.equal(pure.value.meta.name, "Imported Bobby Level");

  const document = classifyImportedJson({
    ...level,
    meta: { name: "Shared Map", author: "Bobby" },
  });
  assert.equal(document?.type, "map");
  if (document?.type !== "map") return;
  assert.equal(document.value.meta.name, "Shared Map");
  assert.equal(document.value.meta.author, "Bobby");
});

test("首页文本入口统一接受 JSON、BC5R1 与完整分享 URL", async () => {
  const json = JSON.stringify(level);
  const encoded = await encodeExchangeText(json);
  const url = await encodeExchangeText(json, {
    publicBaseUrl: "https://example.com/game/",
  });

  for (const source of [json, encoded, url]) {
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
    assert.equal(textImported.type, type);
    assert.equal(payloadImported.type, type);
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
    /无法识别这段 Bobby Carrot 5 Remake 数据/,
  );
});
