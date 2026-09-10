import { toLevelMap, type EditorMap } from "@bobby/editor";
import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { globalActions, pageIdentity } from "../../app/pageChrome.js";
import {
  applyImportedSave,
  type ImportedSaveData,
} from "../../services/import/importPipeline.js";
import { configureShell } from "../../shell/shellBridge.js";
import ImportPage from "./ImportPage.vue";

export function importedLevelMap(level: EditorMap) {
  return toLevelMap(level);
}

export function renderImportMessage(
  context: PageContext,
  options:
    | { status: "save"; data: ImportedSaveData }
    | { status: "error" | "unknown"; message: string; rawText?: string },
): PageController {
  configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("导入", "/import/v1"),
      actions: globalActions(),
    },
    bottomBar: { visible: false },
  });
  context.app.replaceChildren();
  const app = createApp(ImportPage, {
    ...options,
    onConfirm: () => {
      if (options.status !== "save") return;
      context.navigate(applyImportedSave(options.data));
    },
    onCancel: () => context.navigate("/"),
    onHome: () => context.navigate("/"),
  });
  app.mount(context.app);
  return { destroy: () => app.unmount() };
}
