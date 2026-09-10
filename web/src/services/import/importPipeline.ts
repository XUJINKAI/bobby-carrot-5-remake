import type { AdventureSave } from "@bobby/adventure";
import {
  fromLevelMap,
  parseEditorLevel,
  toLevelMap,
  type EditorMap,
} from "@bobby/editor";
import { parseLevelMap, type LevelMap } from "@bobby/model";
import {
  decodeExchangePayload,
  decodeExchangeText,
} from "../../shared/data-exchange/dataExchangeCodec.js";
import {
  parseAdventureProfileExchange,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  parseExploreProgressExchange,
  saveExploreProgressSave,
  type ExploreProgressSave,
} from "../../storage/exploreProgressStorage.js";

export interface ImportedMapData {
  type: "map";
  value: EditorMap;
  level: LevelMap;
}

export type ImportedSaveData =
  | { type: "adventure-save"; value: AdventureSave }
  | { type: "explore-save"; value: ExploreProgressSave };

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
    throw new Error("无法识别这段 Bobby Carrot 5 Remake 数据。");
  return imported;
}

export function classifyImportedJson(value: unknown): ImportedData | null {
  const map = parseMap(value);
  if (map) return map;
  try {
    return {
      type: "adventure-save",
      value: parseAdventureProfileExchange(value),
    };
  } catch {
    // 继续尝试其它本站导出格式。
  }
  try {
    return {
      type: "explore-save",
      value: parseExploreProgressExchange(value),
    };
  } catch {
    return null;
  }
}

export function applyImportedSave(
  data: ImportedSaveData,
): "/adventure" | "/explore" {
  if (data.type === "adventure-save") {
    saveAdventureSave(data.value);
    return "/adventure";
  }
  saveExploreProgressSave(data.value);
  return "/explore";
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
