import {
  campaignSequenceForChapter,
  isAdventureLevelCompleted,
  isAdventureLevelUnlocked,
  parseAdventureLevelId,
  type AdventureLevelId,
  type AdventureSave,
} from "@bobby/adventure";
import type { TinySynthAudioBackend } from "./TinySynthAudio.js";
import { bindNavigation, escapeHtml, type Navigate } from "./common.js";
import { loadAdventureSave } from "./adventure-storage.js";
import { chapterStars, displayLevelShort } from "./pages.js";
import type { CatalogLevel, LevelCatalog } from "./catalog.js";
import { renderAppShell } from "./ui-shell.js";

export interface AdventurePageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
}

export function renderAdventureHome(context: AdventurePageContext): void {
  const { app, catalog, audio, navigate } = context,
    save = loadAdventureSave(),
    next = nextAdventureLevel(catalog, save);
  audio.playMusic("title");
  app.innerHTML = adventureShell(
    `<header class="adventure-title"><div class="eyebrow">ORIGINAL ADVENTURE</div><h1>Bobby Carrot 5 Remake</h1><p>按原版章节顺序游玩；存档、全局道具、一次性奖励和受限竖屏视野只属于这里。</p></header><nav class="adventure-menu">${next ? `<a class="primary-btn" href="adventure/play/${next.publicId}" data-nav>继续 · ${next.publicId.toUpperCase()}</a>` : `<a class="primary-btn" href="adventure/chapters" data-nav>选择章节</a>`}<a class="ghost-btn" href="adventure/chapters" data-nav>章节选择</a><a class="ghost-btn" href="levels" data-nav>自由选关</a><button class="ghost-btn" type="button" data-action="settings">存档 / 设置</button></nav><section class="adventure-wallet"><span>BONUS <strong>${save.economy.bonusCoins}</strong></span><span>GOLDEN CARROT <strong>${save.economy.goldenCarrots}</strong></span><span>KEY <strong>${save.upgrades.goldenKey ? "★" : "—"}</strong></span></section>`,
  );
  bindNavigation(app, navigate);
}

export function renderAdventureChapters(context: AdventurePageContext): void {
  const { app, catalog, audio, navigate } = context,
    save = loadAdventureSave();
  audio.playMusic("title");
  app.innerHTML = adventureShell(
    `<header class="adventure-toolbar"><a href="adventure" data-nav>←</a><strong>CHAPTER SELECT</strong><span></span></header><main class="adventure-scroll"><div class="adventure-chapters">${catalog.chapters
      .map((chapter) => {
        const unlocked = save.campaign.unlockedChapters.includes(
            chapter.number,
          ),
          levels = chapter.levelPublicIds
            .map((id) => catalog.levels.find((level) => level.publicId === id))
            .filter((value): value is CatalogLevel => Boolean(value)),
          done = levels.filter((level) =>
            isAdventureLevelCompleted(save, level.publicId),
          ).length;
        return unlocked
          ? `<a class="adventure-chapter" href="adventure/chapter/${chapter.number}" data-nav><span class="adventure-chapter-no">${String(chapter.number).padStart(2, "0")}</span><span class="adventure-chapter-copy"><strong>${escapeHtml(chapter.title)}</strong><span class="chapter-stars">${chapterStars(chapter.difficultyStars)}</span><small>${done}/${levels.length}</small></span></a>`
          : `<div class="adventure-chapter locked" aria-disabled="true"><span class="adventure-chapter-no">${String(chapter.number).padStart(2, "0")}</span><span class="adventure-chapter-copy"><strong>${escapeHtml(chapter.title)}</strong><span class="chapter-stars">${chapterStars(chapter.difficultyStars)}</span><small>🔒 LOCKED</small></span></div>`;
      })
      .join("")}</div></main>`,
  );
  bindNavigation(app, navigate);
}

export function renderAdventureChapter(
  context: AdventurePageContext,
  chapterNumber: number,
): void {
  const { app, catalog, audio, navigate } = context,
    save = loadAdventureSave(),
    chapter = catalog.chapters.find((item) => item.number === chapterNumber);
  audio.playMusic("title");
  if (!chapter || !save.campaign.unlockedChapters.includes(chapterNumber)) {
    navigate("/adventure/chapters");
    return;
  }
  const sequence = campaignSequenceForChapter(chapterNumber),
    byId = new Map(catalog.levels.map((level) => [level.publicId, level]));
  app.innerHTML = adventureShell(
    `<header class="adventure-toolbar"><a href="adventure/chapters" data-nav>←</a><strong>CHAPTER ${chapterNumber}</strong><span class="chapter-stars">${chapterStars(chapter.difficultyStars)}</span></header><section class="adventure-chapter-title"><h2>${escapeHtml(chapter.title)}</h2>${chapter.description ? `<p>${escapeHtml(chapter.description)}</p>` : ""}</section><main class="adventure-scroll"><div class="adventure-level-list">${sequence
      .map((id) => {
        const level = byId.get(id);
        if (!level) return "";
        const unlocked = isAdventureLevelUnlocked(save, id),
          done = isAdventureLevelCompleted(save, id),
          label =
            level.contentKind === "bonus"
              ? `BONUS ${level.bonusOrdinal}`
              : `LEVEL ${displayLevelShort(level)}`;
        return unlocked
          ? `<a class="adventure-level-row ${done ? "completed" : ""} ${level.contentKind === "bonus" ? "bonus" : ""}" href="adventure/play/${id}" data-nav><span>${label}</span><strong>${id.toUpperCase()}</strong><span>${done ? "✓" : "▶"}</span></a>`
          : `<div class="adventure-level-row locked" aria-disabled="true"><span>${label}</span><strong>${id.toUpperCase()}</strong><span>🔒</span></div>`;
      })
      .join("")}</div></main>`,
  );
  bindNavigation(app, navigate);
}

export function findAdventureLevel(
  catalog: LevelCatalog,
  id: string,
): CatalogLevel | undefined {
  const parsed = parseAdventureLevelId(id);
  return parsed
    ? catalog.levels.find((level) => level.publicId === parsed.id)
    : undefined;
}

function nextAdventureLevel(
  catalog: LevelCatalog,
  save: AdventureSave,
): CatalogLevel | undefined {
  const done = new Set<AdventureLevelId>(save.campaign.completedLevels),
    unlocked = new Set(save.campaign.unlockedChapters);
  for (const chapter of catalog.chapters) {
    if (!unlocked.has(chapter.number)) continue;
    for (const id of chapter.levelPublicIds) {
      const level = catalog.levels.find((item) => item.publicId === id);
      if (level && !done.has(id)) return level;
    }
  }
  return undefined;
}

function portraitShell(content: string): string {
  return `<div class="adventure-desktop"><div class="adventure-phone"><div class="adventure-phone-inner">${content}</div></div></div>`;
}

function adventureShell(content: string): string {
  return renderAppShell({
    mode: "adventure",
    contextInfo: "原版 Campaign · 章节进度与永久奖励",
    showScreenControlToggle: false,
    content: portraitShell(content),
  });
}
