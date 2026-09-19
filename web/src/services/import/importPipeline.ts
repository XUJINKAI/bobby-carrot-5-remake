import type { AdventureSave } from "@bobby/adventure";
import { WEB_ERROR_CODES, WebError } from "../../errors/errorCodes.js";
import {
  fromLevelMap,
  parseEditorLevel,
  toLevelMap,
  type EditorMap,
} from "@bobby/editor";
import { parseLevelMap, type LevelMap } from "@bobby/model";
import { exploreCollectionPath } from "../../app/routes.js";
import {
  decodeExchangePayload,
  decodeExchangeText,
} from "../../shared/data-exchange/dataExchangeCodec.js";
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
  value: EditorMap;
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
): string {
  if (data.type === "adventure-save") {
    saveAdventureSave(data.value);
    return "/adventure";
  }
  saveExploreCollectionSave(data.collection, data.value);
  return exploreCollectionPath(data.collection);
}

function dataScope(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const scope = (value as Record<string, unknown>).scope;
  return typeof scope === "string" ? scope : null;
}

function parseMap(value: unknown): ImportedMapData | null {
  let text: string;
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return null;
    text = serialized;
  } catch {
    return null;
  }
  try {
    const document = parseEditorLevel(text);
    return { type: "map", value: document, level: toLevelMap(document) };
  } catch {
    // 缺少 metadata 的纯 LevelMap 走相同 gameplay parser。
  }
  try {
    const level = parseLevelMap(value);
    return {
      type: "map",
      value: fromLevelMap(level, "Imported Bobby Level"),
      level,
    };
  } catch {
    return null;
  }
}
