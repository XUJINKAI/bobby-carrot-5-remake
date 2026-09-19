export const EXCHANGE_ERROR_CODES = {
  invalidJson: "data-exchange.invalid-json",
  unknownRepresentation: "data-exchange.unknown-representation",
  invalidPayload: "data-exchange.invalid-payload",
  damagedGzip: "data-exchange.damaged-gzip",
  saveNotMap: "data-exchange.save-not-map",
  invalidMap: "data-exchange.invalid-map",
} as const;

export type ExchangeErrorCode =
  (typeof EXCHANGE_ERROR_CODES)[keyof typeof EXCHANGE_ERROR_CODES];

export type ExchangeErrorParams = Readonly<Record<string, string | number>>;

export interface ExchangeErrorOptions extends ErrorOptions {
  params?: ExchangeErrorParams;
}

export class ExchangeError extends Error {
  readonly params: ExchangeErrorParams | undefined;

  constructor(
    public readonly code: ExchangeErrorCode,
    options: ExchangeErrorOptions = {},
  ) {
    const { params, ...errorOptions } = options;
    super(code, errorOptions);
    this.name = "ExchangeError";
    this.params = params;
  }
}
