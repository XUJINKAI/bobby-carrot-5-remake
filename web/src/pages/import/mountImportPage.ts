import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { globalActions, pageIdentity } from "../../app/pageChrome.js";
import {
  applyImportedSave,
  type ImportedSaveData,
} from "../../services/import/importPipeline.js";
import { configureShell } from "../../shell/shellBridge.js";
import ImportPage from "./ImportPage.vue";
import { webT, type WebDisplayText } from "../../i18n/webI18n.js";

export function renderImportMessage(
  context: PageContext,
  options:
    | { status: "save"; data: ImportedSaveData }
    | { status: "unknown"; rawText?: string }
    | { status: "error"; message: WebDisplayText; rawText?: string },
): PageController {
  const syncShell = (): void => configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity(webT("context.import"), "/import/v1"),
      actions: globalActions(),
    },
    bottomBar: { visible: false },
  });
  syncShell();
  context.app.replaceChildren();
  const app = createApp(ImportPage, {
    ...options,
    onConfirm: () => {
      if (options.status !== "save") return;
      context.navigate(
        applyImportedSave(
          options.data,
          context.collectionsIndex.collections,
        ),
      );
    },
    onCancel: () => context.navigate("/"),
    onHome: () => context.navigate("/"),
  });
  app.mount(context.app);
  return { localeChanged: syncShell, destroy: () => app.unmount() };
}
