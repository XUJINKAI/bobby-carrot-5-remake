export type DataExchangeFormat = "json" | "bc5r1" | "unknown";

export type DataExchangeControlConfig =
  | { type: "importText"; label?: string }
  | { type: "importFile"; label?: string; accept?: string }
  | { type: "status" }
  | { type: "compress"; label?: string }
  | { type: "copy"; label?: string }
  | { type: "download"; label?: string };

export interface DataExchangeToolbar {
  left: DataExchangeControlConfig[];
  right: DataExchangeControlConfig[];
}

export class DataExchangeError extends Error {
  constructor(
    public readonly code:
      | "invalid-json"
      | "unknown-representation"
      | "invalid-base64url"
      | "damaged-gzip"
      | "unsupported-version",
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DataExchangeError";
  }
}
