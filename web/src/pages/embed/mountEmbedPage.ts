import { createApp, defineAsyncComponent } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { globalActions, pageIdentity } from "../../app/pageChrome.js";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import { configureShell } from "../../shell/shellBridge.js";
import { webT } from "../../i18n/webI18n.js";

const EmbedPage = defineAsyncComponent(() => import("./EmbedPage.vue"));

export function renderEmbedPage(context: PageContext): PageController {
  configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity(webT("context.embed"), "/embed"),
      actions: globalActions(),
    },
    bottomBar: { visible: false },
  });
  context.app.replaceChildren();
  const app = createApp(EmbedPage, { publicBaseUrl: publicBaseUrl() });
  app.mount(context.app);
  return { destroy: () => app.unmount() };
}
