import {
  EXCHANGE_ERROR_CODES,
  ExchangeError,
} from "@bobby/exchange";
import {
  EMBED_RUNTIME_CATALOGS,
  type Locale,
} from "@bobby/i18n";
import { EmbedMapInputError } from "./mapInput.js";

export interface EmbedStatus {
  root: HTMLDivElement;
  loading(): void;
  error(error: unknown): void;
  hide(): void;
}

export function createEmbedStatus(locale: Locale): EmbedStatus {
  const root = document.createElement("div");
  root.className = "bc5r-status";
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");

  const title = document.createElement("strong");
  const detail = document.createElement("span");
  root.append(title, detail);

  const loading = (): void => {
    root.hidden = false;
    root.dataset.state = "loading";
    title.textContent = text(locale, "embedRuntime.loading");
    detail.textContent = "";
  };
  const error = (value: unknown): void => {
    root.hidden = false;
    root.dataset.state = "error";
    title.textContent = text(locale, "embedRuntime.loadFailed");
    detail.textContent = errorDetail(locale, value);
  };
  const hide = (): void => {
    root.hidden = true;
    delete root.dataset.state;
  };

  loading();
  return { root, loading, error, hide };
}

function errorDetail(locale: Locale, error: unknown): string {
  if (error instanceof EmbedMapInputError) {
    if (error.reason === "missing-map")
      return text(locale, "embedRuntime.missingMap");
    if (error.reason === "multiple-inputs")
      return text(locale, "embedRuntime.multipleInputs");
    return error.status === undefined
      ? text(locale, "embedRuntime.mapRequestFailed")
      : text(locale, "embedRuntime.mapRequestHttp", { status: error.status });
  }

  if (error instanceof ExchangeError) {
    if (error.code === EXCHANGE_ERROR_CODES.invalidJson)
      return text(locale, "embedRuntime.invalidJson");
    if (error.code === EXCHANGE_ERROR_CODES.unknownRepresentation)
      return text(locale, "embedRuntime.unknownRepresentation");
    if (error.code === EXCHANGE_ERROR_CODES.invalidPayload)
      return text(locale, "embedRuntime.invalidPayload");
    if (error.code === EXCHANGE_ERROR_CODES.damagedGzip)
      return text(locale, "embedRuntime.damagedGzip");
    if (error.code === EXCHANGE_ERROR_CODES.saveNotMap)
      return text(locale, "embedRuntime.saveNotMap", {
        scope: error.params?.scope ?? "unknown",
      });
    if (error.code === EXCHANGE_ERROR_CODES.invalidMap)
      return text(locale, "embedRuntime.invalidMap");
  }

  return text(locale, "embedRuntime.unknownError");
}

function text(
  locale: Locale,
  key: string,
  params?: Readonly<Record<string, string | number>>,
): string {
  const template = EMBED_RUNTIME_CATALOGS[locale][key] ?? key;
  if (!params) return template;
  return template.replace(/\{([A-Za-z0-9_.-]+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name])
  );
}
