export const EXCHANGE_ERROR_CODES = {
  invalidJson: "data-exchange.invalid-json",
  unknownRepresentation: "data-exchange.unknown-representation",
  invalidPayload: "data-exchange.invalid-payload",
  damagedGzip: "data-exchange.damaged-gzip",
} as const;

export type ExchangeErrorCode =
  (typeof EXCHANGE_ERROR_CODES)[keyof typeof EXCHANGE_ERROR_CODES];

export class ExchangeError extends Error {
  constructor(
    public readonly code: ExchangeErrorCode,
    options: ErrorOptions = {},
  ) {
    super(code, options);
    this.name = "ExchangeError";
  }
}
