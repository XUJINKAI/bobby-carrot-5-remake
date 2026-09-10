import {
  createBlankLevel,
  fromLevelMap,
  parseEditorLevel,
  type EditorMap,
} from "@bobby/editor";
import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { NOOP_CONTROLLER } from "../../app/pageContracts.js";
import {
  editorPathWithoutMapHash,
  parseEditorMapHash,
} from "../../app/routes.js";
import { resolveMapDocument } from "../../services/catalog/exploreMaps.js";
import { loadEditorAutosave } from "../../storage/editorDraftStorage.js";
import EditorPage from "./EditorPage.vue";
import { configureEditorShell } from "./editorShell.js";

export async function renderEditorPage(
  context: PageContext,
): Promise<PageController> {
  const { app, audio, images, navigate } = context;
  const mapRef = parseEditorMapHash(location.hash) ?? undefined;
  audio.stopMusic();
  let level: EditorMap;
  if (mapRef) {
    try {
      const resolved = await resolveMapDocument(mapRef);
      level = fromLevelMap(
        resolved.level,
        `${resolved.document.meta.name} · 副本`,
      );
      window.history.replaceState(
        window.history.state,
        "",
        editorPathWithoutMapHash(window.location),
      );
    } catch {
      navigate("/edit");
      return NOOP_CONTROLLER;
    }
  } else {
    const pending = sessionStorage.getItem("bc5r:pending-editor-level");
    if (pending) {
      sessionStorage.removeItem("bc5r:pending-editor-level");
      level = parseEditorLevel(pending);
    } else {
      level = loadEditorAutosave() ?? createBlankLevel(16, 16);
    }
  }

  configureEditorShell(false);
  app.replaceChildren();
  const editorPage = createApp(EditorPage, {
    initialLevel: level,
    audio,
    images,
    navigate,
  });
  editorPage.mount(app);
  return {
    destroy(): void {
      editorPage.unmount();
    },
  };
}
