import { shareValueFromHash } from '@bobby/editor';
import { TinySynthAudioBackend } from './TinySynthAudio.js';
import { fetchJson, type LevelCatalog } from './catalog.js';
import { NOOP_CONTROLLER, siteUrl, type PageController } from './common.js';
import { renderAdventureChapter, renderAdventureChapters, renderAdventureHome, findAdventureLevel } from './adventure-pages.js';
import { renderEditorPage } from './editor-page.js';
import { renderOfficialGame } from './official-game.js';
import { renderHome, renderLevels, renderSettings } from './pages.js';
import { renderSharedGame } from './shared-game.js';

export class BobbyApp {
  private readonly app: HTMLDivElement;
  private readonly audio = new TinySynthAudioBackend();
  private catalog!: LevelCatalog;
  private controller: PageController = NOOP_CONTROLLER;

  constructor(app: HTMLDivElement) { this.app = app; }

  async start(): Promise<void> {
    this.catalog = await fetchJson<LevelCatalog>(siteUrl('assets/catalog.json'));
    document.addEventListener('pointerdown', this.resumeAudio, { passive: true });
    document.addEventListener('keydown', this.resumeAudio);
    window.addEventListener('popstate', this.onPopState);
    await this.renderRoute();
  }

  destroy(): void {
    this.controller.destroy();
    document.removeEventListener('pointerdown', this.resumeAudio);
    document.removeEventListener('keydown', this.resumeAudio);
    window.removeEventListener('popstate', this.onPopState);
  }

  private readonly resumeAudio = (): void => this.audio.resume();
  private readonly onPopState = (): void => { void this.renderRoute(); };
  private readonly navigate = (path: string): void => {
    const target = new URL(path.replace(/^\/+/, ''), document.baseURI);
    history.pushState(null, '', `${target.pathname}${target.search}${target.hash}`);
    void this.renderRoute();
  };

  private async renderRoute(): Promise<void> {
    this.controller.destroy();
    this.controller = NOOP_CONTROLLER;
    const path = localRoutePath();
    const context = { app: this.app, catalog: this.catalog, audio: this.audio, navigate: this.navigate };
    if (path === '/') { renderHome(context); return; }
    if (path === '/levels') { await renderLevels(context); return; }
    if (path === '/settings') { renderSettings(context); return; }
    if (path === '/adventure') { renderAdventureHome(context); return; }
    if (path === '/adventure/chapters') { renderAdventureChapters(context); return; }
    if (path.startsWith('/adventure/chapter/')) {
      const chapter = Number(path.split('/').pop());
      if (!Number.isInteger(chapter)) { this.navigate('/adventure/chapters'); return; }
      renderAdventureChapter(context, chapter);
      return;
    }
    if (path.startsWith('/adventure/play/')) {
      const id = decodeURIComponent(path.split('/').pop() ?? '').toLowerCase();
      const level = findAdventureLevel(this.catalog, id);
      if (!level) { this.navigate('/adventure/chapters'); return; }
      this.controller = await renderOfficialGame({ ...context, level, mode:'adventure' });
      return;
    }
    if (path === '/edit') { this.controller = await renderEditorPage(context); return; }
    if (path.startsWith('/edit/')) {
      const publicId = path.split('/').pop();
      this.controller = publicId ? await renderEditorPage({ ...context, publicId }) : await renderEditorPage(context);
      return;
    }
    if (path === '/play' && shareValueFromHash(location.hash)) { this.controller = await renderSharedGame(context); return; }
    if (path.startsWith('/play/')) {
      const publicId = decodeURIComponent(path.split('/').pop() ?? '').toLowerCase();
      const meta = this.catalog.levels.find((level) => level.publicId === publicId);
      if (!meta) { this.navigate('/levels'); return; }
      this.controller = await renderOfficialGame({ ...context, level: meta, mode:'explore' });
      return;
    }
    this.navigate('/');
  }
}

function localRoutePath(): string {
  const basePath = new URL(document.baseURI).pathname.replace(/\/+$/, '');
  const localPath = basePath && basePath !== '/' && location.pathname.startsWith(basePath) ? location.pathname.slice(basePath.length) : location.pathname;
  return localPath.replace(/\/+$/, '') || '/';
}
