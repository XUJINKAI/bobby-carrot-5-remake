import assert from "node:assert/strict";
import {
  EXCHANGE_ERROR_CODES,
  ExchangeError,
  decodeBase64Url,
} from "@bobby/exchange";
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
import { requireImportedJson } from "../src/services/import/importPipeline.ts";
import { parseAdventureProfileExchange } from "../src/storage/adventureSaveStorage.ts";
import {
  parseExploreCollectionExchange,
} from "../src/storage/exploreProgressStorage.ts";
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
  const webCodes = Object.values(WEB_ERROR_CODES).flatMap((group) =>
    Object.values(group),
  );
  const exchangeCodes = Object.values(EXCHANGE_ERROR_CODES);
  const codes = [...webCodes, ...exchangeCodes];
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.length >= 15);
  for (const code of webCodes)
    assert.ok(localizedErrorText(new WebError(code)), `missing error mapping: ${code}`);
  for (const code of exchangeCodes)
    assert.ok(
      localizedErrorText(new ExchangeError(code)),
      `missing error mapping: ${code}`,
    );
});

test("Data Exchange 错误保存语义码并随 locale 重新本地化", async () => {
  let error;
  try {
    decodeBase64Url("%");
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof ExchangeError);
  assert.equal(error.code, EXCHANGE_ERROR_CODES.invalidBase64Url);
  assert.equal(error.message, EXCHANGE_ERROR_CODES.invalidBase64Url);
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

test("存档交换错误在 Web 边界转换为可重新本地化的语义错误", async () => {
  const cases = [
    {
      parse: () => parseAdventureProfileExchange({}),
      code: WEB_ERROR_CODES.saveExchange.invalidAdventureProfile,
      zh: "这段数据不是有效的冒险存档。",
      en: "This is not a valid Adventure save.",
    },
    {
      parse: () => parseExploreCollectionExchange({}),
      code: WEB_ERROR_CODES.saveExchange.invalidExploreSave,
      zh: "这段数据不是有效的自由探索存档。",
      en: "This is not a valid Explore save.",
    },
  ];

  for (const entry of cases) {
    let error;
    try {
      entry.parse();
    } catch (caught) {
      error = caught;
    }
    assert.ok(error instanceof WebError);
    assert.equal(error.code, entry.code);
    assert.equal(resolveWebText(errorDisplayText(error)), entry.zh);

    await setWebLocale("en");
    assert.equal(resolveWebText(errorDisplayText(error)), entry.en);
    await setWebLocale("zh-CN");
  }
});

test("共享 Clipboard 与 Embed 加载错误使用集中语义码", async () => {
  const clipboard = new WebError(WEB_ERROR_CODES.common.clipboardUnavailable);
  assert.equal(resolveWebText(errorDisplayText(clipboard)), "无法访问剪贴板");

  await setWebI18nRouteScopes(["game", "embed"]);
  const embedError = new WebError(WEB_ERROR_CODES.embed.runtimeLoadFailed, {
    params: { url: "https://example.test/bc5r.js" },
  });
  assert.equal(
    resolveWebText(errorDisplayText(embedError)),
    "无法加载内嵌运行时：https://example.test/bc5r.js",
  );

  await setWebLocale("en");
  assert.equal(
    resolveWebText(errorDisplayText(clipboard)),
    "Clipboard access unavailable",
  );
  assert.equal(
    resolveWebText(errorDisplayText(embedError)),
    "Failed to load the embed runtime: https://example.test/bc5r.js",
  );
  await setWebLocale("zh-CN");
  await setWebI18nRouteScopes(["game"]);
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
