import { shareValueFromHash } from '@bobby/editor';
import { TinySynthAudioBackend } from './TinySynthAudio.js';
import { fetchJson, type LevelCatalog } from './catalog.js';
import { NOOP_CONTROLLER, siteUrl, type PageController } from './common.js';
import { renderEditorPage } from './editor-page.js';
import { renderOfficialGame } from './official-game.js';
import { preferredRelease, renderHome, renderLevels, renderSettings } from './pages.js';
import { renderSharedGame } from './shared-game.js';

export class BobbyApp {
  private readonly app: HTMLDivElement;
  private readonly audio = new TinySynthAudioBackend();
  private catalog!: LevelCatalog;
  private controller: PageController = NOOP_CONTROLLER;
  private selectedReleaseId = 'base';

  constructor(app: HTMLDivElement) { this.app = app; }

  async start(): Promise<void> {
    this.catalog = await fetchJson<LevelCatalog>(siteUrl('assets/catalog.json'));
    this.selectedReleaseId = preferredRelease(this.catalog);
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
    if (path === '/levels') {
      await renderLevels(context, this.selectedReleaseId, (releaseId) => { this.selectedReleaseId = releaseId; void this.renderRoute(); });
      return;
    }
    if (path === '/settings') { renderSettings(context); return; }
    if (path === '/edit') { this.controller = await renderEditorPage(context); return; }
    if (path.startsWith('/edit/')) { this.controller = await renderEditorPage({ ...context, publicId: path.split('/').pop() }); return; }
    if (path === '/play' && shareValueFromHash(location.hash)) { this.controller = await renderSharedGame(context); return; }
    if (path.startsWith('/play/')) {
      const publicId = decodeURIComponent(path.split('/').pop() ?? '').toLowerCase();
      const meta = this.catalog.levels.find((level) => level.publicId === publicId);
      if (!meta) { this.navigate('/levels'); return; }
      this.selectedReleaseId = meta.release;
      this.controller = await renderOfficialGame({ ...context, level: meta });
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
