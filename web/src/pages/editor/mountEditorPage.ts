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
import { configureShell } from "../../shell/shellBridge.js";
import EditorPage from "./EditorPage.vue";
import type { ExploreMapRef } from "../../app/routes.js";
import { resolveExploreMap } from "../../services/catalog/exploreMaps.js";
import {
  EDITOR_HELP,
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";

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

  configureShell(
    {
      topBar: {
        visible: true,
        fixed: true,
        identity: pageIdentity("编辑器模式", "/edit"),
        commands: [
          { id: "editor-undo", icon: "undo", title: "Undo" },
          { id: "editor-redo", icon: "redo", title: "Redo" },
          { id: "editor-play", icon: "play", title: "Play Test" },
        ],
        actions: [
          {
            id: "editor-file",
            label: "文件",
            title: "JSON 导入与导出",
            collapse: "overflow",
          },
          ...globalActions(),
        ],
      },
      bottomBar: {
        visible: true,
        fixed: true,
        leading: [{ id: "editor-palette", icon: "palette", label: "Palette" }],
        info: [{ text: "左键放置 · 右键 / Del 删除 · Q / E 切换形态" }],
        trailing: [
          { id: "editor-inspector", icon: "inspector", label: "Inspector" },
          { id: "editor-level-info", icon: "info", label: "Level" },
        ],
      },
    },
    EDITOR_HELP,
  );
  app.replaceChildren();
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
