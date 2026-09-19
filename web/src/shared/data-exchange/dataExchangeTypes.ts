export type DataExchangeFormat = "json" | "payload" | "unknown";

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
