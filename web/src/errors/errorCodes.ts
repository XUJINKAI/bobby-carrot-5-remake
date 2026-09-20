export const WEB_ERROR_CODES = {
  common: {
    clipboardUnavailable: "common.clipboard-unavailable",
  },
  saveExchange: {
    invalidAdventureProfile: "save-exchange.invalid-adventure-profile",
    invalidExploreSave: "save-exchange.invalid-explore-save",
  },
  import: {
    unrecognizedData: "import.unrecognized-data",
  },
  embed: {
    invalidCode: "embed.invalid-code",
    runtimeLoadFailed: "embed.runtime-load-failed",
    runtimeUnavailable: "embed.runtime-unavailable",
  },
  replay: {
    builtinMustWin: "replay.builtin-must-win",
    builtinNotWon: "replay.builtin-not-won",
    interactiveHostUnsupported: "replay.interactive-host-unsupported",
    builtinMissing: "replay.builtin-missing",
    builtinLoadFailed: "replay.builtin-load-failed",
    builtinSaveFailed: "replay.builtin-save-failed",
    invalidJson: "replay.invalid-json",
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
  readonly params: WebErrorParams | undefined;

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
