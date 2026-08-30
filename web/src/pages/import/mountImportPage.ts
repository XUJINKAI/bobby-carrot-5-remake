import type { AdventureSave } from "@bobby/adventure";
import { parseEditorLevel, toLevelMap, type EditorMap } from "@bobby/editor";
import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { decodeBc5rV1 } from "../../shared/data-exchange/dataExchangeCodec.js";
import {
  parseAdventureProfileExchange,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import { configureShell } from "../../shell/shellBridge.js";
import ImportPage from "./ImportPage.vue";

export type ImportedData =
  | { type: "map"; value: EditorMap }
  | { type: "adventure-profile"; value: AdventureSave }
  | { type: "unknown"; rawText: string };

export async function decodeImportedData(payload: string): Promise<ImportedData> {
  const rawText = await decodeBc5rV1(payload);
  try {
    return { type: "map", value: parseEditorLevel(rawText) };
  } catch {
    try {
      return {
        type: "adventure-profile",
        value: parseAdventureProfileExchange(JSON.parse(rawText)),
      };
    } catch {
      return { type: "unknown", rawText };
    }
  }
}

export function importedLevelMap(level: EditorMap) {
  return toLevelMap(level);
}

export function renderImportMessage(
  context: PageContext,
  options:
    | { status: "profile"; profile: AdventureSave }
    | { status: "error" | "unknown"; message: string; rawText?: string },
): PageController {
  configureShell({
    topBar: { visible: true, fixed: true },
    bottomBar: { visible: false },
  });
  context.app.replaceChildren();
  const app = createApp(ImportPage, {
    ...options,
    onConfirm: () => {
      if (options.status !== "profile") return;
      saveAdventureSave(options.profile);
      context.navigate("/adventure");
    },
    onCancel: () => context.navigate("/adventure"),
    onHome: () => context.navigate("/"),
  });
  app.mount(context.app);
  return { destroy: () => app.unmount() };
}
