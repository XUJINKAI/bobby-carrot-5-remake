import {
  createBlankLevel,
  fromLevelMap,
  parseEditorLevel,
  type EditorLevel,
} from "@bobby/editor";
import { createApp } from "vue";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import type { CustomMapCatalog, LevelCatalog } from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import { renderAppShell } from "../../shell/shellBridge.js";
import EditorPage from "./EditorPage.vue";
import type { ExploreMapRef } from "../../app/routes.js";
import { resolveExploreMap } from "../../services/catalog/exploreMaps.js";

export interface EditorPageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  customMapCatalog: CustomMapCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
  mapRef?: ExploreMapRef;
}

export async function renderEditorPage(
  context: EditorPageContext,
): Promise<PageController> {
  const { app, catalog, customMapCatalog, audio, navigate, mapRef } = context;
  audio.stopMusic();
  let level: EditorLevel;
  if (mapRef) {
    const resolved = await resolveExploreMap(catalog, customMapCatalog, mapRef);
    if (!resolved) {
      navigate("/edit");
      return NOOP_CONTROLLER;
    }
    level = fromLevelMap(resolved.level);
    level.name = `${resolved.title} · 副本`;
  } else {
    const pending = sessionStorage.getItem("bc5r:pending-editor-level");
    if (pending) {
      sessionStorage.removeItem("bc5r:pending-editor-level");
      level = parseEditorLevel(pending);
    } else {
      level = createBlankLevel(16, 16);
    }
  }

  app.innerHTML = renderAppShell({
    mode: "editor",
    contextActions: [
      { id: "editor-undo", label: "↶", title: "Undo" },
      { id: "editor-redo", label: "↷", title: "Redo" },
      { id: "editor-play", label: "Play", title: "Play Test" },
      { id: "editor-file", label: "文件", title: "JSON 导入与导出" },
    ],
    contextInfo: "左键放置 · 右键 / Del 删除 · Q / E 切换形态",
    showScreenControlToggle: false,
    topBarFixed: true,
    bottomBarFixed: true,
    content: "",
  });
  const editorPage = createApp(EditorPage, {
    initialLevel: level,
    audio,
    navigate,
  });
  editorPage.mount(app);
  return {
    destroy(): void {
      editorPage.unmount();
    },
  };
}
