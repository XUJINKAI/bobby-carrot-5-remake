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
  [WEB_ERROR_CODES.dataExchange.invalidJson]:
    "common.error.dataExchange.invalidJson",
  [WEB_ERROR_CODES.dataExchange.unknownRepresentation]:
    "common.error.dataExchange.unknownRepresentation",
  [WEB_ERROR_CODES.dataExchange.invalidBase64Url]:
    "common.error.dataExchange.invalidBase64Url",
  [WEB_ERROR_CODES.dataExchange.damagedGzip]:
    "common.error.dataExchange.damagedGzip",
  [WEB_ERROR_CODES.dataExchange.unsupportedVersion]:
    "common.error.dataExchange.unsupportedVersion",
  [WEB_ERROR_CODES.dataExchange.clipboardUnavailable]:
    "common.clipboardUnavailable",
  [WEB_ERROR_CODES.import.unrecognizedData]:
    "common.error.import.unrecognizedData",
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
  [WEB_ERROR_CODES.replay.invalidDocument]:
    "game.replay.invalidDocument",
} satisfies Record<WebErrorCode, WebTranslationKey>;

export function localizedErrorText(error: unknown): WebLocalizedText | null {
  if (!(error instanceof WebError)) return null;
  return localizedText(ERROR_TRANSLATION_KEYS[error.code], error.params);
}

export function errorDisplayText(error: unknown): WebDisplayText {
  return localizedErrorText(error) ??
    (error instanceof Error ? error.message : String(error));
}
