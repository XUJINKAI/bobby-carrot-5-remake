import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import test from "node:test";
import {
  buildImportUrl,
  decodeExchangeText,
  detectExchangeFormat,
  encodeExchangeText,
  extractImportPayload,
  ExchangeMapError,
  parseExchangeMap,
} from "../dist/index.js";
import {
  levelMapFixture,
  mapDocumentFixture,
  scopedSaveFixtures,
} from "./fixtures.mjs";

test("规范 payload 对各类 UTF-8 JSON 文本执行往返", async () => {
  const values = [
    {},
    ["数组", "🥕", "多行\n文本"],
    {
      ascii: "hello",
      chinese: "胡萝卜",
      emoji: "🐰",
      large: "地图".repeat(20_000),
    },
  ];
  for (const value of values) {
    const source = JSON.stringify(value, null, 2);
    const encoded = await encodeExchangeText(source);
    assert.match(encoded, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual((await decodeExchangeText(encoded)).value, value);
  }
});

test("裸 payload 与分享 URL 都接受 Base64 JSON 或 gzip JSON", async () => {
  const jsonText = JSON.stringify(mapDocumentFixture);
  const bytes = [Buffer.from(jsonText, "utf8"), gzipSync(jsonText)];
  const payloads = bytes.flatMap((value) => [
    value.toString("base64url"),
    value.toString("base64"),
  ]);

  for (const payload of payloads) {
    for (const source of [
      payload,
      `https://example.com/game/import/v1#${payload}`,
    ]) {
      const decoded = await decodeExchangeText(source);
      assert.deepEqual(decoded.value, mapDocumentFixture);
    }
  }
});

test("分享 URL 保留完整站点根路径", () => {
  const cases = [
    ["https://bc5r.com", "https://bc5r.com/import/v1#PAYLOAD"],
    ["https://bc5r.com/", "https://bc5r.com/import/v1#PAYLOAD"],
    [
      "https://bc5r.xujinkai.net",
      "https://bc5r.xujinkai.net/import/v1#PAYLOAD",
    ],
    [
      "https://example.com/a/b/c/",
      "https://example.com/a/b/c/import/v1#PAYLOAD",
    ],
  ];
  for (const [base, expected] of cases)
    assert.equal(buildImportUrl(base, "PAYLOAD"), expected);
});

test("格式识别接受 JSON、裸 payload 与任意站点的 import/v1 URL", () => {
  const payload = Buffer.from(JSON.stringify(levelMapFixture)).toString("base64url");
  assert.equal(detectExchangeFormat('{"foo":"bar"}'), "json");
  assert.equal(detectExchangeFormat(payload), "payload");
  assert.equal(
    detectExchangeFormat("https://example.com/foo/import/v1#PAYLOAD"),
    "payload",
  );
  assert.equal(
    extractImportPayload("https://another.example/app/import/v1#PAYLOAD"),
    "PAYLOAD",
  );
});

test("旧 BC5R 前缀不再是有效表示", async () => {
  await assert.rejects(decodeExchangeText("BC5R1:PAYLOAD"));
});

test("公共地图 parser 接受 LevelMap 和 MapDocument", () => {
  assert.deepEqual(parseExchangeMap(levelMapFixture), levelMapFixture);
  assert.deepEqual(parseExchangeMap(mapDocumentFixture), levelMapFixture);
});

test("公共地图 parser 将带 scope 的存档明确识别为非地图", () => {
  for (const save of scopedSaveFixtures)
    assert.throws(
      () => parseExchangeMap(save),
      (error) =>
        error instanceof ExchangeMapError &&
        error.reason === "save" &&
        error.scope === save.scope,
    );
});
