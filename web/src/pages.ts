import type { TinySynthAudioBackend } from './TinySynthAudio.js';
import { bindNavigation, escapeHtml, shell, type Navigate } from './common.js';
import { completedExploreLevels, lastExploreLevelId } from './explore-progress.js';
import { hasActiveLevelFilters, mountLevelFilters, randomFilteredLevel } from './level-filters.js';
import { exportAdventureSave, importAdventureSave, loadAdventureSave, resetAdventureSave } from './adventure-storage.js';
import type { CatalogChapter, CatalogLevel, LevelCatalog } from './catalog.js';

export interface PageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
}

export function lastLevel(catalog: LevelCatalog): CatalogLevel {
  const stored = lastExploreLevelId();
  if (stored) {
    const found = catalog.levels.find((level) => level.publicId === stored);
    if (found) return found;
  }
  return catalog.levels.find((level) => level.publicId === '1-1') ?? catalog.levels[0]!;
}

function randomLevel(catalog: LevelCatalog): CatalogLevel {
  return catalog.levels[Math.floor(Math.random() * catalog.levels.length)] ?? catalog.levels[0]!;
}

export function displayLevelId(level: CatalogLevel): string {
  return level.publicId.toUpperCase();
}

export function displayLevelShort(level: CatalogLevel): string {
  return level.bonusOrdinal ? `BONUS ${level.bonusOrdinal}` : String(level.sourceLevelIndex);
}

export function chapterStars(stars: number): string {
  return `${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, 3 - stars))}`;
}

export function renderHome(context: PageContext): void {
  const { app, catalog, audio, navigate } = context;
  const last = lastLevel(catalog);
  audio.playMusic('title');

  app.innerHTML = shell(`
    <section class="nostalgia-home">
      <img class="nostalgia-logo" src="assets/art/hd/title.png" alt="Bobby Carrot 5 Remake">
      <div class="nostalgia-menu" role="navigation" aria-label="主菜单">
        <a class="nostalgia-primary" href="adventure" data-nav>继续冒险</a>
        <a href="adventure/chapters" data-nav>冒险模式</a>
        <a href="levels" data-nav>自由选关</a>
        <a href="edit" data-nav>地图编辑器</a>
        <a href="settings" data-nav>设置</a>
      </div>
      <div class="nostalgia-foot muted">
        原版冒险保持章节顺序、存档与竖屏视野；自由选关开放全部 ${catalog.uniqueLevels} 关并保留筛选。
      </div>
    </section>
    <section class="home-explore-strip">
      <span>最近浏览：${displayLevelId(last)}</span>
      <button id="home-random" class="ghost-btn">随机一关</button>
    </section>
  `);

  bindNavigation(app, navigate);
  app.querySelector<HTMLButtonElement>('#home-random')?.addEventListener('click', () => {
    navigate(`/play/${randomLevel(catalog).publicId}`);
  });
}

export async function renderLevels(context: PageContext): Promise<void> {
  const { app, catalog, audio, navigate } = context;
  const last = lastLevel(catalog);
  const completed = completedExploreLevels();
  audio.playMusic('title');

  app.innerHTML = shell(`
    <section class="level-browser-head">
      <div class="section-title">
        <div>
          <div class="eyebrow">EXPLORE MODE</div>
          <h1>自由选关</h1>
          <p>原版 1～40 章全部开放。这里用于找关、筛选、研究机关，不受 Adventure 存档限制。</p>
        </div>
        <div class="level-browser-summary muted">${catalog.chapters.length} 章 · ${catalog.levels.length} 关</div>
      </div>
      <div class="level-browser-actions">
        <a class="primary-btn" href="play/${last.publicId}" data-nav>继续浏览 · ${displayLevelId(last)}</a>
        <button id="random-level" class="ghost-btn">随机一个关卡</button>
        <a class="ghost-btn" href="adventure/chapters" data-nav>进入冒险模式</a>
      </div>
    </section>
    <div class="chapter-list">
      ${catalog.chapters.map((chapter) => renderExploreChapter(catalog, chapter, completed)).join('')}
    </div>
    <div class="difficulty-legend muted">
      <span><i class="difficulty-dot easy"></i>简单</span>
      <span><i class="difficulty-dot medium"></i>中等</span>
      <span><i class="difficulty-dot hard"></i>困难</span>
      <span>章节标题旁的 ★ 是原版章节选择界面的 1～3 星难度；关卡 A～F 难度仍用于筛选。</span>
    </div>
  `);

  bindNavigation(app, navigate);
  await mountLevelFilters(catalog);
  app.querySelector<HTMLButtonElement>('#random-level')?.addEventListener('click', () => {
    const chosen = hasActiveLevelFilters() ? randomFilteredLevel() : randomLevel(catalog);
    if (chosen) navigate(`/play/${chosen.publicId}`);
  });
}

function renderExploreChapter(
  catalog: LevelCatalog,
  chapter: CatalogChapter,
  completed: Set<string>,
): string {
  const levels = chapter.levelPublicIds
    .map((publicId) => catalog.levels.find((level) => level.publicId === publicId))
    .filter((level): level is CatalogLevel => Boolean(level));

  const levelLinks = levels
    .map((level) => {
      const done = completed.has(level.canonicalId);
      return `
        <a
          class="chapter-level ${done ? 'completed' : ''} ${level.contentKind === 'bonus' ? 'bonus-level' : ''}"
          href="play/${level.publicId}"
          data-nav
          title="${escapeHtml(level.publicId)} · ${escapeHtml(level.difficulty.label)}"
        >
          <span class="chapter-level-no">${escapeHtml(displayLevelShort(level))}</span>
          <span class="difficulty-badge ${level.difficulty.level} ${level.difficulty.source}">
            ${escapeHtml(level.difficulty.label)}
          </span>
          ${done ? '<span class="done-mark" title="自由浏览中已通关">✓</span>' : ''}
        </a>
      `;
    })
    .join('');

  return `
    <section class="chapter-card">
      <header class="chapter-head">
        <div>
          <div class="chapter-number">
            CHAPTER ${chapter.number}
            <span class="chapter-stars" title="原版章节难度 ${chapter.difficultyStars} 星">
              ${chapterStars(chapter.difficultyStars)}
            </span>
          </div>
          <h3>${escapeHtml(chapter.title)}</h3>
        </div>
        <span class="muted chapter-count">${levels.length} 关</span>
      </header>
      <div class="chapter-levels">${levelLinks}</div>
    </section>
  `;
}

export function renderSettings(context: PageContext): void {
  const { app, audio, navigate } = context;
  const save = loadAdventureSave();
  audio.playMusic('title');

  app.innerHTML = shell(`
    <div class="section-title">
      <h1>设置</h1>
      <p>音乐、操作与 Adventure 存档。</p>
    </div>
    <section class="profile-strip">
      <div><strong>${save.economy.bonusCoins}</strong><span>Bonus Coin</span></div>
      <div><strong>${save.economy.goldenCarrots}</strong><span>Golden Carrot</span></div>
      <div><strong>${save.upgrades.goldenKey ? '已获得' : '未获得'}</strong><span>Golden Key</span></div>
      <div><strong>${save.campaign.completedLevels.length}</strong><span>Adventure 完成</span></div>
    </section>
    <section class="settings-card">
      <div class="setting">
        <div>
          <strong>Adventure 存档</strong>
          <div class="muted">纯 JSON；包含章节进度、全局金币、金胡萝卜、永久道具和已领取奖励位置。</div>
        </div>
        <div class="setting-actions">
          <button id="save-export" class="ghost-btn">导出 JSON</button>
          <button id="save-import" class="ghost-btn">导入 JSON</button>
          <button id="save-reset" class="ghost-btn danger">清空存档</button>
          <input id="save-file" type="file" accept="application/json,.json" hidden>
        </div>
      </div>
      <div class="setting">
        <div>
          <strong>音乐</strong>
          <div class="muted">WebAudio TinySynth 1.1.3 · 原始 .mid</div>
        </div>
        <label class="switch-label">
          <input id="music-enabled" type="checkbox" ${audio.isEnabled() ? 'checked' : ''}> 启用
        </label>
      </div>
      <div class="setting">
        <div><strong>MIDI 音色</strong></div>
        <select id="midi-tone">
          <option value="fm" ${audio.getTone() === 'fm' ? 'selected' : ''}>TinySynth FM</option>
          <option value="chip" ${audio.getTone() === 'chip' ? 'selected' : ''}>TinySynth Chip</option>
        </select>
      </div>
      <div class="setting">
        <div><strong>混响</strong></div>
        <input id="midi-reverb" type="range" min="0" max="100" value="${Math.round(audio.getReverbLevel() * 100)}">
      </div>
      <div class="setting">
        <div><strong>音乐音量</strong></div>
        <input id="music-volume" type="range" min="0" max="100" value="${Math.round(audio.getMusicVolume() * 100)}">
      </div>
      <div class="setting">
        <div><strong>音效音量</strong></div>
        <input id="sound-volume" type="range" min="0" max="100" value="${Math.round(audio.getSoundVolume() * 100)}">
      </div>
    </section>
  `);

  bindNavigation(app, navigate);

  app.querySelector<HTMLButtonElement>('#save-export')?.addEventListener('click', exportAdventureSave);

  const file = app.querySelector<HTMLInputElement>('#save-file');
  app.querySelector<HTMLButtonElement>('#save-import')?.addEventListener('click', () => file?.click());
  file?.addEventListener('change', () => {
    const selected = file.files?.[0];
    if (!selected) return;

    void importAdventureSave(selected)
      .then(() => {
        window.alert('Adventure 存档已导入。');
        navigate('/settings');
      })
      .catch((error) => window.alert(error instanceof Error ? error.message : String(error)))
      .finally(() => {
        file.value = '';
      });
  });

  app.querySelector<HTMLButtonElement>('#save-reset')?.addEventListener('click', () => {
    if (window.confirm('清空 Adventure 存档？自由选关记录不会受影响。')) {
      resetAdventureSave();
      navigate('/settings');
    }
  });

  app.querySelector<HTMLInputElement>('#music-enabled')?.addEventListener('change', (event) => {
    audio.setEnabled((event.currentTarget as HTMLInputElement).checked);
  });
  app.querySelector<HTMLInputElement>('#music-volume')?.addEventListener('input', (event) => {
    audio.setMusicVolume(Number((event.currentTarget as HTMLInputElement).value) / 100);
  });
  app.querySelector<HTMLInputElement>('#sound-volume')?.addEventListener('input', (event) => {
    audio.setSoundVolume(Number((event.currentTarget as HTMLInputElement).value) / 100);
  });
  app.querySelector<HTMLSelectElement>('#midi-tone')?.addEventListener('change', (event) => {
    audio.setTone((event.currentTarget as HTMLSelectElement).value === 'chip' ? 'chip' : 'fm');
  });
  app.querySelector<HTMLInputElement>('#midi-reverb')?.addEventListener('input', (event) => {
    audio.setReverbLevel(Number((event.currentTarget as HTMLInputElement).value) / 100);
  });
}
