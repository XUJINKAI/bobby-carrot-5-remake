import {
  createAdventureSave,
  normalizeAdventureSave,
  parseAdventureSave,
  serializeAdventureSave,
  type AdventureSave,
} from "@bobby/adventure";
import { BC5R_GAME_ID } from "@bobby/model";
import { WEB_ERROR_CODES, WebError } from "../errors/errorCodes.js";
import { ADVENTURE_STORAGE_KEY } from "./contracts.js";

export function loadAdventureSave(): AdventureSave {
  const raw = localStorage.getItem(ADVENTURE_STORAGE_KEY);
  if (!raw) return createAdventureSave();
  try {
    return parseAdventureSave(raw);
  } catch {
    return createAdventureSave();
  }
}

export function saveAdventureSave(save: AdventureSave): AdventureSave {
  const normalized = normalizeAdventureSave(save);
  localStorage.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function resetAdventureSave(): AdventureSave {
  const save = createAdventureSave();
  localStorage.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(save));
  return save;
}

export function parseAdventureProfileExchange(value: unknown): AdventureSave {
  if (
    typeof value !== "object" ||
    value === null ||
    (value as Record<string, unknown>).game !== BC5R_GAME_ID ||
    (value as Record<string, unknown>).schemaVersion !== 1 ||
    (value as Record<string, unknown>).scope !== "adventure" ||
    typeof (value as Record<string, unknown>).campaign !== "object" ||
    typeof (value as Record<string, unknown>).economy !== "object"
  ) {
    throw new WebError(WEB_ERROR_CODES.saveExchange.invalidAdventureProfile);
  }
  try {
    return parseAdventureSave(JSON.stringify(value));
  } catch (cause) {
    throw new WebError(
      WEB_ERROR_CODES.saveExchange.invalidAdventureProfile,
      { cause },
    );
  }
}

export { parseAdventureSave, serializeAdventureSave };
