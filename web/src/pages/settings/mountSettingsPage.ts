import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { globalActions, homeIdentity } from "../../app/pageChrome.js";
import { configureShell } from "../../shell/shellBridge.js";
import SettingsPage from "./SettingsPage.vue";
import { webT } from "../../i18n/webI18n.js";

export function renderSettingsPage(context: PageContext): PageController {
  const syncShell = (): void => configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: {
        ...homeIdentity(),
        contextName: webT("shell.settings"),
      },
      actions: globalActions(),
    },
  });
  syncShell();
  context.app.replaceChildren();
  const page = createApp(SettingsPage, {
    collections: context.collectionsIndex.collections,
  });
  page.mount(context.app);
  return {
    localeChanged: syncShell,
    destroy(): void {
      page.unmount();
    },
  };
}
