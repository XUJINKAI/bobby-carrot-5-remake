import type { Replay } from "@bobby/engine";
import { WEB_ERROR_CODES, WebError } from "../../errors/errorCodes.js";

export interface LoadedReplayAsset {
  replay: Replay;
  text: string;
}

export function replayPathId(collection: string, id: string): string {
  return `${collection}/${id}`;
}

export async function loadReplayAsset(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<LoadedReplayAsset> {
  const response = await fetcher(url, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404)
    throw new WebError(WEB_ERROR_CODES.replay.builtinMissing);
  if (!response.ok)
    throw new WebError(WEB_ERROR_CODES.replay.builtinLoadFailed, {
      params: { status: response.status },
    });
  const text = await response.text();
  return { replay: parseReplayText(text), text };
}

export async function saveReplayAsset(
  url: string,
  text: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher(url, {
    method: "PUT",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: text,
  });
  if (!response.ok)
    throw new WebError(WEB_ERROR_CODES.replay.builtinSaveFailed, {
      params: { status: response.status },
    });
}

export function parseReplayText(text: string): Replay {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new WebError(WEB_ERROR_CODES.replay.invalidJson, { cause });
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new WebError(WEB_ERROR_CODES.replay.invalidDocument);
  return value as Replay;
}
