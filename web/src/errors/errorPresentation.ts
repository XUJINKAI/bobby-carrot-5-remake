import {
  EXCHANGE_ERROR_CODES,
  ExchangeError,
  type ExchangeErrorCode,
} from "@bobby/exchange";
import {
  localizedText,
  type WebDisplayText,
  type WebLocalizedText,
  type WebTranslationKey,
} from "../i18n/webI18n.js";
import {
  WEB_ERROR_CODES,
  WebError,
  type WebErrorCode,
} from "./errorCodes.js";

const ERROR_TRANSLATION_KEYS = {
  [WEB_ERROR_CODES.common.clipboardUnavailable]:
    "common.clipboardUnavailable",
  [EXCHANGE_ERROR_CODES.invalidJson]:
    "common.error.dataExchange.invalidJson",
  [EXCHANGE_ERROR_CODES.unknownRepresentation]:
    "common.error.dataExchange.unknownRepresentation",
  [EXCHANGE_ERROR_CODES.invalidPayload]:
    "common.error.dataExchange.invalidPayload",
  [EXCHANGE_ERROR_CODES.damagedGzip]:
    "common.error.dataExchange.damagedGzip",
  [EXCHANGE_ERROR_CODES.saveNotMap]:
    "common.error.dataExchange.saveNotMap",
  [EXCHANGE_ERROR_CODES.invalidMap]:
    "common.error.dataExchange.invalidMap",
  [WEB_ERROR_CODES.saveExchange.invalidAdventureProfile]:
    "common.error.save.invalidAdventureProfile",
  [WEB_ERROR_CODES.saveExchange.invalidExploreSave]:
    "common.error.save.invalidExploreSave",
  [WEB_ERROR_CODES.import.unrecognizedData]:
    "common.error.import.unrecognizedData",
  [WEB_ERROR_CODES.embed.runtimeLoadFailed]:
    "embed.error.runtimeLoadFailed",
  [WEB_ERROR_CODES.embed.runtimeUnavailable]:
    "embed.error.runtimeUnavailable",
  [WEB_ERROR_CODES.replay.builtinMustWin]:
    "game.replay.builtinMustWin",
  [WEB_ERROR_CODES.replay.builtinNotWon]:
    "game.replay.builtinNotWon",
  [WEB_ERROR_CODES.replay.interactiveHostUnsupported]:
    "game.replay.interactiveHostUnsupported",
  [WEB_ERROR_CODES.replay.builtinMissing]:
    "game.replay.builtinMissing",
  [WEB_ERROR_CODES.replay.builtinLoadFailed]:
    "game.replay.builtinLoadFailed",
  [WEB_ERROR_CODES.replay.builtinSaveFailed]:
    "game.replay.builtinSaveFailed",
  [WEB_ERROR_CODES.replay.invalidJson]:
    "game.replay.invalidJson",
  [WEB_ERROR_CODES.replay.invalidDocument]:
    "game.replay.invalidDocument",
} satisfies Record<WebErrorCode | ExchangeErrorCode, WebTranslationKey>;

export function localizedErrorText(error: unknown): WebLocalizedText | null {
  if (!(error instanceof WebError || error instanceof ExchangeError)) return null;
  return localizedText(
    ERROR_TRANSLATION_KEYS[error.code],
    error.params,
  );
}

export function errorDisplayText(error: unknown): WebDisplayText {
  return localizedErrorText(error) ??
    (error instanceof Error ? error.message : String(error));
}
