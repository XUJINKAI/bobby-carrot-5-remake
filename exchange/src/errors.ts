export const EXCHANGE_ERROR_CODES = {
  invalidJson: "data-exchange.invalid-json",
  unknownRepresentation: "data-exchange.unknown-representation",
  invalidBase64Url: "data-exchange.invalid-base64url",
  damagedGzip: "data-exchange.damaged-gzip",
  unsupportedVersion: "data-exchange.unsupported-version",
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
