import assert from "node:assert/strict";
import { beforeAll, test } from "vitest";
import {
  getWebLocale,
  initializeWebI18n,
  resolveWebText,
  setWebI18nRouteScopes,
  setWebLocale,
} from "../src/i18n/webI18n.ts";
import {
  WEB_ERROR_CODES,
  WebError,
} from "../src/errors/errorCodes.ts";
import {
  errorDisplayText,
  localizedErrorText,
} from "../src/errors/errorPresentation.ts";
import { decodeBase64Url } from "../src/shared/data-exchange/dataExchangeCodec.ts";
import { requireImportedJson } from "../src/services/import/importPipeline.ts";
import {
  loadReplayAsset,
  parseReplayText,
  saveReplayAsset,
} from "../src/pages/game/replayAssets.ts";

beforeAll(async () => {
  await initializeWebI18n("zh-CN");
  await setWebI18nRouteScopes(["game"]);
});

test("所有预期 Web 错误码集中登记且都有本地化映射", () => {
  const codes = Object.values(WEB_ERROR_CODES).flatMap((group) =>
    Object.values(group),
  );
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.length >= 15);
  for (const code of codes)
    assert.ok(localizedErrorText(new WebError(code)), `missing error mapping: ${code}`);
});

test("Data Exchange 错误保存语义码并随 locale 重新本地化", async () => {
  let error;
  try {
    decodeBase64Url("%");
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof WebError);
  assert.equal(error.code, WEB_ERROR_CODES.dataExchange.invalidBase64Url);
  assert.equal(error.message, WEB_ERROR_CODES.dataExchange.invalidBase64Url);
  assert.equal(resolveWebText(errorDisplayText(error)), "BC5R1 数据编码无效");

  await setWebLocale("en");
  assert.equal(getWebLocale(), "en");
  assert.equal(
    resolveWebText(errorDisplayText(error)),
    "Invalid BC5R1 data encoding",
  );

  await setWebLocale("zh-CN");
  assert.equal(resolveWebText(errorDisplayText(error)), "BC5R1 数据编码无效");
});

test("Import 无法分类的数据使用集中错误码", () => {
  assert.throws(
    () => requireImportedJson({ nope: true }),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.import.unrecognizedData &&
      resolveWebText(errorDisplayText(error)) ===
        "无法识别这段 Bobby Carrot 5 Remake 数据。",
  );
});

test("Replay 资产和 JSON 解析使用集中错误码", async () => {
  await assert.rejects(
    loadReplayAsset("/missing.json", async () => new Response("", { status: 404 })),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.replay.builtinMissing,
  );
  await assert.rejects(
    loadReplayAsset("/broken.json", async () => new Response("", { status: 503 })),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.replay.builtinLoadFailed &&
      error.params?.status === 503,
  );
  await assert.rejects(
    saveReplayAsset(
      "/save.json",
      "{}",
      async () => new Response("", { status: 500 }),
    ),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.replay.builtinSaveFailed &&
      error.params?.status === 500,
  );
  assert.throws(
    () => parseReplayText("{"),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.replay.invalidJson,
  );
  assert.throws(
    () => parseReplayText("[]"),
    (error) =>
      error instanceof WebError &&
      error.code === WEB_ERROR_CODES.replay.invalidDocument,
  );
});
