import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { globalActions, homeIdentity } from "../../app/pageChrome.js";
import { configureShell } from "../../shell/shellBridge.js";
import SettingsPage from "./SettingsPage.vue";

export function renderSettingsPage(context: PageContext): PageController {
  configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: {
        ...homeIdentity(),
        contextName: "设置",
      },
      actions: globalActions(),
    },
  });
  context.app.replaceChildren();
  const page = createApp(SettingsPage);
  page.mount(context.app);
  return {
    destroy(): void {
      page.unmount();
    },
  };
}
