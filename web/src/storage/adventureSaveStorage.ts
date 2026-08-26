import {
  createAdventureSave,
  normalizeAdventureSave,
  parseAdventureSave,
  serializeAdventureSave,
  type AdventureSave,
} from "@bobby/adventure";

const SAVE_KEY = "bobby.adventure.save";

export function loadAdventureSave(): AdventureSave {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return createAdventureSave();
  try {
    return parseAdventureSave(raw);
  } catch {
    return createAdventureSave();
  }
}

export function saveAdventureSave(save: AdventureSave): AdventureSave {
  const normalized = normalizeAdventureSave(save);
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function resetAdventureSave(): AdventureSave {
  const save = createAdventureSave();
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  return save;
}

export function parseAdventureProfileExchange(value: unknown): AdventureSave {
  if (
    typeof value !== "object" ||
    value === null ||
    (value as Record<string, unknown>).game !== "bc5r" ||
    (value as Record<string, unknown>).schemaVersion !== 1 ||
    typeof (value as Record<string, unknown>).campaign !== "object" ||
    typeof (value as Record<string, unknown>).economy !== "object"
  ) {
    throw new Error("这段数据不是有效 Adventure Profile");
  }
  return parseAdventureSave(JSON.stringify(value));
}

export { parseAdventureSave, serializeAdventureSave };
