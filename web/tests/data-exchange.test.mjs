import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeExchangeText,
  detectExchangeFormat,
  encodeExchangeText,
} from "../../tmp/web-tests/shared/data-exchange/dataExchangeCodec.js";
import {
  buildImportUrl,
  extractImportPayload,
} from "../../tmp/web-tests/shared/data-exchange/dataExchangeUrl.js";

test("BC5R1 对各类 UTF-8 JSON 文本执行往返", async () => {
  const values = [
    {},
    ["数组", "🥕", "多行\n文本"],
    { ascii: "hello", chinese: "胡萝卜", emoji: "🐰", large: "地图".repeat(20_000) },
  ];
  for (const value of values) {
    const source = JSON.stringify(value, null, 2);
    const encoded = await encodeExchangeText(source);
    assert.match(encoded, /^BC5R1:[A-Za-z0-9_-]+$/);
    assert.deepEqual((await decodeExchangeText(encoded)).value, value);
  }
});

test("分享 URL 保留完整站点根路径", () => {
  const cases = [
    ["https://bc5r.com", "https://bc5r.com/import/v1#PAYLOAD"],
    ["https://bc5r.com/", "https://bc5r.com/import/v1#PAYLOAD"],
    [
      "https://xujinkai.github.io/bobby-carrot-5-remake",
      "https://xujinkai.github.io/bobby-carrot-5-remake/import/v1#PAYLOAD",
    ],
    ["https://example.com/a/b/c/", "https://example.com/a/b/c/import/v1#PAYLOAD"],
  ];
  for (const [base, expected] of cases) {
    assert.equal(buildImportUrl(base, "PAYLOAD"), expected);
  }
});

test("格式识别接受 JSON、BC5R1 与任意站点的 import/v1 URL", () => {
  assert.equal(detectExchangeFormat('{"foo":"bar"}'), "json");
  assert.equal(detectExchangeFormat("BC5R1:PAYLOAD"), "bc5r1");
  assert.equal(
    detectExchangeFormat("https://example.com/foo/import/v1#PAYLOAD"),
    "bc5r1",
  );
  assert.equal(
    extractImportPayload("https://another.example/app/import/v1#PAYLOAD"),
    "PAYLOAD",
  );
});

test("未知 transport 版本返回明确错误", async () => {
  await assert.rejects(
    decodeExchangeText("BC5R2:PAYLOAD"),
    (error) => error.code === "unsupported-version",
  );
});
