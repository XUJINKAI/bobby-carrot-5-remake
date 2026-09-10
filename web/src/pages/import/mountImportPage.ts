import type { AdventureSave } from "@bobby/adventure";
import {
  fromLevelMap,
  parseEditorLevel,
  toLevelMap,
  type EditorMap,
} from "@bobby/editor";
import { parseLevelMap, type LevelMap } from "@bobby/model";
import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { globalActions } from "../../app/pageChrome.js";
import { decodeBc5rV1 } from "../../shared/data-exchange/dataExchangeCodec.js";
import {
  parseAdventureProfileExchange,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import { configureShell } from "../../shell/shellBridge.js";
import ImportPage from "./ImportPage.vue";

export type ImportedData =
  | { type: "map"; value: EditorMap; level: LevelMap }
  | { type: "adventure-profile"; value: AdventureSave }
  | { type: "unknown"; rawText: string };

export async function decodeImportedData(payload: string): Promise<ImportedData> {
  const rawText = await decodeBc5rV1(payload);
  try {
    const value = parseEditorLevel(rawText);
    return { type: "map", value, level: toLevelMap(value) };
  } catch {
    try {
      const level = parseLevelMap(JSON.parse(rawText));
      return {
        type: "map",
        value: fromLevelMap(level, "Imported Bobby Level"),
        level,
      };
    } catch {
      // 继续尝试其它 Data Exchange 文档类型。
    }
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
    topBar: { visible: true, fixed: true, actions: globalActions() },
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
