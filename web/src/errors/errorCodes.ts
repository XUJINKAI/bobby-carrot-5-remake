export const WEB_ERROR_CODES = {
  dataExchange: {
    invalidJson: "data-exchange.invalid-json",
    unknownRepresentation: "data-exchange.unknown-representation",
    invalidBase64Url: "data-exchange.invalid-base64url",
    damagedGzip: "data-exchange.damaged-gzip",
    unsupportedVersion: "data-exchange.unsupported-version",
    clipboardUnavailable: "data-exchange.clipboard-unavailable",
  },
  import: {
    unrecognizedData: "import.unrecognized-data",
  },
  replay: {
    builtinMustWin: "replay.builtin-must-win",
    builtinNotWon: "replay.builtin-not-won",
    interactiveHostUnsupported: "replay.interactive-host-unsupported",
    builtinMissing: "replay.builtin-missing",
    builtinLoadFailed: "replay.builtin-load-failed",
    builtinSaveFailed: "replay.builtin-save-failed",
    invalidDocument: "replay.invalid-document",
  },
} as const;

export type WebErrorCode = {
  [Group in keyof typeof WEB_ERROR_CODES]:
    (typeof WEB_ERROR_CODES)[Group][keyof (typeof WEB_ERROR_CODES)[Group]];
}[keyof typeof WEB_ERROR_CODES];
export type WebErrorParams = Readonly<Record<string, string | number>>;

export interface WebErrorOptions extends ErrorOptions {
  params?: WebErrorParams;
}

export class WebError extends Error {
  readonly params?: WebErrorParams;

  constructor(
    public readonly code: WebErrorCode,
    options: WebErrorOptions = {},
  ) {
    const { params, ...errorOptions } = options;
    super(code, errorOptions);
    this.name = "WebError";
    this.params = params;
  }
}
