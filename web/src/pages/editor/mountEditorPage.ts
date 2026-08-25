import {
  BobbyEditor,
  createBlankLevel,
  fromLevelMap,
  parseEditorLevel,
  type EditorLevel,
} from "@bobby/editor";
import { createApp } from "vue";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import {
  fetchJson,
  type LevelCatalog,
  type OfficialLevelData,
} from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import { siteUrl } from "../../services/assets/gameAssets.js";
import { renderAppShell } from "../../shell/shellBridge.js";
import EditorPageHost from "./EditorPageHost.vue";

export interface EditorPageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
  publicId?: string;
}

export async function renderEditorPage(
  context: EditorPageContext,
): Promise<PageController> {
  const { app, catalog, audio, navigate, publicId } = context;
  audio.stopMusic();
  let level: EditorLevel;
  if (publicId) {
    const decoded = decodeURIComponent(publicId).toLowerCase(),
      meta = catalog.levels.find((entry) => entry.publicId === decoded);
    if (!meta) {
      navigate("/edit");
      return NOOP_CONTROLLER;
    }
    const official = await fetchJson<OfficialLevelData>(
      siteUrl(`assets/${meta.path}`),
    );
    level = fromLevelMap(official);
    level.name = `${meta.publicId.toUpperCase()} · Copy`;
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
    contextInfo: "左键放置 · 右键 / Del 删除 · Q / E 切换形态",
    showScreenControlToggle: false,
    topBarFixed: true,
    bottomBarFixed: true,
    content: "",
  });
  const editorPage = createApp(EditorPageHost);
  editorPage.mount(app);
  const root = app.querySelector<HTMLElement>("#editor-mount");
  if (!root) throw new Error("Editor mount failed");

  const editor = new BobbyEditor({
    root,
    level,
    atlasUrl: siteUrl("assets/art/hd/ts.png"),
    animationAtlasUrl: siteUrl("assets/art/hd/ta.png"),
    bobbyUrls: {
      left: siteUrl("assets/art/hd/b0.png"),
      right: siteUrl("assets/art/hd/b1.png"),
      up: siteUrl("assets/art/hd/b2.png"),
      down: siteUrl("assets/art/hd/b3.png"),
    },
    mowerBobbyUrl: siteUrl("assets/art/hd/b7.png"),
    kiteUrl: siteUrl("assets/art/hd/b9.png"),
    hudAtlasUrl: siteUrl("assets/art/hd/hud.png"),
    goldenCarrotUrl: siteUrl("assets/art/hd/icon.png"),
    screenJoystick: loadScreenControlPreference(),
    audio,
    onClose: () => navigate("/levels"),
  });
  return {
    destroy(): void {
      editor.destroy();
      editorPage.unmount();
    },
  };
}

function loadScreenControlPreference(): boolean {
  const stored = localStorage.getItem("bc5r:screen-control");
  if (stored !== null) return stored === "true";
  return window.matchMedia("(pointer: coarse)").matches;
}
