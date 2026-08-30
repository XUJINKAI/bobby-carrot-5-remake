import {
  createBlankLevel,
  fromLevelMap,
  parseEditorLevel,
  type EditorMap,
} from "@bobby/editor";
import { createApp } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { NOOP_CONTROLLER } from "../../app/pageContracts.js";
import type { ExploreMapRef } from "../../app/routes.js";
import { resolveMapDocument } from "../../services/catalog/exploreMaps.js";
import { loadEditorDraft } from "../../storage/editorDraftStorage.js";
import EditorPage from "./EditorPage.vue";
import { configureEditorShell } from "./editorShell.js";

export interface EditorPageContext extends PageContext {
  mapRef?: ExploreMapRef;
}

export async function renderEditorPage(
  context: EditorPageContext,
): Promise<PageController> {
  const { app, audio, images, navigate, mapRef } = context;
  audio.stopMusic();
  let level: EditorMap;
  if (mapRef) {
    try {
      const resolved = await resolveMapDocument(mapRef);
      level = fromLevelMap(resolved.level);
      level.name = `${resolved.document.meta.name} · 副本`;
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
      level = loadEditorDraft() ?? createBlankLevel(16, 16);
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
  editorPage.config.errorHandler = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    document.documentElement.dataset.editorMountError = message;
    console.error("EditorPage runtime error", error);
  };
  editorPage.mount(app);
  return {
    destroy(): void {
      delete document.documentElement.dataset.editorMountError;
      editorPage.unmount();
    },
  };
}
