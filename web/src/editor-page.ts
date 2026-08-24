import {
  BobbyEditor,
  createBlankLevel,
  decodeShareLevel,
  fromLevelMap,
  shareValueFromHash,
  type EditorLevel,
} from "@bobby/editor";
import type { TinySynthAudioBackend } from "./TinySynthAudio.js";
import {
  fetchJson,
  type LevelCatalog,
  type OfficialLevelData,
} from "./catalog.js";
import {
  bindNavigation,
  escapeHtml,
  NOOP_CONTROLLER,
  shell,
  siteUrl,
  type Navigate,
  type PageController,
} from "./common.js";
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
  const shared = shareValueFromHash(location.hash);
  if (shared) {
    try {
      level = await decodeShareLevel(shared);
    } catch (error) {
      app.innerHTML = shell(
        `<section class="settings-card"><h2>分享地图无法打开</h2><p class="muted">${escapeHtml(error instanceof Error ? error.message : String(error))}</p><a class="primary-btn" href="edit" data-nav>新建地图</a></section>`,
      );
      bindNavigation(app, navigate);
      return NOOP_CONTROLLER;
    }
  } else if (publicId) {
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
  } else level = createBlankLevel(16, 16);
  app.innerHTML = '<div id="editor-mount"></div>';
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
    audio,
    shareOrigin: new URL(".", document.baseURI).href.replace(/\/$/, ""),
    onClose: () => navigate("/levels"),
  });
  return {
    destroy(): void {
      editor.destroy();
    },
  };
}
