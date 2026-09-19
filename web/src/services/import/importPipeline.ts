import type { AdventureSave } from "@bobby/adventure";
import {
  decodeExchangePayload,
  decodeExchangeText,
  parseExchangeMap,
} from "@bobby/exchange";
import { WEB_ERROR_CODES, WebError } from "../../errors/errorCodes.js";
import {
  BC5R_GAME_ID,
  type LevelMap,
  type MapCollectionSummary,
  type MapDocument,
  parseMapDocument,
} from "@bobby/model";
import { exploreCollectionPath } from "../../app/routes.js";
import {
  parseAdventureProfileExchange,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  exploreSaveCollection,
  parseExploreCollectionExchange,
  saveExploreCollectionSave,
} from "../../storage/exploreProgressStorage.js";
import type { ExploreCollectionStorage } from "../../storage/contracts.js";

export interface ImportedMapData {
  type: "map";
  value: MapDocument;
  level: LevelMap;
}

export type ImportedSaveData =
  | { type: "adventure-save"; value: AdventureSave }
  | {
      type: "explore-save";
      collection: string;
      value: ExploreCollectionStorage;
    };

export type ImportedData = ImportedMapData | ImportedSaveData;

export interface UnknownImportedData {
  type: "unknown";
  rawText: string;
}

export async function decodeImportedText(text: string): Promise<ImportedData> {
  const decoded = await decodeExchangeText(text);
  return requireImportedJson(decoded.value);
}

export async function decodeImportedPayload(
  payload: string,
): Promise<ImportedData | UnknownImportedData> {
  const decoded = await decodeExchangePayload(payload);
  return classifyImportedJson(decoded.value) ?? {
    type: "unknown",
    rawText: decoded.jsonText,
  };
}

export function requireImportedJson(value: unknown): ImportedData {
  const imported = classifyImportedJson(value);
  if (!imported)
    throw new WebError(WEB_ERROR_CODES.import.unrecognizedData);
  return imported;
}

export function classifyImportedJson(value: unknown): ImportedData | null {
  const scope = dataScope(value);
  if (scope === "adventure") {
    return {
      type: "adventure-save",
      value: parseAdventureProfileExchange(value),
    };
  }
  if (scope?.startsWith("explore/")) {
    const save = parseExploreCollectionExchange(value);
    return {
      type: "explore-save",
      collection: exploreSaveCollection(save),
      value: save,
    };
  }
  return parseMap(value);
}

export function applyImportedSave(
  data: ImportedSaveData,
  collections: readonly Pick<MapCollectionSummary, "id">[] = [],
): string {
  if (data.type === "adventure-save") {
    saveAdventureSave(data.value);
    return "/adventure";
  }
  requireImportedSaveTarget(data, collections);
  saveExploreCollectionSave(data.collection, data.value);
  return exploreCollectionPath(data.collection);
}

export function requireImportedSaveTarget(
  data: ImportedSaveData,
  collections: readonly Pick<MapCollectionSummary, "id">[],
): void {
  if (
    data.type === "explore-save" &&
    !collections.some(({ id }) => id === data.collection)
  )
    throw new WebError(WEB_ERROR_CODES.saveExchange.invalidExploreSave);
}

function dataScope(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const scope = (value as Record<string, unknown>).scope;
  return typeof scope === "string" ? scope : null;
}

function parseMap(value: unknown): ImportedMapData | null {
  let level: LevelMap;
  try {
    level = parseExchangeMap(value);
  } catch {
    return null;
  }

  try {
    parseMapDocument(value);
    return {
      type: "map",
      value: structuredClone(value as MapDocument),
      level,
    };
  } catch {
    // 纯 LevelMap 只补产品层文档名称；gameplay 内容保持公共 parser 的结果。
  }

  return {
    type: "map",
    value: {
      ...structuredClone(level),
      meta: { game: BC5R_GAME_ID, name: "Imported Bobby Level" },
    },
    level,
  };
}
