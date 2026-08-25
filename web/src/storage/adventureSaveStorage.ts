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

export function exportAdventureSave(): void {
  const blob = new Blob([serializeAdventureSave(loadAdventureSave())], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bc5r-save-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importAdventureSave(file: File): Promise<AdventureSave> {
  const save = parseAdventureSave(await file.text());
  return saveAdventureSave(save);
}
