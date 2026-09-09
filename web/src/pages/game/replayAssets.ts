import type { Replay } from "@bobby/engine";

export interface LoadedReplayAsset {
  replay: Replay;
  text: string;
}

export async function loadReplayAsset(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<LoadedReplayAsset> {
  const response = await fetcher(url, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404)
    throw new Error("当前关卡暂无内置过法");
  if (!response.ok)
    throw new Error(`读取内置过法失败（HTTP ${response.status}）`);
  const text = await response.text();
  return { replay: parseReplayText(text), text };
}

export function parseReplayText(text: string): Replay {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Replay JSON 必须是对象");
  return value as Replay;
}
