import {
  BC5R_GAME_ID,
  parseLevelMap,
  type LevelMap,
} from "@bobby/model";

export type ExchangeMapErrorReason = "save" | "invalid-map";

/** Data Exchange 已成功解码，但内容不能作为地图使用。 */
export class ExchangeMapError extends Error {
  constructor(
    public readonly reason: ExchangeMapErrorReason,
    public readonly scope: string | undefined,
    options: ErrorOptions = {},
  ) {
    super(
      reason === "save"
        ? `BC5R data with scope "${scope}" is a save, not a map`
        : "BC5R data is not a valid map",
      options,
    );
    this.name = "ExchangeMapError";
  }
}

/** 校验统一交换数据中的地图；MapDocument 会降为可游玩的 LevelMap。 */
export function parseExchangeMap(value: unknown): LevelMap {
  const scope = saveScope(value);
  if (scope !== undefined)
    throw new ExchangeMapError("save", scope);
  try {
    return parseLevelMap(value);
  } catch (cause) {
    throw new ExchangeMapError("invalid-map", undefined, { cause });
  }
}

function saveScope(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const source = value as Record<string, unknown>;
  return source.game === BC5R_GAME_ID &&
    source.schemaVersion === 1 &&
    typeof source.scope === "string"
    ? source.scope
    : undefined;
}
